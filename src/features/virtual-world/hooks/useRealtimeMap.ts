import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/shared/contexts/SocketContext';
import { UserInMap, ChatMessage, Position } from '../types/realtime.types';
import { toast } from '@/shared/components/ui/use-toast';

export const useRealtimeMap = () => {
  const { socket } = useSocket();
  const [users, setUsers] = useState<UserInMap[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const targetPositions = useRef<Record<string, Position>>({});
  const lastUpdateSent = useRef<number>(0);
  const THROTTLE_MS = 60;
  const hasJoinedMap = useRef<boolean>(false);

  useEffect(() => {
    if (!socket) {
      console.log('[useRealtimeMap] socket is null, skipping setup');
      hasJoinedMap.current = false;
      return;
    }
    console.log('[useRealtimeMap] setting up listeners, socket.connected:', socket.connected, 'id:', socket.id);

    const emitJoinMap = () => {
      if (!hasJoinedMap.current) {
        console.log('[useRealtimeMap] emitting joinMap');
        socket.emit('joinMap');
        hasJoinedMap.current = true;
      }
    };

    const onConnect = () => {
      console.log('[useRealtimeMap] onConnect fired, id:', socket.id);
      setIsConnected(true);
      emitJoinMap();
    };

    const onDisconnect = () => {
      console.log('[useRealtimeMap] onDisconnect fired');
      setIsConnected(false);
      hasJoinedMap.current = false;
    };

    const onInitialPositions = (initialUsers: AvatarPosition[]) => {
      setUsers(prev => {
        const newUsers = [...prev];
        initialUsers.forEach(u => {
          const existingIdx = newUsers.findIndex(user => user.userId === u.userId);
          const newUserObj: UserInMap = {
            userId: u.userId,
            name: u.name,
            color: u.color || '#6366f1',
            x: u.x,
            y: u.y
          };
          
          if (existingIdx >= 0) {
            newUsers[existingIdx] = newUserObj;
          } else {
            newUsers.push(newUserObj);
          }
          targetPositions.current[u.userId] = { x: u.x, y: u.y };
        });
        return newUsers;
      });
    };

    const onUserJoined = (payload: { userId: string; name: string; email: string; timestamp: number }) => {
      const newUser: UserInMap = {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        color: '#6366f1',
        x: 400,
        y: 300,
        timestamp: payload.timestamp
      };
      
      setUsers(prev => {
        const filtered = prev.filter(u => u.userId !== payload.userId);
        return [...filtered, newUser];
      });
      
      // Update target position for interpolation
      targetPositions.current[payload.userId] = { x: newUser.x, y: newUser.y };
      
      toast({
        title: "Nuevo usuario",
        description: `${payload.name} ha entrado al mapa`,
      });
    };

    const onUserLeft = (payload: { userId: string; timestamp: number }) => {
      setUsers(prev => prev.filter(u => u.userId !== payload.userId));
      delete targetPositions.current[payload.userId];
    };

    const onPositionUpdate = (update: PositionUpdate) => {
      targetPositions.current[update.userId] = { x: update.x, y: update.y };
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatHistory(prev => [...prev.slice(-49), msg]);
    };

    const onError = (error: RealtimeError) => {
      console.error('[Realtime Error]:', error);
      toast({
        variant: "destructive",
        title: `Error: ${error.code}`,
        description: error.message,
      });

      if (error.code === 'AUTH_ERROR') {
        // Podríamos redirigir al login o limpiar el token
        console.warn('Authentication error detected. Please log in again.');
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('initialPositions', onInitialPositions);
    socket.on('userJoined', onUserJoined);
    socket.on('userLeft', onUserLeft);
    socket.on('positionUpdate', onPositionUpdate);
    socket.on('chatMessage', onChatMessage);
    socket.on('error', onError);

    // If socket is already connected when this effect runs, join immediately
    if (socket.connected) {
      console.log('[useRealtimeMap] socket already connected on mount, joining now');
      setIsConnected(true);
      emitJoinMap();
    } else {
      // Socket exists but not yet connected — connect it now
      console.log('[useRealtimeMap] socket not connected, calling connect()');
      socket.connect();
    }

    return () => {
      if (socket.connected) {
        socket.emit('leaveMap');
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('initialPositions', onInitialPositions);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
      socket.off('positionUpdate', onPositionUpdate);
      socket.off('chatMessage', onChatMessage);
      socket.off('error', onError);
      
      // Disconnect socket so next mount starts fresh
      socket.disconnect();
      hasJoinedMap.current = false;
    };
  }, [socket]);

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
    users,
    chatHistory,
    isConnected,
    targetPositions: targetPositions.current,
    move,
    sendMessage
  };
};
