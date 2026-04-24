import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ChevronLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import BubbleBackground from "@/shared/components/ui/bubble-background";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { authService } from "../services/auth.service";

const ResetPassword = () => {
  const reduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordHasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = token.length > 0 && passwordHasMinLength && passwordsMatch && confirmPassword.length > 0;

  const helperMessage = useMemo(() => {
    if (!newPassword && !confirmPassword) {
      return "Usa una clave nueva de al menos 6 caracteres para proteger tu cuenta.";
    }

    if (!passwordHasMinLength) {
      return "La nueva contraseña debe tener minimo 6 caracteres.";
    }

    if (confirmPassword && !passwordsMatch) {
      return "Las contraseñas no coinciden todavia.";
    }

    return "Todo listo. Puedes guardar tu nueva contraseña.";
  }, [confirmPassword, newPassword, passwordHasMinLength, passwordsMatch]);

  const fadeInRight = {
    hidden: { opacity: 0, x: 18, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
      toast.success("Tu contraseña fue actualizada correctamente.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No pudimos actualizar tu contraseña.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] relative flex overflow-hidden">
      <BubbleBackground showGlow />

      <Link
        to={isSuccess ? "/login" : "/forgot-password"}
        className="group hover:text-[hsl(var(--peerly-primary))] transition-colors p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out"
      >
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1" />
        {isSuccess ? "Inicio de sesion" : "Recuperacion"}
      </Link>

      <div className="flex items-center justify-center w-full min-h-screen pt-20 pb-8 px-4">
        <motion.div
          variants={fadeInRight}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
          className="w-full max-w-md"
        >
          {!token ? (
            <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
                  Enlace no valido
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Este enlace de recuperacion no incluye un token valido o ya no esta disponible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <Button asChild className="h-11 w-full rounded-2xl text-sm font-display font-semibold text-white hover:bg-[hsl(var(--peerly-primary))]/90">
                  <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
                </Button>
                <p className="text-center text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                  Vuelve a pedir la recuperacion desde tu correo institucional para continuar.
                </p>
              </CardContent>
            </Card>
          ) : isSuccess ? (
            <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--peerly-primary))]/10 text-[hsl(var(--peerly-primary))]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
                  Contraseña actualizada
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Ya puedes iniciar sesion con tu nueva contraseña.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <Button asChild className="h-11 w-full rounded-2xl text-sm font-display font-semibold text-white hover:bg-[hsl(var(--peerly-primary))]/90">
                  <Link to="/login">Ir a iniciar sesion</Link>
                </Button>
                <p className="text-center text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                  Si intentas usar el mismo enlace otra vez, el sistema lo marcara como invalido por seguridad.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card">
              <CardHeader className="space-y-2 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--peerly-primary))]/10 text-[hsl(var(--peerly-primary))]">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
                  Crear nueva contraseña
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Elige una clave nueva y confirma el cambio. Este paso solo toma un momento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimo 6 caracteres"
                        className="h-11 rounded-2xl bg-background/80 border-border text-sm pr-11"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:hsl(var(--peerly-text-secondary))] transition-colors hover:text-[hsl(var(--peerly-primary-dark))]"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Escribe nuevamente tu contraseña"
                        className="h-11 rounded-2xl bg-background/80 border-border text-sm pr-11"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:hsl(var(--peerly-text-secondary))] transition-colors hover:text-[hsl(var(--peerly-primary-dark))]"
                        aria-label={showConfirmPassword ? "Ocultar confirmacion" : "Mostrar confirmacion"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[hsl(var(--peerly-soft-accent))]/55 px-4 py-3 text-sm text-[color:hsl(var(--peerly-primary-dark))]">
                    {helperMessage}
                  </div>

                  <Button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full h-11 rounded-2xl bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white font-display font-semibold text-sm"
                  >
                    {isLoading ? "Guardando cambios..." : "Actualizar contraseña"}
                  </Button>
                </form>

                <p className="text-center text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                  Usa una contraseña distinta a la anterior y guardala en un lugar seguro.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
