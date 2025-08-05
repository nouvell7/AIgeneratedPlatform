import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { DeploymentService } from '../../services/deployment.service';
import { DeploymentController } from '../deployment.controller';

// Mock the service
const mockDeploymentService = {
  startDeployment: jest.fn(),
  getDeploymentStatus: jest.fn(),
  getDeploymentLogs: jest.fn(),
  cancelDeployment: jest.fn(),
  rollbackDeployment: jest.fn(),
  getDeploymentHistory: jest.fn(),
  getDeploymentMetrics: jest.fn(),
};

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  });

  const controller = new DeploymentController();

  // Deployment routes
  app.post('/api/projects/:projectId/deploy', ...controller.startDeployment);
  app.get('/api/projects/:projectId/deployment/status', ...controller.getDeploymentStatus);

  return app;
};

describe('Deployment Controller Integration Simple Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    container.clearInstances();
    container.registerInstance(DeploymentService, mockDeploymentService as any);
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/:projectId/deploy', () => {
    it('배포 시작 성공', async () => {
      // Given
      const projectId = 'test-project-id';
      const deploymentConfig = {
        platform: 'cloudflare-pages',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      };
      
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
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Deployment started successfully');
      expect(response.body.data.deployment).toMatchObject({
        id: expectedResult.id,
        projectId: expectedResult.projectId,
        status: expectedResult.status,
        platform: expectedResult.platform,
      });
      
      expect(mockDeploymentService.startDeployment).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        deploymentConfig
      );
    });
  });

  describe('GET /api/projects/:projectId/deployment/status', () => {
    it('배포 상태 조회 성공', async () => {
      // Given
      const projectId = 'test-project-id';
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
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toMatchObject({
        id: expectedStatus.id,
        projectId: expectedStatus.projectId,
        status: expectedStatus.status,
        platform: expectedStatus.platform,
        url: expectedStatus.url,
        previewUrl: expectedStatus.previewUrl,
      });
      
      expect(mockDeploymentService.getDeploymentStatus).toHaveBeenCalledWith(
        projectId,
        'test-user-id'
      );
    });
  });
});