import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { notificationsURL } from '@/shared/lib/api';
import type { Notification } from '@/shared/data/mockData';
import {
  notificationService,
  mapBackendNotification,
  type BackendNotification,
} from '../services/notification.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    // Fetch existing notifications
    notificationService.getAll()
      .then(setNotifications)
      .catch(() => {/* silencioso si el servicio no está corriendo */});

    // Connect to WebSocket
    const socket = io(`${notificationsURL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('notification', (data: BackendNotification) => {
      const mapped = mapBackendNotification({ ...data, _id: (data as any)._id || (data as any).id });
      setNotifications(prev => [mapped, ...prev]);
      toast(mapped.title, { description: mapped.description });
    });

    socket.on('connect_error', () => {
      // Fallo silencioso si el servicio de notificaciones no está disponible
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await notificationService.markAsRead(id).catch(() => {});
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await notificationService.markAllAsRead().catch(() => {});
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
