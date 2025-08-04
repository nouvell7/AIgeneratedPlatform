import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { UserService } from '../services/user.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { z } from 'zod';

// Validation schemas for user endpoints
const updateProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long').optional(),
  profileImage: z.string().url('Invalid image URL').optional(),
});

const uploadImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50, 'Search query too long'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(50)).default('10'),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(0)).default('0'),
});

const leaderboardSchema = z.object({
  type: z.enum(['projects', 'revenue', 'community']).default('projects'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(50)).default('10'),
});

const activitySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(50)).default('20'),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(0)).default('0'),
});

@injectable()
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  /**
   * Get current user profile
   * GET /users/profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
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

      const user = await this.userService.getUserProfile(userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get public user profile
   * GET /users/:id/profile
   */
  getPublicProfile = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const profile = await this.userService.getPublicProfile(id);

        res.json({
          success: true,
          data: { profile },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update user profile
   * PUT /users/profile
   */
  updateProfile = [
    validateRequest({ body: updateProfileSchema }),
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

        const user = await this.userService.updateProfile(userId, req.body);

        res.json({
          success: true,
          data: { user },
          message: 'Profile updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Upload profile image
   * POST /users/profile/image
   */
  uploadProfileImage = [
    validateRequest({ body: uploadImageSchema }),
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

        const { imageUrl } = req.body;
        const user = await this.userService.uploadProfileImage(userId, imageUrl);

        res.json({
          success: true,
          data: { user },
          message: 'Profile image updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get user statistics
   * GET /users/stats
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
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

      const stats = await this.userService.getUserStats(userId);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get public user statistics
   * GET /users/:id/stats
   */
  getPublicStats = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const stats = await this.userService.getUserStats(id);

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
   * Search users
   * GET /users/search
   */
  searchUsers = [
    validateRequest({ query: searchUsersSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { q, limit, offset } = req.query as any;
        const result = await this.userService.searchUsers(q, limit, offset);

        res.json({
          success: true,
          data: {
            users: result.users,
            pagination: {
              total: result.total,
              limit,
              offset,
              hasMore: offset + limit < result.total,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get user activity feed
   * GET /users/activity
   */
  getActivity = [
    validateRequest({ query: activitySchema }),
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

        const { limit, offset } = req.query as any;
        const activities = await this.userService.getUserActivity(userId, limit, offset);

        res.json({
          success: true,
          data: {
            activities,
            pagination: {
              limit,
              offset,
              hasMore: activities.length === limit,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get public user activity
   * GET /users/:id/activity
   */
  getPublicActivity = [
    validateRequest({ 
      params: commonSchemas.idParam,
      query: activitySchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { limit, offset } = req.query as any;
        
        // First check if user profile is public
        await this.userService.getPublicProfile(id);
        
        const activities = await this.userService.getUserActivity(id, limit, offset);

        res.json({
          success: true,
          data: {
            activities,
            pagination: {
              limit,
              offset,
              hasMore: activities.length === limit,
            },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get users leaderboard
   * GET /users/leaderboard
   */
  getLeaderboard = [
    validateRequest({ query: leaderboardSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type, limit } = req.query as any;
        const leaderboard = await this.userService.getLeaderboard(type, limit);

        res.json({
          success: true,
          data: {
            leaderboard,
            type,
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Delete user account
   * DELETE /users/account
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
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

      await this.userService.deleteUserAccount(userId);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
