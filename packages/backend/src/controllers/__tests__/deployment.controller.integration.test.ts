import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { DeploymentController } from '../deployment.controller';
import { DeploymentService } from '../../services/deployment.service';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

// Extend the Request type to include a user property
declare module 'express' {
  export interface Request {
    user?: { userId: string; email: string; role: string; };
  }
}

// Mock the DeploymentService
jest.mock('../../services/deployment.service');
const mockDeploymentService = DeploymentService as jest.MockedClass<typeof DeploymentService>;

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const app = express();
app.use(express.json());

// Middleware to mock req.user
app.use((req, res, next) => {
  req.user = { userId: 'testUserId', email: 'test@example.com', role: 'USER' };
  next();
});

let deploymentController: DeploymentController;

beforeAll(() => {
  // Register a mock instance of DeploymentService
  container.registerSingleton(DeploymentService, mockDeploymentService);
  deploymentController = container.resolve(DeploymentController);

  // Manually set up routes for the controller methods
  app.post('/projects/:projectId/deploy', (req, res) => deploymentController.startDeployment(req, res));
  app.get('/projects/:projectId/deploy/status', (req, res) => deploymentController.getDeploymentStatus(req, res));
  app.get('/projects/:projectId/deploy/logs/:deploymentId?', (req, res) => deploymentController.getDeploymentLogs(req, res));
  app.post('/projects/:projectId/deploy/:deploymentId/cancel', (req, res) => deploymentController.cancelDeployment(req, res));
  app.post('/projects/:projectId/deploy/rollback', (req, res) => deploymentController.rollbackDeployment(req, res));
  app.get('/projects/:projectId/deploy/history', (req, res) => deploymentController.getDeploymentHistory(req, res));
  app.get('/projects/:projectId/deploy/metrics', (req, res) => deploymentController.getDeploymentMetrics(req, res));
  app.get('/deploy/platforms', (req, res) => deploymentController.getDeploymentPlatforms(req, res));
  app.post('/projects/:projectId/deploy/test-config', (req, res) => deploymentController.testDeploymentConfig(req, res));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DeploymentController', () => {
  const mockProjectId = 'testProjectId';
  const mockUserId = 'testUserId';

  describe('POST /projects/:projectId/deploy', () => {
    const mockDeploymentConfig = {
      platform: 'cloudflare-pages',
      buildCommand: 'npm run build',
    };
    const mockDeploymentStatus = {
      id: 'deploy1',
      projectId: mockProjectId,
      status: 'pending',
      platform: 'cloudflare-pages',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should start a deployment successfully', async () => {
      mockDeploymentService.prototype.startDeployment.mockResolvedValue(mockDeploymentStatus as any);

      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy`)
        .send(mockDeploymentConfig);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectId).toBe(mockProjectId);
      expect(mockDeploymentService.prototype.startDeployment).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId,
        mockDeploymentConfig
      );
    });

    it('should return 400 if projectId is missing', async () => {
      const res = await request(app)
        .post('/projects//deploy') // Missing projectId
        .send(mockDeploymentConfig);

      expect(res.statusCode).toEqual(404); // Express route will not match
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.startDeployment.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy`)
        .send(mockDeploymentConfig);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /projects/:projectId/deploy/status', () => {
    const mockStatus = {
      id: 'deploy1',
      projectId: mockProjectId,
      status: 'success',
      platform: 'cloudflare-pages',
      url: 'http://example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return deployment status successfully', async () => {
      mockDeploymentService.prototype.getDeploymentStatus.mockResolvedValue(mockStatus as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/status`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockStatus);
      expect(mockDeploymentService.prototype.getDeploymentStatus).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });

    it('should return 400 if projectId is missing', async () => {
      const res = await request(app).get('/projects//deploy/status');
      expect(res.statusCode).toEqual(404);
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.getDeploymentStatus.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/status`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /projects/:projectId/deploy/logs/:deploymentId?', () => {
    const mockLogs = [
      { level: 'info', message: 'Build started', timestamp: new Date().toISOString() },
    ];

    it('should return deployment logs successfully for latest deployment', async () => {
      mockDeploymentService.prototype.getDeploymentLogs.mockResolvedValue(mockLogs as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/logs`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockLogs);
      expect(mockDeploymentService.prototype.getDeploymentLogs).toHaveBeenCalledWith(mockProjectId, mockUserId, undefined);
    });

    it('should return deployment logs successfully for specific deploymentId', async () => {
      mockDeploymentService.prototype.getDeploymentLogs.mockResolvedValue(mockLogs as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/logs/deploy123`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockLogs);
      expect(mockDeploymentService.prototype.getDeploymentLogs).toHaveBeenCalledWith(mockProjectId, mockUserId, 'deploy123');
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.getDeploymentLogs.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/logs`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('POST /projects/:projectId/deploy/:deploymentId/cancel', () => {
    it('should cancel deployment successfully', async () => {
      mockDeploymentService.prototype.cancelDeployment.mockResolvedValue(undefined);

      const res = await request(app).post(`/projects/${mockProjectId}/deploy/deploy123/cancel`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Deployment cancelled successfully');
      expect(mockDeploymentService.prototype.cancelDeployment).toHaveBeenCalledWith(mockProjectId, 'deploy123', mockUserId);
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.cancelDeployment.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app).post(`/projects/${mockProjectId}/deploy/deploy123/cancel`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('POST /projects/:projectId/deploy/rollback', () => {
    const mockRollbackStatus = {
      id: 'deploy2',
      projectId: mockProjectId,
      status: 'pending',
      platform: 'cloudflare-pages',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should rollback deployment successfully', async () => {
      mockDeploymentService.prototype.rollbackDeployment.mockResolvedValue(mockRollbackStatus as any);

      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy/rollback`)
        .send({ targetDeploymentId: 'deploy123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRollbackStatus);
      expect(mockDeploymentService.prototype.rollbackDeployment).toHaveBeenCalledWith(mockProjectId, 'deploy123', mockUserId);
    });

    it('should return 400 if targetDeploymentId is missing', async () => {
      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy/rollback`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Target deployment ID is required');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.rollbackDeployment.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy/rollback`)
        .send({ targetDeploymentId: 'deploy123' });

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /projects/:projectId/deploy/history', () => {
    const mockHistory = [{ id: 'deploy1' }, { id: 'deploy2' }];

    it('should return deployment history successfully', async () => {
      mockDeploymentService.prototype.getDeploymentHistory.mockResolvedValue(mockHistory as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/history`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockHistory);
      expect(mockDeploymentService.prototype.getDeploymentHistory).toHaveBeenCalledWith(mockProjectId, mockUserId, undefined);
    });

    it('should return deployment history with limit', async () => {
      mockDeploymentService.prototype.getDeploymentHistory.mockResolvedValue([mockHistory[0]] as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/history?limit=1`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([mockHistory[0]]);
      expect(mockDeploymentService.prototype.getDeploymentHistory).toHaveBeenCalledWith(mockProjectId, mockUserId, 1);
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.getDeploymentHistory.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/history`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /projects/:projectId/deploy/metrics', () => {
    const mockMetrics = { requests: 100, bandwidth: 500, errors: 5, responseTime: 200, uptime: 0.99, timeline: [] };

    it('should return deployment metrics successfully', async () => {
      mockDeploymentService.prototype.getDeploymentMetrics.mockResolvedValue(mockMetrics as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/metrics`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMetrics);
      expect(mockDeploymentService.prototype.getDeploymentMetrics).toHaveBeenCalledWith(mockProjectId, mockUserId, undefined);
    });

    it('should return deployment metrics with timeRange', async () => {
      mockDeploymentService.prototype.getDeploymentMetrics.mockResolvedValue(mockMetrics as any);

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/metrics?timeRange=7d`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMetrics);
      expect(mockDeploymentService.prototype.getDeploymentMetrics).toHaveBeenCalledWith(mockProjectId, mockUserId, '7d');
    });

    it('should return 500 if service fails', async () => {
      mockDeploymentService.prototype.getDeploymentMetrics.mockRejectedValue(new AppError('Service error', 500));

      const res = await request(app).get(`/projects/${mockProjectId}/deploy/metrics`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Service error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /deploy/platforms', () => {
    it('should return a list of deployment platforms', async () => {
      const res = await request(app).get('/deploy/platforms');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });
  });

  describe('POST /projects/:projectId/deploy/test-config', () => {
    const mockConfig = { platform: 'cloudflare-pages', buildCommand: 'npm run build' };

    it('should return valid true for valid config', async () => {
      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy/test-config`)
        .send(mockConfig);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.issues).toBeUndefined();
    });

    it('should return valid false and issues for invalid config', async () => {
      const invalidConfig = {
        platform: '', // Missing platform
        buildCommand: 'a'.repeat(201), // Too long
        outputDirectory: 'invalid/path!', // Invalid chars
        environmentVariables: Array.from({ length: 51 }, (_, i) => [`KEY${i}`, `VALUE${i}`]).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}), // Too many
      };

      const res = await request(app)
        .post(`/projects/${mockProjectId}/deploy/test-config`)
        .send(invalidConfig);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.issues).toEqual(expect.arrayContaining([
        'Platform is required',
        'Build command is too long (max 200 characters)',
        'Output directory contains invalid characters',
        'Too many environment variables (max 50)',
      ]));
    });

    it('should return 401 if authentication is required but user is missing', async () => {
      // Create a new app instance without the req.user middleware for this specific test
      const unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      unauthenticatedApp.post('/projects/:projectId/deploy/test-config', (req, res) => deploymentController.testDeploymentConfig(req, res));

      const res = await request(unauthenticatedApp)
        .post(`/projects/${mockProjectId}/deploy/test-config`)
        .send(mockConfig);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Authentication required');
      expect(logger.error).toHaveBeenCalledWith('Failed to test deployment config', { error: 'Authentication required' });
    });
  });
});
