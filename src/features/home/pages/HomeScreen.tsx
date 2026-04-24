import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock3, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { MOCK_CONNECTIONS } from '@/shared/data/mockData';
import { activityService } from '@/features/activities/services/activity.service';

const HomeScreen = () => {
  const navigate = useNavigate();

  const friends = useMemo(
    () => [...MOCK_CONNECTIONS].sort((a, b) => Number(b.student.isOnline) - Number(a.student.isOnline)),
    [],
  );
  const { data: fetchedActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityService.getAllActivities(),
  });
  const activities = fetchedActivities ?? [];

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
                  <div className="relative">
                    <div className="rounded-full bg-white p-1.5 shadow-card transition-transform group-hover:-translate-y-0.5">
                      <SafeRemoteImage
                        src={student.photo}
                        alt={student.name}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    </div>
                    {student.isOnline && (
                      <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-success" />
                    )}
                  </div>
                  <span className="max-w-[88px] truncate text-sm font-medium text-foreground sm:max-w-[96px]">
                    {student.name.split(' ')[0]}
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
