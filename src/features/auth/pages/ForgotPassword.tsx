import { ChevronLeft, Mail } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import BubbleBackground from "@/shared/components/ui/bubble-background";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] relative flex overflow-hidden">
      <BubbleBackground showGlow/>
      <a href="/login" className="group hover:text-gray-500 p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out">
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1"/>
        Volver al inicio de sesión
      </a>
      <div className="flex items-center justify-center w-full min-h-screen pt-20 pb-8 px-4">
        <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card w-full max-w-md">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
              Recuperar cuenta
            </CardTitle>
            <CardDescription className="text-sm">
              Introduce tu correo para enviarte un enlace de restablecimiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                Correo universitario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </span>
                <Input
                  type="email"
                  placeholder="tucorreo@universidad.edu"
                  className="pl-9 h-11 rounded-2xl bg-background/80 border-border text-sm"
                />
              </div>
            </div>

            <Button className="w-full h-11 rounded-2xl bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white font-display font-semibold text-sm">
              Enviar enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

