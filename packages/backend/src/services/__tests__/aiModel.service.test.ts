import 'reflect-metadata';
import { AIModelService, AIModelConfig } from '../aiModel.service';
import { NotFoundError, ValidationError, InsufficientPermissionsError, ExternalServiceError } from '../../utils/errors';
import axios from 'axios';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  loggers: {
    business: {
      projectCreated: jest.fn(),
    },
    external: {
      error: jest.fn(),
    },
  },
}));

jest.mock('axios');

const mockPrisma = require('../../lib/prisma').prisma;
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('AIModelService', () => {
  let aiModelService: AIModelService;

  beforeEach(() => {
    aiModelService = new AIModelService();
    jest.clearAllMocks();
  });

  describe('connectModel', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';
    const modelConfig: AIModelConfig = {
      type: 'teachable-machine',
      modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
      modelId: 'tm-test-model',
      configuration: {
        classes: ['cat', 'dog'],
        imageSize: 224,
        type: 'image',
      },
    };

    it('AI 모델 연결 성공', async () => {
      // Given
      const existingProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: null,
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        aiModel: JSON.stringify(modelConfig),
      });

      // When
      await aiModelService.connectModel(projectId, userId, modelConfig);

      // Then
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          aiModel: JSON.stringify(modelConfig),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('Hugging Face 모델 연결 성공', async () => {
      // Given
      const huggingFaceConfig: AIModelConfig = {
        type: 'huggingface',
        modelUrl: 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
        modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
        configuration: {
          task: 'text-classification',
          pipeline: 'sentiment-analysis',
          tokenRequired: false,
        },
      };

      const existingProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: null,
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        aiModel: JSON.stringify(huggingFaceConfig),
      });

      // When
      await aiModelService.connectModel(projectId, userId, huggingFaceConfig);

      // Then
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          aiModel: JSON.stringify(huggingFaceConfig),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('존재하지 않는 프로젝트에 모델 연결 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(aiModelService.connectModel(projectId, userId, modelConfig))
        .rejects.toThrow(NotFoundError);
      
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('다른 사용자의 프로젝트에 모델 연결 시 InsufficientPermissionsError 발생', async () => {
      // Given
      const otherUserProject = {
        id: projectId,
        userId: 'other-user-id',
        name: 'Test Project',
        aiModel: null,
      };

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject);

      // When & Then
      await expect(aiModelService.connectModel(projectId, userId, modelConfig))
        .rejects.toThrow(InsufficientPermissionsError);
    });

    it('잘못된 모델 URL로 연결 시 ValidationError 발생', async () => {
      // Given
      const invalidConfig: AIModelConfig = {
        type: 'teachable-machine',
        modelUrl: 'invalid-url',
        modelId: 'tm-test-model',
        configuration: {
          classes: ['cat', 'dog'],
          imageSize: 224,
          type: 'image',
        },
      };

      const existingProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: null,
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);

      // When & Then
      await expect(aiModelService.connectModel(projectId, userId, invalidConfig))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('testModel', () => {
    const modelConfig: AIModelConfig = {
      type: 'teachable-machine',
      modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
      modelId: 'tm-test-model',
      configuration: {
        classes: ['positive', 'negative'],
        imageSize: 224,
        type: 'image',
      },
    };

    it('Teachable Machine 모델 테스트 성공', async () => {
      // Given
      const mockMetadata = {
        labels: ['positive', 'negative'],
        modelType: 'image',
        version: '1.0',
      };

      mockAxios.get.mockResolvedValue({
        data: mockMetadata,
        status: 200,
      });

      // When
      const result = await aiModelService.testModel(modelConfig);

      // Then
      expect(result).toEqual({
        status: 'success',
        message: 'Teachable Machine model is accessible',
        details: {
          classes: ['positive', 'negative'],
          modelType: 'image',
          version: '1.0',
        },
      });
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://teachablemachine.withgoogle.com/models/test-model//metadata.json',
        { timeout: 10000 }
      );
    });

    it('Hugging Face 모델 테스트 성공', async () => {
      // Given
      const huggingFaceConfig: AIModelConfig = {
        type: 'huggingface',
        modelUrl: 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
        modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
        configuration: {
          task: 'text-classification',
          pipeline: 'sentiment-analysis',
          tokenRequired: false,
        },
      };

      mockAxios.post.mockResolvedValue({
        data: [{ label: 'POSITIVE', score: 0.9 }],
        status: 200,
      });

      // When
      const result = await aiModelService.testModel(huggingFaceConfig);

      // Then
      expect(result).toEqual({
        status: 'success',
        message: 'Hugging Face model is accessible',
        details: {
          modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
          task: 'text-classification',
          responseStatus: 200,
        },
      });
    });

    it('Custom 모델 테스트 성공', async () => {
      // Given
      const customConfig: AIModelConfig = {
        type: 'custom',
        modelUrl: 'https://api.example.com/v1/predict',
        modelId: 'custom-classifier-v1',
        configuration: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          inputFormat: 'json',
          outputFormat: 'json',
        },
      };

      (mockAxios as any).mockResolvedValue({
        data: { prediction: 'success' },
        status: 200,
      });

      // When
      const result = await aiModelService.testModel(customConfig);

      // Then
      expect(result).toEqual({
        status: 'success',
        message: 'Custom model endpoint is accessible',
        details: {
          modelId: 'custom-classifier-v1',
          responseStatus: 200,
          method: 'POST',
        },
      });
    });

    it('모델 테스트 실패 시 에러 반환', async () => {
      // Given
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      // When
      const result = await aiModelService.testModel(modelConfig);

      // Then
      expect(result.status).toBe('error');
      expect(result.message).toContain('Network error');
    });
  });

  describe('disconnectModel', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('AI 모델 연결 해제 성공', async () => {
      // Given
      const projectWithModel = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: JSON.stringify({
          type: 'teachable-machine',
          modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
        }),
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithModel);
      mockPrisma.project.update.mockResolvedValue({
        ...projectWithModel,
        aiModel: null,
      });

      // When
      await aiModelService.disconnectModel(projectId, userId);

      // Then
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          aiModel: null,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('존재하지 않는 프로젝트 연결 해제 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(aiModelService.disconnectModel(projectId, userId))
        .rejects.toThrow(NotFoundError);
    });

    it('다른 사용자의 프로젝트 연결 해제 시 InsufficientPermissionsError 발생', async () => {
      // Given
      const otherUserProject = {
        id: projectId,
        userId: 'other-user-id',
        name: 'Test Project',
        aiModel: null,
      };

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject);

      // When & Then
      await expect(aiModelService.disconnectModel(projectId, userId))
        .rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('getModelConfig', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('AI 모델 설정 조회 성공', async () => {
      // Given
      const modelConfig: AIModelConfig = {
        type: 'teachable-machine',
        modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
        modelId: 'tm-test-model',
        configuration: {
          classes: ['cat', 'dog'],
          imageSize: 224,
          type: 'image',
        },
      };

      const projectWithModel = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: JSON.stringify(modelConfig),
        user: {
          settings: JSON.stringify({ privacy: { projectsPublic: false } }),
        },
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithModel);

      // When
      const result = await aiModelService.getModelConfig(projectId, userId);

      // Then
      expect(result).toEqual(modelConfig);
    });

    it('AI 모델이 연결되지 않은 프로젝트 조회', async () => {
      // Given
      const projectWithoutModel = {
        id: projectId,
        userId,
        name: 'Test Project',
        aiModel: null,
        user: {
          settings: JSON.stringify({ privacy: { projectsPublic: false } }),
        },
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithoutModel);

      // When
      const result = await aiModelService.getModelConfig(projectId, userId);

      // Then
      expect(result).toBeNull();
    });

    it('존재하지 않는 프로젝트 조회 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(aiModelService.getModelConfig(projectId, userId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getSupportedModelTypes', () => {
    it('지원되는 모델 타입 목록 반환', () => {
      // When
      const result = aiModelService.getSupportedModelTypes();

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('teachable-machine');
      expect(result[1].type).toBe('huggingface');
      expect(result[2].type).toBe('custom');
      
      // 각 타입이 필요한 속성들을 가지고 있는지 확인
      result.forEach(modelType => {
        expect(modelType).toHaveProperty('name');
        expect(modelType).toHaveProperty('description');
        expect(modelType).toHaveProperty('configSchema');
        expect(modelType).toHaveProperty('examples');
      });
    });
  });
});