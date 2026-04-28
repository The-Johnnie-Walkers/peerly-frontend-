import { connectionsApi } from '@/shared/lib/api';
import {
  Connection,
  Community,
  ConnectionStatus,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  CreateCommunityRequest,
} from '../types';

// Connections
export const connectionsService = {
  async create(data: CreateConnectionRequest): Promise<Connection> {
    return connectionsApi.request<Connection>('connections', {
      method: 'POST',
      body: data,
    });
  },

  async findAll(userId?: string, status?: ConnectionStatus): Promise<Connection[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return connectionsApi.request<Connection[]>(`connections${query}`);
  },

  async findById(id: string): Promise<Connection> {
    return connectionsApi.request<Connection>(`connections/${id}`);
  },

  async update(id: string, data: UpdateConnectionRequest): Promise<Connection> {
    return connectionsApi.request<Connection>(`connections/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  async remove(id: string): Promise<void> {
    return connectionsApi.request<void>(`connections/${id}`, {
      method: 'DELETE',
    });
  },
};

// Communities
export const communitiesService = {
  async create(data: CreateCommunityRequest): Promise<Community> {
    return connectionsApi.request<Community>('communities', {
      method: 'POST',
      body: data,
    });
  },

  async findAll(interest?: string): Promise<Community[]> {
    const query = interest ? `?interest=${encodeURIComponent(interest)}` : '';
    return connectionsApi.request<Community[]>(`communities${query}`);
  },

  async findById(id: string): Promise<Community> {
    return connectionsApi.request<Community>(`communities/${id}`);
  },

  async join(communityId: string, userId: string): Promise<Community> {
    return connectionsApi.request<Community>(`communities/${communityId}/join`, {
      method: 'POST',
      body: { userId },
    });
  },

  async leave(communityId: string, userId: string, newCreatorId?: string): Promise<{ deleted: boolean; community?: Community }> {
    return connectionsApi.request<{ deleted: boolean; community?: Community }>(`communities/${communityId}/leave`, {
      method: 'POST',
      body: { userId, ...(newCreatorId ? { newCreatorId } : {}) },
    });
  },

  async remove(id: string): Promise<void> {
    return connectionsApi.request<void>(`communities/${id}`, {
      method: 'DELETE',
    });
  },
};
