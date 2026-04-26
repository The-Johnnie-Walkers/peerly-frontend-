import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/features/auth/services/auth.service';
import {
  FootballDuelState,
  DuelSnapshot,
  PlayerInput,
  MatchEndedPayload,
  ReturnToVirtualWorldPayload,
  isValidSnapshot,
} from '../types/football-duel.types';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:3001';
const EMIT_THROTTLE_MS = 16; // ~60 fps

interface UseFootballSocketOptions {
  matchId: string;
  onGoalScored?: (payload: { scorerId: string; score: Record<string, number> }) => void;
  onMatchEnded?: (payload: MatchEndedPayload) => void;
  onReturnToVirtualWorld?: (payload: ReturnToVirtualWorldPayload) => void;
  onMatchNotFound?: (matchId: string) => void;
}

interface UseFootballSocketReturn {
  matchState: FootballDuelState | null;
  lastSnapshot: DuelSnapshot | null;
  isConnected: boolean;
  emitPlayerInput: (input: PlayerInput) => void;
}

export function useFootballSocket({
  matchId,
  onGoalScored,
  onMatchEnded,
  onReturnToVirtualWorld,
  onMatchNotFound,
}: UseFootballSocketOptions): UseFootballSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const lastEmitRef = useRef<number>(0);

  const [matchState, setMatchState] = useState<FootballDuelState | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<DuelSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = authService.getToken();

    const socket = io(`${REALTIME_URL}/football-duel`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinMatch', { matchId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('matchState', (state: FootballDuelState) => {
      setMatchState(state);
    });

    socket.on('snapshot', (raw: unknown) => {
      if (isValidSnapshot(raw)) {
        setLastSnapshot(raw);
      } else {
        console.error('[useFootballSocket] Invalid snapshot discarded', raw);
      }
    });

    socket.on('goalScored', (payload: { scorerId: string; score: Record<string, number> }) => {
      onGoalScored?.(payload);
    });

    socket.on('matchEnded', (payload: MatchEndedPayload) => {
      onMatchEnded?.(payload);
    });

    socket.on('returnToVirtualWorld', (payload: ReturnToVirtualWorldPayload) => {
      onReturnToVirtualWorld?.(payload);
    });

    socket.on('matchNotFound', ({ matchId: id }: { matchId: string }) => {
      onMatchNotFound?.(id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  /** Throttled emit – max 60 events/s */
  const emitPlayerInput = useCallback((input: PlayerInput) => {
    const now = Date.now();
    if (now - lastEmitRef.current < EMIT_THROTTLE_MS) return;
    lastEmitRef.current = now;
    socketRef.current?.emit('playerInput', { matchId, ...input });
  }, [matchId]);

  return { matchState, lastSnapshot, isConnected, emitPlayerInput };
}
