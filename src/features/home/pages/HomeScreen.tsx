import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock3, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Loader2 } from 'lucide-react';
import { StudentCard } from '@/features/users/components/StudentCard';
import { ActivityCard } from '@/features/activities/components/ActivityCard';
import { userService, UserProfile } from '@/features/users/services/user.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { MOCK_ACTIVITIES, MOCK_NOTIFICATIONS, Notification, Student } from '@/shared/data/mockData';
import { NotificationPanel } from '@/shared/components/layout/NotificationPanel';
import { connectionsService } from '@/features/connections/services/connections.service';
import { ConnectionStatus } from '@/features/connections/types';

const HomeScreen = () => {
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  useEffect(() => {
    const fetchConnectedUsers = async () => {
      if (!userData?.id) return;
      try {
        // Solo traer conexiones aceptadas del usuario actual
        const connections = await connectionsService.findAll(userData.id, ConnectionStatus.ACCEPTED);

        // Obtener el ID del otro usuario en cada conexión
        const otherUserIds = connections.map((c) =>
          c.requesterId === userData.id ? c.receiverId : c.requesterId,
        );

        // Resolver los perfiles en paralelo
        const profiles = await Promise.all(otherUserIds.map((id) => userService.getUserById(id)));

        const students: Student[] = profiles
          .filter((u): u is UserProfile => u !== null)
          .map((u) => ({
            id: u.id,
            name: `${u.name} ${u.lastname}`,
            photo: u.profilePicURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}+${encodeURIComponent(u.lastname)}&background=random`,
            career: u.programs?.[0] || 'Estudiante',
            semester: u.semester,
            interests: u.interests?.map((i) => i.id) || [],
            bio: u.description || '',
            availability: u.freeTimeSchedule?.map((f) => ({
              day: f.dayOfTheWeek,
              start: f.startsAt,
              end: f.endsAt,
            })) || [],
            compatibility: Math.floor(Math.random() * 21) + 80,
            isOnline: true,
          }));

        setNearbyUsers(students);
      } catch (error) {
        console.error('Error fetching connected users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchConnectedUsers();
  }, [userData?.id]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:gap-12 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">
          <header className="flex flex-col gap-6 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9 lg:px-10">
            <div className="max-w-3xl">
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))] sm:text-4xl">
                ¿Qué quieres hacer hoy?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))] sm:text-[15px]">
                Accede rapido a tus amigos y revisa actividades cercanas con la informacion justa para decidir sin esfuerzo.
              </p>
            </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero prompt */}
        <div className="px-6 py-4">
          <p className="text-lg font-display font-bold text-foreground/80">
            Tus conexiones 🐾
          </p>
        </div>

        {/* Connected users */}
        <section className="mb-8">
          <div className="flex justify-between items-center px-6 mb-4">
            <h3 className="font-display font-bold text-lg">Conectados contigo</h3>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/connect')}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[hsl(var(--peerly-primary))] px-3.5 text-[13px] font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90 sm:shrink-0"
            >
              Conecta con nuevas personas
            </motion.button>
          </header>

          <section className="space-y-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Tus amigos</h2>
                <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                  Accesos directos a las personas con las que ya conectaste.
                </p>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-3 pl-0.5 pr-2 no-scrollbar">
              {friends.map(({ id, student }) => (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/profile/${student.id}`)}
                  className="group flex min-w-[88px] flex-col items-center gap-3 text-center sm:min-w-[96px]"
                >
                  <StudentCard
                    student={student}
                    compact
                    onClick={() => navigate(`/profile/${student.id}`)}
                  />
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground px-2">Aún no tienes conexiones. ¡Ve a <span className="text-primary font-bold cursor-pointer" onClick={() => navigate('/connect')}>Descubrir</span> para conectar con alguien!</p>
            )}
          </div>
        </section>

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
            </div>
          </section>

          <section className="space-y-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Actividades cerca</h2>
                <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                  Planes simples para unirte sin salirte de tu rutina.
                </p>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/explore')}
                className="inline-flex items-center gap-1 text-sm font-display font-semibold text-primary transition-colors hover:text-[color:hsl(var(--peerly-primary-dark))]"
              >
                Ver más
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-3 pl-0.5 pr-2 no-scrollbar">
              {activities.map((activity, index) => (
                <motion.button
                  key={activity.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
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
                    <span className="rounded-full bg-[hsl(var(--peerly-soft-accent))] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[color:hsl(var(--peerly-primary-dark))]">
                      Actividad
                    </span>
                  </div>

                  <p className="mt-5 line-clamp-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                    {activity.description}
                  </p>

                  <div className="mt-6 space-y-3.5 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">{activity.location}</span>
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
                      <span>
                        {activity.currentAttendees.length}/{activity.maxAttendees} personas confirmadas
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
