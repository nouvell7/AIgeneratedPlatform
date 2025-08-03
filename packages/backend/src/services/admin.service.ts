import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface PlatformStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  projects: {
    total: number;
    deployed: number;
    newThisMonth: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
    averagePerUser: number;
  };
  community: {
    posts: number;
    comments: number;
    sharedProjects: number;
    reports: number;
  };
}

export interface UserActivity {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  projectsCount: number;
  lastActive: Date;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  services: {
    database: 'healthy' | 'warning' | 'critical';
    api: 'healthy' | 'warning' | 'critical';
    deployment: 'healthy' | 'warning' | 'critical';
    revenue: 'healthy' | 'warning' | 'critical';
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export interface ContentReport {
  id: string;
  contentType: 'post' | 'comment' | 'project';
  contentId: string;
  reason: string;
  description?: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
}

class AdminService {
  /**
   * Check if user is admin
   */
  private async checkAdminAccess(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(userId: string): Promise<PlatformStats> {
    try {
      await this.checkAdminAccess(userId);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      // User statistics
      const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: lastMonth },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: twoMonthsAgo,
              lt: lastMonth,
            },
          },
        }),
      ]);

      const userGrowth = newUsersLastMonth > 0 
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
        : 0;

      // Project statistics
      const [totalProjects, deployedProjects, newProjectsThisMonth, newProjectsLastMonth] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({
          where: {
            deployments: {
              some: {
                status: 'deployed',
              },
            },
          },
        }),
        prisma.project.count({
          where: {
            createdAt: { gte: lastMonth },
          },
        }),
        prisma.project.count({
          where: {
            createdAt: {
              gte: twoMonthsAgo,
              lt: lastMonth,
            },
          },
        }),
      ]);

      const projectGrowth = newProjectsLastMonth > 0 
        ? ((newProjectsThisMonth - newProjectsLastMonth) / newProjectsLastMonth) * 100 
        : 0;

      // Revenue statistics (mock data for now)
      const totalRevenue = Math.random() * 100000 + 50000;
      const thisMonthRevenue = Math.random() * 10000 + 5000;
      const lastMonthRevenue = Math.random() * 8000 + 4000;
      const revenueGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      const averagePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Community statistics
      const [communityPosts, communityComments, sharedProjects, pendingReports] = await Promise.all([
        prisma.communityPost.count(),
        prisma.communityComment.count(),
        prisma.sharedProject.count(),
        prisma.contentReport.count({
          where: { status: 'pending' },
        }),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth,
        },
        projects: {
          total: totalProjects,
          deployed: deployedProjects,
          newThisMonth: newProjectsThisMonth,
          growth: projectGrowth,
        },
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          growth: revenueGrowth,
          averagePerUser,
        },
        community: {
          posts: communityPosts,
          comments: communityComments,
          sharedProjects,
          reports: pendingReports,
        },
      };
    } catch (error: any) {
      logger.error('Failed to get platform stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: 'active' | 'inactive' | 'suspended'
  ): Promise<{ activities: UserActivity[]; total: number; hasMore: boolean }> {
    try {
      await this.checkAdminAccess(userId);

      const skip = (page - 1) * limit;
      const where: any = {};

      if (status) {
        if (status === 'suspended') {
          where.isSuspended = true;
        } else if (status === 'active') {
          where.lastLoginAt = {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          };
          where.isSuspended = false;
        } else if (status === 'inactive') {
          where.OR = [
            { lastLoginAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            { lastLoginAt: null },
          ];
          where.isSuspended = false;
        }
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { lastLoginAt: 'desc' },
          include: {
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const activities: UserActivity[] = await Promise.all(
        users.map(async (user) => {
          // Calculate total revenue for user (mock data)
          const totalRevenue = Math.random() * 1000 + 100;

          let userStatus: 'active' | 'inactive' | 'suspended' = 'inactive';
          if (user.isSuspended) {
            userStatus = 'suspended';
          } else if (user.lastLoginAt && user.lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            userStatus = 'active';
          }

          return {
            userId: user.id,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            },
            projectsCount: user._count.projects,
            lastActive: user.lastLoginAt || user.createdAt,
            totalRevenue,
            status: userStatus,
          };
        })
      );

      return {
        activities,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error: any) {
      logger.error('Failed to get user activities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(userId: string): Promise<SystemHealth> {
    try {
      await this.checkAdminAccess(userId);

      // Mock system health data
      const uptime = Math.random() * 100 + 95; // 95-100%
      const responseTime = Math.random() * 200 + 50; // 50-250ms
      const errorRate = Math.random() * 2; // 0-2%

      const services = {
        database: Math.random() > 0.1 ? 'healthy' : 'warning',
        api: Math.random() > 0.05 ? 'healthy' : 'warning',
        deployment: Math.random() > 0.15 ? 'healthy' : 'warning',
        revenue: Math.random() > 0.08 ? 'healthy' : 'warning',
      } as const;

      const status = Object.values(services).some(s => s === 'critical') 
        ? 'critical' 
        : Object.values(services).some(s => s === 'warning') 
        ? 'warning' 
        : 'healthy';

      // Mock alerts
      const alerts = [
        {
          id: '1',
          type: 'warning' as const,
          message: 'High memory usage detected on deployment service',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          resolved: false,
        },
        {
          id: '2',
          type: 'info' as const,
          message: 'Scheduled maintenance completed successfully',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          resolved: true,
        },
      ];

      return {
        status,
        uptime,
        responseTime,
        errorRate,
        services,
        alerts,
      };
    } catch (error: any) {
      logger.error('Failed to get system health', { error: error.message });
      throw error;
    }
  }

  /**
   * Get content reports
   */
  async getContentReports(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<{ reports: ContentReport[]; total: number; hasMore: boolean }> {
    try {
      await this.checkAdminAccess(userId);

      const skip = (page - 1) * limit;
      const where: any = {};

      if (status) {
        where.status = status;
      }

      const [reports, total] = await Promise.all([
        prisma.contentReport.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.contentReport.count({ where }),
      ]);

      const formattedReports: ContentReport[] = reports.map(report => ({
        id: report.id,
        contentType: report.contentType as 'post' | 'comment' | 'project',
        contentId: report.contentId,
        reason: report.reason,
        description: report.description,
        reporter: report.reporter,
        status: report.status as 'pending' | 'reviewed' | 'resolved' | 'dismissed',
        createdAt: report.createdAt,
        reviewedAt: report.reviewedAt,
        reviewedBy: report.reviewedBy,
        resolution: report.resolution,
      }));

      return {
        reports: formattedReports,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error: any) {
      logger.error('Failed to get content reports', { error: error.message });
      throw error;
    }
  }

  /**
   * Review content report
   */
  async reviewContentReport(
    userId: string,
    reportId: string,
    action: 'dismiss' | 'resolve',
    resolution?: string
  ): Promise<void> {
    try {
      await this.checkAdminAccess(userId);

      const status = action === 'dismiss' ? 'dismissed' : 'resolved';

      await prisma.contentReport.update({
        where: { id: reportId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: userId,
          resolution,
        },
      });

      logger.info('Content report reviewed', { reportId, action, userId });
    } catch (error: any) {
      logger.error('Failed to review content report', { error: error.message, reportId });
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, targetUserId: string, reason: string): Promise<void> {
    try {
      await this.checkAdminAccess(userId);

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isSuspended: true,
          suspensionReason: reason,
          suspendedAt: new Date(),
          suspendedBy: userId,
        },
      });

      logger.info('User suspended', { targetUserId, reason, suspendedBy: userId });
    } catch (error: any) {
      logger.error('Failed to suspend user', { error: error.message, targetUserId });
      throw error;
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(userId: string, targetUserId: string): Promise<void> {
    try {
      await this.checkAdminAccess(userId);

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isSuspended: false,
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
        },
      });

      logger.info('User unsuspended', { targetUserId, unsuspendedBy: userId });
    } catch (error: any) {
      logger.error('Failed to unsuspend user', { error: error.message, targetUserId });
      throw error;
    }
  }

  /**
   * Get user details for support
   */
  async getUserDetails(userId: string, targetUserId: string): Promise<any> {
    try {
      await this.checkAdminAccess(userId);

      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          projects: {
            include: {
              deployments: true,
              _count: {
                select: {
                  deployments: true,
                },
              },
            },
          },
          _count: {
            select: {
              projects: true,
              communityPosts: true,
              communityComments: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Calculate user statistics
      const totalRevenue = Math.random() * 1000 + 100; // Mock data
      const deployedProjects = user.projects.filter(p => 
        p.deployments.some(d => d.status === 'deployed')
      ).length;

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isSuspended: user.isSuspended,
          suspensionReason: user.suspensionReason,
          suspendedAt: user.suspendedAt,
        },
        statistics: {
          projectsCount: user._count.projects,
          deployedProjects,
          communityPosts: user._count.communityPosts,
          communityComments: user._count.communityComments,
          totalRevenue,
        },
        recentProjects: user.projects.slice(0, 5).map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          createdAt: project.createdAt,
          deploymentsCount: project._count.deployments,
        })),
      };
    } catch (error: any) {
      logger.error('Failed to get user details', { error: error.message, targetUserId });
      throw error;
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(
    userId: string,
    page: number = 1,
    limit: number = 50,
    level?: 'error' | 'warn' | 'info' | 'debug'
  ): Promise<{ logs: any[]; total: number; hasMore: boolean }> {
    try {
      await this.checkAdminAccess(userId);

      // Mock system logs
      const mockLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - i * 60 * 1000), // Every minute
        level: ['error', 'warn', 'info', 'debug'][Math.floor(Math.random() * 4)],
        message: `System log message ${i}`,
        service: ['api', 'database', 'deployment', 'revenue'][Math.floor(Math.random() * 4)],
        metadata: {
          userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
          projectId: Math.random() > 0.7 ? `project-${Math.floor(Math.random() * 50)}` : undefined,
        },
      }));

      let filteredLogs = mockLogs;
      if (level) {
        filteredLogs = mockLogs.filter(log => log.level === level);
      }

      const skip = (page - 1) * limit;
      const logs = filteredLogs.slice(skip, skip + limit);
      const total = filteredLogs.length;

      return {
        logs,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error: any) {
      logger.error('Failed to get system logs', { error: error.message });
      throw error;
    }
  }
}

export const adminService = new AdminService();