import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Bubble = {
  id: string;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  blur: number;
  color: "primary" | "secondary" | "white";
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface BubbleBackgroundProps {
  /** Number of bubbles */
  count?: number;
  /** Show ambient glow blobs */
  showGlow?: boolean;
  className?: string;
}

export default function BubbleBackground({
  count = 12,
  showGlow = true,
  className = "",
}: BubbleBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ w: number; h: number; lastTs: number; bubbles: Bubble[] } | null>(null);

  const bubbles = useMemo<Bubble[]>(() => {
    const make = (i: number): Bubble => {
      const r = 16 + Math.random() * 44;
      const speed = 18 + Math.random() * 34;
      const angle = Math.random() * Math.PI * 2;
      const colorPick = Math.random();
      const color: Bubble["color"] =
        colorPick < 0.42 ? "primary" : colorPick < 0.84 ? "secondary" : "white";
      return {
        id: `bubble-${i}-${Math.random().toString(36).slice(2, 8)}`,
        r,
        x: Math.random() * 600 + r,
        y: Math.random() * 420 + r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        opacity: 0.24 + Math.random() * 0.18,
        blur: 6 + Math.random() * 10,
        color,
      };
    };
    return Array.from({ length: count }, (_, i) => make(i));
  }, [count]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    };

    const { w, h } = measure();
    stateRef.current = {
      w,
      h,
      lastTs: performance.now(),
      bubbles: bubbles.map((b) => ({
        ...b,
        x: Math.random() * Math.max(1, w - 2 * b.r) + b.r,
        y: Math.random() * Math.max(1, h - 2 * b.r) + b.r,
      })),
    };

    const onResize = () => {
      if (!stateRef.current) return;
      const { w, h } = measure();
      stateRef.current.w = w;
      stateRef.current.h = h;
      stateRef.current.bubbles = stateRef.current.bubbles.map((b) => ({
        ...b,
        x: clamp(b.x, b.r, Math.max(b.r, w - b.r)),
        y: clamp(b.y, b.r, Math.max(b.r, h - b.r)),
      }));
    };
    window.addEventListener("resize", onResize, { passive: true });

    const tick = (ts: number) => {
      const st = stateRef.current;
      if (!st) return;
      const dt = Math.min(0.032, Math.max(0.001, (ts - st.lastTs) / 1000));
      st.lastTs = ts;

      st.bubbles = st.bubbles.map((b) => {
        let x = b.x + b.vx * dt;
        let y = b.y + b.vy * dt;
        let vx = b.vx;
        let vy = b.vy;

        const minX = b.r;
        const maxX = Math.max(b.r, st.w - b.r);
        const minY = b.r;
        const maxY = Math.max(b.r, st.h - b.r);

        if (x <= minX) { x = minX + (minX - x); vx = Math.abs(vx); }
        else if (x >= maxX) { x = maxX - (x - maxX); vx = -Math.abs(vx); }
        if (y <= minY) { y = minY + (minY - y); vy = Math.abs(vy); }
        else if (y >= maxY) { y = maxY - (y - maxY); vy = -Math.abs(vy); }

        return { ...b, x, y, vx, vy };
      });

      for (const b of st.bubbles) {
        const node = el.querySelector<HTMLDivElement>(`[data-bubble-id="${b.id}"]`);
        if (!node) continue;
        node.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [bubbles, reduceMotion]);

  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* Bubbles */}
      <div ref={containerRef} className="absolute inset-0">
        {bubbles.map((b) => {
          const bg =
            b.color === "primary"
              ? "bg-[hsl(var(--peerly-primary))]"
              : b.color === "secondary"
                ? "bg-[hsl(var(--peerly-secondary))]"
                : "bg-white";
          return (
            <div
              key={b.id}
              data-bubble-id={b.id}
              aria-hidden="true"
              className={`absolute rounded-full ${bg} mix-blend-multiply`}
              style={{
                width: `${b.r * 2}px`,
                height: `${b.r * 2}px`,
                opacity: b.opacity,
                filter: `blur(${b.blur}px)`,
                transform: `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`,
                willChange: "transform",
              }}
            />
          );
        })}
      </div>

      {/* Ambient glow blobs */}
      {showGlow && (
        <>
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0.35 } : { opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? { opacity: 0.35 } : { opacity: 0.35, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-[hsl(var(--peerly-primary))]/25"
          />
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0.25 } : { opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? { opacity: 0.25 } : { opacity: 0.25, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
            className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl bg-[hsl(var(--peerly-secondary))]/25"
          />
          {!reduceMotion && (
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-16 right-12 h-40 w-40 rounded-full blur-3xl bg-white/35"
            />
          )}
        </>
      )}
    </div>
  );
}
