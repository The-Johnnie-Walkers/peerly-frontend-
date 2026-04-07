import { motion } from 'framer-motion';
import { MapPin, Clock, Users } from 'lucide-react';
import { Activity, CATEGORY_LABELS, MOCK_STUDENTS } from '@/data/mockData';
import { SafeRemoteImage } from '@/components/peerly/SafeRemoteImage';

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
}

export const ActivityCard = ({ activity, onClick }: ActivityCardProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-3xl overflow-hidden shadow-card border border-border cursor-pointer"
    >
      <div className="h-32 relative overflow-hidden">
        <SafeRemoteImage
          src={activity.coverImage}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider">
          {CATEGORY_LABELS[activity.category]}
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-display font-bold mb-2">{activity.title}</h4>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin size={14} /> {activity.location.split(',')[0]}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {activity.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {activity.currentAttendees.slice(0, 3).map(id => {
              const s = MOCK_STUDENTS.find(st => st.id === id);
              return s ? (
                <SafeRemoteImage
                  key={id}
                  src={s.photo}
                  alt={s.name}
                  className="w-7 h-7 rounded-full border-2 border-card object-cover"
                />
              ) : null;
            })}
            {activity.currentAttendees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-accent border-2 border-card flex items-center justify-center text-[10px] font-mono font-bold text-accent-foreground">
                +{activity.currentAttendees.length - 3}
              </div>
            )}
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <Users size={12} /> {activity.currentAttendees.length}/{activity.maxAttendees}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
