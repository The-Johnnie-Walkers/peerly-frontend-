import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Calendar } from 'lucide-react';
import { MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES } from '@/data/mockData';

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
      <div className="min-h-svh flex flex-col bg-background pb-20 md:pb-4">
        <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto min-h-0">
          {/* Chat header — clear hierarchy, touch targets */}
          <header className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 bg-card/90 backdrop-blur-xl border-b border-border sticky top-0 z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedConnectionId(null)}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <img
src={connection.student.photo}
                alt={connection.student.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-border ring-2 ring-transparent focus-visible:ring-primary"
                />
                {connection.student.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-sm truncate">{connection.student.name}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {connection.student.isOnline ? (
                    <span className="text-success">En línea</span>
                  ) : (
                    'Desconectado'
                  )}
                </p>
              </div>
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Proponer plan"
            >
              <Calendar size={20} />
            </motion.button>
          </header>

          {/* Messages — subtle bg, clear bubbles, scroll anchor */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-3 pb-6 bg-muted/20">
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
                          : 'bg-card border border-border rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      <p className={`text-[10px] mt-1.5 font-mono ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input — above bottom nav, focus states, a11y */}
          <div className="flex-shrink-0 p-4 pt-3 pb-6 md:pb-4 bg-card/95 backdrop-blur-xl border-t border-border">
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
                className="flex-1 min-h-[44px] px-4 py-3 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-muted-foreground transition-colors"
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
                className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

  // ——— Lista de conversaciones ———
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        <header className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border/60 bg-background">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">Mensajes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Propón un plan, no muerdas 🐾</p>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          <ul className="divide-y divide-border/50" role="list">
            {MOCK_CONNECTIONS.map((c, i) => (
              <li key={c.id}>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setSelectedConnectionId(c.id)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center gap-4 text-left hover:bg-accent/50 active:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={c.student.photo}
                      alt={c.student.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border"
                    />
                    {c.student.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-display font-bold text-sm truncate">{c.student.name}</p>
                      <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{c.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <div
                      className="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold flex items-center justify-center"
                      aria-label={`${c.unread} sin leer`}
                    >
                      {c.unread > 99 ? '99+' : c.unread}
                    </div>
                  )}
                </motion.button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatsScreen;
