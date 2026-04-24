import { PadState, PadId, PAD_AREAS } from '../types/football-duel.types';

interface DrawDuelPadsOptions {
  ctx: CanvasRenderingContext2D;
  padStates: PadState[];
  localPlayerOverlap: PadId | null;
}

const PAD_NAMES: Record<PadId, string> = {
  'pad-a': 'Cancha A',
  'pad-b': 'Cancha B',
};

/**
 * Pure canvas drawing function for the two DuelPads.
 * Call this inside the VirtualWorld draw() loop after drawing the grid.
 */
export function drawDuelPads({ ctx, padStates, localPlayerOverlap }: DrawDuelPadsOptions): void {
  for (const pad of padStates) {
    const area = PAD_AREAS[pad.padId];
    const isOverlap = localPlayerOverlap === pad.padId;
    const isLocked = pad.status === 'locked';
    const progress = pad.activationProgress ?? 0;

    // ── Background fill ──────────────────────────────────────────────────────
    if (isLocked) {
      ctx.fillStyle = 'rgba(180, 40, 40, 0.35)';
    } else if (isOverlap) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.35)';
    } else {
      ctx.fillStyle = 'rgba(50, 180, 100, 0.25)';
    }
    ctx.fillRect(area.x, area.y, area.width, area.height);

    // ── Border ───────────────────────────────────────────────────────────────
    ctx.strokeStyle = isLocked ? '#c0392b' : isOverlap ? '#f1c40f' : '#27ae60';
    ctx.lineWidth = isOverlap ? 3 : 2;
    ctx.strokeRect(area.x, area.y, area.width, area.height);

    // ── "Fútbol 1v1" label ───────────────────────────────────────────────────
    ctx.fillStyle = isLocked ? '#c0392b' : '#1a1a1a';
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fútbol 1v1', area.x + area.width / 2, area.y - 18);

    // ── Pad name ─────────────────────────────────────────────────────────────
    ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = isLocked ? '#c0392b' : '#333';
    ctx.fillText(PAD_NAMES[pad.padId], area.x + area.width / 2, area.y - 6);

    // ── Locked state text ────────────────────────────────────────────────────
    if (isLocked) {
      ctx.font = 'bold 9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#c0392b';
      ctx.fillText('En partida', area.x + area.width / 2, area.y + area.height / 2 + 4);
      continue;
    }

    // ── Activation progress bar ──────────────────────────────────────────────
    if (progress > 0) {
      const barH = 6;
      const barY = area.y + area.height + 4;
      const barW = area.width;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(area.x, barY, barW, barH);

      // Fill
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(area.x, barY, barW * progress, barH);

      // Countdown text (2 → 0 seconds)
      const secondsLeft = Math.ceil((1 - progress) * 2);
      ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#e67e22';
      ctx.textAlign = 'center';
      ctx.fillText(`${secondsLeft}s`, area.x + area.width / 2, barY + barH + 10);

      // Particle effect: small dots around the pad border
      drawActivationParticles(ctx, area, progress);
    }

    // ── Occupant name (if someone is standing on it) ─────────────────────────
    if (pad.occupantName && pad.status === 'occupied') {
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'center';
      ctx.fillText(pad.occupantName, area.x + area.width / 2, area.y + area.height / 2 + 4);
    }
  }
}

function drawActivationParticles(
  ctx: CanvasRenderingContext2D,
  area: { x: number; y: number; width: number; height: number },
  progress: number,
): void {
  const count = Math.floor(progress * 8);
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;
  const radius = area.width * 0.6;
  const now = Date.now() / 300;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / 8) * Math.PI * 2 + now;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    const alpha = 0.4 + 0.6 * progress;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}
