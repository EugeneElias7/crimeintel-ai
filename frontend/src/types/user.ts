export type UserRole = 'OFFICER' | 'INSPECTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type AccountStatus = 'PENDING_DOCUMENT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DocumentType = 'EMPLOYEE_ID' | 'POLICE_ID' | 'OTHER_GOVERNMENT_ID';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  role: UserRole;
  account_status: AccountStatus;
  is_active: boolean;
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

export interface RegisterRequest {
  full_name: string;
  email: string;
  employee_id: string;
  department: string;
  designation: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  redirect_url: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface VerificationDocument {
  id: number;
  user_id: number;
  document_type: DocumentType;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  verification_status: VerificationStatus;
  uploaded_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface DocumentUploadResponse {
  message: string;
  document_id: number;
  redirect_url: string;
}

export interface VerificationStatusResponse {
  account_status: AccountStatus;
  document_status?: VerificationStatus;
  document?: VerificationDocument;
}

export interface AdminVerificationActionRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  employee_id: string;
  department: string;
  designation: string;
  role: UserRole;
  account_status: AccountStatus;
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  pages: number;
}

export interface UserUpdate {
  display_name?: string;
  phone?: string;
  badge_number?: string;
}