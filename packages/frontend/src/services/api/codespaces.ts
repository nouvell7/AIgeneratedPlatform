import { apiClient } from './client';

export interface CodespaceConfig {
  repositoryName: string;
  branch?: string;
  machine?: string;
  devcontainerPath?: string;
  idleTimeoutMinutes?: number;
}

export interface CodespaceInfo {
  id: number;
  name: string;
  displayName: string;
  state: string;
  url: string;
  webUrl: string;
  repository: {
    id: number;
    name: string;
    fullName: string;
  };
  machine: {
    name: string;
    displayName: string;
    operatingSystem: string;
    storageInBytes: number;
    memoryInBytes: number;
    cpus: number;
  };
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
}

export interface DevelopmentEnvironment {
  repository: any;
  codespace: CodespaceInfo;
  project: any;
}

export interface DevelopmentEnvironmentStatus {
  codespace?: CodespaceInfo;
  repository?: any;
  status: 'none' | 'creating' | 'available' | 'unavailable';
}

/**
 * Create a new codespace
 */
export const createCodespace = async (
  owner: string,
  repo: string,
  config: CodespaceConfig
) => {
  return apiClient.post('/codespaces', {
    owner,
    repo,
    config,
  });
};

/**
 * Get codespace information
 */
export const getCodespace = async (codespaceId: string) => {
  return apiClient.get(`/codespaces/${codespaceId}`);
};

/**
 * List codespaces
 */
export const listCodespaces = async (repositoryId?: number) => {
  const params = repositoryId ? { repositoryId } : {};
  return apiClient.get('/codespaces', { params });
};

/**
 * Start a codespace
 */
export const startCodespace = async (codespaceId: string) => {
  return apiClient.post(`/codespaces/${codespaceId}/start`);
};

/**
 * Stop a codespace
 */
export const stopCodespace = async (codespaceId: string) => {
  return apiClient.post(`/codespaces/${codespaceId}/stop`);
};

/**
 * Delete a codespace
 */
export const deleteCodespace = async (codespaceId: string) => {
  return apiClient.delete(`/codespaces/${codespaceId}`);
};

/**
 * Create repository with AI service template
 */
export const createRepositoryWithTemplate = async (
  owner: string,
  repoName: string,
  description: string,
  aiModelConfig: any
) => {
  return apiClient.post('/codespaces/repository', {
    owner,
    repoName,
    description,
    aiModelConfig,
  });
};

/**
 * Get available machine types
 */
export const getAvailableMachines = async (owner: string, repo: string) => {
  return apiClient.get(`/codespaces/machines/${owner}/${repo}`);
};

/**
 * Create development environment for a project
 */
export const createDevelopmentEnvironment = async (
  projectId: string,
  aiModelConfig?: any
): Promise<{ data: DevelopmentEnvironment }> => {
  return apiClient.post(`/projects/${projectId}/development-environment`, {
    aiModelConfig,
  });
};

/**
 * Get development environment status
 */
export const getDevelopmentEnvironmentStatus = async (
  projectId: string
): Promise<{ data: DevelopmentEnvironmentStatus }> => {
  return apiClient.get(`/projects/${projectId}/development-environment/status`);
};

/**
 * Start development environment
 */
export const startDevelopmentEnvironment = async (projectId: string) => {
  return apiClient.post(`/projects/${projectId}/development-environment/start`);
};

/**
 * Stop development environment
 */
export const stopDevelopmentEnvironment = async (projectId: string) => {
  return apiClient.post(`/projects/${projectId}/development-environment/stop`);
};