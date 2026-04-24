import { userApi, USERS_API_BASE } from '@/shared/lib/api';
import { authService } from '@/features/auth/services/auth.service';
import { INTERESTS as MOCK_INTERESTS } from '@/shared/data/mockData';

const INTERESTS_API_BASE = 'interests';

export interface BackendInterest {
  id: string;
  name: string;
  category: string;
}

/** Convierte los intereses del mock local al formato BackendInterest como fallback */
const getMockFallback = (): BackendInterest[] =>
  MOCK_INTERESTS.map(i => ({
    id: i.id,
    name: i.label,
    category: i.category,
  }));

export const interestService = {
  /**
   * Obtiene todos los intereses disponibles.
   * Intenta primero en el user-service (3000), luego en el auth-service (3001).
   * Si ambos fallan, devuelve los intereses del mock local como fallback.
   */
  async getAllInterests(): Promise<BackendInterest[]> {
    try {
      const result = await userApi.request<BackendInterest[]>(`/${INTERESTS_API_BASE}`);
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('[InterestService] user-service failed:', error);
    }

    // Fallback: mock local
    console.warn('[InterestService] Service failed. Using local mock interests as fallback.');
    return getMockFallback();
  },

  /** Obtiene un interés por ID */
  async getInterestById(id: string): Promise<BackendInterest | null> {
    try {
      return await userApi.request<BackendInterest>(`/${INTERESTS_API_BASE}/${id}`);
    } catch {
      return null;
    }
  },

  /** Asigna una lista de intereses a un usuario (reemplaza los actuales) */
  async setUserInterests(userId: string, interestIds: string[]): Promise<void> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await userApi.request(`/${USERS_API_BASE}/${userId}`, {
      method: 'PUT',
      body: { interests: interestIds },
      headers,
    });
  },
};
