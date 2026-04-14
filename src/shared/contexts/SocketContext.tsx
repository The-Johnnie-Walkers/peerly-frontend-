import React, { createContext, useContext, useEffect, useState } from 'react';
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
  // Track the token so we reconnect when the user logs in
  const [token, setToken] = useState<string | null>(() => authService.getToken());

  // Poll for token changes (login/logout) every second
  useEffect(() => {
    const interval = setInterval(() => {
      const current = authService.getToken();
      setToken(prev => (prev !== current ? current : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) {
      // No token — disconnect any existing socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Already have a socket with this token — nothing to do
    if (socket && socket.connected) return;

    console.log('[SocketProvider] Creating socket connection to', `${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`);

    const newSocket = io(`${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected ✅ id=${newSocket.id}`);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error ❌:', err.message, err);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    newSocket.on('error', (err) => {
      console.error('[Socket] Server error event:', err);
    });

    setSocket(newSocket);

    return () => {
      console.log('[SocketProvider] Cleaning up socket');
      newSocket.disconnect();
      setSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
