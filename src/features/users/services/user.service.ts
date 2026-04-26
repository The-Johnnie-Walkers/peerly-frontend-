import { userApi, USERS_API_BASE } from '@/shared/lib/api';
import { authService } from '@/features/auth/services/auth.service';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  lastname: string;
  email: string;
  description?: string;
  interests?: Array<{ id: string; name: string; category: string }>;
  profilePicURL?: string;
  semester: number;
  birthDate?: string;
  freeTimeSchedule?: Array<{
    dayOfTheWeek: string;
    startsAt: string;
    endsAt: string;
  }>;
  status: string;
  programs: string[];
  role: string;
}

export interface UserUpdatePayload extends Omit<Partial<UserProfile>, 'interests'> {
  interests?: string[];
}

export const userService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const userId = localStorage.getItem('user_id');
    if (!userId) return null;

    try {
      return await userApi.request<UserProfile>(`${USERS_API_BASE}/${userId}`);
    } catch {
      return null;
    }
  },

  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      return await userApi.request<UserProfile>(`${USERS_API_BASE}/${id}`);
    } catch {
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      return await userApi.request<UserProfile>(`${USERS_API_BASE}/by-email/${email}`)
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      return await userApi.request<UserProfile[]>(`${USERS_API_BASE}`);
    } catch {
      return [];
    }
  },

  async discoverUsers(userId: string): Promise<UserProfile[]> {
    try {
      return await userApi.request<UserProfile[]>(`${USERS_API_BASE}/${userId}/discover`);
    } catch {
      return [];
    }
  },

  async getCompatibility(userId: string, otherId: string): Promise<number> {
    try {
      const result = await userApi.request<{ score: number }>(`${USERS_API_BASE}/${userId}/compatibility/${otherId}`);
      return result.score;
    } catch {
      return 0;
    }
  },

  async updateUser(id: string, data: UserUpdatePayload): Promise<UserProfile> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return await userApi.request<UserProfile>(`${USERS_API_BASE}/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteUser(id: string): Promise<void> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await userApi.requestVoid(`${USERS_API_BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};