import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/features/auth/services/auth.service';
import {
  ChatMessage,
  ClientToChatEvents,
  ServerToChatEvents,
} from '../types/chat.types';
import { connectionsURL } from '@/shared/lib/api';


type ChatSocket = Socket<ServerToChatEvents, ClientToChatEvents>;

interface UseChatSocketReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
  isLoading: boolean;
}

export function useChatSocket(roomId: string | null, userName?: string): UseChatSocketReturn {
  const socketRef = useRef<ChatSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentRoomRef = useRef<string | null>(null);

  // Inicializar socket una sola vez
  useEffect(() => {
    const token = authService.getToken();
    const userId = localStorage.getItem('user_id');
    const storedName = localStorage.getItem('user_name');
    const displayName = userName || storedName || 'Usuario';
    if (!token || !userId) return;

    const socket: ChatSocket = io(`${connectionsURL}/chats`, {
      auth: { token, userId, userName: displayName },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[ChatSocket] Connected');
      // Si ya había una room activa, volver a unirse
      if (currentRoomRef.current) {
        socket.emit('joinRoom', { roomId: currentRoomRef.current });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[ChatSocket] Disconnected');
    });

    socket.on('roomHistory', (history) => {
      setMessages(history);
      setIsLoading(false);
    });

    socket.on('newMessage', (message) => {
      setMessages(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('error', (err) => {
      console.error('[ChatSocket] Error:', err);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Solo una vez al montar

  // Cambiar de room cuando cambia roomId
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Salir de la room anterior
    if (currentRoomRef.current && currentRoomRef.current !== roomId) {
      socket.emit('leaveRoom', { roomId: currentRoomRef.current });
    }

    if (!roomId) {
      currentRoomRef.current = null;
      setMessages([]);
      return;
    }

    currentRoomRef.current = roomId;
    setMessages([]);
    setIsLoading(true);

    if (socket.connected) {
      socket.emit('joinRoom', { roomId });
      socket.emit('markRead', { roomId });
    }
  }, [roomId]);

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket || !roomId || !text.trim()) return;
    socket.emit('sendMessage', { roomId, text: text.trim() });
  }, [roomId]);

  return { messages, sendMessage, isConnected, isLoading };
}
