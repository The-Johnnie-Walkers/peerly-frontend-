import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Loader2, AlertTriangle, Crown, Check, UserPlus } from 'lucide-react';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { communitiesService } from '../services/connections.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/features/users/hooks/useUser';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { useConnections, useCreateConnection } from '../hooks/useConnections';
import { ConnectionStatus } from '../types';
import { translateProgram } from '@/shared/utils/programTranslations';

// Subcomponente para cada miembro
const MemberRow = ({
  userId,
  isCreator,
  selectable,
  selected,
  onSelect,
  currentUserId,
  isConnected,
  onConnect,
  isConnecting,
}: {
  userId: string;
  isCreator: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  currentUserId?: string;
  isConnected?: boolean;
  onConnect?: (id: string) => void;
  isConnecting?: boolean;
}) => {
  const navigate = useNavigate();
  const { data: user } = useUser(userId);
  const displayName = user ? `${user.name} ${user.lastname}`.trim() : userId;
  const isMe = userId === currentUserId;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => selectable ? onSelect?.(userId) : navigate(`/profile/${userId}?from=connect`)}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${
        selectable
          ? selected
            ? 'bg-primary/10 border-2 border-primary'
            : 'hover:bg-muted/40 border-2 border-transparent'
          : 'hover:bg-muted/40'
      }`}
    >
      <SafeRemoteImage
        src={user?.profilePicURL}
        alt={displayName}
        fallback="pastel-icon"
        className="w-10 h-10 rounded-full object-cover border border-border/50"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm text-foreground truncate">{displayName}</p>
          {isCreator && <Crown size={12} className="text-primary flex-shrink-0" />}
        </div>
        {user?.programs?.[0] && (
          <p className="text-xs text-muted-foreground truncate">{translateProgram(user.programs[0])}</p>
        )}
      </div>
      {selectable && selected && <Check size={18} className="text-primary flex-shrink-0" />}
      {!selectable && !isMe && !isConnected && onConnect && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          disabled={isConnecting}
          onClick={e => { e.stopPropagation(); onConnect(userId); }}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl disabled:opacity-50"
        >
          {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <><UserPlus size={12} /> Conectar</>}
        </motion.button>
      )}
    </motion.div>
  );
};

const CommunityDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedNewCreator, setSelectedNewCreator] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());

  // Traer TODAS las conexiones (cualquier estado) para saber con quién ya tengo relación
  const { data: myConnections = [] } = useConnections(userData?.id);
  const myRelatedIds = new Set(
    myConnections.flatMap(c => [c.requesterId, c.receiverId])
  );
  const createConnection = useCreateConnection();

  const { data: community, isLoading } = useQuery({
    queryKey: ['communities', id],
    queryFn: () => communitiesService.findById(id!),
    enabled: !!id,
    staleTime: 0, // Siempre refetch al montar para tener el creatorId actualizado
  });

  const joinMutation = useMutation({
    mutationFn: () => communitiesService.join(id!, userData!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.refetchQueries({ queryKey: ['communities', id] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => communitiesService.leave(id!, userData!.id, selectedNewCreator ?? undefined),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['communities'] });
      if (result?.deleted || isCreator) {
        // Si se eliminó la comunidad o el creador salió → volver a la lista
        navigate('/communities', { replace: true });
      } else {
        // Miembro normal salió → refetch del detalle y cerrar diálogo
        await queryClient.refetchQueries({ queryKey: ['communities', id], exact: true });
        setShowLeaveConfirm(false);
        setSelectedNewCreator(null);
      }
    },
  });

  const memberIds = community?.memberIds ?? [];
  const isLastMember = memberIds.length <= 1;
  const isCreator = community?.creatorId === userData?.id;
  const otherMembers = memberIds.filter(mid => mid !== userData?.id);
  // Necesita seleccionar nuevo líder si: es creador, no es el último, y hay más de 1 otro miembro
  const needsCreatorSelection = isCreator && !isLastMember && otherMembers.length > 1;
  const canConfirmLeave = !needsCreatorSelection || !!selectedNewCreator;

  const handleConnect = (targetId: string) => {
    if (!userData?.id) return;
    setConnectingId(targetId);
    createConnection.mutate(
      { requesterId: userData.id, receiverId: targetId },
      {
        onSuccess: () => {
          // Marcar como enviado localmente para deshabilitar el botón de inmediato
          setSentRequestIds(prev => new Set(prev).add(targetId));
        },
        onSettled: () => setConnectingId(null),
      },
    );
  };

  const isMember = !!userData?.id && memberIds.includes(userData.id);
  const isPending = joinMutation.isPending || leaveMutation.isPending;

  if (isLoading) {
    return (
      <div className="h-svh flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-svh flex items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Comunidad no encontrada</p>
        <button onClick={() => navigate('/communities')} className="text-primary font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/communities')}
            className="p-2.5 bg-card/80 backdrop-blur rounded-xl"
          >
            <ArrowLeft size={18} />
          </motion.button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6">
          {/* Cover */}
          <div className="h-36 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 flex items-center justify-center">
            <Users size={48} className="text-white/80" />
          </div>

          {/* Info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-extrabold">{community.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {memberIds.length} miembro{memberIds.length !== 1 ? 's' : ''}
            </p>
            {community.description && (
              <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{community.description}</p>
            )}
            {(community.interests ?? []).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {(community.interests ?? []).map(interest => (
                  <span key={interest} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          {userData?.id && (
            <div className="mb-8">
              {isMember ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isPending}
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full p-4 rounded-2xl bg-card border-2 border-destructive text-destructive font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Abandonar comunidad'}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isPending}
                  onClick={() => joinMutation.mutate()}
                  className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Unirse a la comunidad'}
                </motion.button>
              )}
            </div>
          )}

          {/* Miembros */}
          <div>
            <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2">
              Miembros
              {isCreator && isMember && (
                <span className="text-xs font-normal text-primary flex items-center gap-1">
                  <Crown size={12} /> Eres el creador
                </span>
              )}
            </h2>
            <div className="space-y-1">
              {memberIds.map(memberId => (
                <MemberRow
                  key={memberId}
                  userId={memberId}
                  isCreator={memberId === community.creatorId}
                  currentUserId={userData?.id}
                  isConnected={memberId === userData?.id || myRelatedIds.has(memberId) || sentRequestIds.has(memberId)}
                  onConnect={handleConnect}
                  isConnecting={connectingId === memberId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para salir */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => { setShowLeaveConfirm(false); setSelectedNewCreator(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-elevated max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-destructive" />
                </div>
                <h3 className="font-display font-bold text-foreground">
                  {isLastMember ? '¿Eliminar comunidad?' : isCreator ? 'Transferir liderazgo' : '¿Abandonar comunidad?'}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {isLastMember
                  ? 'Eres el único miembro. Si sales, la comunidad será eliminada permanentemente.'
                  : needsCreatorSelection
                  ? 'Eres el creador. Elige quién tomará el liderazgo antes de salir:'
                  : isCreator
                  ? 'El liderazgo pasará automáticamente al otro miembro.'
                  : `Dejarás de ser miembro de "${community.name}". Podrás volver a unirte cuando quieras.`}
              </p>

              {/* Selector de nuevo líder */}
              {needsCreatorSelection && (
                <div className="space-y-1 mb-4 border border-border rounded-2xl p-2">
                  {otherMembers.map(memberId => (
                    <MemberRow
                      key={memberId}
                      userId={memberId}
                      isCreator={false}
                      selectable
                      selected={selectedNewCreator === memberId}
                      onSelect={setSelectedNewCreator}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowLeaveConfirm(false); setSelectedNewCreator(null); }}
                  className="flex-1 p-3 rounded-2xl bg-muted text-muted-foreground font-bold text-sm"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isPending || !canConfirmLeave}
                  onClick={() => leaveMutation.mutate()}
                  className="flex-1 p-3 rounded-2xl bg-destructive text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : isLastMember ? 'Eliminar' : 'Salir'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityDetailScreen;
