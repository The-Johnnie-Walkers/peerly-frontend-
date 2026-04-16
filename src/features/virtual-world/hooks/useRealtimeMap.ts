import { useEffect, useRef, useCallback, useReducer, useState } from 'react';
import { useSocket } from '@/shared/contexts/SocketContext';
import { UserInMap, ChatMessage, Position, AvatarPosition, PositionUpdate, RealtimeError } from '../types/realtime.types';
import { toast } from '@/shared/components/ui/use-toast';
import { authService } from '@/features/auth/services/auth.service';
import {
  PadState,
  CrownState,
  DuelStartedPayload,
} from '@/features/football-duel/types/football-duel.types';

// ─── State shape ─────────────────────────────────────────────────────────────

interface MapState {
  users: UserInMap[];
  chatHistory: ChatMessage[];
  isConnected: boolean;
}

const INITIAL_STATE: MapState = {
  users: [],
  chatHistory: [],
  isConnected: false,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type MapAction =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'RESET' }
  | { type: 'SET_INITIAL_POSITIONS'; users: UserInMap[] }
  | { type: 'USER_JOINED'; user: UserInMap }
  | { type: 'USER_LEFT'; userId: string }
  | { type: 'CHAT_MESSAGE'; msg: ChatMessage };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, isConnected: true };

    case 'DISCONNECTED':
      return { ...state, isConnected: false };

    case 'RESET':
      return INITIAL_STATE;

    case 'SET_INITIAL_POSITIONS': {
      console.log(
        `[useRealtimeMap] 📥 Received initialPositions with ${action.users.length} users:`,
        action.users.map(u => ({ userId: u.userId, name: u.name })),
      );
      return { ...state, users: action.users };
    }

    case 'USER_JOINED': {
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useRealtimeMap = () => {
  const { socket, isConnected: socketConnected } = useSocket();
  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);

  // Football Duel state
  const [padStates, setPadStates] = useState<PadState[]>([]);
  const [crownState, setCrownState] = useState<CrownState | null>(null);
  const [activeDuel, setActiveDuel] = useState<DuelStartedPayload | null>(null);

  const targetPositions = useRef<Record<string, Position>>({});
  const lastUpdateSent = useRef<number>(0);
  const hasJoinedMap = useRef<boolean>(false);
  const THROTTLE_MS = 60;
  const lastPadCheckSent = useRef<number>(0);
  const PAD_CHECK_THROTTLE_MS = 200;

  // ── Decode auth userId from JWT once ─────────────────────────────────────
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

  // ── Mount / unmount cleanup ───────────────────────────────────────────────
  useEffect(() => {
    console.log('[useRealtimeMap] 🚀 Component mounted - resetting all state');
    dispatch({ type: 'RESET' });
    targetPositions.current = {};
    hasJoinedMap.current = false;

    return () => {
      console.log('[useRealtimeMap] 🧹 Component unmounting');
      dispatch({ type: 'RESET' });
      targetPositions.current = {};
      hasJoinedMap.current = false;
    };
  }, []);

  // ── Register socket event listeners (only when socket instance changes) ──
  useEffect(() => {
    if (!socket) return;

    console.log('[useRealtimeMap] setting up listeners — socket id:', socket.id);

    const onInitialPositions = (initialUsers: AvatarPosition[]) => {
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

      targetPositions.current = {};
      users.forEach(u => {
        targetPositions.current[u.userId] = { x: u.x, y: u.y };
      });

      dispatch({ type: 'SET_INITIAL_POSITIONS', users });
    };

    const onUserJoined = (payload: { userId: string; name: string; email: string; timestamp: number }) => {
      console.log('[useRealtimeMap] 👤 userJoined received:', payload);
      if (payload.userId === myAuthId.current) return;

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
      if (update.userId === myAuthId.current) return;
      targetPositions.current[update.userId] = { x: update.x, y: update.y };
    };

    const onChatMessage = (msg: ChatMessage) => {
      dispatch({ type: 'CHAT_MESSAGE', msg });
    };

    const onPadStateUpdate = (pads: PadState[]) => {
      setPadStates(pads);
    };

    const onDuelStarted = (payload: DuelStartedPayload) => {
      setActiveDuel(payload);
    };

    const onCrownUpdate = (crownData: CrownState) => {
      setCrownState(crownData.winnerId ? crownData : null);
    };

    const onError = (error: RealtimeError) => {
      console.error('[Realtime Error]:', error);
      if (error.code === 'AUTH_ERROR') {
        console.warn('[useRealtimeMap] Authentication error — redirecting to login');
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

    socket.on('initialPositions', onInitialPositions);
    socket.on('userJoined', onUserJoined);
    socket.on('userLeft', onUserLeft);
    socket.on('positionUpdate', onPositionUpdate);
    socket.on('chatMessage', onChatMessage);
    socket.on('error', onError);
    socket.on('padStateUpdate', onPadStateUpdate);
    socket.on('duelStarted', onDuelStarted);
    socket.on('crownUpdate', onCrownUpdate);

    return () => {
      console.log('[useRealtimeMap] 🧹 Removing socket listeners');
      socket.off('initialPositions', onInitialPositions);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
      socket.off('positionUpdate', onPositionUpdate);
      socket.off('chatMessage', onChatMessage);
      socket.off('error', onError);
      socket.off('padStateUpdate', onPadStateUpdate);
      socket.off('duelStarted', onDuelStarted);
      socket.off('crownUpdate', onCrownUpdate);
    };
  }, [socket]);

  // ── Join/leave map when connection state changes ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    if (socketConnected) {
      console.log('[useRealtimeMap] ✅ Socket connected — joining map');
      dispatch({ type: 'CONNECTED' });
      if (!hasJoinedMap.current) {
        socket.emit('joinMap');
        hasJoinedMap.current = true;
      }
    } else {
      console.log('[useRealtimeMap] ❌ Socket disconnected');
      // If socket exists but is not connected, try to reconnect
      if (!socket.connected && socket.disconnected) {
        console.log('[useRealtimeMap] 🔄 Attempting to reconnect socket...');
        socket.connect();
      }
      dispatch({ type: 'DISCONNECTED' });
      hasJoinedMap.current = false;
    }

    return () => {
      // Only emit leaveMap when truly unmounting (socket still connected)
      // This cleanup runs when socketConnected changes or socket changes.
      // We only want leaveMap on component unmount, handled in the mount effect above
      // via the socket.emit('leaveMap') below.
    };
  }, [socket, socketConnected]);

  // ── Emit leaveMap on component unmount if connected ───────────────────────
  const socketRef = useRef(socket);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  useEffect(() => {
    return () => {
      if (socketRef.current?.connected) {
        console.log('[useRealtimeMap] 🚪 Emitting leaveMap on unmount');
        socketRef.current.emit('leaveMap');
      }
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const move = useCallback((x: number, y: number) => {
    if (!socket || !socketConnected) return;
    const now = Date.now();
    if (now - lastUpdateSent.current > THROTTLE_MS) {
      socket.emit('updatePosition', { x, y });
      lastUpdateSent.current = now;
    }
  }, [socket, socketConnected]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !socketConnected) return;
    socket.emit('sendChat', { message });
  }, [socket, socketConnected]);

  const checkDuelPads = useCallback((x: number, y: number) => {
    if (!socket || !socketConnected) return;
    const now = Date.now();
    if (now - lastPadCheckSent.current > PAD_CHECK_THROTTLE_MS) {
      socket.emit('checkDuelPads', { x, y });
      lastPadCheckSent.current = now;
    }
  }, [socket, socketConnected]);

  const clearActiveDuel = useCallback(() => {
    setActiveDuel(null);
  }, []);

  return {
    users: state.users,
    chatHistory: state.chatHistory,
    isConnected: state.isConnected,
    myAuthId: myAuthId.current,
    targetPositions: targetPositions.current,
    move,
    sendMessage,
    padStates,
    crownState,
    activeDuel,
    checkDuelPads,
    clearActiveDuel,
  };
};
