import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const t = setTimeout(() => {
      setStatus('ready');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setTimeout(() => navigate('/onboarding'), 2200);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-svh flex flex-col items-center justify-center bg-primary text-primary-foreground p-6 md:p-12 text-center"
      role="status"
      aria-live="polite"
      aria-label="Cargando Peerly"
    >
      {/* Logo — Von Restorff: elemento memorable */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 md:w-28 md:h-28 bg-primary-foreground/10 rounded-[28%] mb-6 flex items-center justify-center shadow-elevated border-2 border-primary-foreground/20"
        aria-hidden
      >
        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-full" />
      </motion.div>

      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-2"
      >
        Peerly
      </motion.h1>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-primary-foreground/85 font-medium text-base md:text-lg max-w-xs"
      >
        Conecta con la gente, conecta con Peerly.
      </motion.p>

      {/* Indicador de carga — Nielsen: visibilidad del estado del sistema */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-10 flex flex-col items-center gap-3"
        aria-hidden
      >
        <div
          className="w-8 h-8 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
          aria-hidden
        />
        <span className="text-xs font-mono text-primary-foreground/70">Cargando...</span>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
