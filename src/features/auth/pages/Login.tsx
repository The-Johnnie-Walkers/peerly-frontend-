import { Mail, Lock, ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";

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

const BubbleBackground = ({ reduceMotion }: { reduceMotion: boolean | null }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ w: number; h: number; lastTs: number; bubbles: Bubble[] } | null>(null);

  const bubbles = useMemo<Bubble[]>(() => {
    const make = (i: number): Bubble => {
      const r = 16 + Math.random() * 44; // 16..60
      const speed = 18 + Math.random() * 34; // px/s
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
    return Array.from({ length: 12 }, (_, i) => make(i));
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    };

    const init = () => {
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
    };

    init();

    const onResize = () => {
      if (!stateRef.current) return;
      const { w, h } = measure();
      stateRef.current.w = w;
      stateRef.current.h = h;
      // keep bubbles inside bounds after resize
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
      const dt = Math.min(0.032, Math.max(0.001, (ts - st.lastTs) / 1000)); // cap
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

        if (x <= minX) {
          x = minX + (minX - x);
          vx = Math.abs(vx);
        } else if (x >= maxX) {
          x = maxX - (x - maxX);
          vx = -Math.abs(vx);
        }
        if (y <= minY) {
          y = minY + (minY - y);
          vy = Math.abs(vy);
        } else if (y >= maxY) {
          y = maxY - (y - maxY);
          vy = -Math.abs(vy);
        }

        return { ...b, x, y, vx, vy };
      });

      // write positions to DOM (fast) via CSS vars
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
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0">
      {bubbles.map((b) => {
        const bg =
          b.color === "primary"
            ? "bg-[hsl(var(--peerly-primary))]"
            : b.color === "secondary"
              ? "bg-[hsl(var(--peerly-secondary))]"
              : "bg-white";
        // initial transform set to something; animation loop will update
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
  );
};

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6 1.54 7.38 2.84l5.4-5.4C33.64 3.5 29.3 1.5 24 1.5 14.88 1.5 7.09 7.34 4.24 15.44l6.77 5.26C12.53 14.6 17.74 9.5 24 9.5Z"
    />
    <path
      fill="#34A853"
      d="M46.5 24.5c0-1.57-.14-3.08-.41-4.5H24v9h12.7c-.55 2.82-2.2 5.21-4.7 6.82l7.31 5.68C43.73 37.7 46.5 31.6 46.5 24.5Z"
    />
    <path
      fill="#FBBC05"
      d="M11.01 28.3A14.44 14.44 0 0 1 10 24c0-1.49.26-2.93.73-4.27L3.96 14.5A23.93 23.93 0 0 0 1.5 24c0 3.78.9 7.34 2.46 10.5l7.05-6.2Z"
    />
    <path
      fill="#4285F4"
      d="M24 46.5c6.3 0 11.6-2.07 15.47-5.64l-7.31-5.68C30.46 36.1 27.53 37 24 37c-6.26 0-11.47-5.1-12.73-11.96l-7.03 6.2C7.09 40.66 14.88 46.5 24 46.5Z"
    />
    <path fill="none" d="M1.5 1.5h45v45h-45Z" />
  </svg>
);

const Field = ({
  icon: Icon,
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Icon className="w-4 h-4" />
      </span>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-9 h-11 rounded-2xl bg-background/80 border-border text-sm"
      />
    </div>
  </div>
);

const Login = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      
      const userData = await fetch(`http://localhost:3000/users/${response.id}`, {
        headers: { 'Authorization': `Bearer ${response.token}` }
      }).then(res => res.json()).catch(() => null);
      
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      toast.success("¡Bienvenido de nuevo!");
      navigate("/home");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Credenciales inválidas";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 18, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Fondo moderno (sutil) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Burbujas con rebote */}
        <BubbleBackground reduceMotion={reduceMotion} />

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
      </div>

      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center relative z-10">
        {/* Hero */}
        <motion.div
          variants={container}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
          className="space-y-8"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--peerly-soft-accent))] px-3 py-1 text-xs font-medium text-[color:hsl(var(--peerly-primary-dark))] border border-border/60 shadow-sm"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--peerly-primary))] text-white text-[10px] font-bold shadow-sm">
              P
            </span>
            Conecta con tu campus en segundos
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[color:hsl(var(--peerly-primary-dark))]"
            >
              Conecta con la gente,
              <br />
              conecta con <span className="bg-gradient-to-r from-[hsl(var(--peerly-primary))] to-[hsl(var(--peerly-secondary))] bg-clip-text text-transparent">Peerly</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-sm sm:text-base max-w-md text-[color:hsl(var(--peerly-text-secondary))]"
            >
              Descubre estudiantes compatibles, únete a actividades en tu campus y construye una comunidad auténtica,
              sin ruido ni estrés.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 max-w-md">
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-3xl bg-white/95 shadow-card p-4 border border-border backdrop-blur-sm"
            >
              <p className="text-[10px] font-mono font-bold text-[color:hsl(var(--peerly-primary))] uppercase tracking-widest mb-1">
                Conecta con quien encaja
              </p>
              <p className="text-sm font-medium text-foreground">
                Conoce a compañeros por intereses, carrera y horarios. Tú decides cómo sigue.
              </p>
            </motion.div>
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-3xl bg-white/95 shadow-card p-4 border border-border backdrop-blur-sm"
            >
              <p className="text-[10px] font-mono font-bold text-[color:hsl(var(--peerly-secondary))] uppercase tracking-widest mb-1">
                Actividades
              </p>
              <p className="text-sm font-medium text-foreground">
                Encuentra planes, grupos de estudio y eventos creados por estudiantes.
              </p>
            </motion.div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-xs text-[color:hsl(var(--peerly-text-secondary))]">
            Disponible solo para correos universitarios. Tu campus, tu comunidad.
          </motion.p>
        </motion.div>

        {/* Login card */}
        <motion.div
          variants={fadeInRight}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <Card className="rounded-3xl border-border/60 shadow-card bg-white/90 backdrop-blur">
          <CardHeader className="space-y-1.5">
            <CardTitle className="font-display text-xl text-[color:hsl(var(--peerly-primary-dark))]">
              Inicia sesión
            </CardTitle>
            <CardDescription className="text-[13px]">
              Entra con tu correo universitario para continuar donde lo dejaste.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <Field
                  icon={Mail}
                  label="Correo universitario"
                  type="email"
                  placeholder="tucorreo@universidad.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field
                  icon={Lock}
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !email || !password}
                className="w-full h-11 rounded-2xl bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white font-display font-semibold text-sm mt-6"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl bg-white hover:bg-[hsl(var(--peerly-soft-accent))] text-foreground text-sm justify-center border-border"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continuar con Google</span>
            </Button>

            <div className="flex items-center justify-between text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">
              <Link to="/forgot-password" className="hover:text-[hsl(var(--peerly-primary))] transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link
                to="/register"
                className="hover:text-[hsl(var(--peerly-primary))] transition-colors font-medium"
              >
                ¿No tienes cuenta? <span className="font-semibold">Regístrate</span>
              </Link>
            </div>
          </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

