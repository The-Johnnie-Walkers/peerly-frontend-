import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/shared/contexts/SocketContext';
import { UserInMap, ChatMessage, Position } from '../types/realtime.types';
import { toast } from '@/shared/components/ui/use-toast';

export const useRealtimeMap = () => {
  const { socket } = useSocket();
  const [users, setUsers] = useState<UserInMap[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Ref para posiciones objetivo (para interpolación)
  const targetPositions = useRef<Record<string, Position>>({});
  // Ref para el último tiempo de actualización enviado
  const lastUpdateSent = useRef<number>(0);
  const THROTTLE_MS = 60;

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('joinMap');
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onInitialPositions = (initialUsers: UserInMap[]) => {
      setUsers(initialUsers);
      initialUsers.forEach(u => {
        targetPositions.current[u.id] = { x: u.x, y: u.y };
      });
    };

    const onUserJoined = (user: UserInMap) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      targetPositions.current[user.id] = { x: user.x, y: user.y };
      toast({
        title: "Nuevo usuario",
        description: `${user.name} ha entrado al mapa`,
      });
    };

    const onUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      delete targetPositions.current[userId];
    };

    const onPositionUpdate = (update: { userId: string; x: number; y: number }) => {
      targetPositions.current[update.userId] = { x: update.x, y: update.y };
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatHistory(prev => [...prev.slice(-49), msg]);
    };

    const onError = (errorMsg: string) => {
      console.error('[Realtime Error]:', errorMsg);
      toast({
        variant: "destructive",
        title: "Error en tiempo real",
        description: errorMsg,
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

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('initialPositions', onInitialPositions);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
      socket.off('positionUpdate', onPositionUpdate);
      socket.off('chatMessage', onChatMessage);
      socket.off('error', onError);
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
