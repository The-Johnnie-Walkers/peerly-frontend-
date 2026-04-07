import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Plus, UserPlus, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/home', icon: Search, label: 'Inicio' },
  { path: '/chats', icon: MessageCircle, label: 'Chats' },
  { path: '/create-activity', icon: Plus, label: 'Crear', isCenter: true },
  { path: '/connect', icon: UserPlus, label: 'Conectar' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[hsl(var(--peerly-surface))]/95 backdrop-blur-md border-t border-neutral-200/85 py-2.5 flex justify-center z-40 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.08)]">
      <div className="w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 flex justify-around items-end">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <motion.button
                key={item.path}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(item.path)}
                className="w-[52px] h-[52px] -mt-7 rounded-[18px] bg-primary flex items-center justify-center text-primary-foreground border-[3px] border-[hsl(var(--peerly-background))] shadow-[0_10px_28px_-6px_hsl(12_70%_48%/0.55),0_4px_12px_-4px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Crear actividad"
              >
                <Icon size={26} strokeWidth={2.25} />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.path}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-1 py-1 min-w-[56px] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl ${
                isActive ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {isActive && (
                <span
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-7 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              <span
                className={`flex items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-primary/12 px-2 py-1' : 'px-2 py-1'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
