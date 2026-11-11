import { AuthResponse, LoginCredentials, ApiErrorResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  statusCode: number;
  data?: ApiErrorResponse;

  constructor(message: string, statusCode: number, data?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/sign-in/`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        data?.detail ||
        data?.message ||
        (data?.non_field_errors && data.non_field_errors[0]) ||
        'Unable to sign in. Please verify your credentials.';
      throw new ApiError(errorMessage, res.status, data);
    }

    // Store tokens locally if in browser
    if (typeof window !== 'undefined') {
      localStorage.setItem('bob_access_token', data.access);
      localStorage.setItem('bob_refresh_token', data.refresh);
      localStorage.setItem('bob_user', JSON.stringify(data.user));
    }

    return data as AuthResponse;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error. Please check backend connection.';
    throw new ApiError(message, 0);
  }
}

export function getStoredUser(): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('bob_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bob_access_token');
    localStorage.removeItem('bob_refresh_token');
    localStorage.removeItem('bob_user');
  }
}

