import React from 'react';
import VirtualWorld from '@/features/virtual-world/components/VirtualWorld';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VirtualWorldScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-4 flex items-center gap-4 bg-card border-b border-border sticky top-0 z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/connect')}
          className="p-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Volver a conectar"
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-xl font-display font-extrabold text-foreground">U Virtual</h1>
          <p className="text-xs font-medium text-muted-foreground">Conecta con otros en tiempo real</p>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
        <VirtualWorld />
      </main>
    </div>
  );
};

export default VirtualWorldScreen;
