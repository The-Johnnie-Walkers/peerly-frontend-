import { notificationsApi } from '@/shared/lib/api';
import type { Notification } from '@/shared/data/mockData';

export interface BackendNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  senderId?: string;
  resourceId?: string;
  recipientId: string;
  read: boolean;
  createdAt: string;
}

const TYPE_MAP: Record<string, Notification['type']> = {
  CONNECTION_REQUEST: 'connection',
  CONNECTION_ACCEPTED: 'connection',
  ACTIVITY_CREATED: 'activity',
  REPORT_CREATED: 'report',
  REPORT_STATUS_UPDATED: 'report',
};

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: n._id,
    type: TYPE_MAP[n.type] ?? 'message',
    title: n.title,
    description: n.message,
    timestamp: formatTimestamp(n.createdAt),
    isRead: n.read,
  };
}

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const data = await notificationsApi.request<BackendNotification[]>('notifications');
    return data.map(mapBackendNotification);
  },

  async markAsRead(id: string): Promise<void> {
    await notificationsApi.requestVoid(`notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllAsRead(): Promise<void> {
    await notificationsApi.requestVoid('notifications/read-all', { method: 'PATCH' });
  },
};
