import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, UserPlus, MessageSquare } from 'lucide-react';
import { useRealtimeMap } from '../hooks/useRealtimeMap';
import { useSocket } from '@/shared/contexts/SocketContext';
import { authService } from '@/features/auth/services/auth.service';
import { api } from '@/shared/lib/api';
import { toast } from '@/shared/components/ui/use-toast';
import { UserInMap, ChatMessage } from '../types/realtime.types';
import { drawDuelPads } from '@/features/football-duel/components/DuelPads';
import { drawCrown } from '@/features/football-duel/components/Crown';
import { PadId, PAD_AREAS, PadState, CrownState, DuelStartedPayload } from '@/features/football-duel/types/football-duel.types';
import FootballDuelMatch from '@/features/football-duel/components/FootballDuelMatch';

interface ChatBubble extends ChatMessage {
  id: string;
}

const CANVAS_THEME = {
  grid: 'hsl(43 35% 82%)',
  foreground: 'hsl(0 0% 31%)',
  mutedForeground: 'hsl(0 0% 36%)',
  surface: 'hsl(0 0% 100%)',
  primary: 'hsl(12 70% 63%)',
  primaryDark: 'hsl(12 72% 48%)',
  secondary: 'hsl(146 53% 69%)',
  secondaryDeep: 'hsl(146 45% 52%)',
} as const;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 32;
const AVATAR_RADIUS = 20;
const MOVEMENT_SPEED = 3;
const PROXIMITY_THRESHOLD = 80;
const BUBBLE_TIMEOUT = 3000;
const LERP_FACTOR = 0.15;

const VirtualWorld: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const { socket } = useSocket();
  const {
    users: remoteUsers,
    chatHistory,
    move,
    sendMessage,
    targetPositions,
    myAuthId,
    padStates,
    crownState,
    activeDuel,
    checkDuelPads,
    clearActiveDuel,
    rejoinMap,
  } = useRealtimeMap();

  // ── All mutable state that the RAF loop reads goes into refs ──────────────
  const remoteUsersRef = useRef<UserInMap[]>(remoteUsers);
  const targetPositionsRef = useRef(targetPositions);
  const moveRef = useRef(move);
  const padStatesRef = useRef<PadState[]>(padStates);
  const crownStateRef = useRef<CrownState | null>(crownState);
  const checkDuelPadsRef = useRef(checkDuelPads);
  const isChatFocusedRef = useRef(false);
  const activeDuelRef = useRef<DuelStartedPayload | null>(activeDuel);
  const myAuthIdRef = useRef<string | null>(myAuthId);

  // Keep refs in sync with latest values every render (no re-render cost)
  useEffect(() => { remoteUsersRef.current = remoteUsers; }, [remoteUsers]);
  useEffect(() => { targetPositionsRef.current = targetPositions; }, [targetPositions]);
  useEffect(() => { moveRef.current = move; }, [move]);
  useEffect(() => { padStatesRef.current = padStates; }, [padStates]);
  useEffect(() => { crownStateRef.current = crownState; }, [crownState]);
  useEffect(() => { checkDuelPadsRef.current = checkDuelPads; }, [checkDuelPads]);
  useEffect(() => { activeDuelRef.current = activeDuel; }, [activeDuel]);
  useEffect(() => { myAuthIdRef.current = myAuthId; }, [myAuthId]);

  // ── React state (only for UI re-renders) ─────────────────────────────────
  const [player, setPlayer] = useState(() => ({
    x: Math.random() * (CANVAS_WIDTH - 100) + 50,
    y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
    name: currentUser?.name || 'Tú',
    color: CANVAS_THEME.primaryDark,
  }));
  const playerRef = useRef(player);

  const [inputMessage, setInputMessage] = useState('');
  const [nearbyUser, setNearbyUser] = useState<UserInMap | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMatch, setActiveMatch] = useState<{
    matchId: string;
    role: 1 | 2;
    opponent: { userId: string; name: string };
  } | null>(null);

  const bubblesRef = useRef<ChatBubble[]>([]);
  const renderedUsersRef = useRef<UserInMap[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const keysPressed = useRef<Record<string, boolean>>({});

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Chat bubbles ──────────────────────────────────────────────────────────
  const addBubble = useCallback((userId: string, userName: string, message: string) => {
    const bubble: ChatBubble = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      name: userName,
      message,
      timestamp: Date.now(),
    };
    bubblesRef.current = [...bubblesRef.current.slice(-9), bubble];
    setTimeout(() => {
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== bubble.id);
    }, BUBBLE_TIMEOUT);
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const last = chatHistory[chatHistory.length - 1];
      addBubble(last.userId, last.name, last.message);
    }
  }, [chatHistory, addBubble]);

  // ── Duel transition ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeDuel) return;
    // Use myAuthId (JWT sub) — same ID the server uses to identify players
    const uid = myAuthIdRef.current;
    if (!uid) return;
    const isP1 = activeDuel.player1.userId === uid;
    setActiveMatch({
      matchId: activeDuel.matchId,
      role: isP1 ? 1 : 2,
      opponent: isP1 ? activeDuel.player2 : activeDuel.player1,
    });
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    // Leave the map while in the duel so the avatar disappears for other users
    // and the server cleans up presence. rejoinMap() will re-add on return.
    if (socket?.connected) {
      socket.emit('leaveMap');
    }
  }, [activeDuel, socket]);

  // ── Main RAF loop (stable — no deps that change on every render) ──────────
  const update = useCallback(() => {
    let dx = 0, dy = 0;

    if (!isChatFocusedRef.current) {
      const k = keysPressed.current;
      if (k.w || k.ArrowUp    || k['btn-up'])    dy -= MOVEMENT_SPEED;
      if (k.s || k.ArrowDown  || k['btn-down'])  dy += MOVEMENT_SPEED;
      if (k.a || k.ArrowLeft  || k['btn-left'])  dx -= MOVEMENT_SPEED;
      if (k.d || k.ArrowRight || k['btn-right']) dx += MOVEMENT_SPEED;
    }

    if (dx !== 0 || dy !== 0) {
      const nx = Math.max(AVATAR_RADIUS, Math.min(CANVAS_WIDTH  - AVATAR_RADIUS, playerRef.current.x + dx));
      const ny = Math.max(AVATAR_RADIUS, Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, playerRef.current.y + dy));
      if (nx !== playerRef.current.x || ny !== playerRef.current.y) {
        const next = { ...playerRef.current, x: nx, y: ny };
        playerRef.current = next;
        setPlayer(next);
        moveRef.current(nx, ny);
      }
    }

    // Interpolate remote users — filter self using myAuthId (JWT sub)
    const myId = myAuthIdRef.current || '';
    const updated = remoteUsersRef.current
      .filter(u => u.userId !== myId)
      .map(user => {
        const target = targetPositionsRef.current[user.userId] || { x: user.x, y: user.y };
        const prev = renderedUsersRef.current.find(r => r.userId === user.userId);
        const cx = prev ? prev.x : user.x;
        const cy = prev ? prev.y : user.y;
        return {
          ...user,
          color: user.color || CANVAS_THEME.secondaryDeep,
          x: cx + (target.x - cx) * LERP_FACTOR,
          y: cy + (target.y - cy) * LERP_FACTOR,
        };
      });
    renderedUsersRef.current = updated;

    // Proximity check
    let closest: UserInMap | null = null;
    let minDist = PROXIMITY_THRESHOLD;
    updated.forEach(u => {
      const d = Math.hypot(u.x - playerRef.current.x, u.y - playerRef.current.y);
      if (d < minDist) { minDist = d; closest = u; }
    });
    if (nearbyUser?.userId !== closest?.userId) {
      setNearbyUser(closest);
    }

    // Check duel pad overlap
    checkDuelPadsRef.current?.(playerRef.current.x, playerRef.current.y);

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, []); // stable — all data via refs

  // ── Canvas draw ───────────────────────────────────────────────────────────
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pads = padStatesRef.current;
    const crown = crownStateRef.current;
    const uid = authService.getCurrentUser()?.id;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = CANVAS_THEME.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Duel pads
    const padsToRender: PadState[] = pads.length > 0 ? pads : [
      { padId: 'pad-a', status: 'available', activationProgress: 0 },
      { padId: 'pad-b', status: 'available', activationProgress: 0 },
    ];
    const localOverlap = (['pad-a', 'pad-b'] as PadId[]).find(padId => {
      const a = PAD_AREAS[padId];
      const px = playerRef.current.x, py = playerRef.current.y;
      const cx = Math.max(a.x, Math.min(px, a.x + a.width));
      const cy = Math.max(a.y, Math.min(py, a.y + a.height));
      return (px - cx) ** 2 + (py - cy) ** 2 <= AVATAR_RADIUS ** 2;
    }) ?? null;
    drawDuelPads({ ctx, padStates: padsToRender, localPlayerOverlap: localOverlap });

    // Remote users
    renderedUsersRef.current.forEach(user => {
      drawAvatar(ctx, user.x, user.y, user.color || CANVAS_THEME.secondaryDeep, user.name);
      drawBubble(ctx, user.x, user.y, user.userId);
      if (crown?.winnerId === user.userId) drawCrown(ctx, user.x, user.y);
    });

    // Local player
    drawAvatar(ctx, playerRef.current.x, playerRef.current.y, playerRef.current.color, playerRef.current.name, true);
    drawBubble(ctx, playerRef.current.x, playerRef.current.y, uid || 'me');
    if (crown?.winnerId === uid) drawCrown(ctx, playerRef.current.x, playerRef.current.y);
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string, isMe = false) => {
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'hsl(30 20% 30% / 0.12)';
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(x, y, AVATAR_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = CANVAS_THEME.surface;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = CANVAS_THEME.foreground;
    ctx.font = 'bold 12px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - AVATAR_RADIUS - 10);
    if (isMe) {
      ctx.strokeStyle = CANVAS_THEME.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, AVATAR_RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, userId: string) => {
    const bubble = bubblesRef.current.find(b => b.userId === userId);
    if (!bubble) return;
    const padding = 10, maxWidth = 150;
    ctx.font = '12px "DM Sans", sans-serif';
    const lines = wrapText(ctx, bubble.message, maxWidth);
    const bh = lines.length * 16 + padding * 2;
    const bw = Math.min(maxWidth, ctx.measureText(bubble.message).width + padding * 2);
    const bx = x - bw / 2, by = y - AVATAR_RADIUS - 40 - bh;
    ctx.fillStyle = CANVAS_THEME.surface;
    ctx.strokeStyle = CANVAS_THEME.grid;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bh); ctx.lineTo(x + 5, by + bh); ctx.lineTo(x, by + bh + 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CANVAS_THEME.mutedForeground;
    ctx.textAlign = 'left';
    lines.forEach((line, i) => ctx.fillText(line, bx + padding, by + padding + 12 + i * 16));
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = words[0] ?? '';
    for (let i = 1; i < words.length; i++) {
      const w = words[i];
      if (ctx.measureText(`${cur} ${w}`).width < maxWidth) cur += ` ${w}`;
      else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    return lines;
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  };

  // ── Start/stop RAF ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const onKeyUp   = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const handleMobileControl = (key: string, pressed: boolean) => {
    keysPressed.current[key] = pressed;
  };

  const emitConnectAttempt = useCallback(async (targetUserId: string) => {
    if (!currentUser?.id) return;
    try {
      await api.request('/connections', {
        method: 'POST',
        body: { requesterId: currentUser.id, receiverId: targetUserId },
      });
      toast({ title: 'Solicitud enviada', description: 'Se ha enviado una solicitud de conexión.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud de conexión.' });
    }
  }, [currentUser]);

  const handleMatchEnd = useCallback((spawnX: number, spawnY: number) => {
    const next = { ...playerRef.current, x: spawnX, y: spawnY };
    playerRef.current = next;
    setPlayer(next);
    setActiveMatch(null);
    clearActiveDuel();
    rejoinMap();
    // Restart the RAF loop after React re-renders the canvas.
    // setActiveMatch(null) is async — the canvas isn't in the DOM yet at this point,
    // so we defer one tick with setTimeout to let React commit the new render.
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(update);
    }, 0);
  }, [clearActiveDuel, rejoinMap, update]);

  // ── Match screen ──────────────────────────────────────────────────────────
  if (activeMatch) {
    const localName = currentUser?.name || 'Tú';
    return (
      <FootballDuelMatch
        matchId={activeMatch.matchId}
        localPlayer={{ userId: myAuthIdRef.current ?? '', name: localName, role: activeMatch.role }}
        opponent={activeMatch.opponent}
        onMatchEnd={handleMatchEnd}
      />
    );
  }

  // ── Map screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto bg-muted/50 lg:rounded-2xl shadow-elevated border border-border overflow-hidden animate-in fade-in duration-500 min-h-[90vh] lg:min-h-0">
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="absolute top-4 left-4 z-20 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden />
          <span className="text-xs font-semibold text-foreground">Oficina Virtual Peerly</span>
        </div>

        <div className="relative bg-card rounded-xl border border-border shadow-inner overflow-auto h-[400px] lg:h-[600px] custom-scrollbar">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-crosshair bg-card"
            style={{ imageRendering: 'pixelated', minWidth: CANVAS_WIDTH, minHeight: CANVAS_HEIGHT }}
          />
          {nearbyUser && (
            <div
              className="absolute z-20 transition-all duration-300 transform -translate-x-1/2 -translate-y-full mb-4 animate-bounce"
              style={{ left: nearbyUser.x, top: nearbyUser.y }}
            >
              <button
                type="button"
                onClick={() => emitConnectAttempt(nearbyUser.userId)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-colors border-2 border-card whitespace-nowrap"
              >
                <UserPlus size={16} />
                Conectar con {nearbyUser.name}
              </button>
            </div>
          )}
        </div>

        {isMobile && (
          <div className="flex justify-between items-center mt-4 px-2">
            <div className="grid grid-cols-3 gap-1 bg-card p-3 rounded-2xl border border-border shadow-sm">
              <div />
              {(['btn-up', 'btn-left', 'btn-down', 'btn-right'] as const).map((key, i) => {
                const labels = ['↑', '←', '↓', '→'];
                const ariaLabels = ['Mover arriba', 'Mover izquierda', 'Mover abajo', 'Mover derecha'];
                return (
                  <button key={key} type="button"
                    className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg active:bg-primary active:text-primary-foreground transition-colors"
                    aria-label={ariaLabels[i]}
                    onTouchStart={() => handleMobileControl(key, true)}
                    onTouchEnd={() => handleMobileControl(key, false)}
                    onMouseDown={() => handleMobileControl(key, true)}
                    onMouseUp={() => handleMobileControl(key, false)}
                  >{labels[i]}</button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-tighter text-right leading-tight">
              Controles virtuales
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); if (inputMessage.trim()) { sendMessage(inputMessage); setInputMessage(''); } }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onFocus={() => { isChatFocusedRef.current = true; }}
              onBlur={() => { isChatFocusedRef.current = false; }}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full pl-4 pr-12 py-3 bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
            />
            <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      <div className="lg:w-80 flex flex-col bg-card rounded-xl border border-border shadow-card overflow-hidden h-[300px] lg:h-auto">
        <div className="p-4 border-b border-border flex items-center gap-2 flex-shrink-0">
          <MessageSquare className="text-primary" size={20} aria-hidden />
          <h3 className="font-bold text-foreground">Historial de Chat</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar min-h-0">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70 space-y-2 py-8">
              <MessageSquare size={32} aria-hidden />
              <p className="text-sm">No hay mensajes aún</p>
            </div>
          ) : (
            chatHistory.map((chat, i) => (
              <div key={i} className={`flex flex-col ${chat.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-bold text-muted-foreground uppercase mb-0.5">{chat.name}</span>
                <div className={`px-3 py-2 rounded-2xl text-sm ${chat.userId === currentUser?.id ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                  {chat.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualWorld;
