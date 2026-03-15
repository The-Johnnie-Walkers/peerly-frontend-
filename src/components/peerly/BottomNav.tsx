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
    <nav className="fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-xl border-t border-border p-3 flex justify-center z-40">
      <div className="w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 flex justify-around items-center">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-glow -mt-6 border-4 border-card"
            >
              <Icon size={24} />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-mono font-medium">{item.label}</span>
          </motion.button>
        );
      })}
      </div>
    </nav>
  );
};
