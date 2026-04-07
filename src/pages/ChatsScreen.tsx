import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Phone, Video } from 'lucide-react';
import { MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES } from '@/data/mockData';
import { SafeRemoteImage } from '@/components/peerly/SafeRemoteImage';

const PREVIEW_MAX_CHARS = 52;

function truncatePreview(text: string, max = PREVIEW_MAX_CHARS) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

const ChatsScreen = () => {
  const navigate = useNavigate();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connection = MOCK_CONNECTIONS.find(c => c.id === selectedConnectionId);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    if (selectedConnectionId) scrollToBottom();
  }, [selectedConnectionId, messages]);

  if (selectedConnectionId && connection) {
    return (
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
                onClick={() => console.log('Iniciar llamada de voz')}
              >
                <Phone size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-2.5 rounded-xl bg-accent/10 text-accent-foreground hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Videollamada"
                onClick={() => console.log('Iniciar videollamada')}
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
    );
  }

  /* ——— Lista de conversaciones (mockup alta fidelidad) ——— */
  const cream = 'hsl(var(--peerly-background))';

  return (
    <div
      className="min-h-svh flex flex-col font-sans"
      style={{ backgroundColor: cream }}
    >
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-5 sm:px-6 pt-5 pb-4 bg-peerly-background border-b border-border/80">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Mensajes
          </h1>
          <p className="text-sm font-normal text-muted-foreground mt-1.5 leading-relaxed">
            Propón un plan, no muerdas 🐾
          </p>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 bg-peerly-background">
          <ul className="list-none m-0 p-0" role="list">
            {MOCK_CONNECTIONS.map((c, i) => {
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
  );
};

export default ChatsScreen;
