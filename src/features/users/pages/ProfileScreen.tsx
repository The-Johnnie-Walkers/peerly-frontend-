import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Loader2, UserCheck, UserX, Clock, BookOpen, Heart, AlignLeft, MessageCircle } from 'lucide-react';
import { userService } from '@/features/users/services/user.service';
import { activityService } from '@/features/activities/services/activity.service';
import type { BackendInterest } from '@/features/users/services/interest.service';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { PeerlyChip } from '@/shared/components/PeerlyChip';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { connectionsService } from '@/features/connections/services/connections.service';
import { ConnectionStatus } from '@/features/connections/types';
import { useCreateConnection, useUpdateConnection } from '@/features/connections/hooks/useConnections';
import { ReportButton } from '@/features/reports/components/ReportButton';
import { translateProgram } from '@/shared/utils/programTranslations';

type ProfileStudent = {
  id: string;
  name: string;
  photo: string;
  career: string;
  semester: number;
  interests: BackendInterest[];
  bio: string;
  availability: { day: string; start: string; end: string }[];
  isOnline: boolean;
};

const DAY_TRANSLATIONS: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Miér',
  THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
};
const translateDay = (day: string) => DAY_TRANSLATIONS[day?.toUpperCase()] ?? day;

const parseTime = (raw: string | undefined): string => {
  if (!raw) return '--:--';
  if (raw.includes('T')) {
    if (raw.endsWith('Z') || raw.includes('+')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime()))
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
    return raw.substring(11, 16);
  }
  return raw.substring(0, 5);
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const, delay },
  }),
};

const ProfileScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromConnect = searchParams.get('from') === 'connect';
  const fromRequest = searchParams.get('from') === 'request';
  const connectionId = searchParams.get('connectionId');
  const { userData: currentAuthUser, isLoading: isContextLoading } = useCurrentUser();
  const [student, setStudent] = useState<ProfileStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isPendingConnection, setIsPendingConnection] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [connectionCount, setConnectionCount] = useState<number | null>(null);
  const [activityCount, setActivityCount] = useState<number | null>(null);
  const [connectionSent, setConnectionSent] = useState(false);
  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();
  const isOwnProfile = !id || id === currentAuthUser?.id;

  useEffect(() => {
    if (!id && isContextLoading) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const userId = id || currentAuthUser?.id || localStorage.getItem('user_id');
        if (!userId) { setIsLoading(false); return; }
        const data = await userService.getUserById(userId);
        if (data) {
          const fullName = data.lastname && data.lastname !== data.name && data.lastname !== data.username
            ? `${data.name} ${data.lastname}` : data.name;
          setStudent({
            id: data.id,
            name: fullName,
            photo: data.profilePicURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
            career: translateProgram(data.programs?.[0] || '') || 'Estudiante',
            semester: data.semester,
            interests: data.interests ?? [],
            bio: data.description || '',
            availability: data.freeTimeSchedule?.map(f => ({
              day: translateDay(f.dayOfTheWeek),
              start: parseTime(f.startsAt),
              end: parseTime(f.endsAt),
            })) || [],
            isOnline: data.isOnline ?? false,
          });
        }
      } catch (error) {
        console.error('[ProfileScreen] Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id, currentAuthUser?.id, isContextLoading, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile || !id || !currentAuthUser?.id) return;
    userService.getCompatibility(currentAuthUser.id, id)
      .then(score => setCompatibilityScore(score))
      .catch(() => setCompatibilityScore(null));
  }, [id, currentAuthUser?.id, isOwnProfile]);

  useEffect(() => {
    const profileUserId = id || currentAuthUser?.id;
    if (!profileUserId) return;
    connectionsService.findAll(profileUserId, ConnectionStatus.ACCEPTED)
      .then(conns => setConnectionCount(conns.length))
      .catch(() => setConnectionCount(0));
    activityService.getJoinedActivityIdsByUserId(profileUserId)
      .then(ids => setActivityCount(ids.length))
      .catch(() => setActivityCount(0));
  }, [id, currentAuthUser?.id]);

  useEffect(() => {
    if (isOwnProfile || !id || !currentAuthUser?.id || fromRequest) return;
    connectionsService.findAll(currentAuthUser.id).then(connections => {
      const match = connections.find(c => c.requesterId === id || c.receiverId === id);
      if (match) {
        setIsConnected(match.status === ConnectionStatus.ACCEPTED);
        setIsPendingConnection(match.status === ConnectionStatus.PENDING);
      }
    }).catch(() => { });
  }, [id, currentAuthUser?.id, isOwnProfile, fromRequest]);

  if (isContextLoading || isLoading) {
    return (
      <div className="h-svh flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="h-svh flex items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Usuario no encontrado</p>
        <button onClick={() => navigate(-1)} className="text-primary font-bold">Volver</button>
      </div>
    );
  }

  const myInterestIds = currentAuthUser?.interests?.map(i => i.id) || [];
  const sharedInterestIds = !isOwnProfile
    ? student.interests.filter(i => myInterestIds.includes(i.id)).map(i => i.id)
    : [];

  const profileCompletion = (() => {
    let score = 0;
    if (student.photo && !student.photo.includes('ui-avatars')) score += 25;
    if (student.bio.trim().length > 0) score += 25;
    if (student.interests.length >= 3) score += 25;
    if (student.availability.length > 0) score += 25;
    return score;
  })();

  const stats = [
    { value: connectionCount, label: 'Conexiones' },
    { value: activityCount, label: 'Actividades' },
    isOwnProfile
      ? { value: `${profileCompletion}%`, label: 'Perfil' }
      : { value: compatibilityScore !== null ? `${compatibilityScore}%` : null, label: 'Compat.' },
  ];

  const CTAButtons = ({ stacked = false }: { stacked?: boolean }) => (
    <div className={`flex gap-3 ${stacked ? 'flex-col' : 'justify-center'}`}>
      {isConnected && !isPendingConnection ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/chats')}
          className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={17} /> Mensaje
        </motion.button>
      ) : isConnected && isPendingConnection ? (
        <div className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-display font-bold flex items-center justify-center">
          Solicitud enviada
        </div>
      ) : fromRequest && connectionId ? (
        <>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={updateConnection.isPending}
            onClick={() => {
              if (!currentAuthUser?.id) return;
              updateConnection.mutate(
                { id: connectionId, data: { status: ConnectionStatus.ACCEPTED, actorId: currentAuthUser.id } },
                { onSuccess: () => navigate('/social') },
              );
            }}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {updateConnection.isPending ? <Loader2 size={17} className="animate-spin" /> : <><UserCheck size={17} /> Aceptar</>}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={updateConnection.isPending}
            onClick={() => {
              if (!currentAuthUser?.id) return;
              updateConnection.mutate(
                { id: connectionId, data: { status: ConnectionStatus.REJECTED, actorId: currentAuthUser.id } },
                { onSuccess: () => navigate('/social') },
              );
            }}
            className="flex-1 h-12 rounded-2xl bg-card border-2 border-destructive text-destructive font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {updateConnection.isPending ? <Loader2 size={17} className="animate-spin" /> : <><UserX size={17} /> Rechazar</>}
          </motion.button>
        </>
      ) : fromConnect ? (
        <>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={connectionSent || isPendingConnection || createConnection.isPending}
            onClick={() => {
              if (!currentAuthUser?.id || !id) return;
              createConnection.mutate(
                { requesterId: currentAuthUser.id, receiverId: id },
                { onSuccess: () => setConnectionSent(true) },
              );
            }}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {createConnection.isPending ? <Loader2 size={17} className="animate-spin" />
              : connectionSent || isPendingConnection ? 'Solicitud enviada' : 'Conectar'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} className="flex-1 h-12 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold flex items-center justify-center hover:bg-primary/5 transition-colors">
            Proponer plan
          </motion.button>
        </>
      ) : (
        <>
          <motion.button
            whileTap={isPendingConnection ? {} : { scale: 0.97 }}
            disabled={isPendingConnection}
            onClick={() => !isPendingConnection && navigate('/chats')}
            className={`flex-1 h-12 rounded-2xl font-display font-bold flex items-center justify-center gap-2 ${isPendingConnection
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:opacity-90 transition-opacity'
              }`}
          >
            {isPendingConnection ? 'Solicitud enviada' : <><MessageCircle size={17} /> Mensaje</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} className="flex-1 h-12 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold flex items-center justify-center hover:bg-primary/5 transition-colors">
            Proponer plan
          </motion.button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full mx-auto relative max-w-[1440px]">

        {/* Topbar sobre el cover */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-8">
          {!isOwnProfile ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2.5 bg-black/25 backdrop-blur-sm text-white rounded-xl"
              aria-label="Volver"
            >
              <ArrowLeft size={18} />
            </motion.button>
          ) : <div />}
          {isOwnProfile ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile/edit')}
              className="p-2.5 bg-black/25 backdrop-blur-sm text-white rounded-xl hover:bg-black/40 transition-colors flex items-center justify-center"
              aria-label="Editar perfil"
            >
              <Edit3 size={18} />
            </motion.button>
          ) : (
            <ReportButton userId={student.id} userName={student.name} userPhoto={student.photo} />
          )}
        </header>

        <div className={`flex-1 overflow-y-auto md:pb-10 ${isOwnProfile ? 'pb-6' : 'pb-28'}`}>

          {/* Cover + avatar centrado */}
          <div className="relative">
            <div className="h-44 md:h-28 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--peerly-primary))] via-[hsl(var(--peerly-primary-dark))] to-[hsl(var(--peerly-secondary))]" />
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>
            {/* Avatar siempre centrado */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative"
              >
                <div className="rounded-full p-1 bg-background shadow-elevated items-center justify-center flex">
                  <SafeRemoteImage
                    src={student.photo}
                    alt={student.name}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover"
                  />
                </div>
                {student.isOnline && (
                  <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-[hsl(var(--peerly-secondary))] border-2 border-background" />
                )}
              </motion.div>
            </div>
          </div>

          {/* Nombre e info — centrado */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.12} className="pt-20 px-6 sm:px-8 lg:px-10 text-center">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              {student.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              {student.career} · {student.semester}° semestre
            </p>
          </motion.div>

          {/* Stats — fila simétrica de 3 */}
          <div className="px-6 sm:px-8 lg:px-10 mt-5">
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={0.21 + i * 0.07}
                  className="rounded-2xl bg-card border border-border/60 shadow-sm py-4 flex flex-col items-center gap-1"
                >
                  <span className="font-display font-extrabold text-xl text-foreground">
                    {value !== null && value !== undefined
                      ? value
                      : <Loader2 size={16} className="animate-spin text-muted-foreground" />}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Secciones — una columna en mobile, dos iguales en desktop */}
          <div className="px-6 sm:px-8 lg:px-10 mt-5 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Columna izquierda: bio + intereses */}
            <div className="space-y-4">
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.38} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <AlignLeft className="w-3.5 h-3.5 text-primary" />
                  Sobre mí
                </h3>
                {student.bio.trim() ? (
                  <p className="text-sm text-foreground leading-relaxed">{student.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {isOwnProfile ? 'Aún no has escrito una descripción. ¡Edita tu perfil!' : 'Sin descripción aún.'}
                  </p>
                )}
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.45} className="rounded-2xl bg-card border border-border/60 shadow-sm p-5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <Heart className="w-3.5 h-3.5 text-primary" />
                  {isOwnProfile ? 'Tus intereses' : 'Intereses'}
                  {!isOwnProfile && sharedInterestIds.length > 0 && (
                    <span className="ml-auto text-[10px] font-mono text-primary normal-case tracking-normal">
                      {sharedInterestIds.length} en común
                    </span>
                  )}
                </h3>
                {student.interests.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {isOwnProfile ? 'Añade intereses desde Editar perfil.' : 'Sin intereses definidos.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {student.interests.map(interest => (
                      <PeerlyChip
                        key={interest.id}
                        label={interest.name}
                        active={!isOwnProfile && sharedInterestIds.includes(interest.id)}
                        onClick={() => { }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Columna derecha: disponibilidad */}
            <div className="space-y-2">
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.38} className="rounded-2xl bg-card border border-border/60 shadow-sm p-6">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Disponibilidad
                </h3>
                {student.availability.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {isOwnProfile ? 'Añade franjas desde Editar perfil.' : 'Sin franjas definidas.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {student.availability.map((block, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent border border-border text-xs font-mono font-medium text-foreground"
                      >
                        <span className="font-bold text-primary">{block.day}</span>
                        {block.start}–{block.end}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA en desktop — solo perfiles ajenos */}
        {!isOwnProfile && (
          <div className="hidden md:block p-4">
            <CTAButtons stacked={false} />
          </div>
        )}

        {/* CTA fijo al fondo — solo mobile y perfiles ajenos */}
        {!isOwnProfile && (
          <div className="md:hidden flex-shrink-0 px-4 pb-6 pt-3 border-t border-border/60 bg-background/95 backdrop-blur-sm">
            <CTAButtons stacked={false} />
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileScreen;
