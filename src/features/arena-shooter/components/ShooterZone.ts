/**
 * drawShooterZone — función canvas pura para renderizar la Shooter_Zone.
 * Análoga a drawDuelPads del minijuego de fútbol.
 *
 * Estados visuales:
 * - available: borde verde, fondo verde translúcido
 * - highlighted: borde amarillo + brillo (jugador encima)
 * - locked: borde rojo, fondo rojo, texto "Sala llena"
 */

export type ZoneState = 'available' | 'highlighted' | 'locked';

export interface ShooterZoneArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawShooterZoneOptions {
  ctx: CanvasRenderingContext2D;
  zone: ShooterZoneArea;
  state: ZoneState;
  /** 0.0 – 1.0: progreso de entrada (0 = sin progreso, 1 = listo para entrar) */
  progress: number;
  activePlayers: number;
}

/**
 * Dibuja la Shooter_Zone en el canvas del VirtualWorld.
 * Llamar dentro del loop de dibujo del mapa, después del grid.
 */
export function drawShooterZone({
  ctx,
  zone,
  state,
  progress,
  activePlayers,
}: DrawShooterZoneOptions): void {
  const { x, y, width, height } = zone;
  const cx = x + width / 2;

  if (state === 'locked') {
    drawLockedZone(ctx, zone, activePlayers);
    return;
  }

  const isHighlighted = state === 'highlighted';

  // ── Fondo ────────────────────────────────────────────────────────────────
  ctx.fillStyle = isHighlighted
    ? 'rgba(255, 80, 80, 0.35)'
    : 'rgba(220, 50, 50, 0.20)';
  ctx.fillRect(x, y, width, height);

  // ── Borde ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = isHighlighted ? '#f1c40f' : '#e74c3c';
  ctx.lineWidth = isHighlighted ? 3 : 2;
  ctx.strokeRect(x, y, width, height);

  // ── Ícono de disparo (🎯 dibujado con primitivas) ─────────────────────────
  drawCrosshairIcon(ctx, cx, y + height / 2 - 8);

  // ── Etiqueta "Arena Shooter" ──────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Arena Shooter', cx, y - 18);

  // ── Contador de jugadores ─────────────────────────────────────────────────
  ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText(`${activePlayers}/6 jugadores`, cx, y - 6);

  // ── Barra de progreso de entrada (2 s) ────────────────────────────────────
  if (isHighlighted) {
    const barH = 6;
    const barY = y + height + 4;

    // Fondo de la barra (siempre visible cuando está highlighted)
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, barY, width, barH);

    if (progress > 0) {
      // Barra de progreso animada
      ctx.fillStyle = progress > 0.7 ? '#2ecc71' : '#f1c40f';
      ctx.fillRect(x, barY, width * progress, barH);

      const secondsLeft = Math.ceil((1 - progress) * 2);
      ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#e67e22';
      ctx.textAlign = 'center';
      ctx.fillText(`${secondsLeft}s`, cx, barY + barH + 10);
    } else {
      // Barra vacía con texto "Espera..."
      ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('Mantente aquí...', cx, barY + barH + 10);
    }

    // Partículas siempre visibles cuando está highlighted
    drawActivationParticles(ctx, zone, Math.max(0.15, progress));
  }
}

// ─── Zona bloqueada ───────────────────────────────────────────────────────────

function drawLockedZone(
  ctx: CanvasRenderingContext2D,
  zone: ShooterZoneArea,
  activePlayers: number,
): void {
  const { x, y, width, height } = zone;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Fondo rojo oscuro
  ctx.fillStyle = 'rgba(120, 20, 20, 0.75)';
  ctx.fillRect(x, y, width, height);

  // Patrón de rayas diagonales
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 6;
  for (let i = -height; i < width + height; i += 14) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + height, y + height);
    ctx.stroke();
  }
  ctx.restore();

  // Borde rojo pulsante
  const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 400);
  ctx.strokeStyle = `rgba(231, 76, 60, ${pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);

  // Texto "SALA LLENA"
  ctx.font = 'bold 9px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 200, 200, 0.95)';
  ctx.textAlign = 'center';
  ctx.fillText('SALA LLENA', cx, cy + 4);

  // Contador
  ctx.font = '8px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 180, 180, 0.8)';
  ctx.fillText(`${activePlayers}/6`, cx, cy + 16);

  // Etiqueta superior
  ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 180, 180, 0.85)';
  ctx.fillText('Arena Shooter', cx, y - 18);
}

// ─── Ícono de mira (crosshair) ────────────────────────────────────────────────

function drawCrosshairIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const r = 8;
  const gap = 3;

  ctx.save();
  ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)';
  ctx.lineWidth = 2;

  // Círculo exterior
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cruz
  ctx.beginPath();
  ctx.moveTo(cx - r - gap, cy);
  ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + r + gap, cy);
  ctx.moveTo(cx, cy - r - gap);
  ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap);
  ctx.lineTo(cx, cy + r + gap);
  ctx.stroke();

  // Punto central
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
  ctx.fill();

  ctx.restore();
}

// ─── Partículas de activación ─────────────────────────────────────────────────

function drawActivationParticles(
  ctx: CanvasRenderingContext2D,
  zone: ShooterZoneArea,
  progress: number,
): void {
  // Mínimo 4 partículas, máximo 12
  const count = Math.max(4, Math.floor(progress * 12));
  const cx = zone.x + zone.width / 2;
  const cy = zone.y + zone.height / 2;
  const now = Date.now() / 250;

  ctx.save();
  for (let i = 0; i < count; i++) {
    // Órbita exterior
    const outerAngle = (i / count) * Math.PI * 2 + now;
    const outerR = zone.width * 0.65;
    const px = cx + Math.cos(outerAngle) * outerR;
    const py = cy + Math.sin(outerAngle) * outerR;
    const alpha = 0.5 + 0.5 * progress;
    const size = 2 + progress * 3;

    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(231, 76, 60, 0.8)';
    ctx.fill();
  }

  // Partículas interiores más pequeñas (solo cuando hay progreso)
  if (progress > 0.1) {
    const innerCount = Math.floor(progress * 6);
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2 - now * 1.5;
      const r = zone.width * 0.3;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(241, 196, 15, ${0.6 + 0.4 * progress})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(241, 196, 15, 0.8)';
      ctx.fill();
    }
  }

  ctx.restore();
}
