import 'reflect-metadata';
import { DeploymentService, DeploymentConfig } from '../deployment.service';
import { ProjectService } from '../project.service';
import { AppError, ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    deploymentLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../utils/static-page-generator', () => ({
  generateStaticPage: jest.fn().mockReturnValue('<html><body>Test Page</body></html>'),
}));

const mockPrisma = require('../../lib/prisma').prisma;
const { Octokit } = require('@octokit/rest');

describe('DeploymentService', () => {
  let deploymentService: DeploymentService;
  let mockProjectService: jest.Mocked<ProjectService>;
  let mockOctokit: any;

  beforeEach(() => {
    // Set environment variable
    process.env.GITHUB_TOKEN = 'test-github-token';

    // Create mock ProjectService
    mockProjectService = {
      getProjectById: jest.fn(),
    } as any;

    // Create mock Octokit instance
    mockOctokit = {
      rest: {
        repos: {
          createForAuthenticatedUser: jest.fn(),
        },
      },
    };

    Octokit.mockImplementation(() => mockOctokit);

    deploymentService = new DeploymentService(mockProjectService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  describe('constructor', () => {
    it('GitHub 토큰이 없으면 AppError 발생', () => {
      delete process.env.GITHUB_TOKEN;
      
      expect(() => new DeploymentService(mockProjectService)).toThrow(AppError);
      expect(() => new DeploymentService(mockProjectService)).toThrow('GitHub token is required for deployment');
    });

    it('GitHub 토큰이 있으면 Octokit 인스턴스 생성', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      
      const service = new DeploymentService(mockProjectService);
      
      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-token',
      });
    });
  });

  describe('startDeployment', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';
    const config: DeploymentConfig = {
      platform: 'cloudflare-pages',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    };

    it('Low-Code 프로젝트 배포 시작 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        projectType: 'LOW_CODE',
        pageContent: null,
      };

      const mockDeployment = {
        id: 'deployment-123',
        projectId,
        status: 'pending',
        platform: 'cloudflare-pages',
        configuration: JSON.stringify(config),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject as any);
      mockPrisma.deploymentLog.create.mockResolvedValue(mockDeployment);

      // When
      const result = await deploymentService.startDeployment(projectId, userId, config);

      // Then
      expect(result).toEqual({
        id: 'deployment-123',
        projectId,
        status: 'pending',
        platform: 'cloudflare-pages',
        createdAt: mockDeployment.createdAt,
        updatedAt: mockDeployment.updatedAt,
      });

      expect(mockPrisma.deploymentLog.create).toHaveBeenCalledWith({
        data: {
          projectId,
          status: 'pending',
          platform: 'cloudflare-pages',
          configuration: JSON.stringify(config),
        },
      });
    });

    it('No-Code 프로젝트 배포 시작 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        projectType: 'NO_CODE',
        pageContent: { title: 'Test Page', content: 'Hello World' },
      };

      const mockDeployment = {
        id: 'deployment-123',
        projectId,
        status: 'pending',
        platform: 'cloudflare-pages',
        configuration: JSON.stringify(config),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject as any);
      mockPrisma.deploymentLog.create.mockResolvedValue(mockDeployment);

      // When
      const result = await deploymentService.startDeployment(projectId, userId, config);

      // Then
      expect(result.status).toBe('pending');
      expect(mockPrisma.deploymentLog.create).toHaveBeenCalled();
    });

    it('No-Code 프로젝트에 pageContent가 없으면 ValidationError 발생', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        projectType: 'NO_CODE',
        pageContent: null,
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject as any);

      // When & Then
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow(ValidationError);
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow('No-Code project must have page content to deploy.');
    });

    it('존재하지 않는 프로젝트 배포 시 AppError 발생', async () => {
      // Given
      mockProjectService.getProjectById.mockResolvedValue(null as any);

      // When & Then
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow(AppError);
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow('Project not found');
    });

    it('다른 사용자의 프로젝트 배포 시 AppError 발생', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId: 'other-user-id',
        name: 'Test Project',
        projectType: 'LOW_CODE',
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject as any);

      // When & Then
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow(AppError);
      await expect(deploymentService.startDeployment(projectId, userId, config))
        .rejects.toThrow('You can only deploy your own projects');
    });
  });

  describe('getDeploymentStatus', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('배포 상태 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      const mockDeployment = {
        id: 'deployment-123',
        projectId,
        status: 'success',
        platform: 'cloudflare-pages',
        url: 'https://test.example.com',
        previewUrl: 'https://preview.example.com',
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findFirst.mockResolvedValue(mockDeployment);

      // When
      const result = await deploymentService.getDeploymentStatus(projectId, userId);

      // Then
      expect(result).toEqual({
        id: 'deployment-123',
        projectId,
        status: 'success',
        platform: 'cloudflare-pages',
        url: 'https://test.example.com',
        previewUrl: 'https://preview.example.com',
        error: undefined,
        createdAt: mockDeployment.createdAt,
        updatedAt: mockDeployment.updatedAt,
        completedAt: mockDeployment.completedAt,
      });
    });

    it('배포가 없으면 null 반환', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findFirst.mockResolvedValue(null);

      // When
      const result = await deploymentService.getDeploymentStatus(projectId, userId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getDeploymentLogs', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('배포 로그 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      const mockLogs = [
        {
          level: 'info',
          message: 'Starting deployment...',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
        {
          level: 'info',
          message: 'Deployment complete!',
          timestamp: '2023-01-01T00:05:00.000Z',
        },
      ];

      const mockDeployment = {
        id: 'deployment-123',
        projectId,
        logs: JSON.stringify(mockLogs),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findFirst.mockResolvedValue(mockDeployment);

      // When
      const result = await deploymentService.getDeploymentLogs(projectId, userId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'deployment-123-0',
        deploymentId: 'deployment-123',
        level: 'info',
        message: 'Starting deployment...',
        timestamp: '2023-01-01T00:00:00.000Z',
      });
    });

    it('로그가 없으면 빈 배열 반환', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findFirst.mockResolvedValue(null);

      // When
      const result = await deploymentService.getDeploymentLogs(projectId, userId);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('cancelDeployment', () => {
    const projectId = 'test-project-id';
    const deploymentId = 'deployment-123';
    const userId = 'test-user-id';

    it('배포 취소 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.update.mockResolvedValue({});

      // When
      await deploymentService.cancelDeployment(projectId, deploymentId, userId);

      // Then
      expect(mockPrisma.deploymentLog.update).toHaveBeenCalledWith({
        where: { id: deploymentId },
        data: {
          status: 'cancelled',
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('rollbackDeployment', () => {
    const projectId = 'test-project-id';
    const targetDeploymentId = 'target-deployment-123';
    const userId = 'test-user-id';

    it('배포 롤백 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      const mockTargetDeployment = {
        id: targetDeploymentId,
        projectId,
        status: 'success',
        platform: 'cloudflare-pages',
        configuration: JSON.stringify({ platform: 'cloudflare-pages' }),
      };

      const mockRollbackDeployment = {
        id: 'rollback-deployment-123',
        projectId,
        status: 'pending',
        platform: 'cloudflare-pages',
        configuration: JSON.stringify({ platform: 'cloudflare-pages' }),
        isRollback: true,
        rollbackFromId: targetDeploymentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findUnique.mockResolvedValue(mockTargetDeployment);
      mockPrisma.deploymentLog.create.mockResolvedValue(mockRollbackDeployment);

      // When
      const result = await deploymentService.rollbackDeployment(projectId, targetDeploymentId, userId);

      // Then
      expect(result).toEqual({
        id: 'rollback-deployment-123',
        projectId,
        status: 'pending',
        platform: 'cloudflare-pages',
        createdAt: mockRollbackDeployment.createdAt,
        updatedAt: mockRollbackDeployment.updatedAt,
      });

      expect(mockPrisma.deploymentLog.create).toHaveBeenCalledWith({
        data: {
          projectId,
          status: 'pending',
          platform: 'cloudflare-pages',
          configuration: mockTargetDeployment.configuration,
          isRollback: true,
          rollbackFromId: targetDeploymentId,
        },
      });
    });

    it('실패한 배포로 롤백 시 AppError 발생', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      const mockTargetDeployment = {
        id: targetDeploymentId,
        projectId,
        status: 'failed',
        platform: 'cloudflare-pages',
        configuration: JSON.stringify({ platform: 'cloudflare-pages' }),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findUnique.mockResolvedValue(mockTargetDeployment);

      // When & Then
      await expect(deploymentService.rollbackDeployment(projectId, targetDeploymentId, userId))
        .rejects.toThrow(AppError);
      await expect(deploymentService.rollbackDeployment(projectId, targetDeploymentId, userId))
        .rejects.toThrow('Can only rollback to successful deployments');
    });
  });

  describe('getDeploymentHistory', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('배포 히스토리 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      const mockDeployments = [
        {
          id: 'deployment-1',
          projectId,
          status: 'success',
          platform: 'cloudflare-pages',
          url: 'https://test1.example.com',
          previewUrl: 'https://preview1.example.com',
          error: null,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          completedAt: new Date('2023-01-02'),
        },
        {
          id: 'deployment-2',
          projectId,
          status: 'failed',
          platform: 'cloudflare-pages',
          url: null,
          previewUrl: null,
          error: 'Build failed',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-01'),
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.deploymentLog.findMany.mockResolvedValue(mockDeployments);

      // When
      const result = await deploymentService.getDeploymentHistory(projectId, userId, 5);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'deployment-1',
        projectId,
        status: 'success',
        platform: 'cloudflare-pages',
        url: 'https://test1.example.com',
        previewUrl: 'https://preview1.example.com',
        error: undefined,
        createdAt: mockDeployments[0].createdAt,
        updatedAt: mockDeployments[0].updatedAt,
        completedAt: mockDeployments[0].completedAt,
      });

      expect(mockPrisma.deploymentLog.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('getDeploymentMetrics', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('배포 메트릭 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When
      const result = await deploymentService.getDeploymentMetrics(projectId, userId, '24h');

      // Then
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('bandwidth');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timeline');
      expect(result.timeline).toHaveLength(24);
      expect(typeof result.requests).toBe('number');
      expect(typeof result.bandwidth).toBe('number');
      expect(typeof result.errors).toBe('number');
      expect(typeof result.responseTime).toBe('number');
      expect(typeof result.uptime).toBe('number');
    });
  });
});