import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Loader2, UserCheck, UserX } from 'lucide-react';
import { userService } from '@/features/users/services/user.service';
import type { BackendInterest } from '@/features/users/services/interest.service';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { connectionsService } from '@/features/connections/services/connections.service';
import { ConnectionStatus } from '@/features/connections/types';
import { useCreateConnection, useUpdateConnection } from '@/features/connections/hooks/useConnections';

// Tipo local del perfil mostrado en pantalla
type ProfileStudent = {
  id: string;
  name: string;
  photo: string;
  career: string;
  semester: number;
  interests: BackendInterest[];
  compatibility: number;
  bio: string;
  availability: { day: string; start: string; end: string }[];
  isOnline: boolean;
};

// Traducción de programas académicos del backend (inglés) al español
const PROGRAM_TRANSLATIONS: Record<string, string> = {
  SYSTEMS_ENGINEERING: 'Ingeniería de Sistemas',
  ELECTRICAL_ENGINEERING: 'Ingeniería Eléctrica',
  CIVIL_ENGINEERING: 'Ingeniería Civil',
  MECHANICAL_ENGINEERING: 'Ingeniería Mecánica',
  INDUSTRIAL_ENGINEERING: 'Ingeniería Industrial',
  ELECTRONIC_ENGINEERING: 'Ingeniería Electrónica',
  BIOMEDICAL_ENGINEERING: 'Ingeniería Biomédica',
  COMPUTER_SCIENCE: 'Ciencias de la Computación',
  MATHEMATICS: 'Matemáticas',
  PHYSICS: 'Física',
  CHEMISTRY: 'Química',
  BIOLOGY: 'Biología',
  MEDICINE: 'Medicina',
  LAW: 'Derecho',
  ECONOMICS: 'Economía',
  BUSINESS_ADMINISTRATION: 'Administración de Empresas',
  PSYCHOLOGY: 'Psicología',
  SOCIOLOGY: 'Sociología',
  ARCHITECTURE: 'Arquitectura',
  DESIGN: 'Diseño',
  COMMUNICATION: 'Comunicación Social',
  EDUCATION: 'Educación',
  PHILOSOPHY: 'Filosofía',
  HISTORY: 'Historia',
  LITERATURE: 'Literatura',
  ARTS: 'Artes',
  NURSING: 'Enfermería',
  PHARMACY: 'Farmacia',
  DENTISTRY: 'Odontología',
  VETERINARY: 'Veterinaria',
};

// Traduce el código de programa o lo formatea si no está en el mapa
const translateProgram = (program: string): string =>
  PROGRAM_TRANSLATIONS[program] ??
  program
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Traduce nombres de días del backend (inglés) a abreviaturas en español
const DAY_TRANSLATIONS: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Miér',
  THURSDAY: 'Jue',
  FRIDAY: 'Vie',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom',
};

const translateDay = (day: string): string =>
  DAY_TRANSLATIONS[day?.toUpperCase()] ?? day;

// Parsea un tiempo que puede venir como:
// - "HH:mm:ss"          → substring(0,5)
// - "HH:mm"             → substring(0,5)
// - "1970-01-01T08:00:00.000Z" (ISO UTC) → extrae la hora UTC
// - "2024-01-01T08:00:00" (ISO sin Z)   → extrae la hora local
const parseTime = (raw: string | undefined): string => {
  if (!raw) return '--:--';
  if (raw.includes('T')) {
    // ISO con timezone Z → parsear como UTC para no tener desfase
    if (raw.endsWith('Z') || raw.includes('+')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    }
    // ISO sin timezone → tomar substring
    return raw.substring(11, 16);
  }
  // "HH:mm:ss" o "HH:mm"
  return raw.substring(0, 5);
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
  const [connectionSent, setConnectionSent] = useState(false);
  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();
  const isOwnProfile = !id || id === currentAuthUser?.id;
  console.log("[ProfileScreen] Render State:", { 
    urlParamId: id, 
    contextUserId: currentAuthUser?.id, 
    isContextLoading, 
    isOwnProfile 
  });

  // Cargar perfil
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
            ? `${data.name} ${data.lastname}`
            : data.name;

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
            compatibility: isOwnProfile ? 100 : Math.floor(Math.random() * 21) + 80,
            isOnline: true,
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

  // Verificar conexión — useEffect separado para evitar race condition con currentAuthUser
  useEffect(() => {
    if (isOwnProfile || !id || !currentAuthUser?.id || fromRequest || fromConnect) return;

    const checkConnection = async () => {
      try {
        const connections = await connectionsService.findAll(currentAuthUser.id, ConnectionStatus.ACCEPTED);
        setIsConnected(connections.some(c => c.requesterId === id || c.receiverId === id));
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [id, currentAuthUser?.id, isOwnProfile, fromRequest, fromConnect]);

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

  // Intereses compartidos con el usuario autenticado (solo para perfiles ajenos)
  const myInterestIds = currentAuthUser?.interests?.map(i => i.id) || [];
  const sharedInterestIds = !isOwnProfile
    ? student.interests.filter(i => myInterestIds.includes(i.id)).map(i => i.id)
    : [];

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Centered column on desktop, full width on mobile */}
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2.5 bg-card/80 backdrop-blur rounded-xl"
          >
            <ArrowLeft size={18} />
          </motion.button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6">
          {/* Cover + Avatar — no overflow-hidden so avatar is not clipped */}
          <div className="relative rounded-t-2xl md:rounded-2xl md:mx-0">
            <div className="h-44 md:h-52 bg-gradient-to-br from-primary to-secondary rounded-t-2xl md:rounded-2xl" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <SafeRemoteImage
                  src={student.photo}
                  alt={student.name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-background shadow-elevated"
                />
                {student.isOnline && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-16 px-0 md:px-4 text-center">
            <h1 className="text-2xl md:text-3xl font-display font-extrabold">{student.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-1">{student.career} · {student.semester}° semestre</p>

            {isOwnProfile && (
              <div className="flex items-center justify-center gap-6 md:gap-8 my-4">
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">0</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Conexiones</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">0</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Actividades</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">100%</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Perfil</p>
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="flex items-center justify-center gap-2 my-3">
                <div className="bg-success/10 px-3 py-1 rounded-full">
                  <span className="text-xs font-mono font-bold text-success">{student.compatibility}% Compatible</span>
                </div>
              </div>
            )}

            <p className="text-foreground/80 text-sm md:text-base mb-6 leading-relaxed max-w-xl mx-auto">{student.bio || 'Sin descripción aún.'}</p>
          </div>

          {/* Interests */}
          <div className="mb-6 px-0 md:px-4">
            <h3 className="font-display font-bold text-sm md:text-base mb-3">
              {isOwnProfile ? 'Tus intereses' : 'Intereses'}
            </h3>
            {student.interests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isOwnProfile ? 'Aún no has añadido intereses. ¡Edita tu perfil!' : 'Sin intereses definidos.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {student.interests.map(interest => {
                  const isShared = sharedInterestIds.includes(interest.id);
                  return (
                    <span
                      key={interest.id}
                      className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border ${
                        isShared
                          ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                          : 'bg-accent border-border text-accent-foreground'
                      }`}
                    >
                      {isShared && '✨ '}{interest.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Availability — bloques/franjas */}
          <div className="mb-6 px-0 md:px-4">
            <h3 className="font-display font-bold text-sm md:text-base mb-3">Disponibilidad</h3>
            {student.availability.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin franjas definidas.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {student.availability.map((block, i) => (
                  <li
                    key={i}
                    className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm font-mono font-medium text-foreground"
                  >
                    {block.day} {block.start}–{block.end}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA — in flow, at bottom of page (not fixed) */}
          <div className="pt-4 pb-12 md:px-0">
            {isOwnProfile ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/profile/edit')}
                className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Edit3 size={18} /> Editar perfil
              </motion.button>
            ) : (
              <div className="flex gap-3">
                {isConnected ? (
                  // Ya son conexiones: solo Proponer plan
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="flex-1 p-4 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold"
                  >
                    Proponer plan
                  </motion.button>
                ) : fromRequest && connectionId ? (
                  // Viene de /social solicitudes: Aceptar y Rechazar
                  <>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      disabled={updateConnection.isPending}
                      onClick={() => {
                        if (!currentAuthUser?.id) return;
                        updateConnection.mutate(
                          { id: connectionId, data: { status: ConnectionStatus.ACCEPTED, actorId: currentAuthUser.id } },
                          { onSuccess: () => navigate('/social') },
                        );
                      }}
                      className="flex-1 p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {updateConnection.isPending ? <Loader2 size={18} className="animate-spin" /> : <><UserCheck size={18} /> Aceptar</>}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      disabled={updateConnection.isPending}
                      onClick={() => {
                        if (!currentAuthUser?.id) return;
                        updateConnection.mutate(
                          { id: connectionId, data: { status: ConnectionStatus.REJECTED, actorId: currentAuthUser.id } },
                          { onSuccess: () => navigate('/social') },
                        );
                      }}
                      className="flex-1 p-4 rounded-2xl bg-card border-2 border-destructive text-destructive font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {updateConnection.isPending ? <Loader2 size={18} className="animate-spin" /> : <><UserX size={18} /> Rechazar</>}
                    </motion.button>
                  </>
                ) : fromConnect ? (
                  // Viene de /connect: Conectar funcional + Proponer plan
                  <>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      disabled={connectionSent || createConnection.isPending}
                      onClick={() => {
                        if (!currentAuthUser?.id || !id) return;
                        createConnection.mutate(
                          { requesterId: currentAuthUser.id, receiverId: id },
                          { onSuccess: () => setConnectionSent(true) },
                        );
                      }}
                      className="flex-1 p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {createConnection.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : connectionSent ? (
                        '¡Solicitud enviada! 🎉'
                      ) : (
                        'Conectar 🤝'
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 p-4 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold"
                    >
                      Proponer plan
                    </motion.button>
                  </>
                ) : (
                  // Vista normal sin conexión
                  <>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate('/chats')}
                      className="flex-1 p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold"
                    >
                      Conectar 🤝
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 p-4 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold"
                    >
                      Proponer plan
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
