import { type FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { activityService, type ActivityLocationPayload } from '@/features/activities/services/activity.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

type CreateActivityFormState = {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationQuery: string;
  totalPlaces: string;
};

const INITIAL_FORM: CreateActivityFormState = {
  name: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  locationQuery: '',
  totalPlaces: '',
};

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const buildLocalDateTime = (date: string, time: string) => {
  if (!date || !time) return null;

  const parsedDate = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

const CreateActivityScreen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requesterUserId = authService.getCurrentUser()?.id ?? null;

  const [form, setForm] = useState<CreateActivityFormState>(INITIAL_FORM);
  const [selectedLocation, setSelectedLocation] = useState<ActivityLocationPayload | null>(null);
  const [locationResults, setLocationResults] = useState<ActivityLocationPayload[]>([]);
  const [locationSearched, setLocationSearched] = useState(false);

  const today = formatDateInputValue(new Date());
  const startsAt = buildLocalDateTime(form.date, form.startTime);
  const endsAt = buildLocalDateTime(form.date, form.endTime);
  const totalPlaces = Number(form.totalPlaces);

  let scheduleError = '';
  if (startsAt && startsAt.getTime() <= Date.now()) {
    scheduleError = 'La actividad debe iniciar en el futuro.';
  } else if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    scheduleError = 'La hora de finalizacion debe ser posterior al inicio.';
  } else if (startsAt && endsAt && endsAt.getTime() - startsAt.getTime() < 30 * 60 * 1000) {
    scheduleError = 'La duracion minima es de 30 minutos.';
  } else if (startsAt && endsAt && endsAt.getTime() - startsAt.getTime() > 12 * 60 * 60 * 1000) {
    scheduleError = 'La duracion maxima permitida es de 12 horas.';
  }

  const hasValidCapacity = form.totalPlaces.trim() !== '' && Number.isInteger(totalPlaces) && totalPlaces >= 2;
  const isFormComplete =
    Boolean(requesterUserId) &&
    form.name.trim().length >= 3 &&
    Boolean(startsAt) &&
    Boolean(endsAt) &&
    !scheduleError &&
    Boolean(selectedLocation) &&
    hasValidCapacity &&
    form.locationQuery.trim().length > 0;

  const searchLocationMutation = useMutation({
    mutationFn: async () => {
      const query = form.locationQuery.trim();
      if (query.length < 3) {
        throw new Error('Escribe al menos 3 caracteres para buscar el lugar.');
      }

      return activityService.searchLocations(query);
    },
    onSuccess: (locations) => {
      setLocationResults(locations);
      setLocationSearched(true);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible buscar lugares.';
      toast.error(message);
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async () => {
      if (!requesterUserId || !startsAt || !endsAt || !selectedLocation) {
        throw new Error('Completa los datos obligatorios antes de publicar.');
      }

      return activityService.createActivity({
        requesterUserId,
        name: form.name.trim(),
        description: form.description.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: 'OPEN',
        totalPlaces,
        location: selectedLocation,
      });
    },
    onSuccess: async (response) => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: ['activities'] })];

      if (requesterUserId) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: ['user-activities', requesterUserId] }),
          queryClient.invalidateQueries({ queryKey: ['joined-activity-ids', requesterUserId] }),
        );
      }

      await Promise.all(invalidations);
      toast.success('La actividad se publico correctamente.');
      navigate(`/activity/${response.activityId}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No fue posible crear la actividad.';
      toast.error(message);
    },
  });

  const updateField = (field: keyof CreateActivityFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (field === 'locationQuery') {
      setSelectedLocation(null);
      setLocationResults([]);
      setLocationSearched(false);
    }
  };

  const handleSearchLocation = () => {
    void searchLocationMutation.mutateAsync();
  };

  const handleSelectLocation = (location: ActivityLocationPayload) => {
    setSelectedLocation(location);
    setForm((current) => ({
      ...current,
      locationQuery: location.displayName || location.address,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!requesterUserId) {
      toast.error('Necesitas una sesion activa para crear actividades.');
      return;
    }

    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    if (!selectedLocation) {
      toast.error('Busca y selecciona una ubicacion de la lista.');
      return;
    }

    if (!isFormComplete) {
      toast.error('Completa los campos obligatorios del formulario.');
      return;
    }

    void createActivityMutation.mutateAsync();
  };

  const locationStatus = selectedLocation ? 'Ubicacion seleccionada' : 'Ubicacion pendiente';
  const schedulePreview = formatSchedulePreview(startsAt, endsAt);
  const activitySummary = form.name.trim() || 'Tu actividad';
  const addressSummary = selectedLocation?.displayName || form.locationQuery.trim() || 'Lugar pendiente';
  const capacitySummary = hasValidCapacity ? `${totalPlaces} cupos` : 'Cupos pendientes';

  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
          <header className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(246,236,227,0.9))] px-6 py-7 shadow-card sm:px-8">
            <div className="flex items-start gap-4">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(-1)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/90 text-foreground shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>

              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">
                  Crear actividad
                </p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))]">
                  Cuéntanos lo esencial
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                  Nombre, horario, lugar y cupos. Lo tecnico se completa en segundo plano o solo cuando haga falta.
                </p>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                <div className="mb-5">
                  <h2 className="font-display text-2xl font-bold text-foreground">Actividad</h2>
                  <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                    Usa un nombre claro y una descripcion corta para que se entienda rapido.
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
                    <p className="text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                      Es lo primero que vera la gente cuando explore actividades.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-description">Descripcion</Label>
                    <Textarea
                      id="activity-description"
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      placeholder="Que van a hacer, para quien es y si deben llevar algo."
                      maxLength={500}
                      className="min-h-[146px]"
                    />
                    <div className="flex justify-between gap-3 text-xs text-[color:hsl(var(--peerly-text-secondary))]">
                      <span>Opcional, pero ayuda a que la gente entienda el plan.</span>
                      <span>{form.description.length}/500</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                  <div className="mb-4">
                    <h2 className="font-display text-2xl font-bold text-foreground">Cuando sera</h2>
                    <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                      Elige una fecha y un horario simple en el mismo dia.
                    </p>
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
                </section>

                <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                  <div className="mb-4">
                    <h2 className="font-display text-2xl font-bold text-foreground">Cupos</h2>
                    <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                      Define cuantas personas pueden unirse.
                    </p>
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
                      {hasValidCapacity ? 'Cupos listos para publicar' : 'Minimo 2 cupos'}
                    </p>
                  </div>
                </section>
              </div>

              <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-card sm:p-6">
                <div className="mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">Donde sera</h2>
                  <p className="mt-1 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                    Escribe el nombre del lugar y elige una opcion real para guardar la ubicacion exacta.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="space-y-2">
                      <Label htmlFor="activity-location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Lugar o punto de encuentro
                      </Label>
                      <Input
                        id="activity-location"
                        value={form.locationQuery}
                        onChange={(event) => updateField('locationQuery', event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleSearchLocation();
                          }
                        }}
                        placeholder="Ej: Biblioteca Virgilio Barco"
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearchLocation}
                      disabled={searchLocationMutation.isPending}
                      className="mt-0 h-11 self-end rounded-full border-border/80 bg-white px-4 lg:mt-4"
                    >
                      {searchLocationMutation.isPending ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-[22px] border border-border/70 bg-[hsl(var(--peerly-soft-accent))]/30 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{locationStatus}</p>
                    <p className="mt-1 text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                      {selectedLocation
                        ? selectedLocation.displayName
                        : 'Elige una opcion para completar coordenadas e identificadores OSM.'}
                    </p>
                  </div>

                  {locationSearched && locationResults.length === 0 && !searchLocationMutation.isPending ? (
                    <div className="rounded-[22px] border border-border/70 bg-white/70 px-4 py-4 text-center">
                      <p className="text-sm font-medium text-foreground">Sin resultados</p>
                      <p className="mt-1 text-xs text-[color:hsl(var(--peerly-text-secondary))]">
                        Intenta con un nombre diferente o más específico.
                      </p>
                    </div>
                  ) : locationResults.length > 0 ? (
                    <div className="grid gap-3">
                      {locationResults.map((location) => {
                        const isSelected =
                          selectedLocation?.osmId === location.osmId &&
                          selectedLocation?.osmType === location.osmType;

                        return (
                          <button
                            key={`${location.osmType}-${location.osmId}-${location.latitude}-${location.longitude}`}
                            type="button"
                            onClick={() => handleSelectLocation(location)}
                            className={`flex min-h-[76px] w-full items-start gap-3 rounded-[20px] border px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border/70 bg-background/70 hover:border-primary/30 hover:bg-white'
                            }`}
                          >
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                              {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-5 text-foreground">
                                {location.displayName}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                                {location.address}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-card sm:p-6">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
                  Resumen
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{activitySummary}</h2>
                <p className="mt-2 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))]">
                  Revisa rapido lo esencial antes de publicar.
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
                  disabled={!isFormComplete || createActivityMutation.isPending}
                  className="mt-5 h-12 w-full rounded-2xl bg-[hsl(var(--peerly-primary))] px-6 text-white hover:bg-[hsl(var(--peerly-primary))]/90"
                >
                  {createActivityMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar actividad'
                  )}
                </Button>

                {!isFormComplete ? (
                  <p className="mt-3 text-xs leading-5 text-[color:hsl(var(--peerly-text-secondary))]">
                    Completa nombre, horario, lugar, ubicacion y al menos 2 cupos para continuar.
                  </p>
                ) : null}
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateActivityScreen;
