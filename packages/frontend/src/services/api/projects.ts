import { apiClient } from './client';
import { Project, ApiResponse } from '@/types'; // Use frontend types/index.ts
import { UpdatePageContentInput } from '@/lib/schemas'; // Import new schema

export interface CreateProjectData {
  name: string;
  description: string;
  category: string;
}

export interface ProjectFilters {
  status?: string;
  category?: string;
  search?: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const getProjects = async (params?: {
  page?: number;
  limit?: number;
  filters?: ProjectFilters;
}): Promise<ApiResponse<ProjectsResponse>> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.filters?.status) queryParams.append('status', params.filters.status);
  if (params?.filters?.category) queryParams.append('category', params.filters.category);
  if (params?.filters?.search) queryParams.append('search', params.filters.search);

  const response = await apiClient.get(`/projects?${queryParams.toString()}`);
  return response.data;
};

export const getProject = async (projectId: string): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (data: CreateProjectData): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.post('/projects', data);
  return response.data;
};

export const updateProject = async (
  projectId: string,
  data: Partial<Project>
): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.put(`/projects/${projectId}`, data);
  return response.data;
};

export const deleteProject = async (projectId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

export const duplicateProject = async (
  projectId: string,
  name?: string
): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.post(`/projects/${projectId}/duplicate`, { name });
  return response.data;
};

export const archiveProject = async (projectId: string): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.post(`/projects/${projectId}/archive`);
  return response.data;
};

export const restoreProject = async (projectId: string): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.post(`/projects/${projectId}/restore`);
  return response.data;
};

export const getProjectStats = async (projectId: string): Promise<ApiResponse<{
  stats: {
    views: number;
    deployments: number;
    revenue: number;
    lastDeployed?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}>> => {
  const response = await apiClient.get(`/projects/${projectId}/stats`);
  return response.data;
};

export const getPublicProjects = async (params?: {
  page?: number;
  limit?: number;
  filters?: ProjectFilters;
}): Promise<ApiResponse<ProjectsResponse>> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.filters?.status) queryParams.append('status', params.filters.status);
  if (params?.filters?.category) queryParams.append('category', params.filters.category);
  if (params?.filters?.search) queryParams.append('search', params.filters.search);

  const response = await apiClient.get(`/projects/public?${queryParams.toString()}`);
  return response.data;
};

export const searchProjects = async (
  query: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    publicOnly?: boolean;
  }
): Promise<ApiResponse<ProjectsResponse & { query: string }>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.publicOnly) queryParams.append('publicOnly', 'true');

  const response = await apiClient.get(`/projects/search?${queryParams.toString()}`);
  return response.data;
};

export const getProjectCategories = async (): Promise<ApiResponse<{
  categories: Array<{ category: string; count: number }>;
}>> => {
  const response = await apiClient.get('/projects/categories');
  return response.data;
};

export const updateProjectPageContent = async (
  projectId: string,
  data: UpdatePageContentInput['pageContent']
): Promise<ApiResponse<{ project: Project }>> => {
  const response = await apiClient.put(`/projects/${projectId}/page-content`, { pageContent: data });
  return response.data;
};
