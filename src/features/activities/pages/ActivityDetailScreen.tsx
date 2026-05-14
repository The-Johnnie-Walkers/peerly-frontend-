import { type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { activityService } from '@/features/activities/services/activity.service';
import { authService } from '@/features/auth/services/auth.service';
import { Activity } from '../services/activity.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useUser } from '@/features/users/hooks/useUser';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const STATUS_LABELS: Record<NonNullable<Activity['status']>, string> = {
  OPEN: 'Disponible',
  FULL: 'Lleno',
  IN_PROGRESS: 'En curso',
  ENDED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const STATUS_STYLES: Record<NonNullable<Activity['status']>, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  FULL: 'bg-rose-100 text-rose-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  ENDED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const, delay },
  }),
};

const STATUS_DESCRIPTIONS: Record<NonNullable<Activity['status']>, string> = {
  OPEN: 'Todavia puedes ingresar si quieres reservar un cupo.',
  FULL: 'Ya no quedan cupos disponibles para nuevas personas.',
  IN_PROGRESS: 'La actividad ya empezo y no acepta nuevos ingresos.',
  ENDED: 'La actividad termino.',
  CANCELLED: 'La actividad fue cancelada.',
};

const DetailShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
    <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:gap-8 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">
        {children}
      </div>
    </div>
  </div>
);

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-card">
    <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <p className="mt-3 text-sm font-medium leading-6 text-foreground">{value}</p>
  </div>
);

const DetailErrorState = ({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <DetailShell>
      <section className="rounded-[32px] border border-white/70 bg-white/80 px-6 py-8 shadow-card sm:px-8 sm:py-10">
        <div className="flex max-w-xl flex-col items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-[color:hsl(var(--peerly-primary-dark))]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 rounded-full border-border/80 bg-white px-5"
            >
              Volver
            </Button>
            {onRetry ? (
              <Button
                type="button"
                onClick={onRetry}
                className="h-11 rounded-full bg-[hsl(var(--peerly-primary))] px-5 text-white hover:bg-[hsl(var(--peerly-primary))]/90"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </DetailShell>
  );
};

const ActivityDetailSkeleton = () => (
  <DetailShell>
    <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:px-8 sm:py-9 lg:px-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-10 w-full max-w-2xl rounded-2xl" />
          <Skeleton className="h-10 w-full max-w-xl rounded-2xl" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
        </div>
      </div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="order-2 space-y-6 lg:order-1">
        <Skeleton className="h-56 rounded-[30px]" />
        <Skeleton className="h-44 rounded-[30px]" />
      </div>
      <div className="order-1 lg:order-2">
        <Skeleton className="h-72 rounded-[30px]" />
      </div>
    </div>
  </DetailShell>
);

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getDateLabel = (activity: Activity) => {
  if (!activity.startsAtISO) return activity.date;

  const startsAt = new Date(activity.startsAtISO);
  if (Number.isNaN(startsAt.getTime())) return activity.date;

  return capitalize(DATE_FORMATTER.format(startsAt));
};

const getScheduleLabel = (activity: Activity) => {
  if (!activity.startsAtISO) return activity.time;

  const startsAt = new Date(activity.startsAtISO);
  if (Number.isNaN(startsAt.getTime())) return activity.time;

  if (!activity.endsAtISO) return TIME_FORMATTER.format(startsAt);

  const endsAt = new Date(activity.endsAtISO);
  if (Number.isNaN(endsAt.getTime())) return TIME_FORMATTER.format(startsAt);

  return `${TIME_FORMATTER.format(startsAt)} - ${TIME_FORMATTER.format(endsAt)}`;
};

const getAvailablePlaces = (activity: Activity) =>
  Math.max(activity.availablePlaces ?? activity.maxAttendees - activity.currentAttendees.length, 0);

const getConfirmedCount = (activity: Activity) =>
  Math.max(activity.maxAttendees - getAvailablePlaces(activity), 0);

const updateCachedActivity = (
  activity: Activity | undefined,
  userId: string,
  action: 'join' | 'leave',
) => {
  if (!activity) return activity;

  const nextAttendees =
    action === 'join'
      ? activity.currentAttendees.includes(userId)
        ? activity.currentAttendees
        : [...activity.currentAttendees, userId]
      : activity.currentAttendees.includes(userId)
        ? activity.currentAttendees.filter((attendeeId) => attendeeId !== userId)
        : activity.currentAttendees.slice(0, Math.max(activity.currentAttendees.length - 1, 0));

  const nextAvailablePlaces =
    action === 'join'
      ? Math.max(getAvailablePlaces(activity) - 1, 0)
      : Math.min(getAvailablePlaces(activity) + 1, activity.maxAttendees);

  const currentStatus = activity.status ?? 'OPEN';
  const nextStatus =
    currentStatus === 'OPEN' || currentStatus === 'FULL'
      ? nextAvailablePlaces === 0
        ? 'FULL'
        : 'OPEN'
      : currentStatus;

  return {
    ...activity,
    currentAttendees: nextAttendees,
    availablePlaces: nextAvailablePlaces,
    status: nextStatus,
  };
};

const ActivityDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = authService.getCurrentUser()?.id ?? null;

  const activityQuery = useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      if (!id) throw new Error('No se encontro el identificador de la actividad.');
      return activityService.getActivityById(id);
    },
    enabled: Boolean(id),
  });

  const joinedActivityIdsQuery = useQuery({
    queryKey: ['joined-activity-ids', userId],
    queryFn: () => activityService.getJoinedActivityIdsByUserId(userId!),
    enabled: Boolean(userId),
  });

  const creatorQuery = useUser(activityQuery.data?.creatorId);

  const invalidateActivityQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activities'] }),
      queryClient.invalidateQueries({ queryKey: ['user-activities', userId] }),
      queryClient.invalidateQueries({ queryKey: ['joined-activity-ids', userId] }),
    ]);
  };

  const syncLocalParticipation = (action: 'join' | 'leave') => {
    if (!id || !userId) return;

    queryClient.setQueryData<string[]>(['joined-activity-ids', userId], (current = []) =>
      action === 'join'
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((activityId) => activityId !== id),
    );

    queryClient.setQueryData<Activity | undefined>(['activities', id], (current) =>
      updateCachedActivity(current, userId, action),
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No se pudo identificar la actividad.');
      return activityService.deleteActivity(id);
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['activities'] });
      queryClient.removeQueries({ queryKey: ['user-activities', userId] });
      queryClient.removeQueries({ queryKey: ['joined-activity-ids', userId] });
      toast.success('La actividad fue eliminada.');
      navigate('/explore');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible eliminar la actividad.';
      toast.error(message);
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!id || !userId) {
        throw new Error('No se pudo identificar tu sesion para ingresar.');
      }

      return activityService.joinActivity(id, userId);
    },
    onSuccess: async () => {
      syncLocalParticipation('join');
      toast.success('Ingresaste a la actividad.');
      await invalidateActivityQueries();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible ingresar a la actividad.';
      toast.error(message);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !userId) {
        throw new Error('No se pudo identificar tu sesion para salir.');
      }

      return activityService.leaveActivity(id, userId);
    },
    onSuccess: async () => {
      syncLocalParticipation('leave');
      toast.success('Saliste de la actividad.');
      await invalidateActivityQueries();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible salir de la actividad.';
      toast.error(message);
    },
  });

  if (!id) {
    return (
      <DetailErrorState
        title="Actividad no disponible"
        description="La ruta no incluye un identificador valido para cargar el detalle."
      />
    );
  }

  if (activityQuery.isPending) {
    return <ActivityDetailSkeleton />;
  }

  if (activityQuery.isError) {
    return (
      <DetailErrorState
        title="No pudimos cargar la actividad"
        description={
          activityQuery.error instanceof Error
            ? activityQuery.error.message
            : 'Intenta nuevamente en unos segundos.'
        }
        onRetry={() => {
          void activityQuery.refetch();
        }}
      />
    );
  }

  const activity = activityQuery.data;

  if (!activity) {
    return (
      <DetailErrorState
        title="Actividad no encontrada"
        description="No encontramos informacion para esta actividad en el microservicio."
      />
    );
  }

  const status = activity.status ?? 'OPEN';
  const statusLabel = STATUS_LABELS[status];
  const statusStyle = STATUS_STYLES[status];
  const statusDescription = STATUS_DESCRIPTIONS[status];
  const availablePlaces = getAvailablePlaces(activity);
  const confirmedCount = getConfirmedCount(activity);
  const isOwner = Boolean(userId && activity.creatorId === userId);
  const isJoined = Boolean(userId && joinedActivityIdsQuery.data?.includes(activity.id));
  const isActionPending = joinMutation.isPending || leaveMutation.isPending;
  const canJoin = Boolean(userId) && !isJoined && status === 'OPEN' && availablePlaces > 0;
  const showSessionFallback = !userId;
  const showMembershipError = Boolean(userId) && joinedActivityIdsQuery.isError;

  const primaryAction = (() => {
    if (showSessionFallback) {
      return {
        label: 'Sesion no disponible',
        description: 'No pudimos identificar al usuario actual para administrar tu participacion.',
        disabled: true,
      };
    }

    if (status === 'FULL' || availablePlaces === 0) {
      return {
        label: 'Sin cupos disponibles',
        description: 'La actividad llego al limite de personas confirmadas.',
        disabled: true,
      };
    }

    if (status === 'IN_PROGRESS') {
      return {
        label: 'Actividad en curso',
        description: 'Ya empezo y no acepta nuevos ingresos.',
        disabled: true,
      };
    }

    if (status === 'ENDED') {
      return {
        label: 'Actividad finalizada',
        description: 'Esta actividad ya termino.',
        disabled: true,
      };
    }

    if (status === 'CANCELLED') {
      return {
        label: 'Actividad cancelada',
        description: 'No esta disponible para nuevas personas.',
        disabled: true,
      };
    }

    return {
      label: 'Ingresar a la actividad',
      description: 'Reservaras tu cupo y la actividad aparecera dentro de tus planes.',
      disabled: false,
    };
  })();

  return (
    <DetailShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:px-8 sm:py-9 lg:px-10"
      >
        <div className="flex flex-col gap-6" >
          <div className="flex items-start justify-between gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/explore')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-foreground shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>

            <span
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[11px] font-mono font-bold uppercase tracking-[0.18em] ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="max-w-4xl">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">
              Detalle de actividad
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))] sm:text-4xl">
              {activity.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))] sm:text-[15px]">
              {statusDescription}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard icon={CalendarDays} label="Fecha" value={getDateLabel(activity)} />
            <SummaryCard icon={Clock3} label="Horario" value={getScheduleLabel(activity)} />
            <SummaryCard icon={MapPin} label="Ubicacion" value={activity.locationPayload.displayName} />
          </div>
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          variants={fadeUp} initial="hidden" animate="show" custom={0.14}
          className="order-2 space-y-6 lg:order-1"
        >
          <article className="rounded-[30px] border border-white/70 bg-white/80 px-6 py-6 shadow-card sm:px-7">
            <div className="max-w-3xl">
              <h2 className="font-display text-2xl font-bold text-foreground">Sobre la actividad</h2>
              <p className="mt-4 text-sm leading-7 text-[color:hsl(var(--peerly-text-secondary))] sm:text-[15px]">
                {activity.description}
              </p>
            </div>
          </article>

          {activity.locationPayload?.latitude != null && activity.locationPayload?.longitude != null && (
            <article className="overflow-hidden rounded-[30px] border border-white/70 shadow-card">
              <div className="border-b border-border/70 bg-white/80 px-6 py-4 sm:px-7">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Ubicación
                </h2>
                <p className="mt-0.5 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                  {activity.locationPayload.displayName}
                </p>
              </div>
              <iframe
                title="Mapa de ubicación"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(activity.locationPayload.longitude) - 0.007},${Number(activity.locationPayload.latitude) - 0.007},${Number(activity.locationPayload.longitude) + 0.007},${Number(activity.locationPayload.latitude) + 0.007}&layer=mapnik&marker=${activity.locationPayload.latitude},${activity.locationPayload.longitude}`}
                className="w-full h-56 border-0"
                loading="lazy"
              />
            </article>
          )}

          <article className="rounded-[30px] border border-white/70 bg-white/72 px-6 py-6 shadow-card sm:px-7">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Informacion clave</h2>
                <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                  Solo mostramos el contexto que ayuda a decidir rapido si quieres entrar o salir.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/45 px-4 py-4">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Cupos disponibles
                  </p>
                  <p className="mt-3 text-2xl font-display font-extrabold text-foreground">{availablePlaces}</p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/45 px-4 py-4">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Confirmados
                  </p>
                  <p className="mt-3 text-2xl font-display font-extrabold text-foreground">{confirmedCount}</p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/45 px-4 py-4">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Capacidad total
                  </p>
                  <p className="mt-3 text-2xl font-display font-extrabold text-foreground">
                    {activity.maxAttendees}
                  </p>
                </div>
              </div>
            </div>
          </article>

        </motion.section>

        <motion.aside
          variants={fadeUp} initial="hidden" animate="show" custom={0.07}
          className="order-1 self-start lg:order-2 lg:sticky lg:top-6"
        >
          <article className="rounded-[30px] border border-white/70 bg-white/88 px-6 py-6 shadow-card sm:px-7">
            {isOwner ? (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Tu actividad
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                    Eres el creador
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                    Puedes editar los datos o eliminarla. Los cambios son inmediatos para todos los participantes.
                  </p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/40 px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {confirmedCount} persona{confirmedCount === 1 ? '' : 's'} confirmada
                      {confirmedCount === 1 ? '' : 's'} de {activity.maxAttendees}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate(`/activity/${id}/edit`)}
                    className="h-12 rounded-2xl bg-[hsl(var(--peerly-primary))] text-white hover:bg-[hsl(var(--peerly-primary))]/90"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar actividad
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={deleteMutation.isPending}
                        className="h-12 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15"
                      >
                        {deleteMutation.isPending ? (
                          <><LoaderCircle className="h-4 w-4 animate-spin" />Eliminando...</>
                        ) : (
                          <><Trash2 className="h-4 w-4" />Eliminar actividad</>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[28px] border-white/70 bg-background p-6 sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-2xl font-bold text-foreground">
                          Eliminar actividad
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                          Esta accion es permanente. Se eliminara la actividad para todos los participantes y no podra recuperarse.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-11 rounded-full border-border/80 bg-white px-5">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deleteMutation.isPending}
                          onClick={() => { void deleteMutation.mutateAsync(); }}
                          className="h-11 rounded-full bg-destructive text-white hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Tu participacion
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                    {isJoined ? 'Ya estas dentro' : 'Aun no has ingresado'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                    {isJoined
                      ? 'Puedes salir cuando quieras. Si cambias de opinion, confirmamos antes de liberar tu cupo.'
                      : primaryAction.description}
                  </p>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/40 px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {confirmedCount} persona{confirmedCount === 1 ? '' : 's'} confirmada
                      {confirmedCount === 1 ? '' : 's'} de {activity.maxAttendees}
                    </span>
                  </div>
                </div>

                {joinedActivityIdsQuery.isPending && userId ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 rounded-2xl" />
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                  </div>
                ) : null}

                {showMembershipError ? (
                  <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 px-4 py-4">
                    <p className="text-sm font-medium text-foreground">
                      No pudimos validar si ya estas dentro de esta actividad.
                    </p>
                    <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                      Reintenta para habilitar la accion correcta.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { void joinedActivityIdsQuery.refetch(); }}
                      className="mt-4 h-10 rounded-full border-border/80 bg-white px-4"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reintentar
                    </Button>
                  </div>
                ) : null}

                {!joinedActivityIdsQuery.isPending && !showMembershipError ? (
                  <div className="hidden md:block">
                    {isJoined ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            disabled={isActionPending}
                            className="h-12 w-full rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15"
                          >
                            {leaveMutation.isPending ? (
                              <><LoaderCircle className="h-4 w-4 animate-spin" />Saliendo...</>
                            ) : (
                              <><LogOut className="h-4 w-4" />Salir de la actividad</>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[28px] border-white/70 bg-background p-6 sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display text-2xl font-bold text-foreground">Salir de la actividad</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                              Vas a liberar tu cupo en esta actividad. Si todavia quieres participar, tendras que ingresar otra vez.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="h-11 rounded-full border-border/80 bg-white px-5">Cancelar</AlertDialogCancel>
                            <AlertDialogAction disabled={leaveMutation.isPending} onClick={() => { void leaveMutation.mutateAsync(); }} className="h-11 rounded-full bg-destructive text-white hover:bg-destructive/90">
                              {leaveMutation.isPending ? 'Saliendo...' : 'Confirmar salida'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        type="button"
                        disabled={primaryAction.disabled || isActionPending || !canJoin}
                        onClick={() => { void joinMutation.mutateAsync(); }}
                        className="h-12 w-full rounded-2xl bg-[hsl(var(--peerly-primary))] text-white hover:bg-[hsl(var(--peerly-primary))]/90"
                      >
                        {joinMutation.isPending ? (
                          <><LoaderCircle className="h-4 w-4 animate-spin" />Ingresando...</>
                        ) : (
                          <><LogIn className="h-4 w-4" />{primaryAction.label}</>
                        )}
                      </Button>
                    )}
                  </div>
                ) : null}

                <div className="border-t border-border/60 pt-5">
                  <p className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                    Organizado por
                  </p>
                  {creatorQuery.isPending ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                      </div>
                    </div>
                  ) : creatorQuery.data ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${activity.creatorId}`)}
                      className="flex w-full items-center gap-3 rounded-[20px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--peerly-soft-accent))]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {creatorQuery.data.profilePicURL ? (
                        <SafeRemoteImage
                          src={creatorQuery.data.profilePicURL}
                          alt={`${creatorQuery.data.name} ${creatorQuery.data.lastname}`}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-sm text-primary">
                          {creatorQuery.data.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {creatorQuery.data.name} {creatorQuery.data.lastname}
                        </p>
                        <p className="text-xs text-[color:hsl(var(--peerly-text-secondary))]">Ver perfil</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </article>
        </motion.aside>
      </div>

      {/* CTA fijo en móvil */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-4">
        {isOwner ? (
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => navigate(`/activity/${id}/edit`)}
              className="flex-1 h-12 rounded-2xl bg-[hsl(var(--peerly-primary))] text-white hover:bg-[hsl(var(--peerly-primary))]/90"
            >
              <Pencil className="h-4 w-4" />
              Editar actividad
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={deleteMutation.isPending} className="h-12 w-12 shrink-0 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15">
                  {deleteMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[28px] border-white/70 bg-background p-6 sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-2xl font-bold text-foreground">Eliminar actividad</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                    Esta accion es permanente. Se eliminara la actividad para todos los participantes y no podra recuperarse.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-full border-border/80 bg-white px-5">Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={deleteMutation.isPending} onClick={() => { void deleteMutation.mutateAsync(); }} className="h-11 rounded-full bg-destructive text-white hover:bg-destructive/90">
                    {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : !showSessionFallback && !showMembershipError && !joinedActivityIdsQuery.isPending ? (
          isJoined ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={isActionPending} className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15">
                  {leaveMutation.isPending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Saliendo...</> : <><LogOut className="h-4 w-4" />Salir de la actividad</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[28px] border-white/70 bg-background p-6 sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-2xl font-bold text-foreground">Salir de la actividad</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                    Vas a liberar tu cupo en esta actividad. Si todavia quieres participar, tendras que ingresar otra vez.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-full border-border/80 bg-white px-5">Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={leaveMutation.isPending} onClick={() => { void leaveMutation.mutateAsync(); }} className="h-11 rounded-full bg-destructive text-white hover:bg-destructive/90">
                    {leaveMutation.isPending ? 'Saliendo...' : 'Confirmar salida'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              type="button"
              disabled={primaryAction.disabled || isActionPending || !canJoin}
              onClick={() => { void joinMutation.mutateAsync(); }}
              className="w-full h-12 rounded-2xl bg-[hsl(var(--peerly-primary))] text-white hover:bg-[hsl(var(--peerly-primary))]/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {joinMutation.isPending ? (
                <><LoaderCircle className="h-4 w-4 animate-spin" />Ingresando...</>
              ) : (
                <><LogIn className="h-4 w-4" />{primaryAction.label}</>
              )}
            </Button>
          )
        ) : null}
      </div>
    </DetailShell>
  );
};

export default ActivityDetailScreen;
