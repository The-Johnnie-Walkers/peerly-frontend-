import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFootballSocket } from '../hooks/useFootballSocket';
import { useDuelSnapshot } from '../hooks/useDuelSnapshot';
import { useDuelPhysics } from '../hooks/useDuelPhysics';
import {
  FootballDuelState,
  MatchEndedPayload,
  ReturnToVirtualWorldPayload,
  MATCH_CANVAS_WIDTH,
  MATCH_CANVAS_HEIGHT,
  GOAL_AREAS,
  BALL_RADIUS,
  formatTime,
} from '../types/football-duel.types';

// ─── Field constants ──────────────────────────────────────────────────────────
const FIELD_MARGIN = 20;
const PLAYER_RADIUS = 20;
const FALLBACK_RETURN_DELAY_MS = 10_000;

interface FootballDuelMatchProps {
  matchId: string;
  localPlayer: { userId: string; name: string; role: 1 | 2 };
  opponent: { userId: string; name: string };
  onMatchEnd: (spawnX: number, spawnY: number) => void;
}

type OverlayType = 'goal' | 'win' | 'lose' | 'draw' | null;

const FootballDuelMatch: React.FC<FootballDuelMatchProps> = ({
  matchId,
  localPlayer,
  opponent,
  onMatchEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const keysRef = useRef<Record<string, boolean>>({});

  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [overlayText, setOverlayText] = useState('');
  const [score, setScore] = useState<Record<string, number>>({
    [localPlayer.userId]: 0,
    [opponent.userId]: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [matchEnded, setMatchEnded] = useState(false);

  // Spawn position received from server
  const spawnRef = useRef<{ x: number; y: number } | null>(null);

  // ── Initial positions based on role ──────────────────────────────────────
  const initialX = localPlayer.role === 1 ? 200 : 600;
  const initialY = MATCH_CANVAS_HEIGHT / 2;

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { pushSnapshot, getInterpolatedBall, getInterpolatedOpponent } = useDuelSnapshot();
  const { getLocalPlayerPos, applyInput, stepPhysics, reconcile } = useDuelPhysics({
    initialX,
    initialY,
  });

  const handleGoalScored = useCallback(
    (payload: { scorerId: string; score: Record<string, number> }) => {
      setScore({ ...payload.score });
      setOverlay('goal');
      setOverlayText('⚽ ¡GOL!');
      setTimeout(() => setOverlay(null), 2000);
    },
    [],
  );

  const handleMatchEnded = useCallback(
    (payload: MatchEndedPayload) => {
      setMatchEnded(true);
      setScore(payload.finalScore);

      if (payload.isDraw) {
        setOverlay('draw');
        setOverlayText('🤝 ¡Empate!');
      } else if (payload.winnerId === localPlayer.userId) {
        setOverlay('win');
        setOverlayText('🏆 ¡Ganaste!');
      } else {
        setOverlay('lose');
        setOverlayText(`😔 ¡Perdiste! Ganó ${payload.winnerName ?? 'el oponente'}`);
      }

      // Fallback: if returnToVirtualWorld doesn't arrive in 10 s, force return
      setTimeout(() => {
        if (!spawnRef.current) {
          onMatchEnd(610, 420);
        }
      }, FALLBACK_RETURN_DELAY_MS);
    },
    [localPlayer.userId, onMatchEnd],
  );

  const handleReturnToVirtualWorld = useCallback(
    (payload: ReturnToVirtualWorldPayload) => {
      spawnRef.current = { x: payload.spawnX, y: payload.spawnY };
      onMatchEnd(payload.spawnX, payload.spawnY);
    },
    [onMatchEnd],
  );

  const { lastSnapshot, isConnected, emitPlayerInput } = useFootballSocket({
    matchId,
    onGoalScored: handleGoalScored,
    onMatchEnded: handleMatchEnded,
    onReturnToVirtualWorld: handleReturnToVirtualWorld,
  });

  // ── Sync snapshot into interpolation buffer ───────────────────────────────
  useEffect(() => {
    if (!lastSnapshot) return;
    pushSnapshot(lastSnapshot);

    // Server reconciliation for local player
    const serverPlayer = lastSnapshot.players.find((p) => p.userId === localPlayer.userId);
    if (serverPlayer) {
      reconcile({ x: serverPlayer.x, y: serverPlayer.y }, lastSnapshot.tick);
    }

    // Sync score and time from snapshot
    setScore({ ...lastSnapshot.score });
  }, [lastSnapshot, localPlayer.userId, pushSnapshot, reconcile]);

  // ── Match timer (client-side countdown, synced by snapshots) ─────────────
  useEffect(() => {
    if (matchEnded) return;
    const timer = setInterval(() => setTimeRemaining((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [matchEnded]);

  // ── Keyboard listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      if (!matchEnded) {
        // 1. Read input
        const keys = keysRef.current;
        const dx =
          (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
        const dy =
          (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0);

        if (dx !== 0 || dy !== 0) {
          applyInput({ action: 'move', dx, dy });
          emitPlayerInput({ action: 'move', dx, dy });
        }

        if (keys[' '] || keys.Space) {
          emitPlayerInput({ action: 'kick' });
        }

        // 2. Step local physics
        stepPhysics();
      }

      // 3. Render
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [matchEnded, applyInput, emitPlayerInput, stepPhysics]);

  // ── Canvas draw ───────────────────────────────────────────────────────────
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();

    ctx.clearRect(0, 0, MATCH_CANVAS_WIDTH, MATCH_CANVAS_HEIGHT);

    // Field background
    ctx.fillStyle = '#2d8a4e';
    ctx.fillRect(0, 0, MATCH_CANVAS_WIDTH, MATCH_CANVAS_HEIGHT);

    // Field lines
    drawField(ctx);

    // Interpolated ball
    const ball = getInterpolatedBall(now);
    drawBall(ctx, ball.x, ball.y);

    // Local player
    const localPos = getLocalPlayerPos();
    drawPlayer(ctx, localPos.x, localPos.y, '#f39c12', localPlayer.name, true);

    // Opponent (interpolated)
    const oppPos = getInterpolatedOpponent(now, opponent.userId);
    drawPlayer(ctx, oppPos.x, oppPos.y, '#3498db', opponent.name, false);
  };

  const drawField = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(FIELD_MARGIN, FIELD_MARGIN, MATCH_CANVAS_WIDTH - FIELD_MARGIN * 2, MATCH_CANVAS_HEIGHT - FIELD_MARGIN * 2);

    // Centre line
    ctx.beginPath();
    ctx.moveTo(MATCH_CANVAS_WIDTH / 2, FIELD_MARGIN);
    ctx.lineTo(MATCH_CANVAS_WIDTH / 2, MATCH_CANVAS_HEIGHT - FIELD_MARGIN);
    ctx.stroke();

    // Centre circle
    ctx.beginPath();
    ctx.arc(MATCH_CANVAS_WIDTH / 2, MATCH_CANVAS_HEIGHT / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Goals
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(GOAL_AREAS.left.x, GOAL_AREAS.left.y, GOAL_AREAS.left.width, GOAL_AREAS.left.height);
    ctx.fillRect(GOAL_AREAS.right.x, GOAL_AREAS.right.y, GOAL_AREAS.right.width, GOAL_AREAS.right.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeRect(GOAL_AREAS.left.x, GOAL_AREAS.left.y, GOAL_AREAS.left.width, GOAL_AREAS.left.height);
    ctx.strokeRect(GOAL_AREAS.right.x, GOAL_AREAS.right.y, GOAL_AREAS.right.width, GOAL_AREAS.right.height);
  };

  const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };

  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    name: string,
    isLocal: boolean,
  ) => {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (isLocal) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, PLAYER_RADIUS + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - PLAYER_RADIUS - 6);
    ctx.restore();
  };

  // ── Scores ────────────────────────────────────────────────────────────────
  const localScore = score[localPlayer.userId] ?? 0;
  const opponentScore = score[opponent.userId] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[800px] px-4 py-2 bg-black/60 rounded-t-xl">
        {/* Player 1 score */}
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="text-yellow-400 font-bold text-sm">{localPlayer.name}</span>
          <span className="text-white font-black text-3xl">{localScore}</span>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <span className="text-white/60 text-xs uppercase tracking-widest">Tiempo</span>
          <span className={`font-mono font-black text-2xl ${timeRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatTime(timeRemaining)}
          </span>
          {!isConnected && (
            <span className="text-red-400 text-xs animate-pulse">Reconectando…</span>
          )}
        </div>

        {/* Player 2 score */}
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="text-blue-400 font-bold text-sm">{opponent.name}</span>
          <span className="text-white font-black text-3xl">{opponentScore}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={MATCH_CANVAS_WIDTH}
          height={MATCH_CANVAS_HEIGHT}
          className="block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay */}
        {overlay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`px-8 py-6 rounded-2xl text-center shadow-2xl border-2 ${
                overlay === 'win'
                  ? 'bg-yellow-500/90 border-yellow-300 text-white'
                  : overlay === 'lose'
                  ? 'bg-red-600/90 border-red-400 text-white'
                  : overlay === 'draw'
                  ? 'bg-blue-600/90 border-blue-400 text-white'
                  : 'bg-green-500/90 border-green-300 text-white'
              }`}
            >
              <p className="text-4xl font-black">{overlayText}</p>
              {(overlay === 'win' || overlay === 'lose' || overlay === 'draw') && (
                <p className="text-sm mt-2 opacity-80">Regresando al mapa…</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="mt-2 text-white/40 text-xs">
        WASD / ↑↓←→ para mover &nbsp;·&nbsp; Espacio para patear
      </div>
    </div>
  );
};

export default FootballDuelMatch;
