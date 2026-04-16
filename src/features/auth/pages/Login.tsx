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
    <div className="relative flex overflow-hidden min-h-screen bg-[hsl(var(--peerly-background))]">
      <BubbleBackground showGlow />
      <a href="/" className="group hover:text-gray-500 p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out">
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1"/>
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
    </div>
  );
};

export default Login;

