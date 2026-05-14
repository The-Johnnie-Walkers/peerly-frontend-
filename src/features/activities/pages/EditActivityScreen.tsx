import { type FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { activityService, type ActivityLocationPayload } from '@/features/activities/services/activity.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';

type EditActivityFormState = {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationQuery: string;
  totalPlaces: string;
};

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractTimeFromDate = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const buildLocalDateTime = (date: string, time: string) => {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatSchedulePreview = (startsAt: Date | null, endsAt: Date | null) => {
  if (!startsAt || !endsAt) return 'Completa fecha y horario';
  const formatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(startsAt)} - ${formatter.format(endsAt)}`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const, delay },
  }),
};

const EditActivityScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = authService.getCurrentUser()?.id ?? null;

  const [form, setForm] = useState<EditActivityFormState>({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    locationQuery: '',
    totalPlaces: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<ActivityLocationPayload | null>(null);
  const [locationResults, setLocationResults] = useState<ActivityLocationPayload[]>([]);
  const [locationSearched, setLocationSearched] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const activityQuery = useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      if (!id) throw new Error('Identificador de actividad no encontrado.');
      return activityService.getActivityById(id);
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!activityQuery.data || initialized) return;

    const activity = activityQuery.data;

    if (userId && activity.creatorId !== userId) {
      toast.error('Solo el creador puede editar esta actividad.');
      navigate(`/activity/${id}`);
      return;
    }

    const startsAt = activity.startsAtISO ? new Date(activity.startsAtISO) : null;
    const endsAt = activity.endsAtISO ? new Date(activity.endsAtISO) : null;

    setForm({
      name: activity.title,
      description: activity.description,
      date: startsAt ? formatDateInputValue(startsAt) : '',
      startTime: startsAt ? extractTimeFromDate(startsAt) : '',
      endTime: endsAt ? extractTimeFromDate(endsAt) : '',
      locationQuery: activity.locationPayload?.displayName || activity.location,
      totalPlaces: String(activity.maxAttendees),
    });

    if (activity.locationPayload) {
      setSelectedLocation(activity.locationPayload);
    }

    setInitialized(true);
  }, [activityQuery.data, initialized, userId, id, navigate]);

  const today = formatDateInputValue(new Date());
  const startsAt = buildLocalDateTime(form.date, form.startTime);
  const endsAt = buildLocalDateTime(form.date, form.endTime);
  const totalPlaces = Number(form.totalPlaces);

  let scheduleError = '';
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    scheduleError = 'La hora de finalizacion debe ser posterior al inicio.';
  } else if (startsAt && endsAt && endsAt.getTime() - startsAt.getTime() < 30 * 60 * 1000) {
    scheduleError = 'La duracion minima es de 30 minutos.';
  } else if (startsAt && endsAt && endsAt.getTime() - startsAt.getTime() > 12 * 60 * 60 * 1000) {
    scheduleError = 'La duracion maxima permitida es de 12 horas.';
  }

  const hasValidCapacity = form.totalPlaces.trim() !== '' && Number.isInteger(totalPlaces) && totalPlaces >= 2;
  const isFormComplete =
    form.name.trim().length >= 3 &&
    Boolean(startsAt) &&
    Boolean(endsAt) &&
    !scheduleError &&
    Boolean(selectedLocation) &&
    hasValidCapacity &&
    form.locationQuery.trim().length > 0;

  useEffect(() => {
    const query = form.locationQuery.trim();
    if (selectedLocation || query.length < 3) {
      setIsSearchingLocation(false);
      if (query.length === 0) {
        setLocationResults([]);
        setLocationSearched(false);
      }
      return;
    }
    setIsSearchingLocation(true);
    const timer = setTimeout(async () => {
      try {
        const results = await activityService.searchLocations(query);
        setLocationResults(results);
        setLocationSearched(true);
      } catch {
        toast.error('No fue posible buscar lugares.');
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.locationQuery, selectedLocation]);

  const updateActivityMutation = useMutation({
    mutationFn: async () => {
      if (!id || !startsAt || !endsAt || !selectedLocation) {
        throw new Error('Completa los datos obligatorios antes de guardar.');
      }
      return activityService.updateActivity(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: activityQuery.data?.status ?? 'OPEN',
        location: selectedLocation,
        totalPlaces,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['activities', id] }),
        queryClient.invalidateQueries({ queryKey: ['user-activities', userId] }),
        queryClient.invalidateQueries({ queryKey: ['joined-activity-ids', userId] }),
      ]);
      toast.success('La actividad se actualizo correctamente.');
      navigate(`/activity/${id}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible actualizar la actividad.';
      toast.error(message);
    },
  });

  const updateField = (field: keyof EditActivityFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'locationQuery') {
      setSelectedLocation(null);
      setLocationResults([]);
      setLocationSearched(false);
    }
  };

  const handleSelectLocation = (location: ActivityLocationPayload) => {
    setSelectedLocation(location);
    setLocationResults([]);
    setLocationSearched(false);
    setForm((current) => ({ ...current, locationQuery: location.displayName || location.address }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scheduleError) { toast.error(scheduleError); return; }
    if (!selectedLocation) { toast.error('Busca y selecciona una ubicacion de la lista.'); return; }
    if (!isFormComplete) { toast.error('Completa los campos obligatorios del formulario.'); return; }
    void updateActivityMutation.mutateAsync();
  };

  const schedulePreview = formatSchedulePreview(startsAt, endsAt);
  const activitySummary = form.name.trim() || 'Tu actividad';
  const addressSummary = selectedLocation?.displayName || form.locationQuery.trim() || 'Lugar pendiente';
  const capacitySummary = hasValidCapacity ? `${totalPlaces} cupos` : 'Cupos pendientes';

  if (activityQuery.isPending) {
    return (
      <div className="min-h-svh bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
          <Skeleton className="h-40 rounded-[32px]" />
          <Skeleton className="h-96 rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (activityQuery.isError || !activityQuery.data) {
    return (
      <div className="min-h-svh bg-background px-4 py-6">
        <div className="mx-auto max-w-[1320px] px-6 py-8">
          <p className="text-sm text-destructive">No fue posible cargar la actividad.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="min-h-svh bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
          <Skeleton className="h-40 rounded-[32px]" />
          <Skeleton className="h-96 rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-svh bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-8 pb-40 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12 xl:pb-24">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(246,236,227,0.9))] px-6 py-7 shadow-card sm:px-8"
          >
            <div className="flex items-start gap-4">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/activity/${id}`)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/90 text-foreground shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>

              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">
                  Editar actividad
                </p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))]">
                  Actualiza los datos
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                  Los cambios se aplicaran de inmediato. Los participantes ya inscritos veran la version actualizada.
                </p>
              </div>
            </div>
          </motion.header>

          <form id="edit-activity-form" onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.06} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                <div className="mb-5">
                  <h2 className="font-display text-2xl font-bold text-foreground">Actividad</h2>
                  <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                    Nombre y descripcion visibles para todos los participantes.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="activity-name">Nombre</Label>
                    <Input
                      id="activity-name"
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="Ej: Repaso de algebra en biblioteca"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-description">Descripcion (Opcional)</Label>
                    <Textarea
                      id="activity-description"
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      placeholder="Que van a hacer, para quien es y si deben llevar algo."
                      maxLength={500}
                      className="min-h-[146px]"
                    />
                    <div className="flex justify-between gap-3 text-xs text-[color:hsl(var(--peerly-text-secondary))]">
                      <span>{form.description.length}/500</span>
                    </div>
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.13} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                  <div className="mb-4">
                    <h2 className="font-display text-2xl font-bold text-foreground">Cuando sera</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="activity-date" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Fecha
                      </Label>
                      <Input
                        id="activity-date"
                        type="date"
                        min={today}
                        value={form.date}
                        onChange={(event) => updateField('date', event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity-start-time" className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Inicio
                      </Label>
                      <Input
                        id="activity-start-time"
                        type="time"
                        value={form.startTime}
                        onChange={(event) => updateField('startTime', event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity-end-time" className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Fin
                      </Label>
                      <Input
                        id="activity-end-time"
                        type="time"
                        value={form.endTime}
                        onChange={(event) => updateField('endTime', event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={`mt-4 rounded-[22px] border px-4 py-3 ${scheduleError ? 'border-destructive/20 bg-destructive/5' : 'border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30'}`}>
                    <p className="text-sm font-medium text-foreground">{scheduleError || schedulePreview}</p>
                  </div>
                </motion.section>

                <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.13} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                  <div className="mb-4">
                    <h2 className="font-display text-2xl font-bold text-foreground">Cupos</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-total-places" className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Cupos disponibles
                    </Label>
                    <Input
                      id="activity-total-places"
                      type="number"
                      min={2}
                      step={1}
                      value={form.totalPlaces}
                      onChange={(event) => updateField('totalPlaces', event.target.value)}
                      placeholder="Ej: 8"
                      required
                    />
                  </div>

                  <div className="mt-4 rounded-[22px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-4">
                    <p className="text-2xl font-display font-extrabold text-foreground">
                      {hasValidCapacity ? totalPlaces : '--'}
                    </p>
                    <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                      {hasValidCapacity ? 'Cupos listos' : 'Minimo 2 cupos'}
                    </p>
                  </div>
                </motion.section>
              </div>

              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.20} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                <div className="mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">Donde sera</h2>
                  <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                    Puedes mantener el lugar actual o buscar uno nuevo.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="activity-location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Lugar o punto de encuentro
                    </Label>

                    <div className="relative">
                      <Input
                        id="activity-location"
                        value={form.locationQuery}
                        onChange={(event) => updateField('locationQuery', event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Escape') updateField('locationQuery', ''); }}
                        placeholder="Ej: Biblioteca Virgilio Barco"
                        className="pr-9"
                        autoComplete="off"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isSearchingLocation ? (
                          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : form.locationQuery ? (
                          <button
                            type="button"
                            onClick={() => updateField('locationQuery', '')}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Limpiar búsqueda"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {locationResults.length > 0 && !selectedLocation && (
                      <div className="overflow-hidden rounded-[20px] border border-border/70 bg-background shadow-sm">
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                          {locationResults.map((location) => (
                            <button
                              key={`${location.osmType}-${location.osmId}-${location.latitude}-${location.longitude}`}
                              type="button"
                              onClick={() => handleSelectLocation(location)}
                              className="flex w-full items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors hover:bg-accent"
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold leading-5 text-foreground">
                                  {location.displayName}
                                </span>
                                <span className="mt-0.5 block truncate text-xs leading-5 text-muted-foreground">
                                  {location.address}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedLocation && form.locationQuery.trim().length > 0 && form.locationQuery.trim().length < 3 && (
                      <p className="text-xs text-muted-foreground">Escribe al menos 3 caracteres para buscar.</p>
                    )}
                  </div>

                  {selectedLocation && (
                    <div className="rounded-[22px] border border-primary/30 bg-primary/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        <p className="truncate text-sm font-medium text-foreground">{selectedLocation.displayName}</p>
                      </div>
                      <p className="mt-1 truncate pl-6 text-xs text-muted-foreground">{selectedLocation.address}</p>
                    </div>
                  )}

                  {locationSearched && locationResults.length === 0 && !isSearchingLocation && !selectedLocation && form.locationQuery.trim().length >= 3 && (
                    <div className="rounded-[22px] border border-border/70 bg-white/70 px-4 py-4 text-center">
                      <p className="text-sm font-medium text-foreground">Sin resultados</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Intenta con un nombre diferente o más específico.
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>
            </div>

            <motion.aside variants={fadeUp} initial="hidden" animate="show" custom={0.09} className="xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-card sm:p-6">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                  Resumen
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{activitySummary}</h2>
                <p className="mt-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                  Revisa los cambios antes de guardar.
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-[22px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-4">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-primary">Horario</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{schedulePreview}</p>
                  </div>

                  <div className="rounded-[22px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-4">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-primary">Lugar</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{addressSummary}</p>
                  </div>

                  <div className="rounded-[22px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-4">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-primary">Cupos</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{capacitySummary}</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isFormComplete || updateActivityMutation.isPending}
                  className="mt-5 h-12 w-full rounded-2xl bg-[hsl(var(--peerly-primary))] px-6 text-white hover:bg-[hsl(var(--peerly-primary))]/90"
                >
                  {updateActivityMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/activity/${id}`)}
                  className="mt-3 h-11 w-full rounded-2xl border-border/80 bg-white"
                >
                  Cancelar
                </Button>
              </div>
            </motion.aside>
          </form>
        </div>
      </div>
    </div>

    {/* Resumen + CTA fijo en móvil (< xl) */}
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-4">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-bold uppercase tracking-wide text-primary truncate">
            {activitySummary !== 'Tu actividad' ? activitySummary : 'Editando actividad'}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{schedulePreview}</p>
        </div>
        <span className="shrink-0 text-xs font-mono text-muted-foreground">{capacitySummary}</span>
      </div>
      <Button
        type="submit"
        form="edit-activity-form"
        disabled={!isFormComplete || updateActivityMutation.isPending}
        className="w-full h-12 rounded-2xl bg-[hsl(var(--peerly-primary))] text-white hover:bg-[hsl(var(--peerly-primary))]/90 disabled:bg-muted disabled:text-muted-foreground"
      >
        {updateActivityMutation.isPending ? (
          <><LoaderCircle className="h-4 w-4 animate-spin" />Guardando...</>
        ) : (
          'Guardar cambios'
        )}
      </Button>
    </div>
    </>
  );
};

export default EditActivityScreen;
