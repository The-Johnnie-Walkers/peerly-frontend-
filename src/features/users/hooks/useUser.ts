import { useQuery } from '@tanstack/react-query';
import { userService, UserProfile } from '../services/user.service';

export const userKeys = {
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUser(userId?: string) {
  return useQuery<UserProfile | null>({
    queryKey: userKeys.detail(userId ?? ''),
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
  });
}
