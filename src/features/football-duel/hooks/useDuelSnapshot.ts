import { useRef, useCallback } from 'react';
import { DuelSnapshot, PhysicsBody, lerp } from '../types/football-duel.types';

const DEFAULT_BODY: PhysicsBody = { x: 400, y: 250, vx: 0, vy: 0 };

interface UseDuelSnapshotReturn {
  pushSnapshot: (snapshot: DuelSnapshot) => void;
  getInterpolatedBall: (renderTime: number) => PhysicsBody;
  getInterpolatedOpponent: (renderTime: number, opponentId: string) => PhysicsBody;
  getCurrentTick: () => number;
}

/**
 * Maintains a 2-snapshot ring buffer and provides linear interpolation
 * between the two most recent server snapshots.
 *
 * Client-side prediction for the LOCAL player is handled separately in
 * useDuelPhysics; this hook only interpolates the BALL and the OPPONENT.
 */
export function useDuelSnapshot(): UseDuelSnapshotReturn {
  // Ring buffer: [older, newer]
  const bufferRef = useRef<[DuelSnapshot | null, DuelSnapshot | null]>([null, null]);

  const pushSnapshot = useCallback((snapshot: DuelSnapshot) => {
    const [, prev] = bufferRef.current;
    bufferRef.current = [prev, snapshot];
  }, []);

  const getInterpolatedBall = useCallback((renderTime: number): PhysicsBody => {
    const [prev, next] = bufferRef.current;
    if (!next) return DEFAULT_BODY;
    if (!prev) return next.ball;

    const duration = next.timestamp - prev.timestamp;
    if (duration <= 0) return next.ball;

    const t = Math.min(1, Math.max(0, (renderTime - prev.timestamp) / duration));
    return {
      x: lerp(prev.ball.x, next.ball.x, t),
      y: lerp(prev.ball.y, next.ball.y, t),
      vx: next.ball.vx,
      vy: next.ball.vy,
    };
  }, []);

  const getInterpolatedOpponent = useCallback(
    (renderTime: number, opponentId: string): PhysicsBody => {
      const [prev, next] = bufferRef.current;
      if (!next) return DEFAULT_BODY;

      const nextPlayer = next.players.find((p) => p.userId === opponentId);
      if (!nextPlayer) return DEFAULT_BODY;
      if (!prev) return nextPlayer;

      const prevPlayer = prev.players.find((p) => p.userId === opponentId);
      if (!prevPlayer) return nextPlayer;

      const duration = next.timestamp - prev.timestamp;
      if (duration <= 0) return nextPlayer;

      const t = Math.min(1, Math.max(0, (renderTime - prev.timestamp) / duration));
      return {
        x: lerp(prevPlayer.x, nextPlayer.x, t),
        y: lerp(prevPlayer.y, nextPlayer.y, t),
        vx: nextPlayer.vx,
        vy: nextPlayer.vy,
      };
    },
    [],
  );

  const getCurrentTick = useCallback((): number => {
    return bufferRef.current[1]?.tick ?? 0;
  }, []);

  return { pushSnapshot, getInterpolatedBall, getInterpolatedOpponent, getCurrentTick };
}
