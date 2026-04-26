import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Loader2, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { communitiesService } from '../services/connections.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Community } from '../types';

const CommunitiesScreen = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'mine'>('explore');

  const { data: allCommunities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['communities'],
    queryFn: () => communitiesService.findAll(),
  });

  const joinMutation = useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.join(communityId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.leave(communityId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  const myCommunities = allCommunities.filter(c => userData?.id && (c.memberIds ?? []).includes(userData.id));

  // En explorar solo mostrar comunidades donde NO soy miembro
  const exploreCommunities = allCommunities.filter(c => !userData?.id || !(c.memberIds ?? []).includes(userData.id));

  const filtered = (activeTab === 'mine' ? myCommunities : exploreCommunities).filter(c =>
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const isMember = (c: Community) => !!userData?.id && (c.memberIds ?? []).includes(userData.id);

  return (
    <div className="min-h-svh flex flex-col bg-background pb-20">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="px-6 pt-8 pb-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground">Comunidades</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/communities/create')}
              className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold"
            >
              <Plus size={18} />
              Nueva
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-muted rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'explore' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Explorar
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'mine' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Mis comunidades
              {myCommunities.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                  {myCommunities.length}
                </span>
              )}
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar comunidades..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </header>

        <main className="flex-1 px-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm">
                {activeTab === 'mine'
                  ? 'Aún no perteneces a ninguna comunidad.'
                  : 'No hay comunidades disponibles.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 pt-2">
                {filtered.map((community, i) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-3xl p-4 flex gap-4 items-start"
                  >
                    {/* Icono */}
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users size={24} className="text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => navigate(`/communities/${community.id}`)}
                      >
                        {community.name}
                      </h3>
                      {community.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {community.description}
                        </p>
                      )}
                      <p className="text-[10px] text-primary font-bold uppercase mt-1">
                        {community.memberIds.length} miembro{community.memberIds.length !== 1 ? 's' : ''}
                      </p>

                      {/* Intereses */}
                      {community.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {community.interests.slice(0, 3).map(interest => (
                            <span
                              key={interest}
                              className="px-2 py-0.5 bg-accent text-accent-foreground text-[10px] rounded-full font-medium"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botón unirse/salir */}
                    {userData?.id && (
                      <div className="flex-shrink-0">
                        {isMember(community) ? (
                          <button
                            onClick={() => leaveMutation.mutate({ communityId: community.id, userId: userData.id })}
                            disabled={leaveMutation.isPending}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-muted-foreground text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            Salir
                          </button>
                        ) : (
                          <button
                            onClick={() => joinMutation.mutate({ communityId: community.id, userId: userData.id })}
                            disabled={joinMutation.isPending}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            Unirse
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default CommunitiesScreen;
