export interface UserProfile {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface AuthUser {
  id: number;
  identifier?: string;
  username?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile?: UserProfile;
  is_staff: boolean;
}

export interface AuthResponse {
  refresh: string;
  access: string;
  user: AuthUser;
}

export interface LoginCredentials {
  identifier?: string;
  username?: string;
  password?: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
