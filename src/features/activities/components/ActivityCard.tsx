import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Activity } from '@/shared/data/mockData';

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Disponible',
  FULL: 'Lleno',
  IN_PROGRESS: 'En curso',
  ENDED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  FULL: 'bg-rose-100 text-rose-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  ENDED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export const ActivityCard = ({ activity, onClick }: ActivityCardProps) => {
  const statusLabel = STATUS_LABELS[activity.status ?? 'OPEN'] ?? 'Disponible';
  const statusStyle = STATUS_STYLES[activity.status ?? 'OPEN'] ?? STATUS_STYLES.OPEN;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-[32px] border border-border bg-card shadow-card"
    >
      <div className="flex border-b border-border/70 bg-[linear-gradient(135deg,rgba(255,248,242,0.95),rgba(247,241,235,0.92))] px-4 py-2 pb-4">
        <h4 className="mt-3 font-display text-lg font-bold leading-snug text-foreground">{activity.title}</h4>
        <div className="flex items-center gap-2 ml-auto pt-3">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
        
      </div>
      <div className="p-4">
        <p className="mb-4 pl-2 overflow-hidden line-clamp-1 text-sm leading-6 text-muted-foreground">{activity.description}</p>

        <div className="mb-4 grid gap-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 rounded-2xl bg-accent/45 px-2 py-2">
            <MapPin size={14} className="text-primary" />
            <span className="truncate">{activity.location}</span>
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-2xl bg-accent/45 px-2 py-2">
              <CalendarDays size={14} className="text-primary" />
              <span>{activity.date}</span>
            </span>
            <span className="flex items-center gap-2 rounded-2xl bg-accent/45 px-2 py-2">
              <Clock size={14} className="text-primary" />
              <span>{activity.time}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 text-[11px] font-mono font-bold text-muted-foreground">
            <Users size={13} />
            {activity.currentAttendees.length}/{activity.maxAttendees}
          </span>
          <span className="inline-flex h-9 items-center justify-center rounded-full bg-[hsl(var(--peerly-primary))] px-4 text-[11px] font-display font-semibold text-white shadow-card">
            Ver detalle
          </span>
        </div>
      </div>
    </motion.div>
  );
};
