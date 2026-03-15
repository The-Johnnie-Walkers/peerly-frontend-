import { Mail, Lock, ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

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
}: {
  icon: LucideIcon;
  label: string;
  type: string;
  placeholder: string;
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
        className="pl-9 h-11 rounded-2xl bg-background/80 border-border text-sm"
      />
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        {/* Hero */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--peerly-soft-accent))] px-3 py-1 text-xs font-medium text-[color:hsl(var(--peerly-primary-dark))]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--peerly-primary))] text-white text-[10px] font-bold">
              P
            </span>
            Conecta con tu campus en segundos
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[color:hsl(var(--peerly-primary-dark))]">
              Conecta con la gente,
              <br />
              conecta con <span className="bg-gradient-to-r from-[hsl(var(--peerly-primary))] to-[hsl(var(--peerly-secondary))] bg-clip-text text-transparent">Peerly</span>
            </h1>
            <p className="text-sm sm:text-base max-w-md text-[color:hsl(var(--peerly-text-secondary))]">
              Descubre estudiantes compatibles, únete a actividades en tu campus y construye una comunidad auténtica,
              sin ruido ni estrés.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-3xl bg-white shadow-card p-4 border border-border">
              <p className="text-[10px] font-mono font-bold text-[color:hsl(var(--peerly-primary))] uppercase tracking-widest mb-1">
                Conecta con quien encaja
              </p>
              <p className="text-sm font-medium text-foreground">
                Conoce a compañeros por intereses, carrera y horarios. Tú decides cómo sigue.
              </p>
            </div>
            <div className="rounded-3xl bg-white shadow-card p-4 border border-border">
              <p className="text-[10px] font-mono font-bold text-[color:hsl(var(--peerly-secondary))] uppercase tracking-widest mb-1">
                Actividades
              </p>
              <p className="text-sm font-medium text-foreground">
                Encuentra planes, grupos de estudio y eventos creados por estudiantes.
              </p>
            </div>
          </div>

          <p className="text-xs text-[color:hsl(var(--peerly-text-secondary))]">
            Disponible solo para correos universitarios. Tu campus, tu comunidad.
          </p>
        </div>

        {/* Login card */}
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
            <div className="space-y-4">
              <Field
                icon={Mail}
                label="Correo universitario"
                type="email"
                placeholder="tucorreo@universidad.edu"
              />
              <Field
                icon={Lock}
                label="Contraseña"
                type="password"
                placeholder="••••••••"
              />
            </div>

            <Button className="w-full h-11 rounded-2xl bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white font-display font-semibold text-sm">
              Iniciar sesión
              <ArrowRight className="w-4 h-4" />
            </Button>

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
      </div>
    </div>
  );
};

export default LandingPage;

