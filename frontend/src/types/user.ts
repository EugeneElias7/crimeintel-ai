export type UserRole = 'officer' | 'inspector' | 'admin' | 'super_admin';

export interface User {
  user_id: string;
  display_name: string;
  email: string;
  role: UserRole;
  badge_number?: string;
  phone?: string;
  photo_url?: string;
  status: string;
  permissions: string[];
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface UserUpdate {
  display_name?: string;
  phone?: string;
  badge_number?: string;
}
