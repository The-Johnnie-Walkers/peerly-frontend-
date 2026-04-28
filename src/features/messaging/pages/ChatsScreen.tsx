import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Phone, Video, Search, User, Users, Loader2 } from 'lucide-react';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { useCallContext } from '@/shared/contexts/CallContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { useQuery } from '@tanstack/react-query';
import { connectionsService, communitiesService } from '@/features/connections/services/connections.service';
import { ConnectionStatus, Community } from '@/features/connections/types';
import { userService, UserProfile } from '@/features/users/services/user.service';

type ChatContact = {
  id: string;
  name: string;
  photo?: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  type: 'personal' | 'community';
};

// ─── Vista de chat individual ────────────────────────────────────────────────
const ChatView = ({
  contact,
  currentUserId,
  currentUserName,
  onBack,
}: {
  contact: ChatContact;
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { initiateCall } = useCallContext();

  const roomId = contact.type === 'community'
    ? contact.id
    : [currentUserId, contact.id].sort().join('_');

  const { messages, sendMessage, isConnected, isLoading } = useChatSocket(roomId, currentUserName);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const formatTime = (ts: string | Date) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <div className="min-h-svh flex flex-col bg-peerly-background pb-20 md:pb-4">
        <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto min-h-0">
          <header className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 bg-peerly-surface/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2.5 rounded-xl bg-muted/90 hover:bg-muted text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Volver a conversaciones"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${contact.id}`)}
              className="flex-1 flex items-center gap-3 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1 -m-1"
            >
              <div className="relative flex-shrink-0">
                <SafeRemoteImage
                  src={contact.photo}
                  alt={contact.name}
                  fallback="pastel-icon"
                  className="w-11 h-11 rounded-full object-cover border border-border/80"
                />
                {contact.isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-peerly-surface"
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans font-bold text-base text-foreground truncate">{contact.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {contact.isOnline ? (
                    <span className="text-success">En línea</span>
                  ) : (
                    'Desconectado'
                  )}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {contact.type === 'personal' && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-2 sm:p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Llamada de voz"
                    onClick={() => initiateCall(contact.id, 'audio')}
                  >
                    <Phone size={20} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-accent/10 text-accent-foreground hover:bg-accent/15"
                    aria-label="Videollamada"
                    onClick={() => initiateCall(contact.id, 'video')}
                  >
                    <Video size={20} />
                  </motion.button>
                </>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15"
                aria-label="Proponer plan"
              >
                <Calendar size={20} />
              </motion.button>
              <ReportButton
                userId={connection.student.id}
                userName={connection.student.name}
                userPhoto={connection.student.photo}
              />
            </div>
          </header>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-muted/40 p-4 pb-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-full py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted-foreground">
                <p className="text-sm">No hay mensajes aún.</p>
                <p className="text-xs mt-1">¡Sé el primero en escribir! 🐾</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border/80 rounded-bl-md'
                      }`}>
                        {/* Nombre del remitente en chats de comunidad */}
                        {contact.type === 'community' && !isMe && (
                          <p className="text-[10px] font-bold text-primary mb-1">{msg.senderName}</p>
                        )}
                        <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                          {isMe && (
                            <span className={`text-[10px] ${msg.read ? 'text-primary-foreground/70' : 'text-primary-foreground/40'}`}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 bg-card/98 border-t border-border/80">
            <div className="flex gap-2 items-end">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 min-h-[44px] px-4 py-3 rounded-2xl bg-muted/50 border border-border/90 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
                placeholder="Escribe un mensaje..."
                disabled={!isConnected}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || !isConnected}
                className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-50"
              >
                <Send size={20} />
              </motion.button>
            </div>
            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Conectando al chat...
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Pantalla principal de chats ─────────────────────────────────────────────
const ChatsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'personal' | 'communities'>('personal');
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [search, setSearch] = useState('');

  // Conexiones aceptadas
  const { data: connections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ['connections', userData?.id, 'ACCEPTED'],
    queryFn: () => connectionsService.findAll(userData!.id, ConnectionStatus.ACCEPTED),
    enabled: !!userData?.id,
  });

  // Comunidades donde soy miembro
  const { data: allCommunities = [], isLoading: loadingCommunities } = useQuery<Community[]>({
    queryKey: ['communities'],
    queryFn: () => communitiesService.findAll(),
    enabled: !!userData?.id,
  });

  const myCommunities = allCommunities.filter(c =>
    userData?.id && (c.memberIds ?? []).includes(userData.id),
  );

  // Resolver perfiles de conexiones
  const { data: connectedProfiles = [], isLoading: loadingProfiles } = useQuery<UserProfile[]>({
    queryKey: ['connected-profiles', connections.map(c => c.id).join(',')],
    queryFn: async () => {
      const otherIds = connections.map(c =>
        c.requesterId === userData!.id ? c.receiverId : c.requesterId,
      );
      const profiles = await Promise.all(otherIds.map(id => userService.getUserById(id)));
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: connections.length > 0 && !!userData?.id,
  });

  const personalContacts: ChatContact[] = connectedProfiles.map(p => ({
    id: p.id,
    name: `${p.name} ${p.lastname}`.trim(),
    photo: p.profilePicURL,
    isOnline: p.isOnline ?? false,
    lastMessage: 'Toca para chatear',
    lastMessageTime: '',
    type: 'personal',
  }));

  const communityContacts: ChatContact[] = myCommunities.map(c => ({
    id: c.id,
    name: c.name,
    photo: undefined,
    isOnline: false,
    lastMessage: `${(c.memberIds ?? []).length} miembros`,
    lastMessageTime: '',
    type: 'community',
  }));

  const currentList = activeTab === 'personal' ? personalContacts : communityContacts;
  const filtered = currentList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const isLoading = loadingConnections || loadingProfiles || loadingCommunities;

  // Navegar directo a un contacto si viene con state
  useEffect(() => {
    const state = location.state as { studentId?: string } | null;
    if (state?.studentId && connectedProfiles.length > 0) {
      const profile = connectedProfiles.find(p => p.id === state.studentId);
      if (profile) {
        setSelectedContact({
          id: profile.id,
          name: `${profile.name} ${profile.lastname}`.trim(),
          photo: profile.profilePicURL,
          isOnline: profile.isOnline ?? false,
          lastMessage: '',
          lastMessageTime: '',
          type: 'personal',
        });
      }
    }
  }, [location.state, connectedProfiles]);

  if (selectedContact && userData?.id) {
    return (
      <ChatView
        contact={selectedContact}
        currentUserId={userData.id}
        currentUserName={`${userData.name} ${userData.lastname ?? ''}`.trim()}
        onBack={() => setSelectedContact(null)}
      />
    );
  }

  return (
    <div className="min-h-svh flex flex-col font-sans">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="px-6 pt-8 pb-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">Mensajes</h1>
              <p className="text-sm text-muted-foreground mt-1">Un espacio para hablar con quien quieres</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-muted rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'personal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Personales
              {personalContacts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
                  {personalContacts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'communities' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Comunidades
              {communityContacts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
                  {communityContacts.length}
                </span>
              )}
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === 'personal' ? 'Buscar conversación...' : 'Buscar comunidad...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground px-6">
              {activeTab === 'personal' ? (
                <>
                  <User size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm">Aún no tienes conexiones para chatear.</p>
                  <button onClick={() => navigate('/connect')} className="mt-3 text-primary font-bold text-sm">
                    Descubrir personas
                  </button>
                </>
              ) : (
                <>
                  <Users size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm">No perteneces a ninguna comunidad.</p>
                  <button onClick={() => navigate('/communities')} className="mt-3 text-primary font-bold text-sm">
                    Explorar comunidades
                  </button>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.ul
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'personal' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="list-none m-0 p-0"
              >
                {filtered.map((contact, i) => (
                  <li key={contact.id} className="border-b border-border/60 last:border-b-0">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => setSelectedContact(contact)}
                      className="w-full pl-5 pr-4 py-4 flex gap-3.5 items-center text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        {contact.type === 'community' ? (
                          <div className="w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center border border-border/70">
                            <Users size={22} className="text-primary" />
                          </div>
                        ) : (
                          <SafeRemoteImage
                            src={contact.photo}
                            alt={contact.name}
                            fallback="pastel-icon"
                            className="w-[52px] h-[52px] rounded-full object-cover border border-border/70"
                          />
                        )}
                        {contact.isOnline && (
                          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-foreground truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{contact.lastMessage}</p>
                      </div>
                    </motion.button>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatsScreen;
