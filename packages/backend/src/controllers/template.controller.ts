import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { TemplateService } from '../services/template.service';
import { ProjectService } from '../services/project.service';



export class TemplateController {
  private templateService: TemplateService;
  private projectService: ProjectService;

  constructor() {
    this.templateService = container.resolve(TemplateService);
    this.projectService = container.resolve(ProjectService);
  }

  /**
   * Get all templates
   * GET /templates
   */
  getTemplates = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page = 1, limit = 12, ...filters } = req.query as any;
        
        const result = await this.templateService.getTemplates(
          filters,
          { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
          success: true,
          data: {
            templates: result.templates,
            pagination: {
              page: result.page,
              limit: parseInt(limit),
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
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { q, page = 1, limit = 12, ...filters } = req.query as any;
        
        const result = await this.templateService.searchTemplates(
          q,
          filters,
          { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
          success: true,
          data: {
            templates: result.templates,
            query: q,
            pagination: {
              page: result.page,
              limit: parseInt(limit),
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
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id: templateId } = req.params;
        const { name, description } = req.body;
        const userId = (req as any).user?.userId;
        
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
