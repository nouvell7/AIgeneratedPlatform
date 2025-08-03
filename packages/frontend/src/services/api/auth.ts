import { apiClient } from './client';
import { User, ApiResponse } from '@shared/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const logout = async (): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>> => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
  const response = await apiClient.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/change-password', data);
  return response.data;
};

export const deleteAccount = async (password: string): Promise<ApiResponse> => {
  const response = await apiClient.delete('/auth/account', { data: { password } });
  return response.data;
};

// OAuth
export const googleLogin = async (accessToken: string): Promise<ApiResponse<AuthResponse & { isNewUser: boolean }>> => {
  const response = await apiClient.post('/auth/oauth/google', { accessToken });
  return response.data;
};

export const githubLogin = async (accessToken: string): Promise<ApiResponse<AuthResponse & { isNewUser: boolean }>> => {
  const response = await apiClient.post('/auth/oauth/github', { accessToken });
  return response.data;
};

export const getOAuthStatus = async (): Promise<ApiResponse<{
  google: boolean;
  github: boolean;
  hasPassword: boolean;
}>> => {
  const response = await apiClient.get('/auth/oauth/status');
  return response.data;
};

export const unlinkOAuthAccount = async (provider: 'google' | 'github'): Promise<ApiResponse> => {
  const response = await apiClient.delete('/auth/oauth/unlink', { data: { provider } });
  return response.data;
};
