import { apiClient } from './client';

export interface DeploymentConfig {
  platform: 'cloudflare-pages' | 'vercel' | 'netlify';
  environmentVariables?: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
}

export interface DeploymentStatus {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled';
  platform: string;
  url?: string;
  previewUrl?: string;
  buildLogs?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

/**
 * Start deployment for a project
 */
export const startDeployment = async (
  projectId: string,
  config: DeploymentConfig
): Promise<{ data: DeploymentStatus }> => {
  return apiClient.post(`/deploy/${projectId}`, config);
};

/**
 * Get deployment status
 */
export const getDeploymentStatus = async (
  projectId: string
): Promise<{ data: DeploymentStatus }> => {
  return apiClient.get(`/deploy/${projectId}/status`);
};

/**
 * Get deployment logs
 */
export const getDeploymentLogs = async (
  projectId: string,
  deploymentId?: string
): Promise<{ data: DeploymentLog[] }> => {
  const url = deploymentId 
    ? `/deploy/${projectId}/logs/${deploymentId}`
    : `/deploy/${projectId}/logs`;
  return apiClient.get(url);
};

/**
 * Cancel deployment
 */
export const cancelDeployment = async (
  projectId: string,
  deploymentId: string
): Promise<{ data: { success: boolean } }> => {
  return apiClient.post(`/deploy/${projectId}/${deploymentId}/cancel`);
};

/**
 * Rollback deployment
 */
export const rollbackDeployment = async (
  projectId: string,
  targetDeploymentId: string
): Promise<{ data: DeploymentStatus }> => {
  return apiClient.post(`/deploy/${projectId}/rollback`, {
    targetDeploymentId,
  });
};

/**
 * Get deployment history
 */
export const getDeploymentHistory = async (
  projectId: string,
  limit = 10
): Promise<{ data: DeploymentStatus[] }> => {
  return apiClient.get(`/deploy/${projectId}/history`, {
    params: { limit },
  });
};

/**
 * Get available deployment platforms
 */
export const getDeploymentPlatforms = async (): Promise<{
  data: Array<{
    id: string;
    name: string;
    description: string;
    features: string[];
    limits: {
      builds: string;
      bandwidth: string;
      storage: string;
    };
  }>;
}> => {
  return apiClient.get('/deploy/platforms');
};

/**
 * Test deployment configuration
 */
export const testDeploymentConfig = async (
  projectId: string,
  config: DeploymentConfig
): Promise<{ data: { valid: boolean; issues?: string[] } }> => {
  return apiClient.post(`/deploy/${projectId}/test`, config);
};

/**
 * Get deployment metrics
 */
export const getDeploymentMetrics = async (
  projectId: string,
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<{
  data: {
    requests: number;
    bandwidth: number;
    errors: number;
    responseTime: number;
    uptime: number;
    timeline: Array<{
      timestamp: string;
      requests: number;
      errors: number;
      responseTime: number;
    }>;
  };
}> => {
  return apiClient.get(`/deploy/${projectId}/metrics`, {
    params: { timeRange },
  });
};