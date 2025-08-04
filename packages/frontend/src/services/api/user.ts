import { apiClient } from './client';
import { ApiResponse, User, UserSettings } from '@ai-service-platform/shared';

export interface UpdateProfileData {
  username?: string;
  profileImage?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStats {
  projectsCount: number;
  deploymentsCount: number;
  totalRevenue: number;
  communityPosts: number;
  communityComments: number;
  reputation: number;
}

export const userApi = {
  // Profile Management
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (
    updates: UpdateProfileData
  ): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/users/profile', updates);
    return response.data;
  },

  uploadProfileImage: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Password Management
  changePassword: async (
    passwordData: ChangePasswordData
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.put('/users/password', passwordData);
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.get('/users/settings');
    return response.data;
  },

  updateSettings: async (
    settings: Partial<UserSettings>
  ): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.put('/users/settings', settings);
    return response.data;
  },

  // Statistics
  getStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },

  // Account Management
  deleteAccount: async (password: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete('/users/account', {
      data: { password },
    });
    return response.data;
  },

  // API Keys
  getApiKeys: async (): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    permissions: string[];
    lastUsedAt?: string;
    expiresAt?: string;
    createdAt: string;
  }>>> => {
    const response = await apiClient.get('/users/api-keys');
    return response.data;
  },

  createApiKey: async (data: {
    name: string;
    permissions: string[];
    expiresAt?: string;
  }): Promise<ApiResponse<{
    id: string;
    key: string;
    name: string;
    permissions: string[];
    expiresAt?: string;
  }>> => {
    const response = await apiClient.post('/users/api-keys', data);
    return response.data;
  },

  revokeApiKey: async (keyId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/users/api-keys/${keyId}`);
    return response.data;
  },

  // OAuth Connections
  getOAuthConnections: async (): Promise<ApiResponse<Array<{
    provider: 'google' | 'github';
    connected: boolean;
    email?: string;
    connectedAt?: string;
  }>>> => {
    const response = await apiClient.get('/users/oauth/connections');
    return response.data;
  },

  disconnectOAuth: async (
    provider: 'google' | 'github'
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/users/oauth/${provider}`);
    return response.data;
  },

  // Activity Log
  getActivityLog: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      metadata?: Record<string, any>;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/users/activity?${queryParams}`);
    return response.data;
  },
};