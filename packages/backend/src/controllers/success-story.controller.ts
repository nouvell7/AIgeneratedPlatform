import { Request, Response, NextFunction } from 'express';
import { SuccessStoryService } from '../services/success-story.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { z } from 'zod';

const storyFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export class SuccessStoryController {
  /**
   * Get all success stories
   * GET /success-stories
   */
  static getSuccessStories = [
    validateRequest({ 
      query: z.object({
        ...storyFiltersSchema.shape,
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, ...filters } = req.query as any;
        
        const result = await SuccessStoryService.getSuccessStories(
          filters,
          { page, limit }
        );

        res.json({
          success: true,
          data: {
            stories: result.stories,
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
   * Get success story by ID
   * GET /success-stories/:id
   */
  static getSuccessStory = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const story = await SuccessStoryService.getSuccessStoryById(id);

        res.json({
          success: true,
          data: { story },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get featured success stories
   * GET /success-stories/featured
   */
  static getFeatured = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const stories = await SuccessStoryService.getFeaturedStories(limit);

      res.json({
        success: true,
        data: { stories },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get success stories by category
   * GET /success-stories/category/:category
   */
  static getByCategory = [
    validateRequest({ 
      params: z.object({
        category: z.string().min(1, 'Category is required'),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { category } = req.params;
        const stories = await SuccessStoryService.getStoriesByCategory(category);

        res.json({
          success: true,
          data: { stories, category },
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default SuccessStoryController;