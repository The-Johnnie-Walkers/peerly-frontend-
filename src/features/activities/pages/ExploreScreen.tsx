import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_ACTIVITIES, INTERESTS } from '@/shared/data/mockData';
import { StudentCard } from '@/features/users/components/StudentCard';
import { ActivityCard } from '@/features/activities/components/ActivityCard';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'available', label: 'Disponibles ahora' },
  { id: 'career', label: 'Mi carrera' },
  { id: 'activities', label: 'Actividades' },
];

const ExploreScreen = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredStudents = MOCK_STUDENTS.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.career.toLowerCase().includes(search.toLowerCase()) ||
      s.interests.some(i =>
        INTERESTS.find(int => int.id === i)?.label.toLowerCase().includes(search.toLowerCase())
      )
  );

  const showActivities = activeFilter === 'all' || activeFilter === 'activities';
  const showStudents = activeFilter !== 'activities';

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        {/* Header — jerarquía clara, consistencia con otras pantallas */}
        <header className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border/60 bg-background">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground mb-1">
            Explorar
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Busca personas o actividades por interés, carrera o nombre.
          </p>

          {/* Búsqueda — Nielsen: reconocimiento (placeholder + label implícito) */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={20}
              aria-hidden
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm placeholder:text-muted-foreground"
              placeholder="Personas, intereses, actividades..."
              aria-label="Buscar"
              type="search"
              autoComplete="off"
            />
          </div>

          {/* Filtros — Hick: pocas opciones claras; feedback visual del estado activo */}
          <div className="flex gap-2 overflow-x-auto pb-1 mt-3 -mx-1 scrollbar-none">
            {FILTERS.map(f => (
              <motion.button
                key={f.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-display font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  activeFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-foreground hover:bg-accent/50'
                }`}
                aria-pressed={activeFilter === f.id}
                aria-label={`Filtrar: ${f.label}`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-24 space-y-8">
          {showStudents && (
            <section aria-labelledby="section-students">
              <h2
                id="section-students"
                className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider"
              >
                Estudiantes
                {filteredStudents.length > 0 && (
                  <span className="font-mono font-normal ml-2">({filteredStudents.length})</span>
                )}
              </h2>
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {search ? 'No hay resultados para tu búsqueda.' : 'No hay estudiantes para mostrar.'}
                </p>
              ) : (
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 list-none p-0 m-0">
                  {filteredStudents.map((student, i) => (
                    <li key={student.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      >
                        <StudentCard
                          student={student}
                          compact
                          onClick={() => navigate(`/profile/${student.id}`)}
                        />
                      </motion.div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {showActivities && (
            <section aria-labelledby="section-activities">
              <h2
                id="section-activities"
                className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider"
              >
                Actividades trending
              </h2>
              <ul className="space-y-3 list-none p-0 m-0">
                {MOCK_ACTIVITIES.map((activity, i) => (
                  <li key={activity.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                    >
                      <ActivityCard
                        activity={activity}
                        onClick={() => navigate(`/activity/${activity.id}`)}
                      />
                    </motion.div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreScreen;
