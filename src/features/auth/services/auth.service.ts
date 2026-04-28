import { userService } from '@/features/users/services/user.service';
import { authApi, AUTH_API_BASE } from '@/shared/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.request<LoginResponse>(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      body: credentials,
    });

    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_name', response.name);
      localStorage.setItem('user_email', response.email);
    }

    const userProfile = await userService.getUserByEmail(response.email);
    
    if (!userProfile) {
        authService.logout();
        throw new Error("No se encontro el perfil del usuario");
      }

    localStorage.setItem('user_id', userProfile.id);
    localStorage.setItem('user_data', JSON.stringify(userProfile));

    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await authApi.request<RegisterResponse>(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      body: data,
    });

    return response;
  },

  logout(): void {
    // Marcar offline antes de limpiar el userId
    const userId = localStorage.getItem('user_id');
    if (userId) {
      import('@/features/users/services/user.service').then(({ userService }) => {
        userService.updatePresence(userId, false);
      });
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
  },

  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    // Decode payload and check expiration without a library
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
      if (isExpired) {
        // Token expired — clear session and force re-login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        return null;
      }
    } catch {
      // Malformed token — discard it
      localStorage.removeItem('auth_token');
      return null;
    }

    return token;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getCurrentUser(): { id: string; name: string; email: string } | null {
    const id = localStorage.getItem('user_id');
    const name = localStorage.getItem('user_name');
    const email = localStorage.getItem('user_email');

    if (id && name && email) {
      return { id, name, email };
    }
    return null;
  },

  async forgotPassword(email: string): Promise<void> {
    const emailTrim = email.trim()
    await authApi.requestVoid(`${AUTH_API_BASE}/reset-request`, {
      method: 'POST',
      body: { email: emailTrim },
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const newPasswordTrim = newPassword.trim()
    await authApi.requestVoid(`${AUTH_API_BASE}/reset-password`, {
      method: 'POST',
      body: { token: token, newPassword: newPasswordTrim },
    });
  }
};
