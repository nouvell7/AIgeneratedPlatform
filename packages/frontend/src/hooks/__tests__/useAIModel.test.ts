import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAIModel } from '../useAIModel';
import aiModelReducer from '../../store/slices/aiModelSlice';
import * as aiModelAPI from '../../services/api/aiModel';

// Mock dependencies
jest.mock('../../services/api/aiModel');

const mockAIModelAPI = aiModelAPI as jest.Mocked<typeof aiModelAPI>;

// Mock types
interface AIModelConfig {
  type: 'teachable-machine' | 'hugging-face';
  modelUrl?: string;
  modelId?: string;
  apiKey?: string;
  labels?: string[];
  inputType?: 'image' | 'audio' | 'text';
  task?: string;
}

interface TestData {
  input: string;
  inputType: 'text' | 'image' | 'audio';
}

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      aiModel: aiModelReducer,
    },
    preloadedState: {
      aiModel: {
        currentModel: null,
        isLoading: false,
        error: null,
        testResult: null,
        availableTypes: [],
        ...initialState,
      },
    },
  });
};

const renderHookWithProvider = (initialState = {}) => {
  const store = createTestStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(Provider, { store }, children);
  return renderHook(() => useAIModel(), { wrapper });
};

describe('useAIModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI 모델 연결', () => {
    it('AI 모델 연결 성공', async () => {
      // Given
      const projectId = 'test-project-id';
      const modelConfig: AIModelConfig = {
        type: 'teachable-machine',
        modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
        labels: ['cat', 'dog'],
        inputType: 'image',
      };

      const mockResponse = {
        success: true,
        data: {
          project: {
            id: projectId,
            aiModel: modelConfig,
            updatedAt: new Date().toISOString(),
          },
        },
        message: 'AI model connected successfully',
      };

      mockAIModelAPI.connectModel.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.connectModel(projectId, modelConfig);
      });

      // Then
      expect(mockAIModelAPI.connectModel).toHaveBeenCalledWith(projectId, modelConfig);
    });
  });

  describe('AI 모델 테스트', () => {
    it('AI 모델 테스트 실행 성공', async () => {
      // Given
      const projectId = 'test-project-id';
      const testData: TestData = {
        input: 'test input',
        inputType: 'text',
      };

      const mockResponse = {
        success: true,
        data: {
          success: true,
          predictions: [
            { label: 'positive', confidence: 0.8 },
            { label: 'negative', confidence: 0.2 },
          ],
          modelType: 'teachable-machine',
        },
      };

      mockAIModelAPI.testModel.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.testModel(projectId, testData);
      });

      // Then
      expect(mockAIModelAPI.testModel).toHaveBeenCalledWith(projectId, testData);
    });
  });

  describe('AI 모델 연결 해제', () => {
    it('AI 모델 연결 해제 성공', async () => {
      // Given
      const projectId = 'test-project-id';

      const mockResponse = {
        success: true,
        message: 'AI model disconnected successfully',
      };

      mockAIModelAPI.disconnectModel.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.disconnectModel(projectId);
      });

      // Then
      expect(mockAIModelAPI.disconnectModel).toHaveBeenCalledWith(projectId);
    });
  });
});