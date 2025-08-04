import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { TemplateService } from '../services/template.service';
import { ProjectService } from '../services/project.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { z } from 'zod';

const templateFiltersSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  search: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).pipe(z.array(z.string())).optional(),
});

@injectable()
export class TemplateController {
  constructor(
    @inject(TemplateService) private templateService: TemplateService,
    @inject(ProjectService) private projectService: ProjectService
  ) {}

  /**
   * Get all templates
   * GET /templates
   */
  getTemplates = [
    validateRequest({
      query: z.object({
        ...templateFiltersSchema.shape,
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, ...filters } = req.query as any;
        
        const result = await this.templateService.getTemplates(
          filters,
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            templates: result.templates,
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
   * Get template by ID
   * GET /templates/:id
   */
  getTemplate = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const template = await this.templateService.getTemplateById(id);

        res.json({
          success: true,
          data: { template },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get template categories
   * GET /templates/categories
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.templateService.getCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get popular templates
   * GET /templates/popular
   */
  getPopular = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const templates = await this.templateService.getPopularTemplates(limit);

      res.json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get featured templates
   * GET /templates/featured
   */
  getFeatured = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const templates = await this.templateService.getFeaturedTemplates(limit);

      res.json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search templates
   * GET /templates/search
   */
  searchTemplates = [
    validateRequest({
      query: z.object({
        q: z.string().min(1, 'Search query is required'),
        category: z.string().optional(),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { q, page, limit, ...filters } = req.query as any;
        
        const result = await this.templateService.searchTemplates(
          q,
          filters,
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            templates: result.templates,
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
   * Create project from template
   * POST /projects/from-template/:templateId
   */
  createFromTemplate = [
    validateRequest({
      params: commonSchemas.idParam,
      body: z.object({
        name: z.string().min(1, 'Project name is required'),
        description: z.string().optional(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id: templateId } = req.params;
        const { name, description } = req.body;
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

        // Get template
        const template = await this.templateService.getTemplateById(templateId);
        
        // Create project from template
        const project = await this.projectService.createProject(userId, {
          name,
          description: description || template.description,
          category: template.category,
        });

        // Project created successfully

        // Increment template usage count
        await this.templateService.incrementUsageCount(templateId);

        res.status(201).json({
          success: true,
          data: { 
            project,
            template: {
              id: template.id,
              name: template.name,
              codeTemplate: template.codeTemplate,
            },
          },
          message: 'Project created from template successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}
