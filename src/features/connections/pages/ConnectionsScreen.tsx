import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, Search, MessageSquare, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { authService } from '@/features/auth/services/auth.service';
import { useConnections, useUpdateConnection } from '../hooks/useConnections';
import { ConnectionStatus } from '../types';

const ConnectionsScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'connections'>('requests');
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

  // Para las conexiones aceptadas, obtenemos el ID del otro usuario
  const getOtherUserId = (c: { requesterId: string; receiverId: string }) =>
    c.requesterId === userId ? c.receiverId : c.requesterId;

  const filteredConnections = useMemo(() => {
    if (!search.trim()) return acceptedConnections;
    const q = search.toLowerCase();
    return acceptedConnections.filter((c) =>
      getOtherUserId(c).toLowerCase().includes(q),
    );
  }, [acceptedConnections, search, userId]);

  const isLoading = loadingPending || loadingAccepted;

  return (
    <div className="min-h-svh flex flex-col bg-background pb-20">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="px-6 pt-8 pb-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground">Social</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/connect')}
              className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold active:bg-primary/90 transition-colors"
            >
              <Sparkles size={18} />
              Descubrir
            </motion.button>
          </div>

          <div className="flex p-1 bg-muted rounded-2xl gap-1">
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
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'connections'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conexiones
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'requests' ? (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 pt-2"
                >
                  {incomingRequests.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <UserPlus size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm">No tienes solicitudes pendientes.</p>
                    </div>
                  ) : (
                    incomingRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border shadow-sm rounded-3xl p-4 flex gap-4"
                      >
                        <div
                          className="relative flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/profile/${request.requesterId}`)}
                        >
                          <SafeRemoteImage
                            src={undefined}
                            alt={request.requesterId}
                            fallback="pastel-icon"
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="mb-2">
                            <h3
                              className="font-bold text-foreground truncate cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile/${request.requesterId}`)}
                            >
                              {request.requesterId}
                            </h3>
                            <p className="text-[10px] text-primary font-bold uppercase mt-0.5">
                              {new Date(request.createdAt).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(request.id)}
                              disabled={updateConnection.isPending}
                              className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <UserCheck size={14} />
                              Aceptar
                            </button>
                            <button
                              onClick={() => handleDecline(request.id)}
                              disabled={updateConnection.isPending}
                              className="py-2 px-3 bg-muted text-muted-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <UserX size={14} />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="connections"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2 pt-2"
                >
                  <div className="relative mb-6">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar conexiones..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {filteredConnections.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <UserPlus size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm">Aún no tienes conexiones.</p>
                    </div>
                  ) : (
                    filteredConnections.map((connection) => {
                      const otherId = getOtherUserId(connection);
                      return (
                        <motion.div
                          key={connection.id}
                          layout
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/profile/${otherId}`)}
                          className="flex items-center gap-4 p-3 hover:bg-muted/40 rounded-2xl transition-colors cursor-pointer"
                        >
                          <SafeRemoteImage
                            src={undefined}
                            alt={otherId}
                            fallback="pastel-icon"
                            className="w-12 h-12 rounded-full object-cover border border-border/50 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm truncate">{otherId}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/chats', { state: { studentId: otherId } });
                              }}
                              className="p-2.5 rounded-xl bg-accent/10 text-secondary hover:bg-accent/20 transition-colors"
                              aria-label="Mensaje"
                            >
                              <MessageSquare size={18} />
                            </button>
                            <ChevronRight size={18} className="text-muted-foreground self-center" />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default ConnectionsScreen;
