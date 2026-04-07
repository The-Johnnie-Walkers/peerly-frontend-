import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, MessageSquare, CheckCircle2 } from 'lucide-react';
import { MOCK_ACTIVITIES, MOCK_STUDENTS, CATEGORY_LABELS } from '@/data/mockData';
import { SafeRemoteImage } from '@/components/peerly/SafeRemoteImage';

const ActivityDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAttending, setIsAttending] = useState(false);

  const activity = MOCK_ACTIVITIES.find(a => a.id === id);
  if (!activity) {
    return (
      <div className="h-svh flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Actividad no encontrada</p>
      </div>
    );
  }

  const attendees = activity.currentAttendees.map(id => MOCK_STUDENTS.find(s => s.id === id)).filter(Boolean);

  return (
    <div className="h-svh flex flex-col bg-background">
      {/* Cover */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <SafeRemoteImage
          src={activity.coverImage}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/25 to-transparent" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2.5 bg-card/85 backdrop-blur rounded-xl border border-border/70 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div className="absolute bottom-5 left-6">
          <span className="px-3 py-1.5 bg-card/90 backdrop-blur rounded-xl text-xs font-mono font-bold uppercase tracking-wide text-foreground">
            {CATEGORY_LABELS[activity.category]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-8 -mt-5 bg-background rounded-t-3xl relative">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight mb-4">{activity.title}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          <span className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2 text-sm text-muted-foreground">
            <MapPin size={16} className="text-primary" />
            <span className="truncate">{activity.location}</span>
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2 text-sm text-muted-foreground">
            <Clock size={16} className="text-primary" />
            <span className="truncate">{activity.time}</span>
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2 text-sm text-muted-foreground">
            <Users size={16} className="text-primary" />
            <span>{activity.currentAttendees.length}/{activity.maxAttendees} cupos</span>
          </span>
        </div>

        <p className="text-foreground/85 text-base leading-relaxed mb-8">{activity.description}</p>

        {/* Attendees */}
        <div className="mb-8">
          <h3 className="font-display font-bold text-base mb-3">Asistentes</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {attendees.map(student => student && (
            <motion.div
              key={student.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/profile/${student.id}`)}
              className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer p-1 rounded-xl hover:bg-card/70 transition-colors"
            >
              <SafeRemoteImage
                src={student.photo}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-sm"
              />
              <span className="text-xs font-medium text-center truncate w-full">{student.name.split(' ')[0]}</span>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base">Comentarios</h3>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <SafeRemoteImage
                src={MOCK_STUDENTS[0].photo}
                alt={MOCK_STUDENTS[0].name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs font-display font-bold">{MOCK_STUDENTS[0].name}</span>
              <span className="text-xs font-mono text-muted-foreground">hace 2h</span>
            </div>
            <p className="text-sm text-foreground/80">¡Yo llevo los ejercicios del parcial pasado! 📝</p>
          </div>
        </div>
      </div>

      {/* RSVP button */}
      <div className="w-full max-w-[450px] mx-auto p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card/92 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-16px_hsl(30_20%_30%/0.4)]">
        <p className="text-xs text-muted-foreground mb-2">Confirma tu asistencia para reservar tu cupo.</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAttending(!isAttending)}
          className={`w-full h-12 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isAttending
              ? 'bg-success text-success-foreground'
              : 'bg-primary text-primary-foreground shadow-glow'
          }`}
        >
          {isAttending ? (
            <><CheckCircle2 size={20} /> ¡Asistiendo!</>
          ) : (
            <>Quiero ir 🙋</>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ActivityDetailScreen;
