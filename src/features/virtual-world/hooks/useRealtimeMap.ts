import { useEffect, useRef, useCallback, useReducer } from 'react';
import { useSocket } from '@/shared/contexts/SocketContext';
import { UserInMap, ChatMessage, Position } from '../types/realtime.types';
import { toast } from '@/shared/components/ui/use-toast';
import { authService } from '@/features/auth/services/auth.service';

// ─── State shape ────────────────────────────────────────────────────────────

interface MapState {
  users: UserInMap[];
  chatHistory: ChatMessage[];
  isConnected: boolean;
  /** Auth-service userId (sub from JWT) — used to filter self from remote users */
  myAuthId: string | null;
}

const INITIAL_STATE: MapState = {
  users: [],
  chatHistory: [],
  isConnected: false,
  myAuthId: null,
};

// ─── Reducer ────────────────────────────────────────────────────────────────

type MapAction =
  | { type: 'CONNECTED'; myAuthId: string }
  | { type: 'DISCONNECTED' }
  | { type: 'RESET' }
  | { type: 'SET_INITIAL_POSITIONS'; users: UserInMap[] }
  | { type: 'USER_JOINED'; user: UserInMap }
  | { type: 'USER_LEFT'; userId: string }
  | { type: 'CHAT_MESSAGE'; msg: ChatMessage };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, isConnected: true, myAuthId: action.myAuthId };

    case 'DISCONNECTED':
      return { ...state, isConnected: false };

    case 'RESET':
      console.log('[useRealtimeMap] 🧹 Component unmounting - clearing all users and positions');
      return INITIAL_STATE;

    case 'SET_INITIAL_POSITIONS': {
      console.log(
        `[useRealtimeMap] 📥 Received initialPositions with ${action.users.length} users:`,
        action.users.map(u => ({ userId: u.userId, name: u.name })),
      );
      const finalState = { ...state, users: action.users };
      console.log(
        '[useRealtimeMap] ✅ Final users state after update:',
        finalState.users.map(u => ({ userId: u.userId, name: u.name })),
      );
      return finalState;
    }

    case 'USER_JOINED': {
      // Deduplicate: remove existing entry for this userId before adding
      const filtered = state.users.filter(u => u.userId !== action.user.userId);
      return { ...state, users: [...filtered, action.user] };
    }

    case 'USER_LEFT':
      return { ...state, users: state.users.filter(u => u.userId !== action.userId) };

    case 'CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory.slice(-49), action.msg] };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useRealtimeMap = () => {
  const { socket } = useSocket();
  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);

  const targetPositions = useRef<Record<string, Position>>({});
  const lastUpdateSent = useRef<number>(0);
  const hasJoinedMap = useRef<boolean>(false);
  const THROTTLE_MS = 60;

  // ── Decode auth userId from JWT once ──────────────────────────────────────
  const myAuthId = useRef<string | null>(null);
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        myAuthId.current = payload.sub ?? null;
        console.log('[useRealtimeMap] 🔑 Decoded myAuthId from JWT:', myAuthId.current);
      } catch {
        console.warn('[useRealtimeMap] ⚠️  Could not decode JWT payload');
      }
    }
  }, []);

  // ── Mount log ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[useRealtimeMap] 🚀 Component mounted - resetting all state');
    dispatch({ type: 'RESET' });
    targetPositions.current = {};
    hasJoinedMap.current = false;

    return () => {
      dispatch({ type: 'RESET' });
      targetPositions.current = {};
      hasJoinedMap.current = false;
    };
  }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) {
      console.log('[useRealtimeMap] socket is null, skipping setup');
      hasJoinedMap.current = false;
      return;
    }

    console.log(
      '[useRealtimeMap] setting up listeners — socket.connected:',
      socket.connected,
      'id:', socket.id,
    );

    const emitJoinMap = () => {
      if (!hasJoinedMap.current) {
        console.log('[useRealtimeMap] emitting joinMap');
        socket.emit('joinMap');
        hasJoinedMap.current = true;
      }
    };

    const onConnect = () => {
      console.log('[useRealtimeMap] onConnect fired, id:', socket.id);
      dispatch({ type: 'CONNECTED', myAuthId: myAuthId.current ?? '' });
      emitJoinMap();
    };

    const onDisconnect = () => {
      console.log('[useRealtimeMap] onDisconnect fired');
      dispatch({ type: 'DISCONNECTED' });
      hasJoinedMap.current = false;
    };

    const onInitialPositions = (initialUsers: AvatarPosition[]) => {
      // Build clean user list, excluding self (by authId)
      const users: UserInMap[] = initialUsers
        .filter(u => {
          if (u.userId === myAuthId.current) {
            console.log(`[useRealtimeMap] 🚫 Filtering self (${u.userId}) from initialPositions`);
            return false;
          }
          return true;
        })
        .map(u => ({
          userId: u.userId,
          name: u.name,
          color: u.color || '#6366f1',
          x: u.x,
          y: u.y,
        }));

      // Reset target positions completely before setting new ones
      targetPositions.current = {};
      users.forEach(u => {
        targetPositions.current[u.userId] = { x: u.x, y: u.y };
      });

      dispatch({ type: 'SET_INITIAL_POSITIONS', users });
    };

    const onUserJoined = (payload: { userId: string; name: string; email: string; timestamp: number }) => {
      console.log('[useRealtimeMap] 👤 userJoined received:', payload);

      // Never add self
      if (payload.userId === myAuthId.current) {
        console.log('[useRealtimeMap] 🚫 Ignoring self userJoined event');
        return;
      }

      const newUser: UserInMap = {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        color: '#6366f1',
        x: 400,
        y: 300,
        timestamp: payload.timestamp,
      };

      targetPositions.current[payload.userId] = { x: 400, y: 300 };
      dispatch({ type: 'USER_JOINED', user: newUser });

      toast({
        title: 'Nuevo usuario',
        description: `${payload.name} ha entrado al mapa`,
      });
    };

    const onUserLeft = (payload: { userId: string }) => {
      console.log('[useRealtimeMap] 👋 userLeft received:', payload);
      delete targetPositions.current[payload.userId];
      dispatch({ type: 'USER_LEFT', userId: payload.userId });
    };

    const onPositionUpdate = (update: PositionUpdate) => {
      if (update.userId === myAuthId.current) return; // ignore self
      targetPositions.current[update.userId] = { x: update.x, y: update.y };
    };

    const onChatMessage = (msg: ChatMessage) => {
      dispatch({ type: 'CHAT_MESSAGE', msg });
    };

    const onError = (error: RealtimeError) => {
      console.error('[Realtime Error]:', error);

      if (error.code === 'AUTH_ERROR') {
        console.warn('[useRealtimeMap] Authentication error — token expired, redirecting to login');
        authService.logout();
        window.location.href = '/';
        return;
      }

      toast({
        variant: 'destructive',
        title: `Error: ${error.code}`,
        description: error.message,
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('initialPositions', onInitialPositions);
    socket.on('userJoined', onUserJoined);
    socket.on('userLeft', onUserLeft);
    socket.on('positionUpdate', onPositionUpdate);
    socket.on('chatMessage', onChatMessage);
    socket.on('error', onError);

    if (socket.connected) {
      console.log('[useRealtimeMap] socket already connected on mount, joining now');
      dispatch({ type: 'CONNECTED', myAuthId: myAuthId.current ?? '' });
      emitJoinMap();
    } else {
      console.log('[useRealtimeMap] connecting socket');
      socket.connect();
    }

    return () => {
      console.log('[useRealtimeMap] 🧹 Removing socket listeners');
      if (socket.connected) {
        socket.emit('leaveMap');
        socket.disconnect();
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('initialPositions', onInitialPositions);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
      socket.off('positionUpdate', onPositionUpdate);
      socket.off('chatMessage', onChatMessage);
      socket.off('error', onError);
      hasJoinedMap.current = false;
    };
  }, [socket]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const move = useCallback((x: number, y: number) => {
    if (!socket || !socket.connected) return;
    const now = Date.now();
    if (now - lastUpdateSent.current > THROTTLE_MS) {
      socket.emit('updatePosition', { x, y });
      lastUpdateSent.current = now;
    }
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('sendChat', { message });
  }, [socket]);

  return {
    users: state.users,
    chatHistory: state.chatHistory,
    isConnected: state.isConnected,
    myAuthId: myAuthId.current,
    targetPositions: targetPositions.current,
    move,
    sendMessage,
  };
};
