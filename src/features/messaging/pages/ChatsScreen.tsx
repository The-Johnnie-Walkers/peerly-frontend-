import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Phone, Video, MessageSquarePlus, Search, X, User } from 'lucide-react';
import { MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES, MOCK_STUDENTS, Student, Connection } from '@/shared/data/mockData';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { cn } from '@/shared/lib/utils';
import { useLocation } from 'react-router-dom';
import { useCall } from '../hooks/useCall';
import { CallModal } from '../components/CallModal';
import { authService } from '@/features/auth/services/auth.service';

const PREVIEW_MAX_CHARS = 52;

function truncatePreview(text: string, max = PREVIEW_MAX_CHARS) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

const ChatsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isSelectingContact, setIsSelectingContact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES);
  const [activeConnections, setActiveConnections] = useState<Connection[]>(MOCK_CONNECTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = authService.getCurrentUser();
  const { callState, callType, incomingCall, remoteStream, localStreamRef, initiateCall, acceptCall, rejectCall, endCall } = useCall(
    currentUser?.id ?? '',
    currentUser?.name ?? '',
    authService.getToken() ?? '',
  );

  // Efecto para manejar navegación desde otras pantallas (ej: ConnectionsScreen)
  useEffect(() => {
    const state = location.state as { studentId?: string } | null;
    if (state?.studentId) {
      handleSelectStudent(state.studentId);
    }
  }, [location.state]);

  const connection = activeConnections.find(c => c.id === selectedConnectionId);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    if (selectedConnectionId) scrollToBottom();
  }, [selectedConnectionId, messages]);

  const handleSelectStudent = (studentId: string) => {
    const existingConn = activeConnections.find(c => c.student.id === studentId);
    if (existingConn) {
      setSelectedConnectionId(existingConn.id);
    } else {
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      if (student) {
        const newConn: Connection = {
          id: `temp-${student.id}`,
          student,
          lastMessage: '',
          lastMessageTime: 'Ahora',
          unread: 0
        };
        setActiveConnections(prev => [newConn, ...prev]);
        setSelectedConnectionId(newConn.id);
      }
    }
    setIsSelectingContact(false);
  };

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.career.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedConnectionId && connection) {
    return (
      <>
      <CallModal
        callState={callState}
        callType={callType}
        incomingCall={incomingCall}
        remoteStream={remoteStream}
        localStreamRef={localStreamRef}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
      />
      <div className="min-h-svh flex flex-col bg-peerly-background pb-20 md:pb-4">
        <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto min-h-0">
          <header className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 bg-peerly-surface/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedConnectionId(null)}
              className="p-2.5 rounded-xl bg-muted/90 hover:bg-muted text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Volver a conversaciones"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${connection.student.id}`)}
              className="flex-1 flex items-center gap-3 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1 -m-1"
            >
              <div className="relative flex-shrink-0">
                <SafeRemoteImage
                  src={connection.student.photo}
                  alt={connection.student.name}
                  fallback="pastel-icon"
                  className="w-11 h-11 rounded-full object-cover border border-border/80"
                />
                {connection.student.isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-peerly-surface"
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans font-bold text-base text-foreground truncate">{connection.student.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {connection.student.isOnline ? (
                    <span className="text-success">En línea</span>
                  ) : (
                    'Desconectado'
                  )}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Llamada de voz"
                onClick={() => initiateCall(connection.student.id, 'audio')}
              >
                <Phone size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-2.5 rounded-xl bg-accent/10 text-accent-foreground hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Videollamada"
                onClick={() => initiateCall(connection.student.id, 'video')}
              >
                <Video size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Proponer plan"
              >
                <Calendar size={20} />
              </motion.button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-3 pb-6 bg-muted/40">
              {messages.map(msg => {
                const isMe = msg.senderId === 'me';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-peerly-surface border border-border/80 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      <p className={`text-xs mt-1.5 font-normal ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 p-4 pt-3 pb-6 md:pb-4 bg-peerly-surface/98 backdrop-blur-md border-t border-border/80">
            <div className="flex gap-2 items-end">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
                    e.preventDefault();
                    setMessages(prev => [...prev, { id: `new-${Date.now()}`, senderId: 'me', text: message.trim(), timestamp: 'Ahora' }]);
                    setMessage('');
                  }
                }}
                className="flex-1 min-h-[44px] px-4 py-3 rounded-2xl bg-muted/50 border border-border/90 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm placeholder:text-muted-foreground transition-colors font-sans"
                placeholder="Escribe un mensaje..."
                aria-label="Mensaje"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (message.trim()) {
                    setMessages(prev => [...prev, { id: `new-${Date.now()}`, senderId: 'me', text: message.trim(), timestamp: 'Ahora' }]);
                    setMessage('');
                  }
                }}
                disabled={!message.trim()}
                className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-50 disabled:pointer-events-none hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Enviar mensaje"
              >
                <Send size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  /* ——— Lista de conversaciones (mockup alta fidelidad) ——— */
  const cream = 'hsl(var(--peerly-background))';

  return (
    <>
    <CallModal
      callState={callState}
      callType={callType}
      incomingCall={incomingCall}
      remoteStream={remoteStream}
      localStreamRef={localStreamRef}
      onAccept={acceptCall}
      onReject={rejectCall}
      onEnd={endCall}
    />
    <div
      className="min-h-svh flex flex-col font-sans"
      style={{ backgroundColor: cream }}
    >
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-5 sm:px-6 pt-5 pb-4 bg-peerly-background border-b border-border/80 flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mensajes
            </h1>
            <p className="text-sm font-normal text-muted-foreground mt-1.5 leading-relaxed">
              Propón un plan, no muerdas 🐾
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSelectingContact(true)}
            className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:bg-primary/95 transition-colors"
            aria-label="Nueva conversación"
          >
            <MessageSquarePlus size={22} />
          </motion.button>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 bg-peerly-background relative">
          {/* Overlay de selección de contacto */}
          {isSelectingContact && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 z-50 bg-peerly-background flex flex-col"
            >
              <div className="p-4 border-b border-border/80 bg-peerly-surface/50 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setIsSelectingContact(false)}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-bold text-lg">Nueva conversación</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar amigo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    autoFocus
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-2 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 mb-2">Sugerencias</p>
                  {filteredStudents.map((student) => (
                    <motion.button
                      key={student.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectStudent(student.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-peerly-surface/40 rounded-2xl transition-colors text-left"
                    >
                      <SafeRemoteImage
                        src={student.photo}
                        alt=""
                        className="w-12 h-12 rounded-full border border-border/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.career}</p>
                      </div>
                    </motion.button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      <User size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No encontramos a nadie con ese nombre.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <ul className="list-none m-0 p-0" role="list">
            {activeConnections.map((c, i) => {
              const preview = truncatePreview(c.lastMessage);
              const hasUnread = c.unread > 0;

              return (
                <li key={c.id} className="border-b border-border/90 last:border-b-0">
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setSelectedConnectionId(c.id)}
                    className="w-full pl-5 pr-4 sm:pl-6 sm:pr-5 py-4 flex gap-3.5 items-start text-left bg-transparent hover:bg-peerly-surface/40 active:bg-peerly-surface/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset transition-colors"
                  >
                    {/* Avatar + estado */}
                    <div className="relative flex-shrink-0">
                      <SafeRemoteImage
                        src={c.student.photo}
                        alt=""
                        fallback="pastel-icon"
                        className="w-[52px] h-[52px] rounded-full object-cover border border-border/70 bg-card shadow-sm"
                      />
                      {c.student.isOnline && (
                        <span
                          className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-peerly-background"
                          aria-label="En línea"
                        />
                      )}
                    </div>

                    {/* Nombre + preview (dos líneas) */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="font-sans font-bold text-base text-foreground leading-snug">
                        {c.student.name}
                      </p>
                      <p className="font-sans font-normal text-sm text-muted-foreground mt-1 leading-snug line-clamp-2">
                        {preview}
                      </p>
                    </div>

                    {/* Metadatos alineados: hora arriba, badge abajo */}
                    <div className="flex-shrink-0 w-[52px] flex flex-col items-end gap-2 pt-0.5">
                      <span className="text-xs font-normal text-muted-foreground tabular-nums leading-none">
                        {c.lastMessageTime}
                      </span>
                      {hasUnread ? (
                        <span
                          className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-peerly-accent-strong text-primary-foreground text-xs font-semibold flex items-center justify-center shadow-sm tabular-nums"
                          aria-label={`${c.unread} sin leer`}
                        >
                          {c.unread > 99 ? '99+' : c.unread}
                        </span>
                      ) : (
                        <span className="h-[22px] w-[22px] flex-shrink-0" aria-hidden />
                      )}
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatsScreen;
