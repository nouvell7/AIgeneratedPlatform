import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class AdminController {
  /**
   * Get platform statistics
   */
  async getPlatformStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const stats = await adminService.getPlatformStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get platform stats', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'PLATFORM_STATS_FAILED',
        },
      });
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        page = '1',
        limit = '20',
        status
      } = req.query;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await adminService.getUserActivities(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        status as 'active' | 'inactive' | 'suspended'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to get user activities', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'USER_ACTIVITIES_FAILED',
        },
      });
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const health = await adminService.getSystemHealth(userId);

      res.json({
        success: true,
        data: health,
      });
    } catch (error: any) {
      logger.error('Failed to get system health', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'SYSTEM_HEALTH_FAILED',
        },
      });
    }
  }

  /**
   * Get content reports
   */
  async getContentReports(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        page = '1',
        limit = '20',
        status
      } = req.query;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await adminService.getContentReports(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        status as 'pending' | 'reviewed' | 'resolved' | 'dismissed'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to get content reports', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CONTENT_REPORTS_FAILED',
        },
      });
    }
  }

  /**
   * Review content report
   */
  async reviewContentReport(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { action, resolution } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!reportId) {
        throw new AppError('Report ID is required', 400);
      }

      if (!action || !['dismiss', 'resolve'].includes(action)) {
        throw new AppError('Valid action is required (dismiss or resolve)', 400);
      }

      await adminService.reviewContentReport(userId, reportId, action, resolution);

      res.json({
        success: true,
        message: `Report ${action}ed successfully`,
      });
    } catch (error: any) {
      logger.error('Failed to review content report', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CONTENT_REPORT_REVIEW_FAILED',
        },
      });
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(req: Request, res: Response) {
    try {
      const { targetUserId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      if (!reason) {
        throw new AppError('Suspension reason is required', 400);
      }

      await adminService.suspendUser(userId, targetUserId, reason);

      res.json({
        success: true,
        message: 'User suspended successfully',
      });
    } catch (error: any) {
      logger.error('Failed to suspend user', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'USER_SUSPEND_FAILED',
        },
      });
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(req: Request, res: Response) {
    try {
      const { targetUserId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      await adminService.unsuspendUser(userId, targetUserId);

      res.json({
        success: true,
        message: 'User unsuspended successfully',
      });
    } catch (error: any) {
      logger.error('Failed to unsuspend user', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'USER_UNSUSPEND_FAILED',
        },
      });
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(req: Request, res: Response) {
    try {
      const { targetUserId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      const userDetails = await adminService.getUserDetails(userId, targetUserId);

      res.json({
        success: true,
        data: userDetails,
      });
    } catch (error: any) {
      logger.error('Failed to get user details', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'USER_DETAILS_FAILED',
        },
      });
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        page = '1',
        limit = '50',
        level
      } = req.query;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await adminService.getSystemLogs(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        level as 'error' | 'warn' | 'info' | 'debug'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to get system logs', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'SYSTEM_LOGS_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue trends for admin dashboard
   */
  async getRevenueTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { period = '30d' } = req.query;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Mock revenue trends data
      const trends = {
        totalRevenue: Math.random() * 100000 + 50000,
        growth: Math.random() * 20 + 5, // 5-25% growth
        dailyData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          revenue: Math.random() * 2000 + 1000,
          users: Math.floor(Math.random() * 100) + 50,
        })),
        topPerformers: [
          { userId: 'user1', revenue: Math.random() * 5000 + 2000, name: 'John Doe' },
          { userId: 'user2', revenue: Math.random() * 4000 + 1500, name: 'Jane Smith' },
          { userId: 'user3', revenue: Math.random() * 3000 + 1000, name: 'Bob Johnson' },
        ],
      };

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue trends', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_TRENDS_FAILED',
        },
      });
    }
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Mock deployment statistics
      const stats = {
        totalDeployments: Math.floor(Math.random() * 1000) + 500,
        successfulDeployments: Math.floor(Math.random() * 900) + 450,
        failedDeployments: Math.floor(Math.random() * 50) + 10,
        averageDeployTime: Math.random() * 300 + 120, // seconds
        deploymentsByPlatform: {
          cloudflare: Math.floor(Math.random() * 400) + 200,
          vercel: Math.floor(Math.random() * 300) + 150,
          netlify: Math.floor(Math.random() * 200) + 100,
        },
        recentDeployments: Array.from({ length: 10 }, (_, i) => ({
          id: `deploy-${i}`,
          projectName: `Project ${i + 1}`,
          status: ['success', 'failed', 'pending'][Math.floor(Math.random() * 3)],
          platform: ['cloudflare', 'vercel', 'netlify'][Math.floor(Math.random() * 3)],
          deployedAt: new Date(Date.now() - i * 60 * 60 * 1000), // Every hour
          duration: Math.floor(Math.random() * 300) + 60,
        })),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment stats', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_STATS_FAILED',
        },
      });
    }
  }
}

export const adminController = new AdminController();