import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { ProjectService } from '../services/project.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { createProjectSchema, updateProjectSchema, updatePageContentSchema } from '@shared/schemas';
import { z } from 'zod';

// Additional validation schemas
const projectFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'DEVELOPING', 'DEPLOYED', 'ARCHIVED']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

const duplicateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
});

@injectable()
export class ProjectController {
  constructor(@inject(ProjectService) private projectService: ProjectService) {}

  /**
   * Create new project
   * POST /projects
   */
  createProject = [
    validateRequest({ body: createProjectSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const project = await this.projectService.createProject(userId, req.body);

        res.status(201).json({
          success: true,
          data: { project },
          message: 'Project created successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get project by ID
   * GET /projects/:id
   */
  getProject = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const project = await this.projectService.getProjectById(id, userId);

        res.json({
          success: true,
          data: { project },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get user's projects
   * GET /projects
   */
  getUserProjects = [
    validateRequest({
      query: z.object({
        ...projectFiltersSchema.shape,
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const { page, limit, sortBy, sortOrder, ...filters } = req.query as any;
        
        const result = await this.projectService.getUserProjects(
          userId,
          filters,
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            projects: result.projects,
            pagination: {
              page: result.page,
              limit,
              total: result.total,
              totalPages: result.totalPages,
              hasMore: result.page < result.totalPages,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update project
   * PUT /projects/:id
   */
  updateProject = [
    validateRequest({
      params: commonSchemas.idParam,
      body: updateProjectSchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const project = await this.projectService.updateProject(id, userId, req.body);

        res.json({
          success: true,
          data: { project },
          message: 'Project updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Delete project
   * DELETE /projects/:id
   */
  deleteProject = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        await this.projectService.deleteProject(id, userId);

        res.json({
          success: true,
          message: 'Project deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get public projects
   * GET /projects/public
   */
  getPublicProjects = [
    validateRequest({
      query: z.object({
        ...projectFiltersSchema.shape,
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, sortBy, sortOrder, ...filters } = req.query as any;
        
        const result = await this.projectService.getPublicProjects(
          filters,
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            projects: result.projects,
            pagination: {
              page: result.page,
              limit,
              total: result.total,
              totalPages: result.totalPages,
              hasMore: result.page < result.totalPages,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get project categories
   * GET /projects/categories
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.projectService.getProjectCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Duplicate project
   * POST /projects/:id/duplicate
   */
  duplicateProject = [
    validateRequest({
      params: commonSchemas.idParam,
      body: duplicateProjectSchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const { name } = req.body;
        const project = await this.projectService.duplicateProject(id, userId, name);

        res.status(201).json({
          success: true,
          data: { project },
          message: 'Project duplicated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Archive project
   * POST /projects/:id/archive
   */
  archiveProject = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const project = await this.projectService.archiveProject(id, userId);

        res.json({
          success: true,
          data: { project },
          message: 'Project archived successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Restore project
   * POST /projects/:id/restore
   */
  restoreProject = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const project = await this.projectService.restoreProject(id, userId);

        res.json({
          success: true,
          data: { project },
          message: 'Project restored successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get project statistics
   * GET /projects/:id/stats
   */
  getProjectStats = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const stats = await this.projectService.getProjectStats(id, userId);

        res.json({
          success: true,
          data: { stats },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Search projects
   * GET /projects/search
   */
  searchProjects = [
    validateRequest({
      query: z.object({
        q: z.string().min(1, 'Search query is required'),
        category: z.string().optional(),
        publicOnly: z.string().transform(val => val === 'true').optional(),
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { q, page, limit, category, publicOnly } = req.query as any;
        const userId = req.user?.userId;
        
        const result = await this.projectService.searchProjects(
          q,
          {
            category, 
            userId: publicOnly ? undefined : userId,
            publicOnly,
          },
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            projects: result.projects,
            query: q,
            pagination: {
              page: result.page,
              limit,
              total: result.total,
              totalPages: result.totalPages,
              hasMore: result.page < result.totalPages,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update project page content
   * PUT /projects/:id/page-content
   */
  updatePageContent = [
    validateRequest({
      params: commonSchemas.idParam,
      body: updatePageContentSchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const { pageContent } = req.body;
        const project = await this.projectService.updateProject(id, userId, { pageContent });

        res.json({
          success: true,
          data: { project },
          message: 'Project page content updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}
