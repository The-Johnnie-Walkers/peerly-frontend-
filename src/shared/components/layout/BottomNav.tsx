import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, UserPlus, User, Globe, ShieldAlert, Users2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { authService } from '@/features/auth/services/auth.service';

const NAV_ITEMS = [
  { path: '/home', icon: Home, label: 'Inicio' },
  { path: '/chats', icon: MessageCircle, label: 'Chats' },
  { path: '/connect', icon: UserPlus, label: 'Descubrir' },
  { path: '/communities', icon: Globe, label: 'Comunidades' },
  { path: '/social', icon: Users2, label: 'Social' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

const itemClass = "flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] rounded-xl";
const iconClass = "flex items-center justify-center w-9 h-9 rounded-xl transition-colors";
const labelClass = "text-[10px] font-medium leading-none";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2 max-w-screen-xl mx-auto">

        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <motion.button
              key={path}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(path)}
              className={itemClass}
              aria-label={label}
            >
              <span className={`${iconClass} ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
              </span>
              <span className={`${labelClass} ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {label}
              </span>
            </motion.button>
          );
        })}

        {userData?.role === 'ADMIN' && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate('/admin-reports')}
            className={itemClass}
          >
            <span className={`${iconClass} ${location.pathname === '/admin-reports' ? 'bg-destructive/10 text-destructive' : 'text-gray-400'}`}>
              <ShieldAlert size={20} strokeWidth={location.pathname === '/admin-reports' ? 2.25 : 1.75} />
            </span>
            <span className={`${labelClass} ${location.pathname === '/admin-reports' ? 'text-destructive' : 'text-gray-400'}`}>
              Reportes
            </span>
          </motion.button>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={handleLogout}
          className={itemClass}
          aria-label="Cerrar sesión"
        >
          <span className={`${iconClass} text-gray-400 hover:text-red-500`}>
            <LogOut size={20} strokeWidth={1.75} />
          </span>
          <span className={`${labelClass} text-gray-400`}>Salir</span>
        </motion.button>

      </div>
    </nav>
  );
};
