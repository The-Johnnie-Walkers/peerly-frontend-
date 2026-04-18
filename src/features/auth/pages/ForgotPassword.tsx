import { ChevronLeft, Mail } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import BubbleBackground from "@/shared/components/ui/bubble-background";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { authService } from "../services/auth.service";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
const reduceMotion = useReducedMotion();
const [email, setEmail] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [sent, setSent] = useState(false);

const handleSummit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try{
    await authService.forgotPassword(email);
    setSent(true);
    toast.message("Informacion de recuperacion enviada al correo.")
  } catch(error){
    toast.error("No se ha podido enviar informacion de recuperacion, intenta nuevamente.");
  } finally {
    setIsLoading(false);
  }
}

const fadeInRight = {
    hidden: { opacity: 0, x: 18, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};
  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] relative flex overflow-hidden">
      <BubbleBackground showGlow/>
      <Link to="/login" className="group hover:hover:text-[hsl(var(--peerly-primary))] transition-colors p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out">
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1"/>
        Inicio de sesión
      </Link>
      <div className="flex items-center justify-center w-full min-h-screen"> {!sent ? 
        <div className="flex items-center justify-center w-full min-h-screen pt-20 pb-8 px-4">
          <motion.div
                variants={fadeInRight}
                initial={reduceMotion ? "show" : "hidden"}
                animate="show"
          >
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
                <form onSubmit={handleSummit}>
                  <div className="space-y-2 pb-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                
                  <Button 
                    type="submit" 
                    disabled={isLoading || !email || sent} 
                    className="w-full h-11 rounded-2xl bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white font-display font-semibold text-sm">
                    {isLoading ? "Enviando..." : "Enviar correo de restablecimiento"}                  
                  </Button>
                  
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        : 
        <div className="flex items-center justify-center w-full min-h-screen">
          <motion.div
                variants={fadeInRight}
                initial={reduceMotion ? "show" : "hidden"}
                animate="show"
          >
            <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card w-full max-w-md">
                <CardHeader className="space-y-2 pb-4">
                  <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
                    Recuperar cuenta
                  </CardTitle>
                  <CardDescription className="text-sm pt-4">
                    Hemos enviado informacion de recuperacion a tu correo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="space-y-2 pb-2">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                      No te llego el correo? 
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs pl-1 hover:text-[hsl(var(--peerly-primary))]/90"
                      onClick={(e) => {
                        e.preventDefault();
                        setSent(false);
                      }}
                    >
                      Haz click aqui 
                    </a>
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] pl-1">
                      e intentalo nuevamente.
                    </label>   
                  </div>
                                
                </CardContent>
              </Card>
            </motion.div>
        </div>
        }
      </div>
    </div>
  );
};

export default ForgotPassword;

