import { api } from '@/shared/lib/api';
import {
  Connection,
  Community,
  ConnectionStatus,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  CreateCommunityRequest,
} from '../types';

const CONNECTIONS_BASE = import.meta.env.VITE_CONNECTIONS_API_URL || 'http://localhost:3002';

// Connections
export const connectionsService = {
  async create(data: CreateConnectionRequest): Promise<Connection> {
    return api.request<Connection>(`${CONNECTIONS_BASE}/connections`, {
      method: 'POST',
      body: data,
    });
  },

  async findAll(userId?: string, status?: ConnectionStatus): Promise<Connection[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.request<Connection[]>(`${CONNECTIONS_BASE}/connections${query}`);
  },

  async findById(id: string): Promise<Connection> {
    return api.request<Connection>(`${CONNECTIONS_BASE}/connections/${id}`);
  },

  async update(id: string, data: UpdateConnectionRequest): Promise<Connection> {
    return api.request<Connection>(`${CONNECTIONS_BASE}/connections/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  async remove(id: string): Promise<void> {
    return api.request<void>(`${CONNECTIONS_BASE}/connections/${id}`, {
      method: 'DELETE',
    });
  },
};

// Communities
export const communitiesService = {
  async create(data: CreateCommunityRequest): Promise<Community> {
    return api.request<Community>(`${CONNECTIONS_BASE}/communities`, {
      method: 'POST',
      body: data,
    });
  },

  async findAll(interest?: string): Promise<Community[]> {
    const query = interest ? `?interest=${encodeURIComponent(interest)}` : '';
    return api.request<Community[]>(`${CONNECTIONS_BASE}/communities${query}`);
  },

  async findById(id: string): Promise<Community> {
    return api.request<Community>(`${CONNECTIONS_BASE}/communities/${id}`);
  },

  async join(communityId: string, userId: string): Promise<Community> {
    return api.request<Community>(`${CONNECTIONS_BASE}/communities/${communityId}/join`, {
      method: 'POST',
      body: { userId },
    });
  },

  async leave(communityId: string, userId: string): Promise<Community> {
    return api.request<Community>(`${CONNECTIONS_BASE}/communities/${communityId}/leave`, {
      method: 'POST',
      body: { userId },
    });
  },

  async remove(id: string): Promise<void> {
    return api.request<void>(`${CONNECTIONS_BASE}/communities/${id}`, {
      method: 'DELETE',
    });
  },
};
