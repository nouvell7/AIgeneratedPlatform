import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe'; // tsyringe 임포트
import { SuccessStoryService } from '../services/success-story.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { z } from 'zod';

const storyFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

@injectable() // injectable 데코레이터 추가
export class SuccessStoryController {
  constructor(@inject(SuccessStoryService) private successStoryService: SuccessStoryService) {} // 생성자 주입

  /**
   * Get all success stories
   * GET /success-stories
   */
  getSuccessStories = [ // static 제거
    validateRequest({ 
      query: z.object({
        ...storyFiltersSchema.shape,
        ...commonSchemas.pagination.shape,
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, ...filters } = req.query as any;
        
        const result = await this.successStoryService.getSuccessStories( // this. 사용
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
  getSuccessStory = [ // static 제거
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const story = await this.successStoryService.getSuccessStoryById(id); // this. 사용

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
  getFeatured = async (req: Request, res: Response, next: NextFunction) => { // static 제거
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const stories = await this.successStoryService.getFeaturedStories(limit); // this. 사용

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
  getByCategory = [ // static 제거
    validateRequest({ 
      params: z.object({
        category: z.string().min(1, 'Category is required'),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { category } = req.params;
        const stories = await this.successStoryService.getStoriesByCategory(category); // this. 사용

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

// export default SuccessStoryController; // default export는 유지
