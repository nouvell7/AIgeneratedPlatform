import { apiClient } from './client';

export interface AIModelConfig {
  type: 'teachable-machine' | 'hugging-face';
  modelUrl?: string;
  modelId?: string;
  apiKey?: string;
  labels?: string[];
  inputType?: 'image' | 'audio' | 'text';
  task?: string;
}

export interface TestData {
  input: string;
  inputType: 'text' | 'image' | 'audio';
}

export interface TestResult {
  success: boolean;
  predictions: any[];
  modelType: string;
  error?: string;
}

export interface ModelStatus {
  hasModel: boolean;
  config: AIModelConfig | null;
  status: 'connected' | 'not_connected' | 'error';
}

export interface AIModelType {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
}

export const connectModel = async (projectId: string, modelConfig: AIModelConfig) => {
  const response = await apiClient.post(`/projects/${projectId}/ai-model`, modelConfig);
  return response.data;
};

export const getModelConfig = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}/ai-model`);
  return response.data;
};

export const disconnectModel = async (projectId: string) => {
  const response = await apiClient.delete(`/projects/${projectId}/ai-model`);
  return response.data;
};

export const testModel = async (projectId: string, testData: TestData) => {
  const response = await apiClient.post(`/projects/${projectId}/ai-model/test`, testData);
  return response.data;
};

export const getAvailableTypes = async () => {
  const response = await apiClient.get('/ai-models/types');
  return response.data;
};

export const validateModelConfig = async (type: string, config: any) => {
  const response = await apiClient.post('/ai-models/validate', { type, config });
  return response.data;
};