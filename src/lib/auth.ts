import { AuthResponse, LoginCredentials, ApiErrorResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export async function loginAdminStaff(credentials: LoginCredentials): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/sign-in/`;

  const identifier = (credentials.identifier || (credentials as any).username || '').trim();
  const password = credentials.password || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      data?.errors?.[0]?.detail ||
      data?.detail ||
      data?.message ||
      (data?.non_field_errors && data.non_field_errors[0]) ||
      'Invalid identifier or password.';
    throw new AuthError(errorMsg, res.status);
  }

  // Strict check: ONLY admin and staff members can access this portal
  if (!data.user?.is_staff) {
    throw new AuthError(
      'Access Denied: Only administrators and staff members are authorized to access the Attendance Management Portal.',
      403
    );
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('bob_access_token', data.access);
    localStorage.setItem('bob_refresh_token', data.refresh);
    localStorage.setItem('bob_staff_user', JSON.stringify(data.user));
  }

  return data as AuthResponse;
}

export function getStaffUser(): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('bob_staff_user');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.is_staff) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function logoutStaff(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bob_access_token');
    localStorage.removeItem('bob_refresh_token');
    localStorage.removeItem('bob_staff_user');
    window.location.href = '/login';
  }
}

