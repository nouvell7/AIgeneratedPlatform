import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError, ValidationError, InsufficientPermissionsError } from '../utils/errors';
import { loggers } from '../utils/logger';
import { Project, Prisma } from '@prisma/client';
import { codespacesService } from './codespaces.service';

export interface CreateProjectData {
  name: string;
  description: string;
  category: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  category?: string;
  status?: 'DRAFT' | 'DEVELOPING' | 'DEPLOYED' | 'ARCHIVED';
}

export interface ProjectWithStats extends Project {
  stats: {
    views: number;
    deployments: number;
    revenue: number;
  };
}

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(userId: string, data: CreateProjectData): Promise<Project> {
    // Check if user already has a project with the same name
    const existingProject = await prisma.project.findFirst({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existingProject) {
      throw new ConflictError('Project with this name already exists');
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        userId,
        status: 'DRAFT',
      },
    });

    loggers.business.projectCreated(project.id, userId);

    return project;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(projectId: string, userId?: string): Promise<Project> {
    const project = await prisma.project.findUnique({
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

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Check if user can access this project
    if (userId && project.userId !== userId) {
      // For now, assume all projects are public
      // TODO: Implement proper privacy settings check
    }

    return project;
  }

  /**
   * Get user's projects
   */
  static async getUserProjects(
    userId: string,
    filters?: {
      status?: string;
      category?: string;
      search?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereClause: any = { userId };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectData
  ): Promise<Project> {
    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new NotFoundError('Project');
    }

    if (existingProject.userId !== userId) {
      throw new InsufficientPermissionsError('You can only update your own projects');
    }

    // Check for name conflicts if name is being updated
    if (data.name && data.name !== existingProject.name) {
      const nameConflict = await prisma.project.findFirst({
        where: {
          userId,
          name: data.name,
          NOT: { id: projectId },
        },
      });

      if (nameConflict) {
        throw new ConflictError('Project with this name already exists');
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return project;
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check if project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only delete your own projects');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    loggers.business.projectCreated(projectId, 'project_deleted');
  }

  /**
   * Get public projects
   */
  static async getPublicProjects(
    filters?: {
      category?: string;
      search?: string;
      status?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    projects: Array<Project & { user: { username: string; profileImage?: string | null } }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereClause: any = {
      user: {
        settings: {
          path: ['privacy', 'projectsPublic'],
          equals: true,
        },
      },
    };

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    } else {
      // Default to only show deployed projects for public view
      whereClause.status = 'DEPLOYED';
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
              profileImage: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get project categories
   */
  static async getProjectCategories(): Promise<Array<{
    category: string;
    count: number;
  }>> {
    const categories = await prisma.project.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
    }));
  }

  /**
   * Duplicate project
   */
  static async duplicateProject(
    projectId: string,
    userId: string,
    newName?: string
  ): Promise<Project> {
    // Get original project
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!originalProject) {
      throw new NotFoundError('Project');
    }

    if (originalProject.userId !== userId) {
      throw new InsufficientPermissionsError('You can only duplicate your own projects');
    }

    // Generate new name if not provided
    const duplicateName = newName || `${originalProject.name} (Copy)`;

    // Check for name conflicts
    const nameConflict = await prisma.project.findFirst({
      where: {
        userId,
        name: duplicateName,
      },
    });

    if (nameConflict) {
      throw new ConflictError('Project with this name already exists');
    }

    // Create duplicate
    const { id, createdAt, updatedAt, aiModel, deployment, revenue, ...projectData } = originalProject;
    
    const duplicateProject = await prisma.project.create({
      data: {
        ...projectData,
        name: duplicateName,
        status: 'DRAFT', // Reset status to draft
        aiModel: aiModel === null ? Prisma.JsonNull : aiModel,
        deployment: deployment === null ? Prisma.JsonNull : deployment,
        revenue: revenue === null ? Prisma.JsonNull : revenue,
      },
    });

    return duplicateProject;
  }

  /**
   * Archive project
   */
  static async archiveProject(projectId: string, userId: string): Promise<Project> {
    return this.updateProject(projectId, userId, { status: 'ARCHIVED' });
  }

  /**
   * Restore archived project
   */
  static async restoreProject(projectId: string, userId: string): Promise<Project> {
    return this.updateProject(projectId, userId, { status: 'DRAFT' });
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(projectId: string, userId: string): Promise<{
    views: number;
    deployments: number;
    revenue: number;
    lastDeployed?: Date;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only view stats for your own projects');
    }

    // Get deployment logs count
    const deployments = await prisma.deploymentLog.count({
      where: { projectId },
    });

    // Get last successful deployment
    const lastDeployment = await prisma.deploymentLog.findFirst({
      where: {
        projectId,
        status: 'SUCCESS',
      },
      orderBy: { createdAt: 'desc' },
    });

    // TODO: Implement actual view tracking and revenue calculation
    const views = 0;
    const revenue = 0;

    return {
      views,
      deployments,
      revenue,
      lastDeployed: lastDeployment?.createdAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Search projects
   */
  static async searchProjects(
    query: string,
    filters?: {
      category?: string;
      userId?: string;
      publicOnly?: boolean;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters?.publicOnly) {
      whereClause.user = {
        settings: {
          path: ['privacy', 'projectsPublic'],
          equals: true,
        },
      };
      whereClause.status = 'DEPLOYED';
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: filters?.publicOnly ? {
          user: {
            select: {
              username: true,
              profileImage: true,
            },
          },
        } : undefined,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create development environment with GitHub Codespaces
   */
  static async createDevelopmentEnvironment(
    projectId: string,
    userId: string,
    aiModelConfig?: any
  ): Promise<{
    repository: any;
    codespace: any;
    project: Project;
  }> {
    // Check if project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only create development environments for your own projects');
    }

    // Generate repository name
    const repoName = `ai-service-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const owner = project.user.username;

    try {
      // Create repository with AI service template and codespace
      const result = await codespacesService.createRepositoryWithTemplate(
        owner,
        repoName,
        project.description,
        aiModelConfig || {}
      );

      // Update project with development environment info
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'DEVELOPING',
          deployment: {
            repositoryUrl: result.repository.html_url,
            codespaceId: result.codespace.id,
            codespaceUrl: result.codespace.webUrl,
            createdAt: new Date().toISOString(),
          } as any,
          updatedAt: new Date(),
        },
      });

      loggers.business.projectCreated(projectId, 'development_environment_created');

      return {
        repository: result.repository,
        codespace: result.codespace,
        project: updatedProject,
      };
    } catch (error: any) {
      throw new ValidationError(`Failed to create development environment: ${error.message}`);
    }
  }

  /**
   * Get development environment status
   */
  static async getDevelopmentEnvironmentStatus(
    projectId: string,
    userId: string
  ): Promise<{
    codespace?: any;
    repository?: any;
    status: 'none' | 'creating' | 'available' | 'unavailable';
  }> {
    // Check if project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only view development environments for your own projects');
    }

    // Check if project has deployment info with codespace
    const deployment = project.deployment as any;
    if (!deployment?.codespaceId) {
      return { status: 'none' };
    }

    try {
      // Get codespace status from GitHub
      const codespace = await codespacesService.getCodespace(deployment.codespaceId);
      
      let status: 'none' | 'creating' | 'available' | 'unavailable' = 'unavailable';
      
      switch (codespace.state) {
        case 'Available':
          status = 'available';
          break;
        case 'Creating':
        case 'Provisioning':
        case 'Starting':
          status = 'creating';
          break;
        default:
          status = 'unavailable';
      }

      return {
        codespace,
        repository: {
          url: deployment.repositoryUrl,
        },
        status,
      };
    } catch (error: any) {
      return { status: 'unavailable' };
    }
  }

  /**
   * Start development environment
   */
  static async startDevelopmentEnvironment(
    projectId: string,
    userId: string
  ): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only start development environments for your own projects');
    }

    const deployment = project.deployment as any;
    if (!deployment?.codespaceId) {
      throw new ValidationError('No development environment found for this project');
    }

    try {
      const codespace = await codespacesService.startCodespace(deployment.codespaceId);
      return codespace;
    } catch (error: any) {
      throw new ValidationError(`Failed to start development environment: ${error.message}`);
    }
  }

  /**
   * Stop development environment
   */
  static async stopDevelopmentEnvironment(
    projectId: string,
    userId: string
  ): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only stop development environments for your own projects');
    }

    const deployment = project.deployment as any;
    if (!deployment?.codespaceId) {
      throw new ValidationError('No development environment found for this project');
    }

    try {
      const codespace = await codespacesService.stopCodespace(deployment.codespaceId);
      return codespace;
    } catch (error: any) {
      throw new ValidationError(`Failed to stop development environment: ${error.message}`);
    }
  }
}

export default ProjectService;
