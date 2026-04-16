import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/features/auth/services/auth.service';
import { ClientToServerEvents, ServerToClientEvents } from '@/features/virtual-world/types/realtime.types';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

const SOCKET_BASE_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:3004';
const SOCKET_NAMESPACE = '/map';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const socketRef = useRef<Socket | null>(null);

  // Poll for token changes (login/logout/expiration) every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const current = authService.getToken();
      setToken(prev => (prev !== current ? current : prev));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Tear down any existing socket when token changes
    if (socketRef.current) {
      console.log('[SocketProvider] Tearing down previous socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    if (!token) {
      console.log('[SocketProvider] No token, skipping socket creation');
      return;
    }

    console.log('[SocketProvider] Creating socket for', `${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`);

    const newSocket = io(`${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false, // hook controls reconnection via re-mount
    });

    newSocket.on('connect', () => console.log(`[Socket] Connected ✅ id=${newSocket.id}`));
    newSocket.on('connect_error', (err) => console.error('[Socket] Connection error ❌:', err.message));
    newSocket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('[SocketProvider] Cleanup — disconnecting socket');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
