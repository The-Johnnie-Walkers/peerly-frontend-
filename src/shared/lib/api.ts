const USER_MGMT_URL = 'http://localhost:3001';
const AUTH_MGMT_URL = 'https://peerly-authentication-management-gfddasemeyhudxe3.canadacentral-01.azurewebsites.net';
const ACTIVITIES_MGMT_URL = 'http://localhost:3005';

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
    
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[API Error Response] ${method} ${url}`, errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const textResponse = await response.text();
      return JSON.parse(textResponse) as T;
      
    } catch (error) {
      throw error;
    }
  }

  async requestVoid(endpoint: string, options: RequestOptions = {}): Promise<void> {
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
    
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
      }
      
    } catch (error) {
      throw error;
    }

  }

  setTokenFromResponse(response: { token?: string }): void {
    if (response.token) {
      this.setToken(response.token);
    }
  }
}

const CONNECTIONS_MGMT_URL = 'http://localhost:3002';

export const AUTH_API_BASE = 'auth';
export const USERS_API_BASE = 'users';
export const ACTIVITIES_API_BASE = 'activities';
export const userApi = new ApiClient(USER_MGMT_URL);
export const authApi = new ApiClient(AUTH_MGMT_URL);
export const activityApi = new ApiClient(ACTIVITIES_MGMT_URL);
export const connectionsApi = new ApiClient(CONNECTIONS_MGMT_URL);
