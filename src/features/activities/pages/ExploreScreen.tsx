import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus2, Search } from 'lucide-react';
import { ActivityCard } from '@/features/activities/components/ActivityCard';
import { activityService } from '@/features/activities/services/activity.service';

const ExploreScreen = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: fetchedActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityService.getAllActivities(),
  });

  const activities = fetchedActivities ?? activityService.getMockActivities();
  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const searchTerm = search.trim().toLowerCase();
        if (!searchTerm) return true;

        return (
          activity.title.toLowerCase().includes(searchTerm) ||
          activity.description.toLowerCase().includes(searchTerm) ||
          activity.location.toLowerCase().includes(searchTerm)
        );
      }),
    [activities, search],
  );

  return (
    <div className="min-h-svh bg-background px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:gap-10 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">
          <header className="flex flex-col gap-5 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:px-8 sm:py-9 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">
                Actividades
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))] sm:text-4xl">
                Descubre planes dentro del campus
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))] sm:text-[15px]">
                Revisa actividades disponibles, filtra por nombre o lugar y crea un nuevo plan cuando quieras mover a más personas.
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/create-activity')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[hsl(var(--peerly-primary))] px-4 text-sm font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90 sm:self-start lg:self-auto"
            >
              <CalendarPlus2 className="h-4 w-4" />
              Crear actividad
            </motion.button>
          </header>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/72 px-5 py-5 shadow-card sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Actividades disponibles</h2>
                <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                  {filteredActivities.length} resultado{filteredActivities.length === 1 ? '' : 's'} para explorar.
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Buscar por nombre, descripción o lugar"
                  aria-label="Buscar actividades"
                  type="search"
                  autoComplete="off"
                />
              </div>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="rounded-[30px] border border-dashed border-primary/25 bg-white/70 px-6 py-12 text-center shadow-card">
                <h3 className="font-display text-xl font-bold text-foreground">No encontramos actividades</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                  Ajusta la búsqueda o crea una nueva actividad para empezar a mover la comunidad.
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/create-activity')}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[hsl(var(--peerly-primary))] px-4 text-sm font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90"
                >
                  Crear actividad
                </motion.button>
              </div>
            ) : (
              <ul className="grid list-none gap-5 p-0 m-0 md:grid-cols-2 xl:grid-cols-3">
                {filteredActivities.map((activity, index) => (
                  <li key={activity.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.25) }}
                    >
                      <ActivityCard
                        activity={activity}
                        onClick={() => navigate(`/activity/${activity.id}`)}
                      />
                    </motion.div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExploreScreen;
