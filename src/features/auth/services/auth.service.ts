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
      // No guardar el authId aún, primero obtener el userId de user-management
      localStorage.setItem('user_name', response.name);
      localStorage.setItem('user_email', response.email);
    }
    
    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await authApi.request<RegisterResponse>(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      body: data,
    });
    
    // Guardar el ID del usuario registrado
    if (response.id) {
      localStorage.setItem('user_id', response.id);
      localStorage.setItem('user_name', response.name);
      localStorage.setItem('user_email', response.email);
    }
    
    return response;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
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
};