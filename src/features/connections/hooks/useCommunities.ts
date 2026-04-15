import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communitiesService } from '../services/connections.service';
import { CreateCommunityRequest } from '../types';

export const communityKeys = {
  all: ['communities'] as const,
  list: (interest?: string) => [...communityKeys.all, 'list', { interest }] as const,
  detail: (id: string) => [...communityKeys.all, 'detail', id] as const,
};

export function useCommunities(interest?: string) {
  return useQuery({
    queryKey: communityKeys.list(interest),
    queryFn: () => communitiesService.findAll(interest),
  });
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => communitiesService.findById(id),
    enabled: !!id,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommunityRequest) => communitiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.join(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.leave(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
