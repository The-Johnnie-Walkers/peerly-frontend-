import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock, Loader2, Camera, X, AlignLeft, Heart, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { DAY_LABELS, TIME_OPTIONS } from '@/shared/data/mockData';
import type { AvailabilityBlock } from '@/shared/data/mockData';
import { PeerlyChip } from '@/shared/components/PeerlyChip';
import { interestService, type BackendInterest } from '@/features/users/services/interest.service';
import { userService } from '@/features/users/services/user.service';
import { authService } from '@/features/auth/services/auth.service';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { toast } from 'sonner';
import { translateProgram } from '@/shared/utils/programTranslations';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/shared/components/ui/alert-dialog';

const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normTime = (t: string) => (t.includes('T') ? t.substring(11, 16) : t.substring(0, 5));
const blockTimeInvalid = (start: string, end: string) => normTime(start) >= normTime(end);
const MAX_BIO_LENGTH = 200;
const MAX_INTERESTS = 10;

const getPwdStrength = (pwd: string): { level: number; label: string; colorClass: string } => {
  if (!pwd) return { level: 0, label: '', colorClass: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const level = Math.min(4, score);
  const configs = [
    { label: '', colorClass: '' },
    { label: 'Muy débil', colorClass: 'bg-destructive' },
    { label: 'Débil', colorClass: 'bg-orange-400' },
    { label: 'Media', colorClass: 'bg-yellow-400' },
    { label: 'Fuerte', colorClass: 'bg-[hsl(var(--peerly-secondary))]' },
  ];
  return { level, ...configs[level] };
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const, delay },
  }),
};

export default function EditProfileScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile, userData } = useCurrentUser();
  const [bio, setBio] = useState(profile.bio);
  const [profilePicURL, setProfilePicURL] = useState(userData?.profilePicURL ?? '');
  const [semester, setSemester] = useState(userData?.semester ?? 1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // IDs de intereses seleccionados por el usuario
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>(
    userData?.interests?.map(i => i.id) ?? profile.interests
  );
  const [availableInterests, setAvailableInterests] = useState<BackendInterest[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(
    profile.availability.length > 0
      ? profile.availability.map(b => ({ ...b, id: b.id ?? generateBlockId() }))
      : [{ id: generateBlockId(), day: DAY_LABELS[0], start: '08:00', end: '10:00' }]
  );

  // Carga los intereses disponibles desde el backend
  useEffect(() => {
    const loadInterests = async () => {
      setIsLoadingInterests(true);
      try {
        const interests = await interestService.getAllInterests();
        setAvailableInterests(interests);
      } catch (error) {
        console.error('[EditProfile] Failed to load interests:', error);
      } finally {
        setIsLoadingInterests(false);
      }
    };
    loadInterests();
  }, []);

  useEffect(() => {
    setBio(profile.bio);
    setProfilePicURL(userData?.profilePicURL ?? '');
    setSemester(userData?.semester ?? 1);
    setBlocks(
      profile.availability.length > 0
        ? profile.availability.map(b => ({ ...b, id: b.id ?? generateBlockId() }))
        : [{ id: generateBlockId(), day: DAY_LABELS[0], start: '08:00', end: '10:00' }]
    );
  }, [profile.bio, profile.availability, userData?.profilePicURL, userData?.semester]);

  // Estado inicial capturado una sola vez al montar — base para detectar cambios reales
  const initial = useRef({
    bio: profile.bio,
    semester: userData?.semester ?? 1,
    profilePicURL: userData?.profilePicURL ?? '',
    interestIds: (userData?.interests?.map(i => i.id) ?? profile.interests).slice().sort().join(','),
    blocks: (profile.availability.length > 0
      ? profile.availability.map(b => ({ day: b.day, start: normTime(b.start), end: normTime(b.end) }))
      : [{ day: DAY_LABELS[0], start: '08:00', end: '10:00' }]),
  });

  const isDirty = useMemo(() => {
    const init = initial.current;
    if (bio !== init.bio) return true;
    if (semester !== init.semester) return true;
    if (profilePicURL !== init.profilePicURL) return true;
    if (selectedInterestIds.slice().sort().join(',') !== init.interestIds) return true;
    if (blocks.length !== init.blocks.length) return true;
    return blocks.some((b, i) => {
      const o = init.blocks[i];
      return !o || b.day !== o.day || normTime(b.start) !== normTime(o.start) || normTime(b.end) !== normTime(o.end);
    });
  }, [bio, semester, profilePicURL, selectedInterestIds, blocks]);

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleBack = () => {
    if (isDirty) setShowDiscardDialog(true);
    else navigate('/profile');
  };

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const toggleInterest = (id: string) => {
    setSelectedInterestIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, id];
    });
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

  // Mapeo de abreviaturas en español → nombres en inglés para el backend
  const DAY_TO_BACKEND: Record<string, string> = {
    'Lun': 'MONDAY', 'Mar': 'TUESDAY', 'Miér': 'WEDNESDAY',
    'Jue': 'THURSDAY', 'Vie': 'FRIDAY', 'Sáb': 'SATURDAY', 'Dom': 'SUNDAY',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setProfilePicURL(result);
      setShowUrlInput(false);
    };
    reader.readAsDataURL(file);
  };

  const pwdStrength = getPwdStrength(newPassword);
  const pwdMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const canChangePassword = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword && !isChangingPassword;

  const handleChangePassword = async () => {
    if (!userData?.id) return;
    setIsChangingPassword(true);
    try {
      await authService.changePassword(userData.id, currentPassword, newPassword);
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message.toLowerCase() : '';
      toast.error(
        msg.includes('incorrect') || msg.includes('wrong') || msg.includes('invalid') || msg.includes('incorrecta')
          ? 'La contraseña actual es incorrecta.'
          : 'Error al cambiar la contraseña. Inténtalo de nuevo.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!userData?.id) {
      toast.error('No se pudo identificar el usuario.');
      return;
    }
    setIsSaving(true);
    try {
      // PUT requiere todos los campos — usamos userData como base y sobreescribimos los editados
      await userService.updateUser(userData.id, {
        // Campos obligatorios del usuario actual
        username: userData.username,
        name: userData.name,
        lastname: userData.lastname,
        email: userData.email,
        semester: semester,
        status: userData.status,
        programs: userData.programs,
        role: userData.role,
        birthDate: userData.birthDate ?? '2000-01-01',
        // Campos editables
        profilePicURL: profilePicURL.trim() || undefined,
        description: bio.trim(),
        interests: selectedInterestIds,
        freeTimeSchedule: blocks
          .filter(b => b.start && b.end && b.start !== '--:--' && b.end !== '--:--')
          .map(b => {
            // b.start puede ser "HH:mm" o ya un ISO completo — normalizamos a "HH:mm"
            const normalizeTime = (t: string): string => {
              if (t.includes('T')) {
                // ISO completo → extraer HH:mm UTC
                const d = new Date(t);
                if (!isNaN(d.getTime())) {
                  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                }
                // ISO sin Z → substring
                return t.substring(11, 16);
              }
              // "HH:mm:ss" o "HH:mm"
              return t.substring(0, 5);
            };

            const startTime = normalizeTime(b.start);
            const endTime = normalizeTime(b.end);

            return {
              dayOfTheWeek: DAY_TO_BACKEND[b.day] ?? b.day,
              startsAt: new Date(`1970-01-01T${startTime}:00Z`).toISOString(),
              endsAt: new Date(`1970-01-01T${endTime}:00Z`).toISOString(),
            };
          }),
      });

      // Actualiza el contexto local
      updateProfile({
        bio: bio.trim(),
        interests: selectedInterestIds,
        availability: blocks.map(({ id, ...rest }) => rest),
      });

      toast.success('Perfil actualizado correctamente');
      navigate('/profile');
    } catch (error) {
      console.error('[EditProfile] Save error:', error);
      toast.error('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasMinimumInterests = selectedInterestIds.length >= 3;
  const hasAtLeastOneBlock = blocks.length > 0;
  const hasInvalidBlocks = blocks.some(b => blockTimeInvalid(b.start, b.end));
  const canSave = bio.trim().length > 0 && hasMinimumInterests && hasAtLeastOneBlock && !isSaving && !hasInvalidBlocks;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full px-6 sm:px-8 lg:px-10 py-4 mx-auto">

        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex-shrink-0 py-4 flex items-center gap-3 border-b border-border/60 bg-background"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Volver al perfil"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-display font-extrabold">Editar perfil</h1>
              {isDirty && <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Cambios sin guardar" />}
            </div>
            <p className="text-xs text-muted-foreground">Actualiza tu descripción, intereses y franjas disponibles</p>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto py-5 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Columna izquierda: foto + bio */}
            <div className="space-y-4">

              {/* Foto de perfil */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.06} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex items-center gap-4">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                    aria-label="Cambiar foto de perfil"
                  >
                    <SafeRemoteImage
                      src={previewUrl || profilePicURL || undefined}
                      alt="Foto de perfil"
                      fallback="pastel-icon"
                      className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-elevated"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <Camera size={18} className="text-white" />
                    </div>
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-extrabold text-base text-foreground leading-tight truncate">
                      {[userData?.name, userData?.lastname].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {translateProgram(userData?.programs?.[0] || '') || 'Estudiante'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <label htmlFor="semester-select" className="text-xs font-mono text-muted-foreground shrink-0">Semestre</label>
                      <select
                        id="semester-select"
                        value={semester}
                        onChange={e => setSemester(Number(e.target.value))}
                        className="text-xs font-mono px-2 py-1 rounded-lg bg-background border border-border outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                          <option key={s} value={s}>{s}°</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(v => !v)}
                      className="mt-2 text-xs text-primary hover:underline transition-colors"
                    >
                      {showUrlInput ? 'Cancelar URL' : 'o usar una URL'}
                    </button>
                  </div>
                </div>
                {showUrlInput && (
                  <div className="mt-3 flex gap-2 items-center">
                    <input
                      type="url"
                      value={profilePicURL.startsWith('data:') ? '' : profilePicURL}
                      onChange={e => { setProfilePicURL(e.target.value); setPreviewUrl(null); }}
                      placeholder="https://ejemplo.com/mi-foto.jpg"
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                      aria-label="URL de la foto de perfil"
                    />
                    {profilePicURL && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setProfilePicURL(''); setPreviewUrl(null); }}
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Limpiar URL"
                      >
                        <X size={16} />
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.section>

              {/* Bio */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.13} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5" aria-labelledby="label-bio">
                <h3 id="label-bio" className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <AlignLeft className="w-3.5 h-3.5 text-primary" />
                  Sobre mí
                  {!bio.trim() && (
                    <span className="ml-auto text-[10px] normal-case tracking-normal font-mono text-destructive">Requerido</span>
                  )}
                </h3>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  maxLength={MAX_BIO_LENGTH}
                  className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-body text-foreground placeholder:text-muted-foreground resize-none text-sm"
                  placeholder="Ej: Dev en progreso. Busco partners para hackathons y cafés."
                  aria-describedby="bio-hint"
                />
                <p id="bio-hint" className={`text-xs mt-1.5 font-mono text-right ${bio.length >= MAX_BIO_LENGTH ? 'text-destructive' : bio.length >= MAX_BIO_LENGTH * 0.85 ? 'text-[hsl(var(--peerly-accent-strong))]' : 'text-muted-foreground'}`}>
                  {bio.length} / {MAX_BIO_LENGTH}
                </p>
              </motion.section>

              {/* Contraseña */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.20} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5" aria-labelledby="label-password">
                <h3 id="label-password" className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Contraseña
                </h3>
                <div className="space-y-3">

                  {/* Contraseña actual */}
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Contraseña actual"
                      className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showCurrentPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Nueva contraseña */}
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Indicador de fortaleza */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${i <= pwdStrength.level ? pwdStrength.colorClass : 'bg-muted'}`}
                          />
                        ))}
                      </div>
                      {pwdStrength.label && (
                        <p className="text-xs text-muted-foreground">{pwdStrength.label}</p>
                      )}
                    </div>
                  )}

                  {/* Confirmar nueva contraseña */}
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar nueva contraseña"
                      className={`w-full px-4 py-2.5 pr-11 rounded-2xl bg-background border text-sm outline-none focus:ring-2 transition-colors placeholder:text-muted-foreground ${
                        !pwdMatch && confirmPassword.length > 0
                          ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                          : 'border-border focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!pwdMatch && confirmPassword.length > 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertTriangle size={11} /> Las contraseñas no coinciden.
                    </p>
                  )}

                  <motion.button
                    type="button"
                    whileTap={canChangePassword ? { scale: 0.98 } : {}}
                    disabled={!canChangePassword}
                    onClick={handleChangePassword}
                    className={`w-full py-3 rounded-2xl font-display font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      canChangePassword
                        ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                    aria-disabled={!canChangePassword}
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Cambiando...
                      </span>
                    ) : 'Cambiar contraseña'}
                  </motion.button>
                </div>
              </motion.section>

            </div>

            {/* Columna derecha: intereses + disponibilidad */}
            <div className="space-y-4">
              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.06} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5" aria-labelledby="label-interests">
                <h3 id="label-interests" className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <Heart className="w-3.5 h-3.5 text-primary" />
                  Intereses
                  <span className={`ml-auto text-[10px] normal-case tracking-normal font-mono ${
                    selectedInterestIds.length >= MAX_INTERESTS ? 'text-destructive' :
                    selectedInterestIds.length >= 3 ? 'text-primary' :
                    selectedInterestIds.length > 0 ? 'text-[hsl(var(--peerly-accent-strong))]' :
                    'text-muted-foreground'
                  }`}>
                    {selectedInterestIds.length} / {MAX_INTERESTS}
                    {selectedInterestIds.length < 3 && ' · mín. 3'}
                  </span>
                </h3>
                {isLoadingInterests ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando intereses...
                  </div>
                ) : availableInterests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay intereses disponibles en este momento.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map(interest => (
                      <PeerlyChip
                        key={interest.id}
                        label={interest.name}
                        active={selectedInterestIds.includes(interest.id)}
                        onClick={() => toggleInterest(interest.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section variants={fadeUp} initial="hidden" animate="show" custom={0.13} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5" aria-labelledby="label-availability">
                <h3 id="label-availability" className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Disponibilidad
                </h3>
                <ul className="space-y-3 list-none p-0 m-0">
                  {blocks.map(block => (
                    <li key={block.id} className={`rounded-2xl bg-background border p-3 transition-colors ${blockTimeInvalid(block.start, block.end) ? 'border-destructive/60 bg-destructive/5' : 'border-border'}`}>
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide px-1">Día</span>
                          <select
                            value={block.day}
                            onChange={e => updateBlock(block.id!, 'day', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            aria-label="Día"
                          >
                            {DAY_LABELS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide px-1">Desde</span>
                          <select
                            value={block.start}
                            onChange={e => updateBlock(block.id!, 'start', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            aria-label="Hora inicio"
                          >
                            {TIME_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide px-1">Hasta</span>
                          <select
                            value={block.end}
                            onChange={e => updateBlock(block.id!, 'end', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            aria-label="Hora fin"
                          >
                            {TIME_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeBlock(block.id!)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-0.5"
                          aria-label="Quitar franja"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                      {blockTimeInvalid(block.start, block.end) && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                          <AlertTriangle size={11} /> La hora de fin debe ser posterior al inicio.
                        </p>
                      )}
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
              </motion.section>
            </div>
          </div>
        </div>

        {/* Barra de guardar — siempre visible */}
        <div className="flex-shrink-0 pb-6 pt-3 border-t border-border/60 bg-background/95 backdrop-blur-sm">
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
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Guardando...
              </span>
            ) : 'Guardar cambios'}
          </motion.button>
          {!canSave && !isSaving && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {!bio.trim()
                ? 'Escribe una descripción para continuar.'
                : !hasMinimumInterests
                  ? `Selecciona al menos 3 intereses (${selectedInterestIds.length}/3).`
                  : hasInvalidBlocks
                    ? 'Corrige las franjas horarias inválidas.'
                    : 'Añade al menos una franja de disponibilidad.'}
            </p>
          )}
        </div>

      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-extrabold">¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora los perderás.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
              Seguir editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowDiscardDialog(false); navigate('/profile'); }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
