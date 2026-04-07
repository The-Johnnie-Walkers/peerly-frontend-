import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, Search, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_CONNECTION_REQUESTS, ConnectionRequest, Student } from '@/data/mockData';
import { SafeRemoteImage } from '@/components/peerly/SafeRemoteImage';

const ConnectionsScreen = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConnectionRequest[]>(MOCK_CONNECTION_REQUESTS);
  const [activeTab, setActiveTab] = useState<'requests' | 'connections'>('requests');

  // Simulamos conexiones ya hechas (algunos estudiantes del mock)
  const [connections] = useState<Student[]>(MOCK_STUDENTS.slice(0, 4));

  const handleAccept = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    // Aquí iría la lógica para añadir a la lista de conexiones real
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

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
              {requests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                  {requests.length}
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
          <AnimatePresence mode="wait">
            {activeTab === 'requests' ? (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 pt-2"
              >
                {requests.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <UserPlus size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm">No tienes solicitudes pendientes.</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <motion.div
                      key={request.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border shadow-sm rounded-3xl p-4 flex gap-4"
                    >
                      <div 
                        className="relative flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/profile/${request.student.id}`)}
                      >
                        <SafeRemoteImage
                          src={request.student.photo}
                          alt={request.student.name}
                          fallback="pastel-icon"
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="mb-2">
                          <h3 className="font-bold text-foreground truncate">{request.student.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {request.student.career} · {request.student.semester}° sem
                          </p>
                          <p className="text-[10px] text-primary font-bold uppercase mt-0.5">{request.timestamp}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(request.id)}
                            className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <UserCheck size={14} />
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            className="py-2 px-3 bg-muted text-muted-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5"
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
                    className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {connections.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/profile/${student.id}`)}
                    className="flex items-center gap-4 p-3 hover:bg-muted/40 rounded-2xl transition-colors cursor-pointer"
                  >
                    <SafeRemoteImage
                      src={student.photo}
                      alt={student.name}
                      fallback="pastel-icon"
                      className="w-12 h-12 rounded-full object-cover border border-border/50 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">{student.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{student.career}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/chats', { state: { studentId: student.id } }); 
                        }}
                        className="p-2.5 rounded-xl bg-accent/10 text-secondary hover:bg-accent/20 transition-colors"
                        aria-label="Mensaje"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <ChevronRight size={18} className="text-muted-foreground self-center" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ConnectionsScreen;
