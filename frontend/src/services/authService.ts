import type { LoginRequest, LoginResponse, User } from '../types/user';
import type { ApiResponse } from '../types/api';
import api from './api';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const payload: LoginRequest = { email, password };
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
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
