import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card">
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

            <div className="flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] hover:text-[hsl(var(--peerly-primary))] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

