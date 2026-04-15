import { useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { authService } from '@/features/auth/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { userService, UserProfile } from '@/features/users/services/user.service';
import { useCreateConnection } from '../hooks/useConnections';
import { useConnections } from '../hooks/useConnections';
import { ConnectionStatus } from '../types';

// Tarjeta de swipe
const SwipeCard = ({
  user,
  onSwipe,
  isTop,
}: {
  user: UserProfile;
  onSwipe: (dir: 'left' | 'right') => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const connectOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const displayName = `${user.name} ${user.lastname}`.trim();

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onSwipe(info.offset.x > 0 ? 'right' : 'left');
        }
      }}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      aria-label={`Perfil de ${displayName}`}
    >
      <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-elevated bg-card border border-border">
        <SafeRemoteImage
          src={user.profilePicURL}
          alt={displayName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />

        {isTop && (
          <>
            <motion.div
              style={{ opacity: connectOpacity }}
              className="absolute top-6 left-6 border-4 border-success rounded-xl px-4 py-2 rotate-[-12deg] shadow-lg bg-success/20 backdrop-blur-sm"
              aria-hidden
            >
              <span className="text-success font-display font-extrabold text-2xl">CONECTAR</span>
            </motion.div>
            <motion.div
              style={{ opacity: skipOpacity }}
              className="absolute top-6 right-6 border-4 border-muted-foreground rounded-xl px-4 py-2 rotate-[12deg] shadow-lg bg-muted/30 backdrop-blur-sm"
              aria-hidden
            >
              <span className="text-muted-foreground font-display font-extrabold text-2xl">PASAR</span>
            </motion.div>
          </>
        )}

        <div className="absolute bottom-0 p-5 md:p-6 w-full">
          <div className="flex justify-between items-end gap-3 mb-2">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-display font-extrabold text-card drop-shadow-sm">
                {displayName}
              </h2>
              <p className="text-card/90 text-sm font-medium truncate">
                {user.programs?.[0] ?? 'Universidad'} · {user.semester}° sem
              </p>
            </div>
          </div>
          {user.description && (
            <p className="text-card/80 text-sm mb-3 line-clamp-2">{user.description}</p>
          )}
          {user.interests && user.interests.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {user.interests.slice(0, 4).map((interest) => (
                <span
                  key={interest.id}
                  className="px-2.5 py-1 bg-card/30 backdrop-blur-md rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold text-card border border-card/50"
                >
                  {interest.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Pantalla de celebración al conectar
const ConnectCelebration = ({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) => {
  const displayName = `${user.name} ${user.lastname}`.trim();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-primary/95 flex flex-col items-center justify-center p-6 md:p-12 text-center text-primary-foreground"
      role="dialog"
      aria-labelledby="connect-title"
      aria-describedby="connect-desc"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex -space-x-5 md:-space-x-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary-foreground overflow-hidden shadow-elevated">
            <SafeRemoteImage
              src={user.profilePicURL}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary-foreground overflow-hidden shadow-elevated bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <UserPlus size={40} className="text-primary-foreground/80" />
          </div>
        </div>
      </motion.div>
      <h2 id="connect-title" className="text-3xl md:text-4xl font-display font-extrabold mb-2">
        ¡Solicitud enviada! 🎉
      </h2>
      <p id="connect-desc" className="text-primary-foreground/85 mb-8 md:mb-12 text-sm md:text-base">
        Le enviaste una solicitud a {displayName.split(' ')[0]}. Espera a que la acepte. 🐾
      </p>
      <div className="w-full max-w-sm space-y-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full p-4 rounded-2xl bg-primary-foreground text-primary font-display font-bold shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Seguir descubriendo
        </motion.button>
      </div>
    </motion.div>
  );
};

const ConnectScreen = () => {
  const navigate = useNavigate();
  const [connectedUser, setConnectedUser] = useState<UserProfile | null>(null);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.getAllUsers(),
  });

  // Traer todas las conexiones del usuario para excluir a quienes ya tienen relación
  const { data: myConnections = [] } = useConnections(userId);

  const connectedUserIds = useMemo(() => {
    const ids = new Set<string>();
    myConnections.forEach((c) => {
      ids.add(c.requesterId);
      ids.add(c.receiverId);
    });
    return ids;
  }, [myConnections]);

  // Filtrar: excluir yo mismo, ya conectados y ya swipeados en esta sesión
  const cards = useMemo(
    () => {
      console.log('[ConnectScreen] Filtering users:', {
        totalUsers: allUsers.length,
        userId,
        connectedUserIds: Array.from(connectedUserIds),
        swipedIds: Array.from(swipedIds),
      });
      
      const filtered = allUsers.filter(
        (u) => {
          const hasId = !!u.id;
          const notMe = u.id !== userId;
          const notConnected = !connectedUserIds.has(u.id);
          const notSwiped = !swipedIds.has(u.id);
          
          console.log(`[ConnectScreen] User ${u.username}:`, {
            hasId,
            notMe,
            notConnected,
            notSwiped,
            passes: hasId && notMe && notConnected && notSwiped,
          });
          
          return hasId && notMe && notConnected && notSwiped;
        },
      );
      
      console.log('[ConnectScreen] Filtered cards:', filtered.length);
      return filtered;
    },
    [allUsers, userId, connectedUserIds, swipedIds],
  );

  const createConnection = useCreateConnection();

  const handleSwipe = (dir: 'left' | 'right') => {
    const current = cards[0];
    if (!current) return;

    if (dir === 'right') {
      setConnectedUser(current);
      if (userId) {
        createConnection.mutate({ requesterId: userId, receiverId: current.id });
      }
    }

    setSwipedIds((prev) => new Set(prev).add(current.id));
  };

  if (loadingUsers) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border/60 bg-background">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            className="p-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar y volver al inicio"
          >
            <X size={20} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-extrabold truncate">Descubrir</h1>
            <p className="text-xs font-mono text-muted-foreground">
              {cards.length > 0 ? `${cards.length} perfiles restantes` : 'Sin perfiles por ahora'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/virtual-world')}
            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-display font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition-colors"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Mundo Virtual
          </motion.button>
        </header>

        <div className="flex-1 relative mx-4 sm:mx-6 my-4 min-h-[420px] md:min-h-[480px]">
          <AnimatePresence mode="sync">
            {cards.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-card/50 border border-border"
              >
                <span className="text-5xl md:text-6xl mb-4" aria-hidden>😴</span>
                <h2 className="font-display font-bold text-xl md:text-2xl mb-2 text-foreground">
                  Parece que todos están en clase
                </h2>
                <p className="text-muted-foreground text-sm md:text-base mb-6">
                  Vuelve en un rato para conocer más compañeros.
                </p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/home')}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Volver al inicio
                </motion.button>
              </motion.div>
            ) : (
              cards
                .slice(0, 2)
                .map((user, i) => (
                  <SwipeCard
                    key={user.id}
                    user={user}
                    onSwipe={handleSwipe}
                    isTop={i === 0}
                  />
                ))
                .reverse()
            )}
          </AnimatePresence>
        </div>

        {cards.length > 0 && (
          <div className="flex justify-center gap-6 pb-24 md:pb-8 px-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-card shadow-md border border-border flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Pasar de este perfil"
            >
              <X size={28} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Conectar con este perfil"
            >
              <UserPlus size={28} />
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {connectedUser && (
          <ConnectCelebration
            user={connectedUser}
            onClose={() => setConnectedUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectScreen;
