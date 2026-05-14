import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, Search, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { authService } from '@/features/auth/services/auth.service';
import { useConnections, useUpdateConnection } from '../hooks/useConnections';
import { ConnectionStatus } from '../types';
import { useUser } from '@/features/users/hooks/useUser';
import { translateProgram } from '@/shared/utils/programTranslations';

// Subcomponente para cada conexión aceptada — resuelve el nombre del otro usuario
const ConnectionCard = ({
  connection,
  currentUserId,
  search = '',
}: {
  connection: { id: string; requesterId: string; receiverId: string };
  currentUserId: string;
  search?: string;
}) => {
  const navigate = useNavigate();
  const otherId = connection.requesterId === currentUserId ? connection.receiverId : connection.requesterId;
  const { data: otherUser } = useUser(otherId);

  const displayName = otherUser
    ? `${otherUser.name} ${otherUser.lastname}`.trim()
    : '';

  // Solo filtra una vez que el perfil cargó — evita parpadeos mientras carga
  if (search.trim() && otherUser && !displayName.toLowerCase().includes(search.trim().toLowerCase())) {
    return null;
  }

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/profile/${otherId}`)}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        <SafeRemoteImage
          src={otherUser?.profilePicURL}
          alt={displayName}
          fallback="pastel-icon"
          className="w-12 h-12 rounded-full object-cover border border-border/50 shadow-sm"
        />
        {otherUser?.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground text-sm truncate">{displayName || otherId}</h3>
        {otherUser && (otherUser.programs?.[0] || otherUser.semester) && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[
              otherUser.programs?.[0] ? translateProgram(otherUser.programs[0]) : null,
              otherUser.semester ? `Sem. ${otherUser.semester}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          title="Abrir chat"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/chats', { state: { studentId: otherId } });
          }}
          className="p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-secondary transition-colors"
          aria-label="Abrir chat"
        >
          <MessageSquare size={17} />
        </button>
        <button
          title="Ver perfil"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${otherId}`);
          }}
          className="p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Ver perfil"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </motion.div>
  );
};

// Subcomponente para cada solicitud — resuelve el nombre del solicitante
const RequestCard = ({
  request,
  onAccept,
  onDecline,
  isPending,
}: {
  request: { id: string; requesterId: string; createdAt: Date };
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isPending: boolean;
}) => {
  const navigate = useNavigate();
  const { data: requester } = useUser(request.requesterId);

  const displayName = requester
    ? `${requester.name} ${requester.lastname}`.trim()
    : request.requesterId;

  const program = requester?.programs?.[0] ? translateProgram(requester.programs[0]) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border shadow-sm rounded-3xl p-4 flex items-center gap-4"
    >
      <div
        className="relative flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/profile/${request.requesterId}?from=request&connectionId=${request.id}`)}
      >
        <SafeRemoteImage
          src={requester?.profilePicURL}
          alt={displayName}
          fallback="pastel-icon"
          className="w-12 h-12 rounded-2xl object-cover"
        />
      </div>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/profile/${request.requesterId}?from=request&connectionId=${request.id}`)}
      >
        <h3 className="font-bold text-foreground text-sm truncate hover:underline">{displayName}</h3>
        {program && <p className="text-xs text-muted-foreground truncate mt-0.5">{program}</p>}
        <p className="text-[10px] text-primary font-mono font-bold uppercase mt-0.5">
          {new Date(request.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={() => onAccept(request.id)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <UserCheck size={13} />
          Aceptar
        </button>
        <button
          onClick={() => onDecline(request.id)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <UserX size={13} />
          Rechazar
        </button>
      </div>
    </motion.div>
  );
};

const RequestCardSkeleton = () => (
  <div className="animate-pulse bg-card border border-border rounded-3xl p-4 flex gap-4">
    <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0" />
    <div className="flex-1 space-y-2 py-0.5">
      <div className="h-4 w-36 rounded-full bg-muted" />
      <div className="h-3 w-16 rounded-full bg-muted" />
      <div className="flex gap-2 mt-3">
        <div className="h-8 flex-1 rounded-xl bg-muted" />
        <div className="h-8 w-20 rounded-xl bg-muted" />
      </div>
    </div>
  </div>
);

const ConnectionCardSkeleton = () => (
  <div className="animate-pulse flex items-center gap-4 px-4 py-3">
    <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-4 w-32 rounded-full bg-muted" />
      <div className="h-3 w-20 rounded-full bg-muted" />
    </div>
    <div className="h-9 w-9 rounded-xl bg-muted" />
  </div>
);

const ConnectionsScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'connections'>('connections');
  const [search, setSearch] = useState('');

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  // Solicitudes pendientes recibidas (receiverId = yo, status = PENDING)
  const { data: pendingConnections = [], isLoading: loadingPending } = useConnections(userId, ConnectionStatus.PENDING);
  // Conexiones aceptadas
  const { data: acceptedConnections = [], isLoading: loadingAccepted } = useConnections(userId, ConnectionStatus.ACCEPTED);

  const updateConnection = useUpdateConnection();

  // Solicitudes donde yo soy el receptor
  const incomingRequests = useMemo(
    () => pendingConnections.filter((c) => c.receiverId === userId),
    [pendingConnections, userId],
  );

  // Más recientes primero
  const sortedConnections = useMemo(
    () => [...acceptedConnections].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [acceptedConnections],
  );

  const handleAccept = (connectionId: string) => {
    if (!userId) return;
    updateConnection.mutate({
      id: connectionId,
      data: { status: ConnectionStatus.ACCEPTED, actorId: userId },
    });
  };

  const handleDecline = (connectionId: string) => {
    if (!userId) return;
    updateConnection.mutate({
      id: connectionId,
      data: { status: ConnectionStatus.REJECTED, actorId: userId },
    });
  };

  const isLoading = loadingPending || loadingAccepted;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="min-h-full rounded-[28px] bg-background md:rounded-[32px] md:shadow-elevated">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 pb-24 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">

          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex flex-col gap-5 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,236,227,0.88))] px-7 py-8 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9 lg:px-10"
          >
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-primary">
                Red social
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[color:hsl(var(--peerly-primary-dark))] sm:text-4xl">
                Tu red
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:hsl(var(--peerly-text-secondary))] sm:text-[15px]">
                Gestiona tus solicitudes de conexión y mantén el contacto con tu comunidad.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/connect')}
              className="hidden lg:inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[hsl(var(--peerly-primary))] px-6 text-sm font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Descubrir personas
            </motion.button>
          </motion.header>

          <div className="flex p-1 bg-muted/60 rounded-2xl gap-1">
          <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'connections'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conexiones
              {!isLoading && acceptedConnections.length > 0 && (
                <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                  {acceptedConnections.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Solicitudes
              {incomingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </button>
            
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {activeTab === 'requests' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <RequestCardSkeleton key={i} />)}
              </div>
              ) : (
                <div className="rounded-[28px] border border-white/70 bg-white/80 shadow-card overflow-hidden divide-y divide-border/40">
                  {Array.from({ length: 5 }).map((_, i) => <ConnectionCardSkeleton key={i} />)}
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'requests' ? (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {incomingRequests.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-primary/25 bg-white/60 px-6 py-12 text-center shadow-card">
                      <UserPlus size={36} className="mx-auto mb-4 text-primary/30" />
                      <h3 className="font-display text-lg font-bold text-foreground">Sin solicitudes pendientes</h3>
                      <p className="mt-2 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                        Cuando alguien quiera conectar contigo, aparecerá aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {incomingRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          isPending={updateConnection.isPending}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="connections"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <input
                      type="search"
                      placeholder="Buscar por nombre..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground shadow-card outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      autoComplete="off"
                    />
                  </div>

                  {acceptedConnections.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-primary/25 bg-white/60 px-6 py-12 text-center shadow-card">
                      <UserPlus size={36} className="mx-auto mb-4 text-primary/30" />
                      <h3 className="font-display text-lg font-bold text-foreground">Aún no tienes conexiones</h3>
                      <p className="mt-2 text-sm text-[color:hsl(var(--peerly-text-secondary))]">
                        Descubre compañeros compatibles y empieza a conectar.
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/connect')}
                        className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-[hsl(var(--peerly-primary))] px-5 text-sm font-display font-semibold text-white shadow-card transition-opacity hover:opacity-90"
                      >
                        <Sparkles className="h-4 w-4" />
                        Descubrir personas
                      </motion.button>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-white/70 bg-white/80 shadow-card overflow-hidden divide-y divide-border/40">
                      {sortedConnections.map((connection) => (
                        <ConnectionCard
                          key={connection.id}
                          connection={connection}
                          currentUserId={userId!}
                          search={search}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  );
};

export default ConnectionsScreen;
