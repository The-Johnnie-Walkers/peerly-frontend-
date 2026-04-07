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
      <div className="relative h-56 overflow-hidden">
        <SafeRemoteImage
          src={activity.coverImage}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2.5 bg-card/80 backdrop-blur rounded-xl"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div className="absolute bottom-4 left-6">
          <span className="px-2.5 py-1 bg-card/90 backdrop-blur rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider">
            {CATEGORY_LABELS[activity.category]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 -mt-4 bg-background rounded-t-3xl relative">
        <h1 className="text-2xl font-display font-extrabold mb-3">{activity.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {activity.location}</span>
          <span className="flex items-center gap-1.5"><Clock size={16} className="text-primary" /> {activity.time}</span>
          <span className="flex items-center gap-1.5"><Users size={16} className="text-primary" /> {activity.currentAttendees.length}/{activity.maxAttendees}</span>
        </div>

        <p className="text-foreground/80 mb-8 leading-relaxed">{activity.description}</p>

        {/* Attendees */}
        <h3 className="font-display font-bold mb-3">Asistentes</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8">
          {attendees.map(student => student && (
            <motion.div
              key={student.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/profile/${student.id}`)}
              className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer"
            >
              <SafeRemoteImage
                src={student.photo}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-border"
              />
              <span className="text-[10px] font-medium text-center truncate w-full">{student.name.split(' ')[0]}</span>
            </motion.div>
          ))}
        </div>

        {/* Comments */}
        <h3 className="font-display font-bold mb-3">Comentarios</h3>
        <div className="space-y-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <SafeRemoteImage
                src={MOCK_STUDENTS[0].photo}
                alt={MOCK_STUDENTS[0].name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs font-display font-bold">{MOCK_STUDENTS[0].name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">hace 2h</span>
            </div>
            <p className="text-sm text-foreground/80">¡Yo llevo los ejercicios del parcial pasado! 📝</p>
          </div>
        </div>
      </div>

      {/* RSVP button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] p-6 bg-card/90 backdrop-blur-xl border-t border-border">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAttending(!isAttending)}
          className={`w-full p-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 transition-all ${
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
