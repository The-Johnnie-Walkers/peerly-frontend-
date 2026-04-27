import { useRef, useCallback } from 'react';
import {
  Vec2,
  ShooterInput,
  lerp,
  PLAYER_SPEED,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PLAYER_RADIUS,
  RECONCILE_THRESHOLD,
  CORRECTION_FRAMES,
} from '../types/arena-shooter.types';

interface Position extends Vec2 {}

interface UseShooterPhysicsOptions {
  initialX: number;
  initialY: number;
}

interface UseShooterPhysicsReturn {
  getLocalPlayerPos: () => Position;
  /** Última dirección de movimiento registrada (para disparos sin movimiento activo) */
  getLastDirection: () => Vec2;
  applyInput: (input: ShooterInput) => void;
  /** Avanza la simulación local un frame */
  stepPhysics: () => void;
  /**
   * Server reconciliation: si la posición autoritativa difiere más de
   * RECONCILE_THRESHOLD px, inicia corrección suave en CORRECTION_FRAMES frames.
   */
  reconcile: (serverPos: Position, tick: number) => void;
}

/**
 * Client-side prediction para el jugador local del Arena Shooter.
 * Sin Matter.js — movimiento lineal simple (igual que el servidor).
 *
 * Diferencias respecto a useDuelPhysics:
 * - No usa Matter.js (movimiento lineal directo)
 * - Mantiene última dirección para disparos sin movimiento activo
 * - Clamp manual a límites de arena
 */
export function useShooterPhysics({
  initialX,
  initialY,
}: UseShooterPhysicsOptions): UseShooterPhysicsReturn {
  const posRef = useRef<Position>({ x: initialX, y: initialY });
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastDirRef = useRef<Vec2>({ x: 1, y: 0 });
  const lastStepTimeRef = useRef<number>(0);

  // Estado de corrección suave
  const correctionRef = useRef<{
    target: Position;
    framesLeft: number;
  } | null>(null);

  const applyInput = useCallback((input: ShooterInput) => {
    if (input.action !== 'move') return;

    const dx = input.dx ?? 0;
    const dy = input.dy ?? 0;

    velRef.current = {
      x: dx * PLAYER_SPEED,
      y: dy * PLAYER_SPEED,
    };

    // Guardar última dirección solo si hay movimiento activo
    if (dx !== 0 || dy !== 0) {
      lastDirRef.current = { x: dx, y: dy };
    }
  }, []);

  const stepPhysics = useCallback(() => {
    const now = performance.now();
    // Delta en segundos desde el último step, clampeado a máx 100ms para evitar
    // saltos grandes si el tab estuvo en background
    const rawDelta = lastStepTimeRef.current ? now - lastStepTimeRef.current : 16.67;
    const deltaMs = Math.min(rawDelta, 100);
    lastStepTimeRef.current = now;

    // Escalar velocidad por delta real (la velocidad está en px/tick a 30tps = px/33ms)
    // Multiplicamos por deltaMs/33.33 para que sea frame-rate independent
    const scale = deltaMs / 33.33;

    const pos = posRef.current;
    const vel = velRef.current;

    let nx = pos.x + vel.x * scale;
    let ny = pos.y + vel.y * scale;

    // Clamp a límites de arena
    nx = Math.max(PLAYER_RADIUS, Math.min(ARENA_WIDTH - PLAYER_RADIUS, nx));
    ny = Math.max(PLAYER_RADIUS, Math.min(ARENA_HEIGHT - PLAYER_RADIUS, ny));

    // Aplicar corrección suave si está activa
    if (correctionRef.current && correctionRef.current.framesLeft > 0) {
      const { target, framesLeft } = correctionRef.current;
      const t = 1 / framesLeft;
      nx = lerp(nx, target.x, t);
      ny = lerp(ny, target.y, t);
      correctionRef.current.framesLeft--;
      if (correctionRef.current.framesLeft === 0) {
        correctionRef.current = null;
      }
    }

    posRef.current = { x: nx, y: ny };
  }, []);

  const reconcile = useCallback((serverPos: Position, _tick: number) => {
    const pos = posRef.current;
    const dx = serverPos.x - pos.x;
    const dy = serverPos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > RECONCILE_THRESHOLD) {
      // Drift grande (teletransporte, anti-cheat) — corregir en CORRECTION_FRAMES
      correctionRef.current = { target: serverPos, framesLeft: CORRECTION_FRAMES };
    } else if (dist > 2) {
      // Drift pequeño — snap suave directo sin animación de corrección
      // Mezcla 15% hacia la posición del servidor cada reconciliación
      posRef.current = {
        x: pos.x + dx * 0.15,
        y: pos.y + dy * 0.15,
      };
    }
    // < 2px: ignorar — ruido de floating point
  }, []);

  const getLocalPlayerPos = useCallback((): Position => {
    return { ...posRef.current };
  }, []);

  const getLastDirection = useCallback((): Vec2 => {
    return { ...lastDirRef.current };
  }, []);

  return { getLocalPlayerPos, getLastDirection, applyInput, stepPhysics, reconcile };
}
