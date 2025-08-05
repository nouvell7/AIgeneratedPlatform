import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { DeploymentService } from '../../services/deployment.service';
import { DeploymentController } from '../deployment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { errorHandler } from '../../middleware/error.middleware';

// Mock dependencies
jest.mock('../../services/deployment.service');
jest.mock('../../middleware/auth.middleware');

const MockDeploymentService = DeploymentService as jest.MockedClass<typeof DeploymentService>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  mockAuthMiddleware.mockImplementation(async (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
    return undefined;
  });

  const controller = new DeploymentController();

  // Deployment routes
  app.post('/api/projects/:projectId/deploy', mockAuthMiddleware, ...controller.startDeployment);
  app.get('/api/projects/:projectId/deployment/status', mockAuthMiddleware, ...controller.getDeploymentStatus);
  app.get('/api/projects/:projectId/deployment/logs', mockAuthMiddleware, ...controller.getDeploymentLogs);
  app.post('/api/projects/:projectId/deployment/:deploymentId/cancel', mockAuthMiddleware, ...controller.cancelDeployment);
  app.post('/api/projects/:projectId/deployment/:targetDeploymentId/rollback', mockAuthMiddleware, ...controller.rollbackDeployment);
  app.get('/api/projects/:projectId/deployment/history', mockAuthMiddleware, ...controller.getDeploymentHistory);
  app.get('/api/projects/:projectId/deployment/metrics', mockAuthMiddleware, ...controller.getDeploymentMetrics);

  app.use(errorHandler);
  return app;
};

describe('Deployment Controller Integration Tests', () => {
  let app: express.Application;
  let mockDeploymentService: jest.Mocked<DeploymentService>;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    // Create mock instance with proper constructor arguments
    const mockProjectService = {} as any;
    mockDeploymentService = {
      startDeployment: jest.fn(),
      getDeploymentStatus: jest.fn(),
      getDeploymentLogs: jest.fn(),
      cancelDeployment: jest.fn(),
      rollbackDeployment: jest.fn(),
      getDeploymentHistory: jest.fn(),
      getDeploymentMetrics: jest.fn(),
    } as unknown as jest.Mocked<DeploymentService>;
    
    container.clearInstances();
    container.registerInstance(DeploymentService, mockDeploymentService);
    jest.clearAllMocks();
  });

  describe('POST /api/projects/:projectId/deploy', () => {
    const projectId = 'test-project-id';
    const deploymentConfig = {
      platform: 'cloudflare-pages',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    };

    it('배포 시작 성공', async () => {
      // Given
      const expectedResult = {
        id: 'deployment-123',
        projectId,
        status: 'pending' as const,
        platform: 'cloudflare-pages',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDeploymentService.startDeployment.mockResolvedValue(expectedResult);

      // When
      const response = await request(app)
        .post(`/api/projects/${projectId}/deploy`)
        .send(deploymentConfig);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: { deployment: expectedResult },
        message: 'Deployment started successfully',
      });
      expect(mockDeploymentService.startDeployment).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        deploymentConfig
      );
    });

    it('잘못된 플랫폼으로 배포 시작 시 400 에러', async () => {
      // Given
      const invalidConfig = {
        ...deploymentConfig,
        platform: 'invalid-platform',
      };

      // When
      const response = await request(app)
        .post(`/api/projects/${projectId}/deploy`)
        .send(invalidConfig);

      // Then
      expect(response.status).toBe(400);
      expect(mockDeploymentService.startDeployment).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:projectId/deployment/status', () => {
    const projectId = 'test-project-id';

    it('배포 상태 조회 성공', async () => {
      // Given
      const expectedStatus = {
        id: 'deployment-123',
        projectId,
        status: 'success' as const,
        platform: 'cloudflare-pages',
        url: 'https://test.example.com',
        previewUrl: 'https://preview.example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };
      mockDeploymentService.getDeploymentStatus.mockResolvedValue(expectedStatus);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/status`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { status: expectedStatus },
      });
      expect(mockDeploymentService.getDeploymentStatus).toHaveBeenCalledWith(
        projectId,
        'test-user-id'
      );
    });

    it('배포가 없을 때 null 반환', async () => {
      // Given
      mockDeploymentService.getDeploymentStatus.mockResolvedValue(null);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/status`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { status: null },
      });
    });
  });

  describe('GET /api/projects/:projectId/deployment/logs', () => {
    const projectId = 'test-project-id';

    it('배포 로그 조회 성공', async () => {
      // Given
      const expectedLogs = [
        {
          level: 'info' as const,
          message: 'Starting deployment...',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
        {
          level: 'info' as const,
          message: 'Deployment complete!',
          timestamp: '2023-01-01T00:05:00.000Z',
        },
      ];
      mockDeploymentService.getDeploymentLogs.mockResolvedValue(expectedLogs);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/logs`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { logs: expectedLogs },
      });
      expect(mockDeploymentService.getDeploymentLogs).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        undefined
      );
    });

    it('특정 배포 ID로 로그 조회', async () => {
      // Given
      const deploymentId = 'deployment-123';
      const expectedLogs = [
        {
          level: 'info' as const,
          message: 'Starting deployment...',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      ];
      mockDeploymentService.getDeploymentLogs.mockResolvedValue(expectedLogs);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/logs?deploymentId=${deploymentId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { logs: expectedLogs },
      });
      expect(mockDeploymentService.getDeploymentLogs).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        deploymentId
      );
    });
  });

  describe('POST /api/projects/:projectId/deployment/:deploymentId/cancel', () => {
    const projectId = 'test-project-id';
    const deploymentId = 'deployment-123';

    it('배포 취소 성공', async () => {
      // Given
      mockDeploymentService.cancelDeployment.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .post(`/api/projects/${projectId}/deployment/${deploymentId}/cancel`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Deployment cancelled successfully',
      });
      expect(mockDeploymentService.cancelDeployment).toHaveBeenCalledWith(
        projectId,
        deploymentId,
        'test-user-id'
      );
    });
  });

  describe('POST /api/projects/:projectId/deployment/:targetDeploymentId/rollback', () => {
    const projectId = 'test-project-id';
    const targetDeploymentId = 'target-deployment-123';

    it('배포 롤백 성공', async () => {
      // Given
      const expectedResult = {
        id: 'rollback-deployment-123',
        projectId,
        status: 'pending' as const,
        platform: 'cloudflare-pages',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDeploymentService.rollbackDeployment.mockResolvedValue(expectedResult);

      // When
      const response = await request(app)
        .post(`/api/projects/${projectId}/deployment/${targetDeploymentId}/rollback`);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: { deployment: expectedResult },
        message: 'Rollback started successfully',
      });
      expect(mockDeploymentService.rollbackDeployment).toHaveBeenCalledWith(
        projectId,
        targetDeploymentId,
        'test-user-id'
      );
    });
  });

  describe('GET /api/projects/:projectId/deployment/history', () => {
    const projectId = 'test-project-id';

    it('배포 히스토리 조회 성공', async () => {
      // Given
      const expectedHistory = [
        {
          id: 'deployment-1',
          projectId,
          status: 'success' as const,
          platform: 'cloudflare-pages',
          url: 'https://test1.example.com',
          previewUrl: 'https://preview1.example.com',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          completedAt: new Date('2023-01-02'),
        },
        {
          id: 'deployment-2',
          projectId,
          status: 'failed' as const,
          platform: 'cloudflare-pages',
          error: 'Build failed',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-01'),
        },
      ];
      mockDeploymentService.getDeploymentHistory.mockResolvedValue(expectedHistory);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/history`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { history: expectedHistory },
      });
      expect(mockDeploymentService.getDeploymentHistory).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        10
      );
    });

    it('limit 파라미터로 히스토리 조회', async () => {
      // Given
      const limit = 5;
      const expectedHistory: any[] = [];
      mockDeploymentService.getDeploymentHistory.mockResolvedValue(expectedHistory);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/history?limit=${limit}`);

      // Then
      expect(response.status).toBe(200);
      expect(mockDeploymentService.getDeploymentHistory).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        limit
      );
    });
  });

  describe('GET /api/projects/:projectId/deployment/metrics', () => {
    const projectId = 'test-project-id';

    it('배포 메트릭 조회 성공', async () => {
      // Given
      const expectedMetrics = {
        requests: 5000,
        bandwidth: 1000000000,
        errors: 25,
        responseTime: 250,
        uptime: 0.99,
        timeline: [
          {
            timestamp: '2023-01-01T00:00:00.000Z',
            requests: 100,
            errors: 2,
            responseTime: 200,
          },
        ],
      };
      mockDeploymentService.getDeploymentMetrics.mockResolvedValue(expectedMetrics);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/metrics`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { metrics: expectedMetrics },
      });
      expect(mockDeploymentService.getDeploymentMetrics).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        '24h'
      );
    });

    it('timeRange 파라미터로 메트릭 조회', async () => {
      // Given
      const timeRange = '7d';
      const expectedMetrics = {
        requests: 35000,
        bandwidth: 7000000000,
        errors: 175,
        responseTime: 300,
        uptime: 0.98,
        timeline: [],
      };
      mockDeploymentService.getDeploymentMetrics.mockResolvedValue(expectedMetrics);

      // When
      const response = await request(app)
        .get(`/api/projects/${projectId}/deployment/metrics?timeRange=${timeRange}`);

      // Then
      expect(response.status).toBe(200);
      expect(mockDeploymentService.getDeploymentMetrics).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        timeRange
      );
    });
  });
});