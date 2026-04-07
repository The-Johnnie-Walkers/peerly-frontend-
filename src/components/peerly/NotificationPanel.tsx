import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, UserPlus, Calendar, MessageSquare } from 'lucide-react';
import { Notification } from '@/data/mockData';
import { SafeRemoteImage } from './SafeRemoteImage';

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'connection': return <UserPlus size={16} className="text-secondary" />;
      case 'activity': return <Calendar size={16} className="text-primary" />;
      case 'message': return <MessageSquare size={16} className="text-secondary" />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40 lg:rounded-[32px]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 right-6 w-[calc(100%-3rem)] max-w-sm bg-card border border-border shadow-elevated rounded-2xl z-50 overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                Notificaciones
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tienes notificaciones por ahora</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 flex gap-3 hover:bg-muted/30 transition-colors relative cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                      )}
                      
                      <div className="relative flex-shrink-0">
                        {notification.avatar ? (
                          <SafeRemoteImage
                            src={notification.avatar}
                            alt=""
                            fallback="pastel-icon"
                            className="w-10 h-10 rounded-full object-cover border border-border/50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                            {getIcon(notification.type)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center shadow-sm border border-border">
                          {getIcon(notification.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-bold text-foreground truncate">
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                            {notification.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-muted/10 border-t border-border text-center">
                <button 
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() => console.log('Ver todas las notificaciones')}
                >
                  Ver todas las actividades
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
