import { motion, scale } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import type { Activity } from '@/features/activities/services/activity.service';

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
  isOwner?: boolean;
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
  CANCELLED: 'bg-red-100 text-rose-700',
};

export const ActivityCard = ({ activity, onClick, isOwner = false }: ActivityCardProps) => {
  const statusLabel = STATUS_LABELS[activity.status ?? 'OPEN'] ?? 'Disponible';
  const statusStyle = STATUS_STYLES[activity.status ?? 'OPEN'] ?? STATUS_STYLES.OPEN;
  const isFull = (activity.status ?? 'OPEN') === 'FULL';

  return (
    <motion.div
      className="cursor-pointer overflow-hidden rounded-[32px] border border-border bg-card shadow-card"
    >
      <div className="flex flex-col border-b border-border/70 bg-[linear-gradient(135deg,rgba(255,248,242,0.95),rgba(247,241,235,0.92))] px-4 py-2 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="mt-3 font-display text-lg font-bold leading-snug text-foreground">{activity.title}</h4>
          <span className={`mt-3 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
        {isOwner && (
          <span className="mt-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
            Creada por ti
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="mb-4 pl-2 overflow-hidden line-clamp-2 text-sm leading-6 text-muted-foreground">{activity.description}</p>

        <div className="mb-4 grid gap-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 rounded-2xl bg-accent/45 px-2 py-2">
            <MapPin size={14} className="text-primary" />
            <span className="truncate">{activity.locationPayload.displayName}</span>
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
          <span className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-[11px] font-mono font-bold ${
            isFull
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-border/70 bg-background text-muted-foreground'
          }`}>
            <Users size={13} />
            {activity.currentAttendees.length}/{activity.maxAttendees}
          </span>
          <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.1}}
            whileTap={{ scale: 0.98 }}
            className="shrink-0"
          >
            <span className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[11px] font-display font-semibold shadow-card ${
              isFull
                ? 'bg-muted text-muted-foreground'
                : 'bg-[hsl(var(--peerly-primary))] text-white'
            }`}>
              Ver detalle
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
