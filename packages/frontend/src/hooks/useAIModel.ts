import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import * as aiModelAPI from '../services/api/aiModel';
import {
  setLoading,
  setError,
  setCurrentModel,
  setTestResult,
  clearError,
} from '../store/slices/aiModelSlice';

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

export const useAIModel = () => {
  const dispatch = useDispatch();
  const {
    currentModel,
    isLoading,
    error,
    testResult,
    availableTypes,
  } = useSelector((state: RootState) => state.aiModel);

  const connectModel = useCallback(async (projectId: string, modelConfig: AIModelConfig) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await aiModelAPI.connectModel(projectId, modelConfig);
      
      if (response.success) {
        dispatch(setCurrentModel(response.data.project.aiModel));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect AI model';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const testModel = useCallback(async (projectId: string, testData: TestData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await aiModelAPI.testModel(projectId, testData);
      
      if (response.success) {
        dispatch(setTestResult(response.data));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test AI model';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const disconnectModel = useCallback(async (projectId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await aiModelAPI.disconnectModel(projectId);
      
      if (response.success) {
        dispatch(setCurrentModel(null));
        dispatch(setTestResult(null));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect AI model';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const getModelConfig = useCallback(async (projectId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await aiModelAPI.getModelConfig(projectId);
      
      if (response.success && response.data.hasModel) {
        dispatch(setCurrentModel(response.data.config));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get model config';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const clearTestResult = useCallback(() => {
    dispatch(setTestResult(null));
  }, [dispatch]);

  const clearModelError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    currentModel,
    isLoading,
    error,
    testResult,
    availableTypes,
    
    // Actions
    connectModel,
    testModel,
    disconnectModel,
    getModelConfig,
    clearTestResult,
    clearModelError,
  };
};