import 'reflect-metadata';
import { ProjectService } from '../project.service';
import { CodespacesService } from '../codespaces.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError, InsufficientPermissionsError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    deploymentLog: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../codespaces.service');

jest.mock('../../utils/logger', () => ({
  loggers: {
    business: {
      projectCreated: jest.fn(),
    },
  },
}));

const mockPrisma = require('../../lib/prisma').prisma;
const MockCodespacesService = CodespacesService as jest.MockedClass<typeof CodespacesService>;

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockCodespacesService: jest.Mocked<CodespacesService>;

  beforeEach(() => {
    mockCodespacesService = new MockCodespacesService() as jest.Mocked<CodespacesService>;
    projectService = new ProjectService(mockCodespacesService);
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const userId = 'test-user-id';
    const projectData = {
      name: 'Test Project',
      description: 'Test Description',
      category: 'web-app',
      projectType: 'LOW_CODE' as const,
    };

    it('프로젝트 생성 성공', async () => {
      // Given
      const expectedProject = {
        id: 'project-id',
        userId,
        ...projectData,
        status: 'DRAFT',
        pageContent: null,
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(null); // No existing project
      mockPrisma.project.create.mockResolvedValue(expectedProject);

      // When
      const result = await projectService.createProject(userId, projectData);

      // Then
      expect(result).toEqual(expectedProject);
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { userId, name: projectData.name },
      });
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: projectData.name,
          description: projectData.description,
          category: projectData.category,
          userId,
          status: 'DRAFT',
          projectType: 'LOW_CODE',
          pageContent: undefined,
        },
      });
    });

    it('NO_CODE 프로젝트 생성 성공 (pageContent 포함)', async () => {
      // Given
      const noCodeData = {
        ...projectData,
        projectType: 'NO_CODE' as const,
        pageContent: { title: 'My Page', content: 'Hello World' },
      };

      const expectedProject = {
        id: 'project-id',
        userId,
        name: noCodeData.name,
        description: noCodeData.description,
        category: noCodeData.category,
        status: 'DRAFT',
        projectType: 'NO_CODE',
        pageContent: JSON.stringify(noCodeData.pageContent),
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue(expectedProject);

      // When
      const result = await projectService.createProject(userId, noCodeData);

      // Then
      expect(result).toEqual(expectedProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: noCodeData.name,
          description: noCodeData.description,
          category: noCodeData.category,
          userId,
          status: 'DRAFT',
          projectType: 'NO_CODE',
          pageContent: JSON.stringify(noCodeData.pageContent),
        },
      });
    });

    it('동일한 이름의 프로젝트 존재 시 ConflictError 발생', async () => {
      // Given
      const existingProject = { id: 'existing-id', name: projectData.name, userId };
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      // When & Then
      await expect(projectService.createProject(userId, projectData))
        .rejects.toThrow(ConflictError);
      
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('기본 projectType이 LOW_CODE로 설정됨', async () => {
      // Given
      const dataWithoutType = {
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
      };

      const expectedProject = {
        id: 'project-id',
        userId,
        ...dataWithoutType,
        status: 'DRAFT',
        projectType: 'LOW_CODE',
        pageContent: null,
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue(expectedProject);

      // When
      const result = await projectService.createProject(userId, dataWithoutType);

      // Then
      expect(result.projectType).toBe('LOW_CODE');
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...dataWithoutType,
          userId,
          status: 'DRAFT',
          projectType: 'LOW_CODE',
          pageContent: undefined,
        },
      });
    });

    it('데이터베이스 오류 시 예외 전파', async () => {
      // Given
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(projectService.createProject(userId, projectData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getProjectById', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('프로젝트 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
        status: 'DRAFT',
        projectType: 'LOW_CODE',
        pageContent: null,
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          profileImage: null,
        },
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When
      const result = await projectService.getProjectById(projectId, userId);

      // Then
      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
        },
      });
    });

    it('pageContent가 있는 프로젝트 조회 시 JSON 파싱', async () => {
      // Given
      const pageContent = { title: 'My Page', content: 'Hello World' };
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
        status: 'DRAFT',
        projectType: 'NO_CODE',
        pageContent: JSON.stringify(pageContent),
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          profileImage: null,
        },
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When
      const result = await projectService.getProjectById(projectId, userId);

      // Then
      expect(result.pageContent).toEqual(pageContent);
    });

    it('존재하지 않는 프로젝트 조회 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(projectService.getProjectById(projectId, userId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProject', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';
    const existingProject = {
      id: projectId,
      userId,
      name: 'Original Project',
      description: 'Original Description',
      category: 'web-app',
      status: 'DRAFT',
      projectType: 'LOW_CODE',
      pageContent: null,
      aiModel: null,
      deployment: null,
      revenue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('프로젝트 업데이트 성공', async () => {
      // Given
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
        status: 'DEVELOPING' as const,
      };

      const updatedProject = { ...existingProject, ...updateData };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue(updatedProject);

      // When
      const result = await projectService.updateProject(projectId, userId, updateData);

      // Then
      expect(result).toEqual(updatedProject);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          ...updateData,
          pageContent: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('pageContent 업데이트 시 JSON 문자열로 변환', async () => {
      // Given
      const pageContent = { title: 'Updated Page', content: 'Updated Content' };
      const updateData = { pageContent };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({ ...existingProject, ...updateData });

      // When
      await projectService.updateProject(projectId, userId, updateData);

      // Then
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          pageContent: JSON.stringify(pageContent),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('존재하지 않는 프로젝트 업데이트 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(projectService.updateProject(projectId, userId, { name: 'New Name' }))
        .rejects.toThrow(NotFoundError);
    });

    it('다른 사용자의 프로젝트 업데이트 시 InsufficientPermissionsError 발생', async () => {
      // Given
      const otherUserProject = { ...existingProject, userId: 'other-user-id' };
      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject);

      // When & Then
      await expect(projectService.updateProject(projectId, userId, { name: 'New Name' }))
        .rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('deleteProject', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('프로젝트 삭제 성공', async () => {
      // Given
      const existingProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
        status: 'DRAFT',
        projectType: 'LOW_CODE',
        pageContent: null,
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.delete.mockResolvedValue(existingProject);

      // When
      await projectService.deleteProject(projectId, userId);

      // Then
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });

    it('다른 사용자의 프로젝트 삭제 시 InsufficientPermissionsError 발생', async () => {
      // Given
      const otherUserProject = {
        id: projectId,
        userId: 'other-user-id',
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
        status: 'DRAFT',
        projectType: 'LOW_CODE',
        pageContent: null,
        aiModel: null,
        deployment: null,
        revenue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject);

      // When & Then
      await expect(projectService.deleteProject(projectId, userId))
        .rejects.toThrow(InsufficientPermissionsError);
      
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUserProjects', () => {
    const userId = 'test-user-id';

    it('사용자 프로젝트 목록 조회 성공', async () => {
      // Given
      const mockProjects = [
        {
          id: 'project-1',
          userId,
          name: 'Project 1',
          description: 'Description 1',
          category: 'web-app',
          status: 'DRAFT',
          projectType: 'LOW_CODE',
          pageContent: null,
          aiModel: null,
          deployment: null,
          revenue: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          userId,
          name: 'Project 2',
          description: 'Description 2',
          category: 'api',
          status: 'DEPLOYED',
          projectType: 'NO_CODE',
          pageContent: JSON.stringify({ title: 'Page 2' }),
          aiModel: null,
          deployment: null,
          revenue: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.project.count.mockResolvedValue(2);

      // When
      const result = await projectService.getUserProjects(userId);

      // Then
      expect(result).toEqual({
        projects: [
          mockProjects[0],
          { ...mockProjects[1], pageContent: { title: 'Page 2' } }, // JSON parsed
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('필터링 옵션 적용', async () => {
      // Given
      const filters = {
        status: 'DEPLOYED',
        category: 'web-app',
        search: 'test',
      };
      const pagination = { page: 2, limit: 5 };

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      // When
      await projectService.getUserProjects(userId, filters, pagination);

      // Then
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'DEPLOYED',
          category: 'web-app',
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        skip: 5,
      });
    });
  });

  describe('duplicateProject', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';
    const originalProject = {
      id: projectId,
      userId,
      name: 'Original Project',
      description: 'Original Description',
      category: 'web-app',
      status: 'DEPLOYED',
      projectType: 'LOW_CODE',
      pageContent: JSON.stringify({ title: 'Original Page' }),
      aiModel: JSON.stringify({ type: 'teachable-machine' }),
      deployment: JSON.stringify({ platform: 'cloudflare' }),
      revenue: JSON.stringify({ enabled: true }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('프로젝트 복제 성공', async () => {
      // Given
      const newName = 'Duplicated Project';
      const duplicatedProject = {
        id: 'new-project-id',
        userId,
        name: newName,
        description: originalProject.description,
        category: originalProject.category,
        status: 'DRAFT',
        projectType: originalProject.projectType,
        pageContent: originalProject.pageContent,
        aiModel: originalProject.aiModel,
        deployment: originalProject.deployment,
        revenue: originalProject.revenue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(originalProject);
      mockPrisma.project.findFirst.mockResolvedValue(null); // No name conflict
      mockPrisma.project.create.mockResolvedValue(duplicatedProject);

      // When
      const result = await projectService.duplicateProject(projectId, userId, newName);

      // Then
      expect(result).toEqual(duplicatedProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: newName,
          description: originalProject.description,
          category: originalProject.category,
          userId,
          status: 'DRAFT',
          projectType: originalProject.projectType,
          pageContent: originalProject.pageContent,
          aiModel: originalProject.aiModel,
          deployment: originalProject.deployment,
          revenue: originalProject.revenue,
        },
      });
    });

    it('이름 없이 복제 시 기본 이름 사용', async () => {
      // Given
      const defaultName = `${originalProject.name} (Copy)`;
      const duplicatedProject = {
        ...originalProject,
        id: 'new-project-id',
        name: defaultName,
        status: 'DRAFT',
      };

      mockPrisma.project.findUnique.mockResolvedValue(originalProject);
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue(duplicatedProject);

      // When
      const result = await projectService.duplicateProject(projectId, userId);

      // Then
      expect(result.name).toBe(defaultName);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: defaultName,
          status: 'DRAFT',
        }),
      });
    });

    it('이름 충돌 시 ConflictError 발생', async () => {
      // Given
      const conflictingName = 'Existing Project';
      const existingProject = { id: 'existing-id', name: conflictingName, userId };

      mockPrisma.project.findUnique.mockResolvedValue(originalProject);
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      // When & Then
      await expect(projectService.duplicateProject(projectId, userId, conflictingName))
        .rejects.toThrow(ConflictError);
      
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('archiveProject', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('프로젝트 아카이브 성공', async () => {
      // Given
      const existingProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        status: 'DEPLOYED',
      };
      const archivedProject = { ...existingProject, status: 'ARCHIVED' };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.update.mockResolvedValue(archivedProject);

      // When
      const result = await projectService.archiveProject(projectId, userId);

      // Then
      expect(result.status).toBe('ARCHIVED');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          status: 'ARCHIVED',
          pageContent: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('restoreProject', () => {
    const projectId = 'test-project-id';
    const userId = 'test-user-id';

    it('프로젝트 복원 성공', async () => {
      // Given
      const archivedProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        status: 'ARCHIVED',
      };
      const restoredProject = { ...archivedProject, status: 'DRAFT' };

      mockPrisma.project.findUnique.mockResolvedValue(archivedProject);
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.update.mockResolvedValue(restoredProject);

      // When
      const result = await projectService.restoreProject(projectId, userId);

      // Then
      expect(result.status).toBe('DRAFT');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          status: 'DRAFT',
          pageContent: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getProjectCategories', () => {
    it('프로젝트 카테고리 목록 조회 성공', async () => {
      // Given
      const mockCategories = [
        { category: 'web-app', _count: { category: 5 } },
        { category: 'api', _count: { category: 3 } },
        { category: 'mobile-app', _count: { category: 2 } },
      ];

      mockPrisma.project.groupBy.mockResolvedValue(mockCategories);

      // When
      const result = await projectService.getProjectCategories();

      // Then
      expect(result).toEqual([
        { category: 'web-app', count: 5 },
        { category: 'api', count: 3 },
        { category: 'mobile-app', count: 2 },
      ]);
      expect(mockPrisma.project.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      });
    });
  });

  describe('searchProjects', () => {
    const query = 'test search';
    const userId = 'test-user-id';

    it('프로젝트 검색 성공', async () => {
      // Given
      const mockProjects = [
        {
          id: 'project-1',
          userId,
          name: 'Test Project',
          description: 'Test Description',
          category: 'web-app',
          status: 'DEPLOYED',
          projectType: 'LOW_CODE',
          pageContent: null,
          aiModel: null,
          deployment: null,
          revenue: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.project.count.mockResolvedValue(1);

      // When
      const result = await projectService.searchProjects(query, { userId });

      // Then
      expect(result).toEqual({
        projects: mockProjects,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          userId,
        },
        include: undefined,
        orderBy: { updatedAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });
});