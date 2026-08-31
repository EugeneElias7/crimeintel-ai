import type { LoginRequest, LoginResponse, User, RegisterRequest, RegisterResponse, VerificationStatusResponse, DocumentUploadResponse } from '../types/user';
import type { ApiResponse } from '../types/api';
import api from './api';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const payload: LoginRequest = { email, password };
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
};

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const { data: response } = await api.post<RegisterResponse>('/auth/register', data);
  return response;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const { data } = await api.get<ApiResponse<User>>('/auth/me');
  return data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> => {
  await api.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
};

export const uploadVerificationDocument = async (
  userId: number,
  documentType: string,
  file: File
): Promise<DocumentUploadResponse> => {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('document_type', documentType);
  formData.append('file', file);

  const { data } = await api.post<DocumentUploadResponse>('/auth/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getVerificationStatus = async (userId: number): Promise<VerificationStatusResponse> => {
  const { data } = await api.get<VerificationStatusResponse>(`/auth/verification-status/${userId}`);
  return data;
};

export const forgotPassword = async (email: string): Promise<{ reset_link?: string; reset_token?: string }> => {
  const { data } = await api.post('/auth/reset-password', { email });
  return data.data || {};
};

export const confirmResetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  await api.post('/auth/reset-password/confirm', { token, new_password: newPassword, confirm_password: confirmPassword });
};

export const directResetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  await api.post('/auth/reset-password/direct', { email, new_password: newPassword, confirm_password: confirmPassword });
};

export const updateProfile = async (data: { display_name?: string; phone?: string; badge_number?: string }): Promise<User> => {
  const { data: res } = await api.put<User>('/auth/me', data);
  return res as unknown as User;
};