import { useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { authService } from '@/features/auth/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { userService, UserProfile } from '@/features/users/services/user.service';
import { useCreateConnection } from '../hooks/useConnections';
import { ConnectionStatus } from '../types';

// Tarjeta de swipe
const STACK_SCALE = [1, 0.95, 0.90];
const STACK_OPACITY = [1, 0.7, 0.45];

const SwipeCard = ({
  user,
  onSwipe,
  isTop,
  onCardClick,
  compatibility,
  stackIndex = 0,
}: {
  user: UserProfile;
  onSwipe: (dir: 'left' | 'right') => void;
  isTop: boolean;
  onCardClick: (userId: string) => void;
  compatibility?: number;
  stackIndex?: number;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const connectOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const scale = STACK_SCALE[stackIndex] ?? 0.90;
  const opacity = STACK_OPACITY[stackIndex] ?? 0.45;

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
      onClick={(e) => {
        // Solo abrir perfil si no fue un drag (offset pequeño)
        if (Math.abs(x.get()) < 5 && isTop) {
          e.stopPropagation();
          onCardClick(user.id);
        }
      }}
      initial={{ scale, opacity: stackIndex === 0 ? 1 : 0.5 }}
      animate={{ scale, opacity }}
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

        <div className="absolute bottom-0 p-5 md:p-5 w-full ">
          <div className="flex items-end gap-3 mb-1">
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
          {compatibility !== undefined && compatibility > 0 && (
            <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-card/30 bg-card/20 backdrop-blur-md py-1.5 text-[10px] font-mono font-semibold text-card/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {compatibility}% compatible
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
      className="fixed inset-0 z-50 bg-primary/95 flex flex-col items-center justify-center p-6 md:p-12 text-center text-primary-foreground"
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
    queryKey: ['users', 'discover', userId],
    queryFn: () => userId ? userService.discoverUsers(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  // discoverUsers ya devuelve la lista filtrada (sin yo, sin conectados) y ordenada por compatibilidad
  const cards = useMemo(() => {
    return allUsers.filter(u => !swipedIds.has(u.id));
  }, [allUsers, swipedIds]);

  const { data: topCompatibility } = useQuery({
    queryKey: ['compatibility', userId, cards[0]?.id],
    queryFn: () => userService.getCompatibility(userId!, cards[0]!.id),
    enabled: !!userId && !!cards[0]?.id,
    staleTime: 10 * 60 * 1000,
  });

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
      <div className="h-svh bg-background px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 flex flex-col">
        <div className="flex-1 min-h-0 rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated flex flex-col">
          <div className="flex flex-col flex-1 min-h-0 mx-auto w-full max-w-[1440px] px-6 pt-5 pb-6 sm:px-8 sm:pt-6 lg:px-10 xl:px-12 2xl:px-14 gap-4">
            <header className="flex-shrink-0 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-6 py-5 shadow-card sm:px-8">
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">Descubrir</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))]">
                Conoce a tu comunidad
              </h1>
              <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">Buscando perfiles...</p>
            </header>

            <div className="flex flex-col flex-1 min-h-0 gap-3 w-full max-w-2xl mx-auto">
              <div className="flex-1 min-h-[42svh] relative">
                <div className="absolute inset-0 rounded-3xl overflow-hidden bg-muted animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-0 p-5 md:p-6 w-full space-y-3">
                    <div className="h-7 w-44 bg-white/20 rounded-2xl" />
                    <div className="h-4 w-32 bg-white/15 rounded-full" />
                    <div className="h-4 w-full bg-white/10 rounded-full mt-3" />
                    <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                    <div className="flex gap-2 mt-1">
                      <div className="h-6 w-16 bg-white/15 rounded-lg" />
                      <div className="h-6 w-20 bg-white/15 rounded-lg" />
                      <div className="h-6 w-14 bg-white/15 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex justify-center gap-6 pb-24 md:pb-6">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-svh bg-background px-4 py-2 sm:px-5 sm:py-2 lg:px-6 lg:py-2 flex flex-col">
      <div className="flex-1 min-h-0 rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated flex flex-col">
        <div className="flex flex-col flex-1 min-h-0 mx-auto w-full max-w-[1440px] px-6 pt-5 pb-6 sm:px-8 sm:pt-6 lg:px-10 xl:px-12 2xl:px-14 gap-4">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex-shrink-0 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-6 py-5 shadow-card sm:px-8"
          >
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">Descubrir</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))]">
              Conoce a tu comunidad
            </h1>
          </motion.header>

          <div className="flex flex-col flex-1 min-h-0 gap-3 w-full max-w-2xl mx-auto">
            <div className="flex-1 min-h-[60svh] relative">
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
                    .slice(0, 3)
                    .map((user, i) => (
                      <SwipeCard
                        key={user.id}
                        user={user}
                        onSwipe={handleSwipe}
                        isTop={i === 0}
                        stackIndex={i}
                        onCardClick={(id) => navigate(`/profile/${id}?from=connect`)}
                        compatibility={i === 0 ? topCompatibility : undefined}
                      />
                    ))
                    .reverse()
                )}
              </AnimatePresence>
            </div>

            {cards.length > 0 && (
              <p className="hidden md:block flex-shrink-0 text-center text-xs text-muted-foreground">
                Arrastra la carta o usa los botones para conectar
              </p>
            )}

            {cards.length > 0 && (
              <div className="flex-shrink-0 flex justify-center gap-6 pb-24 md:pb-6">
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
        </div>
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
