import { Mail, Lock, ArrowRight, LucideIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import BubbleBackground from "@/shared/components/ui/bubble-background";

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
      await authService.login({ email, password });
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
    <div className="relative flex overflow-hidden min-h-screen bg-[hsl(var(--peerly-background))]">
      <BubbleBackground showGlow />
      <a href="/" className="group hover:text-[hsl(var(--peerly-primary))] p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out">
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1" />
        Volver
      </a>
      <div className="flex items-center justify-center px-4 pt-20 pb-8 min-h-screen w-full">
        <div className="max-w-5xl grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center relative z-10">
          {/* Hero */}
          <motion.div
            variants={container}
            initial={reduceMotion ? "show" : "hidden"}
            animate="show"
            className="space-y-8 text-center lg:text-left"
          >
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
                className="text-sm sm:text-base max-w-md mx-auto lg:mx-0 text-[color:hsl(var(--peerly-text-secondary))]"
              >
                Descubre estudiantes compatibles, únete a actividades en tu campus y construye una comunidad auténtica,
                sin ruido ni estrés.
              </motion.p>
            </div>

            <motion.p variants={fadeUp} className="text-xs text-[color:hsl(var(--peerly-text-secondary))]">
              Disponible solo para correos universitarios. Tu campus, tu comunidad.
            </motion.p>
          </motion.div>

          <motion.div
            variants={fadeInRight}
            initial={reduceMotion ? "show" : "hidden"}
            animate="show"
          >
            <Card className="rounded-3xl border-border/60 shadow-card bg-white/90 backdrop-blur">
              <CardHeader className="space-y-1.5">
                <CardTitle className="font-display text-xl text-[color:hsl(var(--peerly-primary-dark))]">
                  Iniciar sesión
                </CardTitle>
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
    </div>
  );
};

export default Login;
