import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { userService, UserProfile } from '@/features/users/services/user.service';
import { activityService, Activity } from '@/features/activities/services/activity.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { MOCK_NOTIFICATIONS, Notification } from '@/shared/data/mockData';
import { NotificationPanel } from '@/shared/components/layout/NotificationPanel';
import { connectionsService } from '@/features/connections/services/connections.service';
import { ConnectionStatus } from '@/features/connections/types';

type ConnectedUser = {
  id: string;
  name: string;
  photo: string;
  isOnline: boolean;
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Cargar conexiones aceptadas
  useEffect(() => {
    const fetchConnectedUsers = async () => {
      if (!userData?.id) return;
      try {
        const connections = await connectionsService.findAll(userData.id, ConnectionStatus.ACCEPTED);
        const otherUserIds = connections.map((c) =>
          c.requesterId === userData.id ? c.receiverId : c.requesterId,
        );
        const profiles = await Promise.all(otherUserIds.map((id) => userService.getUserById(id)));
        const users: ConnectedUser[] = profiles
          .filter((u): u is UserProfile => u !== null)
          .map((u) => ({
            id: u.id,
            name: `${u.name} ${u.lastname}`.trim(),
            photo: u.profilePicURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}+${encodeURIComponent(u.lastname)}&background=random`,
            isOnline: u.isOnline ?? false,
          }));
        setConnectedUsers(users);
      } catch (error) {
        console.error('Error fetching connected users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchConnectedUsers();
  }, [userData?.id]);

  // Cargar actividades
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const all = await activityService.getAllActivities();
        setActivities(all.slice(0, 8));
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:gap-12 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">

          {/* Header */}
          <header className="flex flex-col gap-6 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9 lg:px-10">
            <div className="max-w-3xl">
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                ¡Hola, {userData?.name || 'Compañero'}!
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Accede rápido a tus conexiones y revisa actividades cercanas.
              </p>
            </div>
            <div className="flex gap-3 items-center sm:shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-accent rounded-xl relative"
                aria-label="Abrir notificaciones"
              >
                <Bell size={20} className="text-foreground" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-secondary-foreground shadow-sm">
                    {unreadCount}
                  </div>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/connect')}
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-3.5 text-[13px] font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90"
              >
                Descubrir personas
              </motion.button>
            </div>
          </header>

          {/* Conexiones */}
          <section className="space-y-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Tus conexiones</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accesos directos a las personas con las que ya conectaste.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/social')}
                className="inline-flex items-center gap-1 text-sm font-display font-semibold text-primary"
              >
                Ver más <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-3 pl-0.5 pr-2 no-scrollbar min-h-[120px]">
              {isLoadingUsers ? (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex min-w-[88px] flex-col items-center gap-3 sm:min-w-[96px] animate-pulse">
                      <div className="h-[92px] w-[92px] rounded-full bg-muted" />
                      <div className="h-3 w-14 rounded-full bg-muted" />
                    </div>
                  ))}
                </>
              ) : connectedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full gap-3 py-4">
                  <div className="flex -space-x-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-12 w-12 rounded-full bg-accent border-2 border-background flex items-center justify-center"
                        style={{ zIndex: 3 - i }}
                      >
                        <Users className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Aún no tienes conexiones</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Encuentra compañeros compatibles y empieza a conectar</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/connect')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-display font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Descubrir personas
                  </motion.button>
                </div>
              ) : (
                <>
                  {connectedUsers.slice(0, 10).map((user, i) => (
                    <motion.button
                      key={user.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="group flex min-w-[88px] flex-col items-center gap-3 text-center sm:min-w-[96px]"
                    >
                      <div className="relative">
                        <div className="rounded-full bg-white p-1.5 shadow-card transition-transform group-hover:-translate-y-0.5">
                          <SafeRemoteImage
                            src={user.photo}
                            alt={user.name}
                            className="h-20 w-20 rounded-full object-cover"
                          />
                        </div>
                        {user.isOnline && (
                          <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-success" />
                        )}
                      </div>
                      <span className="max-w-[88px] truncate text-sm font-medium text-foreground sm:max-w-[96px]">
                        {user.name.split(' ')[0]}
                      </span>
                    </motion.button>
                  ))}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/social')}
                    className="flex min-w-[88px] flex-col items-center justify-center gap-3 text-center sm:min-w-[96px]"
                  >
                    <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border border-dashed border-primary/35 bg-white/75 text-primary shadow-card transition-colors hover:bg-white">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-primary">Ver más</span>
                  </motion.button>
                </>
              )}
            </div>
          </section>

          {/* Actividades */}
          <section className="space-y-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Actividades cerca</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Planes simples para unirte sin salirte de tu rutina.
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/explore')}
                className="inline-flex items-center gap-1 text-sm font-display font-semibold text-primary"
              >
                Ver más <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-3 pl-0.5 pr-2 no-scrollbar">
              {isLoadingActivities ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="min-w-[286px] max-w-[286px] sm:min-w-[330px] sm:max-w-[330px] rounded-[40px] border border-white/70 bg-card px-5 py-5 sm:px-6 sm:py-6 animate-pulse"
                    >
                      <div className="h-3 w-24 rounded-full bg-muted mb-3" />
                      <div className="h-5 w-3/4 rounded-full bg-muted mb-2" />
                      <div className="h-4 w-full rounded-full bg-muted mb-1" />
                      <div className="h-4 w-2/3 rounded-full bg-muted mt-5 mb-6" />
                      <div className="space-y-3">
                        <div className="h-3 w-1/2 rounded-full bg-muted" />
                        <div className="h-3 w-2/5 rounded-full bg-muted" />
                        <div className="h-3 w-1/3 rounded-full bg-muted" />
                      </div>
                    </div>
                  ))}
                </>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay actividades disponibles.</p>
              ) : (
                activities.map((activity, index) => (
                  <motion.button
                    key={activity.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/activity/${activity.id}`)}
                    className="min-w-[286px] max-w-[286px] rounded-[40px] border border-white/70 bg-card px-5 py-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated sm:min-w-[330px] sm:max-w-[330px] sm:px-6 sm:py-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                          Actividad cercana
                        </p>
                        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-foreground">
                          {activity.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="mt-6 space-y-3.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate">{activity.locationPayload.displayName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {activity.date}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-primary" />
                          {activity.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{activity.currentAttendees.length}/{activity.maxAttendees} personas confirmadas</span>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </section>

        </div>
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};

export default HomeScreen;
