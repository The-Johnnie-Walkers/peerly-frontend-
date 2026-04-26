import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, Plus, X, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { communitiesService } from '../services/connections.service';
import { interestService, type BackendInterest } from '@/features/users/services/interest.service';
import { PeerlyChip } from '@/shared/components/PeerlyChip';
import { toast } from 'sonner';

export default function CreateCommunityScreen() {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<BackendInterest[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const interests = await interestService.getAllInterests();
        setAvailableInterests(interests);
      } catch {
        toast.error('No se pudieron cargar los intereses.');
      } finally {
        setIsLoadingInterests(false);
      }
    };
    load();
  }, []);

  const toggleInterest = (name: string) => {
    setSelectedInterests(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name],
    );
  };

  const canSave = name.trim().length >= 3 && !isSaving;

  const handleSave = async () => {
    if (!userData?.id || !canSave) return;
    setIsSaving(true);
    try {
      const community = await communitiesService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        interests: selectedInterests,
        creatorId: userData.id,
      });
      setCreatedName(community.name);
      setCreatedId(community.id);
    } catch (error: any) {
      const msg = error?.message?.includes('already exists')
        ? 'Ya existe una comunidad con ese nombre.'
        : 'Error al crear la comunidad. Inténtalo de nuevo.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">

      {/* Pantalla de éxito */}
      <AnimatePresence>
        {createdName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-primary/95 flex flex-col items-center justify-center p-8 text-center text-primary-foreground"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={52} className="text-white" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-display font-extrabold mb-2">¡Comunidad creada! 🎉</h2>
            <p className="text-primary-foreground/85 mb-10 text-sm">
              <span className="font-bold">"{createdName}"</span> ya está lista. Invita a otros a unirse.
            </p>
            <div className="w-full max-w-sm space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/communities/${createdId}`)}
                className="w-full p-4 rounded-2xl bg-white text-primary font-display font-bold shadow-elevated"
              >
                Ver mi comunidad
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/communities')}
                className="w-full p-4 rounded-2xl bg-primary-foreground/10 text-primary-foreground font-display font-bold border border-primary-foreground/20"
              >
                Volver a comunidades
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Header */}
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border/60 bg-background sticky top-0 z-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/communities')}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-extrabold">Nueva comunidad</h1>
            <p className="text-xs text-muted-foreground">Crea un espacio para conectar con otros</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24 space-y-6">

          {/* Preview del icono */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-elevated">
              <Users size={40} className="text-white" />
            </div>
          </div>

          {/* Nombre */}
          <section>
            <label className="block text-sm font-display font-bold text-foreground mb-1.5">
              Nombre de la comunidad <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              placeholder="Ej: Amantes del café ☕"
              className="w-full px-4 py-3 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
            />
            <div className="flex justify-between mt-1">
              {name.trim().length > 0 && name.trim().length < 3 && (
                <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">{name.length}/60</p>
            </div>
          </section>

          {/* Descripción */}
          <section>
            <label className="block text-sm font-display font-bold text-foreground mb-1.5">
              Descripción
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="¿De qué trata esta comunidad? ¿A quién va dirigida?"
              className="w-full px-4 py-3 rounded-2xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/200</p>
          </section>

          {/* Intereses */}
          <section>
            <h2 className="text-sm font-display font-bold text-foreground mb-1.5">
              Intereses relacionados
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Ayuda a otros a encontrar tu comunidad seleccionando temas afines.
            </p>

            {/* Chips seleccionados */}
            {selectedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-primary/5 rounded-2xl border border-primary/20">
                {selectedInterests.map(interest => (
                  <span
                    key={interest}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="hover:opacity-70"
                      aria-label={`Quitar ${interest}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isLoadingInterests ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 size={16} className="animate-spin" />
                Cargando intereses...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableInterests.map(interest => (
                  <PeerlyChip
                    key={interest.id}
                    label={interest.name}
                    active={selectedInterests.includes(interest.name)}
                    onClick={() => toggleInterest(interest.name)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Botón guardar */}
          <div className="pt-2">
            <motion.button
              type="button"
              whileTap={canSave ? { scale: 0.98 } : {}}
              disabled={!canSave}
              onClick={handleSave}
              className={`w-full p-4 rounded-2xl font-display font-bold text-base transition-all flex items-center justify-center gap-2 ${
                canSave
                  ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90 cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <><Loader2 size={18} className="animate-spin" /> Creando...</>
              ) : (
                <><Plus size={18} /> Crear comunidad</>
              )}
            </motion.button>
            {!canSave && !isSaving && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                El nombre debe tener al menos 3 caracteres.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
