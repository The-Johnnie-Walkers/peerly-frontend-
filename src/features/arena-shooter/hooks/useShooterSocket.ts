import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ShooterSnapshot,
  isValidShooterSnapshot,
  ShooterInput,
  PlayerHitPayload,
  PlayerEliminatedPayload,
  PlayerLeftPayload,
  ReturnPayload,
  RoomStatePayload,
} from '../types/arena-shooter.types';
import { realTimeURL } from '@/shared/lib/api';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || realTimeURL;
const RECONNECT_TIMEOUT_MS = 10000;
const EMIT_THROTTLE_MOVE_MS = 16;
const EMIT_THROTTLE_SHOOT_MS = 300;

interface UseShooterSocketProps {
  roomId: string;
  playerName: string;
  onSnapshot: (snapshot: ShooterSnapshot) => void;
  onRoomState?: (payload: RoomStatePayload) => void;
  onPlayerHit?: (payload: PlayerHitPayload) => void;
  onPlayerEliminated?: (payload: PlayerEliminatedPayload) => void;
  onPlayerLeft?: (payload: PlayerLeftPayload) => void;
  onPlayerJoined?: (payload: { userId: string; name: string }) => void;
  onLastPlayerStanding?: (payload: { userId: string }) => void;
  onReturnToVirtualWorld?: (payload: ReturnPayload) => void;
  onRoomFull?: () => void;
  onConnectionLost?: () => void;
  onReconnected?: () => void;
}

export const useShooterSocket = ({
  roomId,
  playerName,
  onSnapshot,
  onRoomState,
  onPlayerHit,
  onPlayerEliminated,
  onPlayerLeft,
  onPlayerJoined,
  onLastPlayerStanding,
  onReturnToVirtualWorld,
  onRoomFull,
  onConnectionLost,
  onReconnected,
}: UseShooterSocketProps) => {
  // ⚠️ SHOOTER ARENA TEMPORARILY DISABLED
  // The shooter arena module is disabled on the server due to performance issues
  // Return mock functions to prevent connection errors
  console.warn('[useShooterSocket] ⚠️ Shooter Arena is temporarily disabled on the server');
  
  return {
    isConnected: false,
    isReconnecting: false,
    emitPlayerInput: () => {
      console.warn('[useShooterSocket] Shooter Arena is disabled');
    },
    disconnect: () => {},
  };

  /* ORIGINAL CODE - Uncomment when shooter arena is re-enabled
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastEmitMoveRef = useRef<number>(0);
  const lastEmitShootRef = useRef<number>(0);

  // --- Use Ref for callbacks to avoid stale closures ---
  const callbacks = useRef({
    onSnapshot,
    onRoomState,
    onPlayerHit,
    onPlayerEliminated,
    onPlayerLeft,
    onPlayerJoined,
    onLastPlayerStanding,
    onReturnToVirtualWorld,
    onRoomFull,
    onConnectionLost,
    onReconnected,
  });

  useEffect(() => {
    callbacks.current = {
      onSnapshot,
      onRoomState,
      onPlayerHit,
      onPlayerEliminated,
      onPlayerLeft,
      onPlayerJoined,
      onLastPlayerStanding,
      onReturnToVirtualWorld,
      onRoomFull,
      onConnectionLost,
      onReconnected,
    };
  }, [
    onSnapshot, onRoomState, onPlayerHit, onPlayerEliminated, 
    onPlayerLeft, onPlayerJoined, onLastPlayerStanding, 
    onReturnToVirtualWorld, onRoomFull, onConnectionLost, onReconnected
  ]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.error('[useShooterSocket] No authentication token found');
      return;
    }
    
    const socket = io(`${REALTIME_URL}/shooter-arena`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Performance optimizations for shooter game
      timeout: 20000,
      forceNew: false,
      upgrade: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
        callbacks.current.onReconnected?.();
      }
      socket.emit('joinRoom', { name: playerName, roomId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(true);
      callbacks.current.onConnectionLost?.();
      reconnectTimerRef.current = setTimeout(() => {
        setIsReconnecting(false);
        socket.disconnect();
        callbacks.current.onReturnToVirtualWorld?.({ spawnX: 400, spawnY: 300 });
      }, RECONNECT_TIMEOUT_MS);
    });

    socket.on('error', (error: any) => {
      console.error('[useShooterSocket] ❌ Server error:', error);
    });

    socket.on('connect_error', (error: any) => {
      console.error('[useShooterSocket] ❌ Connection error:', error);
    });

    socket.on('snapshot', (raw: unknown) => {
      if (isValidShooterSnapshot(raw)) {
        callbacks.current.onSnapshot(raw);
      }
    });

    socket.on('playerHit', (p: PlayerHitPayload) => callbacks.current.onPlayerHit?.(p));
    socket.on('playerEliminated', (p: PlayerEliminatedPayload) => callbacks.current.onPlayerEliminated?.(p));
    socket.on('playerLeft', (p: PlayerLeftPayload) => callbacks.current.onPlayerLeft?.(p));
    socket.on('playerJoined', (p: { userId: string; name: string }) => callbacks.current.onPlayerJoined?.(p));
    socket.on('roomState', (s: RoomStatePayload) => {
      callbacks.current.onRoomState?.(s);
    });
    socket.on('lastPlayerStanding', (p: { userId: string }) => callbacks.current.onLastPlayerStanding?.(p));
    socket.on('returnToVirtualWorld', (p: ReturnPayload) => callbacks.current.onReturnToVirtualWorld?.(p));
    socket.on('roomFull', () => callbacks.current.onRoomFull?.());

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, playerName]);

  const emitPlayerInput = useCallback((input: ShooterInput) => {
    const now = Date.now();
    if (input.action === 'move') {
      if (now - lastEmitMoveRef.current < EMIT_THROTTLE_MOVE_MS) return;
      lastEmitMoveRef.current = now;
    } else if (input.action === 'shoot') {
      if (now - lastEmitShootRef.current < EMIT_THROTTLE_SHOOT_MS) return;
      lastEmitShootRef.current = now;
    }
    socketRef.current?.emit('playerInput', input);
  }, []);

  return { isConnected, isReconnecting, emitPlayerInput };
  */
};
