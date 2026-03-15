import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { INTERESTS, DAY_LABELS, TIME_OPTIONS } from '@/data/mockData';
import type { AvailabilityBlock } from '@/data/mockData';
import { PeerlyChip } from '@/components/peerly/PeerlyChip';

const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function EditProfileScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useCurrentUser();
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(
    profile.availability.length > 0
      ? profile.availability.map(b => ({ ...b, id: b.id ?? generateBlockId() }))
      : [{ id: generateBlockId(), day: DAY_LABELS[0], start: '08:00', end: '10:00' }]
  );

  useEffect(() => {
    setBio(profile.bio);
    setInterests(profile.interests);
    setBlocks(
      profile.availability.length > 0
        ? profile.availability.map(b => ({ ...b, id: b.id ?? generateBlockId() }))
        : [{ id: generateBlockId(), day: DAY_LABELS[0], start: '08:00', end: '10:00' }]
    );
  }, [profile.bio, profile.interests, profile.availability]);

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addBlock = () => {
    const startIndex = TIME_OPTIONS.indexOf('08:00');
    const endIndex = Math.min(startIndex + 2, TIME_OPTIONS.length - 1);
    setBlocks(prev => [
      ...prev,
      {
        id: generateBlockId(),
        day: DAY_LABELS[0],
        start: TIME_OPTIONS[startIndex],
        end: TIME_OPTIONS[endIndex],
      },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, field: keyof AvailabilityBlock, value: string) => {
    setBlocks(prev =>
      prev.map(b => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleSave = () => {
    updateProfile({
      bio: bio.trim(),
      interests,
      availability: blocks.map(({ id, ...rest }) => rest),
    });
    navigate('/profile');
  };

  const hasMinimumInterests = interests.length >= 3;
  const hasAtLeastOneBlock = blocks.length > 0;
  const canSave = bio.trim().length > 0 && hasMinimumInterests && hasAtLeastOneBlock;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border/60 bg-background">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Volver al perfil"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-extrabold">Editar perfil</h1>
            <p className="text-xs text-muted-foreground">Actualiza tu descripción, intereses y franjas disponibles</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-24">
          {/* Descripción — Nielsen: label visible, reconocimiento */}
          <section className="mb-6" aria-labelledby="label-bio">
            <label id="label-bio" className="block text-sm font-display font-bold text-foreground mb-1.5">
              Descripción del perfil
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Cuéntales a los demás en qué andas o qué buscas (estudio, café, planes).
            </p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="Ej: Dev en progreso. Busco partners para hackathons y cafés."
              aria-describedby="bio-hint"
            />
            <p id="bio-hint" className="text-xs text-muted-foreground mt-1">{bio.length} caracteres</p>
          </section>

          {/* Intereses — mínimo 3 (prevención de errores) */}
          <section className="mb-6" aria-labelledby="label-interests">
            <h2 id="label-interests" className="block text-sm font-display font-bold text-foreground mb-1.5">
              Intereses
            </h2>
            <p className="text-xs text-muted-foreground mb-2">
              Selecciona al menos 3. Así te encontrarán compañeros con gustos parecidos.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <PeerlyChip
                  key={interest.id}
                  label={interest.label}
                  iconName={interest.icon}
                  active={interests.includes(interest.id)}
                  onClick={() => toggleInterest(interest.id)}
                />
              ))}
            </div>
            <p className={`text-xs mt-1.5 font-mono ${hasMinimumInterests ? 'text-success' : 'text-muted-foreground'}`}>
              {interests.length}/3 mínimo seleccionados
            </p>
          </section>

          {/* Disponibilidad por bloques — Ley de proximidad, feedback */}
          <section className="mb-8" aria-labelledby="label-availability">
            <h2 id="label-availability" className="block text-sm font-display font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              Franjas disponibles
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Añade bloques de tiempo en los que sueles estar libre (sin clase o para estudiar/conectar). Ej: Lun 08:00–10:00.
            </p>

            <ul className="space-y-3 list-none p-0 m-0">
              {blocks.map(block => (
                <li
                  key={block.id}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-card border border-border"
                >
                  <select
                    value={block.day}
                    onChange={e => updateBlock(block.id!, 'day', e.target.value)}
                    className="flex-1 min-w-[4rem] px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    aria-label="Día"
                  >
                    {DAY_LABELS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground text-sm">de</span>
                  <select
                    value={block.start}
                    onChange={e => updateBlock(block.id!, 'start', e.target.value)}
                    className="flex-1 min-w-[4.5rem] px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    aria-label="Hora inicio"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground text-sm">a</span>
                  <select
                    value={block.end}
                    onChange={e => updateBlock(block.id!, 'end', e.target.value)}
                    className="flex-1 min-w-[4.5rem] px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    aria-label="Hora fin"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeBlock(block.id!)}
                    className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Quitar franja"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={addBlock}
              className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus size={18} /> Añadir franja
            </motion.button>
            {!hasAtLeastOneBlock && (
              <p className="text-xs text-destructive mt-1.5">Añade al menos una franja disponible.</p>
            )}
          </section>

          <div className="pt-4">
            <motion.button
              type="button"
              whileTap={canSave ? { scale: 0.98 } : {}}
              disabled={!canSave}
              onClick={handleSave}
              className={`w-full p-4 rounded-2xl font-display font-bold text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                canSave
                  ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90 cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              aria-disabled={!canSave}
            >
              Guardar cambios
            </motion.button>
            {!canSave && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Completa descripción, al menos 3 intereses y una franja disponible.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
