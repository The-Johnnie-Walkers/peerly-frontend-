const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USER_MGMT_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001';
const AUTH_MGMT_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000';
const CONNECTIONS_MGMT_URL = import.meta.env.VITE_CONNECTIONS_API_URL || 'http://localhost:3002';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, baseUrl = this.baseUrl } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
    console.log(`[API Request] ${method} ${url}`, { 
      headers,
      body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : null 
    });
    
    try {
      const response = await fetch(url, config);
      console.log(`[API Response] ${method} ${url} | Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[API Error Response] ${method} ${url}`, errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API Success] ${method} ${url}`, data);
      return data;
    } catch (error) {
      console.error(`[API Fetch Failure] ${method} ${url}:`, error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(`[API Debug Tip] 'Failed to fetch' usually means the server at ${baseUrl} is not reachable or there is a CORS issue.`);
      }
      throw error;
    }
  }

  setTokenFromResponse(response: { token?: string }): void {
    if (response.token) {
      this.setToken(response.token);
    }
  }
}

export const api = new ApiClient(AUTH_MGMT_URL);
export const userApi = new ApiClient(USER_MGMT_URL);
export const authApi = new ApiClient(AUTH_MGMT_URL);
export const connectionsApi = new ApiClient(CONNECTIONS_MGMT_URL);
export const AUTH_API_BASE = 'auth';
export const USERS_API_BASE = 'users';
export const INTERESTS_API_BASE = 'interests';
