import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Image, Calendar } from 'lucide-react';
import { CATEGORY_LABELS } from '@/data/mockData';

const CreateActivityScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    description: '',
    visibility: 'all',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isValid = Boolean(form.title && form.category && form.date && form.time && form.location);

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        {/* Header — consistencia con otras pantallas */}
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border/60 bg-background">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-extrabold">Crear actividad</h1>
            <p className="text-xs text-muted-foreground">Completa los datos para publicar</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-8">
          {/* Portada — agrupación visual */}
          <section className="mb-6" aria-labelledby="label-cover">
            <label id="label-cover" className="sr-only">
              Foto de portada
            </label>
            <motion.div
              whileTap={{ scale: 0.99 }}
              className="h-36 bg-muted/50 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-muted/70 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              tabIndex={0}
              role="button"
              onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
            >
              <Image size={28} className="text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium text-muted-foreground">Agregar foto de portada</span>
            </motion.div>
          </section>

          {/* Título y categoría — Nielsen: labels visibles, no solo placeholder */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="activity-title" className="block text-sm font-display font-bold text-foreground mb-1.5">
                Nombre de la actividad <span className="text-destructive">*</span>
              </label>
              <input
                id="activity-title"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground"
                placeholder="Ej: Café para estudiar cálculo"
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="activity-category" className="block text-sm font-display font-bold text-foreground mb-1.5">
                Categoría <span className="text-destructive">*</span>
              </label>
              <select
                id="activity-category"
                value={form.category}
                onChange={e => updateField('category', e.target.value)}
                className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground appearance-none cursor-pointer"
                aria-required="true"
              >
                <option value="">Elige una categoría</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha y hora — agrupación (Ley de proximidad) */}
          <section className="mb-6" aria-labelledby="label-datetime">
            <h2 id="label-datetime" className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              Fecha y hora
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="activity-date" className="sr-only">Fecha</label>
                <input
                  id="activity-date"
                  type="date"
                  value={form.date}
                  onChange={e => updateField('date', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="activity-time" className="sr-only">Hora</label>
                <input
                  id="activity-time"
                  type="time"
                  value={form.time}
                  onChange={e => updateField('time', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground"
                  aria-required="true"
                />
              </div>
            </div>
          </section>

          {/* Ubicación y aforo */}
          <section className="mb-6" aria-labelledby="label-place">
            <h2 id="label-place" className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" />
              Lugar y aforo
            </h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="activity-location" className="sr-only">Ubicación</label>
                <input
                  id="activity-location"
                  value={form.location}
                  onChange={e => updateField('location', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground"
                  placeholder="Ubicación en el campus"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="activity-max" className="block text-sm font-medium text-muted-foreground mb-1">
                  Máximo de asistentes
                </label>
                <input
                  id="activity-max"
                  type="number"
                  min={1}
                  max={99}
                  value={form.maxAttendees}
                  onChange={e => updateField('maxAttendees', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: 10"
                />
              </div>
            </div>
          </section>

          {/* Descripción */}
          <div className="mb-6">
            <label htmlFor="activity-desc" className="block text-sm font-display font-bold text-foreground mb-1.5">
              Descripción
            </label>
            <textarea
              id="activity-desc"
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
              className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="Describe tu actividad..."
              aria-describedby="desc-hint"
            />
            <p id="desc-hint" className="text-xs text-muted-foreground mt-1">Opcional. Ayuda a que más gente se anime.</p>
          </div>

          {/* Visibilidad — opciones claras (Hick: pocas opciones) */}
          <fieldset className="mb-8">
            <legend className="block text-sm font-display font-bold text-foreground mb-2">
              Quién puede verla
            </legend>
            <div className="flex gap-3">
              {[
                { value: 'all', label: 'Todo el campus' },
                { value: 'connections', label: 'Solo conexiones' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={form.visibility === opt.value}
                    onChange={() => updateField('visibility', opt.value)}
                    className="sr-only peer"
                  />
                  <span className="block p-3 rounded-2xl border text-sm font-medium text-center transition-all peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground border-border hover:bg-accent/50">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* CTA en flujo — no superpuesto; espacio para bottom nav */}
          <div className="pt-4 pb-24 md:pb-8">
            <motion.button
              type="button"
              whileTap={isValid ? { scale: 0.98 } : {}}
              disabled={!isValid}
              onClick={() => isValid && navigate('/home')}
              className={`w-full p-4 rounded-2xl font-display font-bold text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isValid
                  ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90 cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              aria-disabled={!isValid}
            >
              Publicar actividad 🚀
            </motion.button>
            {!isValid && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Completa título, categoría, fecha, hora y ubicación para publicar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateActivityScreen;
