import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '../services/connections.service';
import { ConnectionStatus, CreateConnectionRequest, UpdateConnectionRequest } from '../types';

export const connectionKeys = {
  all: ['connections'] as const,
  list: (userId?: string, status?: ConnectionStatus) =>
    [...connectionKeys.all, 'list', { userId, status }] as const,
  detail: (id: string) => [...connectionKeys.all, 'detail', id] as const,
};

export function useConnections(userId?: string, status?: ConnectionStatus) {
  return useQuery({
    queryKey: connectionKeys.list(userId, status),
    queryFn: () => connectionsService.findAll(userId, status),
    enabled: !!userId,
  });
}

export function useConnection(id: string) {
  return useQuery({
    queryKey: connectionKeys.detail(id),
    queryFn: () => connectionsService.findById(id),
    enabled: !!id,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConnectionRequest) => connectionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all });
    },
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConnectionRequest }) =>
      connectionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all });
    },
  });
}
