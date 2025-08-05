import 'reflect-metadata';
import { DeploymentService } from '../deployment.service';
import { ProjectService } from '../project.service';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { AppError, ValidationError } from '../../utils/errors';
import { Octokit } from '@octokit/rest';
import { generateStaticPage } from '../../utils/static-page-generator';
import { container } from 'tsyringe';

// Mock external dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    deploymentLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => ({
    rest: {
      repos: {
        createForAuthenticatedUser: jest.fn(),
      },
      codespaces: {
        createForAuthenticatedUser: jest.fn(),
      },
    },
  })),
}));

jest.mock('../project.service');
jest.mock('../../utils/static-page-generator');

describe('DeploymentService', () => {
  let deploymentService: DeploymentService;
  let mockProjectService: jest.Mocked<ProjectService>;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    jest.clearAllMocks();
    container.clearInstances();
    container.reset();

    // Set GITHUB_TOKEN for Octokit constructor
    process.env.GITHUB_TOKEN = 'test_github_token';

    // Register mocks
    container.registerInstance(ProjectService, new ProjectService(prisma as any)); // Mock ProjectService constructor
    mockProjectService = container.resolve(ProjectService) as jest.Mocked<ProjectService>;
    mockOctokit = (Octokit as unknown as jest.MockedClass<typeof Octokit>).mock.results[0].value;

    deploymentService = container.resolve(DeploymentService);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  describe('startDeployment', () => {
    const mockProjectId = 'proj123';
    const mockUserId = 'user456';
    const mockDeploymentConfig = {
      platform: 'cloudflare-pages' as const,
      buildCommand: 'npm run build',
    };
    const mockProject = {
      id: mockProjectId,
      userId: mockUserId,
      name: 'Test Project',
      projectType: 'LOW_CODE',
      pageContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockDeploymentRecord = {
      id: 'deploy1',
      projectId: mockProjectId,
      status: 'pending',
      platform: mockDeploymentConfig.platform,
      configuration: JSON.stringify(mockDeploymentConfig),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should start a low-code deployment successfully', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce(mockProject as any);
      (prisma.deploymentLog.create as jest.Mock).mockResolvedValueOnce(mockDeploymentRecord);

      // Mock the private simulateDeploymentProcess
      const spySimulateDeploymentProcess = jest.spyOn(deploymentService as any, 'simulateDeploymentProcess').mockResolvedValue(undefined);

      const result = await deploymentService.startDeployment(
        mockProjectId,
        mockUserId,
        mockDeploymentConfig
      );

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(prisma.deploymentLog.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProjectId,
          status: 'pending',
          platform: mockDeploymentConfig.platform,
          configuration: JSON.stringify(mockDeploymentConfig),
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Deployment started', { deploymentId: mockDeploymentRecord.id, projectId: mockProjectId });
      expect(result).toEqual({
        id: mockDeploymentRecord.id,
        projectId: mockProjectId,
        status: 'pending',
        platform: mockDeploymentConfig.platform,
        createdAt: mockDeploymentRecord.createdAt,
        updatedAt: mockDeploymentRecord.updatedAt,
      });
      expect(spySimulateDeploymentProcess).toHaveBeenCalled();
      spySimulateDeploymentProcess.mockRestore();
    });

    it('should start a no-code deployment successfully', async () => {
      const noCodeProject = {
        ...mockProject,
        projectType: 'NO_CODE',
        pageContent: { sections: [{ type: 'hero', content: 'hello' }] },
      };
      mockProjectService.getProjectById.mockResolvedValueOnce(noCodeProject as any);
      (prisma.deploymentLog.create as jest.Mock).mockResolvedValueOnce(mockDeploymentRecord);
      (generateStaticPage as jest.Mock).mockReturnValueOnce('<html>No-code page</html>');

      // Mock the private simulateStaticSiteDeployment
      const spySimulateStaticSiteDeployment = jest.spyOn(deploymentService as any, 'simulateStaticSiteDeployment').mockResolvedValue(undefined);

      const result = await deploymentService.startDeployment(
        mockProjectId,
        mockUserId,
        mockDeploymentConfig
      );

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(prisma.deploymentLog.create).toHaveBeenCalled();
      expect(generateStaticPage).toHaveBeenCalledWith(noCodeProject.pageContent);
      expect(spySimulateStaticSiteDeployment).toHaveBeenCalled();
      expect(result.status).toBe('pending');
      spySimulateStaticSiteDeployment.mockRestore();
    });

    it('should throw AppError if project not found', async () => {
      mockProjectService.getProjectById.mockRejectedValueOnce(new AppError('Project not found', 404));

      await expect(
        deploymentService.startDeployment(mockProjectId, mockUserId, mockDeploymentConfig)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start deployment', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' } as any);

      await expect(
        deploymentService.startDeployment(mockProjectId, mockUserId, mockDeploymentConfig)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start deployment', { error: 'You can only deploy your own projects', projectId: mockProjectId });
    });

    it('should throw ValidationError if no-code project has no page content', async () => {
      const noCodeProject = { ...mockProject, projectType: 'NO_CODE', pageContent: null };
      mockProjectService.getProjectById.mockResolvedValueOnce(noCodeProject as any);
      (prisma.deploymentLog.create as jest.Mock).mockResolvedValueOnce(mockDeploymentRecord);

      await expect(
        deploymentService.startDeployment(mockProjectId, mockUserId, mockDeploymentConfig)
      ).rejects.toThrow(ValidationError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start deployment', { error: 'No-Code project must have page content to deploy.', projectId: mockProjectId });
    });
  });

  describe('getDeploymentStatus', () => {
    const mockProjectId = 'proj123';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };
    const mockDeployment = {
      id: 'deploy1',
      projectId: mockProjectId,
      status: 'success',
      platform: 'cloudflare-pages',
      url: 'https://example.com',
      previewUrl: 'https://preview.example.com',
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    };

    it('should return deployment status successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findFirst as jest.Mock).mockResolvedValueOnce(mockDeployment);

      const result = await deploymentService.getDeploymentStatus(mockProjectId, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(prisma.deploymentLog.findFirst).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        id: mockDeployment.id,
        projectId: mockDeployment.projectId,
        status: mockDeployment.status,
        platform: mockDeployment.platform,
        url: mockDeployment.url,
        previewUrl: mockDeployment.previewUrl,
        error: undefined,
        createdAt: mockDeployment.createdAt,
        updatedAt: mockDeployment.updatedAt,
        completedAt: mockDeployment.completedAt,
      });
    });

    it('should return null if no deployment found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await deploymentService.getDeploymentStatus(mockProjectId, mockUserId);
      expect(result).toBeNull();
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.getDeploymentStatus(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment status', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.getDeploymentStatus(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment status', { error: 'You can only view your own project deployments', projectId: mockProjectId });
    });
  });

  describe('getDeploymentLogs', () => {
    const mockProjectId = 'proj123';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };
    const mockLogs = [
      { level: 'info', message: 'Step 1', timestamp: new Date().toISOString() },
      { level: 'error', message: 'Step 2 failed', timestamp: new Date().toISOString() },
    ];
    const mockDeployment = {
      id: 'deploy1',
      projectId: mockProjectId,
      status: 'failed',
      platform: 'cloudflare-pages',
      configuration: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
      logs: JSON.stringify(mockLogs),
    };

    it('should return deployment logs successfully for latest deployment', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findFirst as jest.Mock).mockResolvedValueOnce(mockDeployment);

      const result = await deploymentService.getDeploymentLogs(mockProjectId, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(prisma.deploymentLog.findFirst).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.length).toBe(mockLogs.length);
      expect(result[0].message).toBe('Step 1');
      expect(result[1].level).toBe('error');
    });

    it('should return deployment logs successfully for a specific deploymentId', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findUnique as jest.Mock).mockResolvedValueOnce(mockDeployment);

      const result = await deploymentService.getDeploymentLogs(mockProjectId, mockUserId, mockDeployment.id);

      expect(prisma.deploymentLog.findUnique).toHaveBeenCalledWith({ where: { id: mockDeployment.id } });
      expect(result.length).toBe(mockLogs.length);
    });

    it('should return empty array if no deployment found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await deploymentService.getDeploymentLogs(mockProjectId, mockUserId);
      expect(result).toEqual([]);
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.getDeploymentLogs(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment logs', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.getDeploymentLogs(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment logs', { error: 'You can only view your own project logs', projectId: mockProjectId });
    });
  });

  describe('cancelDeployment', () => {
    const mockProjectId = 'proj123';
    const mockDeploymentId = 'deploy1';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };

    it('should cancel deployment successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.update as jest.Mock).mockResolvedValueOnce({ count: 1 });

      await deploymentService.cancelDeployment(mockProjectId, mockDeploymentId, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(prisma.deploymentLog.update).toHaveBeenCalledWith({
        where: { id: mockDeploymentId },
        data: {
          status: 'cancelled',
          completedAt: expect.any(Date),
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Deployment cancelled', { deploymentId: mockDeploymentId, projectId: mockProjectId });
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.cancelDeployment(mockProjectId, mockDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to cancel deployment', { error: 'Project not found', deploymentId: mockDeploymentId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.cancelDeployment(mockProjectId, mockDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to cancel deployment', { error: 'You can only cancel your own deployments', deploymentId: mockDeploymentId });
    });
  });

  describe('rollbackDeployment', () => {
    const mockProjectId = 'proj123';
    const mockTargetDeploymentId = 'deploy1';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };
    const mockTargetDeployment = {
      id: mockTargetDeploymentId,
      projectId: mockProjectId,
      status: 'success',
      platform: 'cloudflare-pages',
      configuration: '{}',
      url: 'https://old.example.com',
      previewUrl: 'https://old-preview.example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    };
    const mockRollbackDeploymentRecord = {
      id: 'deploy2',
      projectId: mockProjectId,
      status: 'pending',
      platform: mockTargetDeployment.platform,
      configuration: mockTargetDeployment.configuration,
      isRollback: true,
      rollbackFromId: mockTargetDeploymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should start a rollback successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findUnique as jest.Mock).mockResolvedValueOnce(mockTargetDeployment);
      (prisma.deploymentLog.create as jest.Mock).mockResolvedValueOnce(mockRollbackDeploymentRecord);

      // Mock the private processRollback
      const spyProcessRollback = jest.spyOn(deploymentService as any, 'processRollback').mockResolvedValue(undefined);

      const result = await deploymentService.rollbackDeployment(
        mockProjectId,
        mockTargetDeploymentId,
        mockUserId
      );

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(prisma.deploymentLog.findUnique).toHaveBeenCalledWith({ where: { id: mockTargetDeploymentId } });
      expect(prisma.deploymentLog.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProjectId,
          status: 'pending',
          platform: mockTargetDeployment.platform,
          configuration: mockTargetDeployment.configuration,
          isRollback: true,
          rollbackFromId: mockTargetDeploymentId,
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Rollback deployment started', {
        deploymentId: mockRollbackDeploymentRecord.id,
        targetDeploymentId: mockTargetDeploymentId,
        projectId: mockProjectId,
      });
      expect(spyProcessRollback).toHaveBeenCalled();
      expect(result.status).toBe('pending');
      spyProcessRollback.mockRestore();
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.rollbackDeployment(mockProjectId, mockTargetDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to rollback deployment', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.rollbackDeployment(mockProjectId, mockTargetDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to rollback deployment', { error: 'You can only rollback your own deployments', projectId: mockProjectId });
    });

    it('should throw AppError if target deployment not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.rollbackDeployment(mockProjectId, mockTargetDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to rollback deployment', { error: 'Target deployment not found', projectId: mockProjectId });
    });

    it('should throw AppError if target deployment is not successful', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockTargetDeployment, status: 'failed' });

      await expect(
        deploymentService.rollbackDeployment(mockProjectId, mockTargetDeploymentId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to rollback deployment', { error: 'Can only rollback to successful deployments', projectId: mockProjectId });
    });
  });

  describe('getDeploymentHistory', () => {
    const mockProjectId = 'proj123';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };
    const mockDeployments = [
      {
        id: 'deploy1', projectId: mockProjectId, status: 'success', platform: 'cf', configuration: '{}',
        createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(), url: 'url1', previewUrl: 'purl1', error: null,
      },
      {
        id: 'deploy2', projectId: mockProjectId, status: 'failed', platform: 'cf', configuration: '{}',
        createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(), url: null, previewUrl: null, error: 'build fail',
      },
    ];

    it('should return deployment history successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findMany as jest.Mock).mockResolvedValueOnce(mockDeployments);

      const result = await deploymentService.getDeploymentHistory(mockProjectId, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(prisma.deploymentLog.findMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      expect(result.length).toBe(mockDeployments.length);
      expect(result[0].id).toBe('deploy1');
      expect(result[1].status).toBe('failed');
    });

    it('should apply limit if provided', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);
      (prisma.deploymentLog.findMany as jest.Mock).mockResolvedValueOnce(mockDeployments);

      await deploymentService.getDeploymentHistory(mockProjectId, mockUserId, 1);
      expect(prisma.deploymentLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.getDeploymentHistory(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment history', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.getDeploymentHistory(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment history', { error: 'You can only view your own deployment history', projectId: mockProjectId });
    });
  });

  describe('getDeploymentMetrics', () => {
    const mockProjectId = 'proj123';
    const mockUserId = 'user456';
    const mockProject = { id: mockProjectId, userId: mockUserId };

    it('should return deployment metrics successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(mockProject);

      const result = await deploymentService.getDeploymentMetrics(mockProjectId, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: mockProjectId } });
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('bandwidth');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('uptime');
      expect(result.timeline.length).toBe(24);
    });

    it('should throw AppError if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        deploymentService.getDeploymentMetrics(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment metrics', { error: 'Project not found', projectId: mockProjectId });
    });

    it('should throw AppError if user does not own the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockProject, userId: 'otherUser' });

      await expect(
        deploymentService.getDeploymentMetrics(mockProjectId, mockUserId)
      ).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get deployment metrics', { error: 'You can only view your own project metrics', projectId: mockProjectId });
    });
  });
});
