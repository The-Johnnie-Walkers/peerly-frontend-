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

    if (isLocked) {
      drawLockedPad(ctx, area, pad);
      continue;
    }

    // ── Background fill ──────────────────────────────────────────────────────
    ctx.fillStyle = isOverlap ? 'rgba(255, 200, 0, 0.35)' : 'rgba(50, 180, 100, 0.25)';
    ctx.fillRect(area.x, area.y, area.width, area.height);

    // ── Border ───────────────────────────────────────────────────────────────
    ctx.strokeStyle = isOverlap ? '#f1c40f' : '#27ae60';
    ctx.lineWidth = isOverlap ? 3 : 2;
    ctx.strokeRect(area.x, area.y, area.width, area.height);

    // ── "Fútbol 1v1" label ───────────────────────────────────────────────────
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fútbol 1v1', area.x + area.width / 2, area.y - 18);

    // ── Pad name ─────────────────────────────────────────────────────────────
    ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(PAD_NAMES[pad.padId], area.x + area.width / 2, area.y - 6);

    // ── Occupant name ────────────────────────────────────────────────────────
    if (pad.occupantName && pad.status === 'occupied') {
      ctx.font = '9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'center';
      ctx.fillText(pad.occupantName, area.x + area.width / 2, area.y + area.height / 2 + 4);
    }
  }
}

function drawLockedPad(
  ctx: CanvasRenderingContext2D,
  area: { x: number; y: number; width: number; height: number },
  pad: PadState,
): void {
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;

  // ── Grey fill ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(80, 80, 90, 0.72)';
  ctx.fillRect(area.x, area.y, area.width, area.height);

  // ── Diagonal stripe pattern ──────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.width, area.height);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 6;
  for (let i = -area.height; i < area.width + area.height; i += 14) {
    ctx.beginPath();
    ctx.moveTo(area.x + i, area.y);
    ctx.lineTo(area.x + i + area.height, area.y + area.height);
    ctx.stroke();
  }
  ctx.restore();

  // ── Pulsing border ───────────────────────────────────────────────────────
  const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 400);
  ctx.strokeStyle = `rgba(160, 160, 175, ${pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(area.x, area.y, area.width, area.height);
  ctx.setLineDash([]);

  // ── Lock icon (drawn with primitives) ────────────────────────────────────
  const lx = cx;
  const ly = cy - 10;
  const bw = 16, bh = 11, br = 3;
  const bx = lx - bw / 2;
  const by = ly;

  // Shackle (arc)
  ctx.beginPath();
  ctx.arc(lx, ly - 1, 6, Math.PI, 0, false);
  ctx.strokeStyle = 'rgba(220, 220, 230, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Body (rounded rect)
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, br);
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, br);
  ctx.arcTo(bx, by + bh, bx, by, br);
  ctx.arcTo(bx, by, bx + bw, by, br);
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 220, 230, 0.9)';
  ctx.fill();

  // Keyhole dot
  ctx.beginPath();
  ctx.arc(lx, by + bh / 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80, 80, 90, 0.9)';
  ctx.fill();

  // ── "En partida" text ────────────────────────────────────────────────────
  ctx.font = 'bold 9px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(220, 220, 230, 0.95)';
  ctx.textAlign = 'center';
  ctx.fillText('EN PARTIDA', cx, cy + 14);

  // ── Labels above ─────────────────────────────────────────────────────────
  ctx.font = 'bold 11px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(180, 180, 190, 0.85)';
  ctx.fillText('Fútbol 1v1', cx, area.y - 18);

  ctx.font = 'bold 10px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(160, 160, 170, 0.85)';
  ctx.fillText(pad.padId === 'pad-a' ? 'Cancha A' : 'Cancha B', cx, area.y - 6);
}

