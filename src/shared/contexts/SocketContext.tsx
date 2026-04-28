import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/features/auth/services/auth.service';
import { ClientToServerEvents, ServerToClientEvents } from '@/features/virtual-world/types/realtime.types';
import { realTimeURL } from '@/shared/lib/api';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

const SOCKET_BASE_URL = import.meta.env.VITE_REALTIME_URL || realTimeURL;
const SOCKET_NAMESPACE = '/map';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  // socketRef holds the instance so we can tear it down when token changes
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
    // If token changed, tear down the old socket first
    if (socketRef.current) {
      console.log('[SocketProvider] Token changed — tearing down previous socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    if (!token) {
      console.log('[SocketProvider] No token, skipping socket creation');
      return;
    }

    console.log('[SocketProvider] Creating socket →', `${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`);

    const newSocket = io(`${SOCKET_BASE_URL}${SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected ✅ id=${newSocket.id}`);
      setIsConnected(true);
    });
    newSocket.on('connect_error', (err) =>
      console.error('[Socket] Connection error ❌:', err.message));
    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });
    newSocket.on('reconnect_failed', () => {
      console.warn('[Socket] Reconnection failed — recreating socket');
      // Force recreation by toggling token state
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      // Trigger effect re-run after a short delay
      setTimeout(() => {
        const current = authService.getToken();
        if (current) {
          setToken(t => t === current ? current + '' : current); // force re-render
          setToken(current);
        }
      }, 2000);
    });

    socketRef.current = newSocket;
    // Set socket immediately so consumers can register listeners before connect fires
    setSocket(newSocket);

    // No cleanup return here on purpose:
    // The socket must survive route changes (VirtualWorld mount/unmount).
    // It is only torn down when the token changes (handled at the top of this effect).
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disconnect on true unmount (app teardown / logout)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('[SocketProvider] App unmounting — disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
