import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, UserPlus, MessageSquare } from 'lucide-react';
import { useRealtimeMap } from '../hooks/useRealtimeMap';
import { authService } from '@/features/auth/services/auth.service';
import { api } from '@/shared/lib/api';
import { toast } from '@/shared/components/ui/use-toast';
import { UserInMap, ChatMessage } from '../types/realtime.types';

interface ChatBubble extends ChatMessage {
  id: string; // Local bubble ID for cleanup
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
  warmSand: 'hsl(43 55% 72%)',
  terracottaMuted: 'hsl(12 45% 48%)',
} as const;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 32;
const AVATAR_RADIUS = 20;
const MOVEMENT_SPEED = 3;
const PROXIMITY_THRESHOLD = 80;
const BUBBLE_TIMEOUT = 3000;
const LERP_FACTOR = 0.15; // Suavidad de movimiento

const VirtualWorld: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const { users: remoteUsers, chatHistory, move, sendMessage, targetPositions } = useRealtimeMap();

  const [player, setPlayer] = useState({
    x: Math.random() * (CANVAS_WIDTH - 100) + 50,
    y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
    name: currentUser?.name || 'Tú',
    color: CANVAS_THEME.primaryDark,
  });
  const playerRef = useRef(player);

  const [inputMessage, setInputMessage] = useState('');
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const bubblesRef = useRef<ChatBubble[]>([]);

  // Ref para usuarios procesados y listos para dibujar (incluye interpolación)
  const renderedUsersRef = useRef<UserInMap[]>([]);
  
  const [nearbyUser, setNearbyUser] = useState<UserInMap | null>(null);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincronizar burbujas de chat desde el servidor
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      addBubble(lastMsg.userId, lastMsg.name, lastMsg.message);
    }
  }, [chatHistory]);

  const addBubble = useCallback((userId: string, userName: string, message: string) => {
    const newBubble: ChatBubble = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      message,
      timestamp: Date.now(),
    };
    setBubbles(prev => [...prev.slice(-9), newBubble]);
    bubblesRef.current = [...bubblesRef.current.slice(-9), newBubble];

    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== newBubble.id);
    }, BUBBLE_TIMEOUT);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  const emitConnectAttempt = useCallback(async (targetUserId: string) => {
    if (!currentUser?.id) return;
    
    try {
      await api.request('/connections', {
        method: 'POST',
        body: {
          requesterId: currentUser.id,
          receiverId: targetUserId
        }
      });
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado una solicitud de conexión.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la solicitud de conexión."
      });
    }
  }, [currentUser]);

  const update = useCallback(() => {
    // 1. Actualizar posición propia
    let dx = 0;
    let dy = 0;

    if (!isChatFocused) {
      const up = keysPressed.current.w || keysPressed.current.ArrowUp || keysPressed.current['btn-up'];
      const down = keysPressed.current.s || keysPressed.current.ArrowDown || keysPressed.current['btn-down'];
      const left = keysPressed.current.a || keysPressed.current.ArrowLeft || keysPressed.current['btn-left'];
      const right = keysPressed.current.d || keysPressed.current.ArrowRight || keysPressed.current['btn-right'];

      if (up) dy -= MOVEMENT_SPEED;
      if (down) dy += MOVEMENT_SPEED;
      if (left) dx -= MOVEMENT_SPEED;
      if (right) dx += MOVEMENT_SPEED;
    }

    if (dx !== 0 || dy !== 0) {
      const newX = Math.max(AVATAR_RADIUS, Math.min(CANVAS_WIDTH - AVATAR_RADIUS, playerRef.current.x + dx));
      const newY = Math.max(AVATAR_RADIUS, Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, playerRef.current.y + dy));

      if (newX !== playerRef.current.x || newY !== playerRef.current.y) {
        const newState = { ...playerRef.current, x: newX, y: newY };
        playerRef.current = newState;
        setPlayer(newState);
        move(newX, newY);
      }
    }

    // 2. Interpolar posiciones de otros usuarios
    const myId = currentUser?.id || '';
    const updatedRenderedUsers = remoteUsers.filter(u => u.userId !== myId).map(user => {
      const targetPos = targetPositions[user.userId] || { x: user.x, y: user.y };
      const currentRendered = renderedUsersRef.current.find(r => r.userId === user.userId);
      
      const currentX = currentRendered ? currentRendered.x : user.x;
      const currentY = currentRendered ? currentRendered.y : user.y;

      return {
        ...user,
        color: user.color || CANVAS_THEME.secondaryDeep,
        x: currentX + (targetPos.x - currentX) * LERP_FACTOR,
        y: currentY + (targetPos.y - currentY) * LERP_FACTOR,
      };
    });

    renderedUsersRef.current = updatedRenderedUsers;

    // 3. Proximidad (solo actualizar estado si cambia el usuario cercano)
    let closestUser: UserInMap | null = null;
    let minDistance = PROXIMITY_THRESHOLD;

    updatedRenderedUsers.forEach(user => {
      const dist = Math.sqrt((user.x - playerRef.current.x) ** 2 + (user.y - playerRef.current.y) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestUser = user;
      }
    });
    
    if (nearbyUser?.userId !== closestUser?.userId) {
      setNearbyUser(closestUser);
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [move, isChatFocused, remoteUsers, targetPositions, currentUser]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Otros usuarios
    renderedUsersRef.current.forEach(user => {
      drawAvatar(ctx, user.x, user.y, user.color || CANVAS_THEME.secondaryDeep, user.name);
      drawBubble(ctx, user.x, user.y, user.userId);
    });

    // Jugador (local)
    drawAvatar(ctx, playerRef.current.x, playerRef.current.y, playerRef.current.color, playerRef.current.name, true);
    drawBubble(ctx, playerRef.current.x, playerRef.current.y, currentUser?.id || 'me');
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

    const padding = 10;
    const maxWidth = 150;
    ctx.font = '12px "DM Sans", sans-serif';

    const lines = wrapText(ctx, bubble.message, maxWidth);
    const bubbleHeight = lines.length * 16 + padding * 2;
    const bubbleWidth = Math.min(maxWidth, ctx.measureText(bubble.message).width + padding * 2);

    const bx = x - bubbleWidth / 2;
    const by = y - AVATAR_RADIUS - 40 - bubbleHeight;

    ctx.fillStyle = CANVAS_THEME.surface;
    ctx.strokeStyle = CANVAS_THEME.grid;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 5, by + bubbleHeight);
    ctx.lineTo(x + 5, by + bubbleHeight);
    ctx.lineTo(x, by + bubbleHeight + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CANVAS_THEME.mutedForeground;
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + padding, by + padding + 12 + i * 16);
    });
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] ?? '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(`${currentLine} ${word}`).width;
      if (width < maxWidth) {
        currentLine += ` ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    let rad = r;
    if (w < 2 * rad) rad = w / 2;
    if (h < 2 * rad) rad = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const handleMobileControl = (key: string, pressed: boolean) => {
    keysPressed.current[key] = pressed;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto bg-muted/50 lg:rounded-2xl shadow-elevated border border-border overflow-hidden animate-in fade-in duration-500 min-h-[90vh] lg:min-h-0">
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="absolute top-4 left-4 z-20 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden />
          <span className="text-xs font-semibold text-foreground">Oficina Virtual Peerly</span>
        </div>

        <div
          className="relative bg-card rounded-xl border border-border shadow-inner overflow-auto h-[400px] lg:h-[600px] custom-scrollbar focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
        >
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-colors border-2 border-card whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg active:bg-primary active:text-primary-foreground transition-colors"
                aria-label="Mover arriba"
                onTouchStart={() => handleMobileControl('btn-up', true)}
                onTouchEnd={() => handleMobileControl('btn-up', false)}
                onMouseDown={() => handleMobileControl('btn-up', true)}
                onMouseUp={() => handleMobileControl('btn-up', false)}
              >
                ↑
              </button>
              <div />
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg active:bg-primary active:text-primary-foreground transition-colors"
                aria-label="Mover izquierda"
                onTouchStart={() => handleMobileControl('btn-left', true)}
                onTouchEnd={() => handleMobileControl('btn-left', false)}
                onMouseDown={() => handleMobileControl('btn-left', true)}
                onMouseUp={() => handleMobileControl('btn-left', false)}
              >
                ←
              </button>
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg active:bg-primary active:text-primary-foreground transition-colors"
                aria-label="Mover abajo"
                onTouchStart={() => handleMobileControl('btn-down', true)}
                onTouchEnd={() => handleMobileControl('btn-down', false)}
                onMouseDown={() => handleMobileControl('btn-down', true)}
                onMouseUp={() => handleMobileControl('btn-down', false)}
              >
                ↓
              </button>
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg active:bg-primary active:text-primary-foreground transition-colors"
                aria-label="Mover derecha"
                onTouchStart={() => handleMobileControl('btn-right', true)}
                onTouchEnd={() => handleMobileControl('btn-right', false)}
                onMouseDown={() => handleMobileControl('btn-right', true)}
                onMouseUp={() => handleMobileControl('btn-right', false)}
              >
                →
              </button>
            </div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-tighter text-right leading-tight">
              Controles virtuales
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onFocus={() => setIsChatFocused(true)}
              onBlur={() => setIsChatFocused(false)}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full pl-4 pr-12 py-3 bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="absolute right-2 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
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
            chatHistory.map((chat, index) => (
              <div key={index} className={`flex flex-col ${chat.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-bold text-muted-foreground uppercase mb-0.5">{chat.name}</span>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    chat.userId === currentUser?.id
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}
                >
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
