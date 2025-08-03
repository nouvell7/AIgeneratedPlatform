import { apiClient } from './client';
import { Template, Project, ApiResponse } from '@shared/types';

export interface TemplateFilters {
  category?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  search?: string;
  tags?: string[];
}

export interface TemplatesResponse {
  templates: Template[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const getTemplates = async (params?: {
  page?: number;
  limit?: number;
  filters?: TemplateFilters;
}): Promise<ApiResponse<TemplatesResponse>> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.filters?.category) queryParams.append('category', params.filters.category);
  if (params?.filters?.difficulty) queryParams.append('difficulty', params.filters.difficulty);
  if (params?.filters?.search) queryParams.append('search', params.filters.search);
  if (params?.filters?.tags) queryParams.append('tags', params.filters.tags.join(','));

  const response = await apiClient.get(`/templates?${queryParams.toString()}`);
  return response.data;
};

export const getTemplate = async (templateId: string): Promise<ApiResponse<{ template: Template }>> => {
  const response = await apiClient.get(`/templates/${templateId}`);
  return response.data;
};

export const getFeaturedTemplates = async (limit?: number): Promise<ApiResponse<{ templates: Template[] }>> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const response = await apiClient.get(`/templates/featured?${queryParams.toString()}`);
  return response.data;
};

export const getPopularTemplates = async (limit?: number): Promise<ApiResponse<{ templates: Template[] }>> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const response = await apiClient.get(`/templates/popular?${queryParams.toString()}`);
  return response.data;
};

export const getTemplateCategories = async (): Promise<ApiResponse<{
  categories: Array<{ category: string; count: number }>;
}>> => {
  const response = await apiClient.get('/templates/categories');
  return response.data;
};

export const searchTemplates = async (
  query: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  }
): Promise<ApiResponse<TemplatesResponse & { query: string }>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.difficulty) queryParams.append('difficulty', params.difficulty);

  const response = await apiClient.get(`/templates/search?${queryParams.toString()}`);
  return response.data;
};

export const createProjectFromTemplate = async (
  templateId: string,
  data: { name: string; description?: string }
): Promise<ApiResponse<{
  project: Project;
  template: {
    id: string;
    name: string;
    codeTemplate: string;
  };
}>> => {
  const response = await apiClient.post(`/templates/from-template/${templateId}`, data);
  return response.data;
};
