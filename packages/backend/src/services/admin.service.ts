import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma'; // Use lib/prisma
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client'; // Import Prisma for types

// Manually define User interface based on schema.prisma
interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string | null;
  profileImage: string | null;
  role: 'USER' | 'ADMIN';
  googleId: string | null;
  githubId: string | null;
  settings: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

// Manually define Project interface based on schema.prisma
interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'DEVELOPING' | 'DEPLOYED' | 'ARCHIVED';
  projectType: 'LOW_CODE' | 'NO_CODE';
  pageContent: string | null;
  aiModel: string | null;
  deployment: string | null;
  revenue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
    username: string;
    profileImage: string | null;
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
    username: string;
    email: string;
  };
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
}

@injectable()
export class AdminService {
  /**
   * Check if user is admin
   */
  private async checkAdminAccess(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') { // Role is 'ADMIN' not 'admin'
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
        // Active users (logged in last 30 days) - requires lastLoginAt field on User model
        // For now, mock active users or filter based on recent activity (e.g., project updates)
        prisma.user.count({ // Mock active users for now
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
            status: 'DEPLOYED', // Direct status check on Project model
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
        prisma.comment.count(), // Use prisma.comment for comments
        prisma.project.count({ // Assuming shared projects are just projects
            where: {
                // Logic to identify shared projects, e.g., published in community
                // status: 'PUBLISHED' // Example status for shared projects
            }
        }),
        // Content reports are not directly linked to a model in this schema
        // For now, mock them or integrate with a dedicated reporting model if it exists
        prisma.communityPost.count({ // Mock content reports as reported community posts
            where: {
                // status: 'REPORTED' // Example status for reported posts
            }
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
      const where: any = {}; // Explicitly type where to any for now

      // Filter based on status (mocking isSuspended and lastLoginAt)
      if (status) {
        if (status === 'suspended') {
          // Assuming a 'suspended' status is managed through a field (e.g., isSuspended)
          // For now, we'll mock this or rely on actual data if available
          // where.isSuspended = true; 
        } else if (status === 'active') {
          where.updatedAt = { // Using updatedAt as a proxy for lastLoginAt
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          };
          // where.isSuspended = false;
        } else if (status === 'inactive') {
          where.updatedAt = { // Using updatedAt as a proxy for lastLoginAt
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          };
          // where.isSuspended = false;
        }
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }, // Order by createdAt instead of lastLoginAt
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
        users.map(async (user: any) => { // Explicitly type user to any for now
          // Calculate total revenue for user (mock data)
          const totalRevenue = Math.random() * 1000 + 100;

          let userStatus: 'active' | 'inactive' | 'suspended' = 'inactive';
          // Mock status based on updatedAt
          if (user.updatedAt.getTime() > (Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            userStatus = 'active';
          }
          // if (user.isSuspended) { // isSuspended does not exist on User model
          //   userStatus = 'suspended';
          // }

          return {
            userId: user.id,
            user: {
              id: user.id,
              username: user.username, // Use username
              profileImage: user.profileImage, // Use profileImage
            },
            projectsCount: user._count.projects,
            lastActive: user.updatedAt, // Use updatedAt for last active
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
        database: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as 'healthy' | 'warning' | 'critical',
        api: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as 'healthy' | 'warning' | 'critical',
        deployment: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as 'healthy' | 'warning' | 'critical',
        revenue: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as 'healthy' | 'warning' | 'critical',
      };

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
      const where: any = {}; // Explicitly type where to any for now

      if (status) {
        // Assuming content reports are linked to community posts and have a status
        // For now, mock status filtering
      }

      // Mock content reports as CommunityPosts
      const [reports, total] = await Promise.all([
        prisma.communityPost.findMany({ // Assuming content reports are linked to community posts
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { // Include user to get reporter info
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        }),
        prisma.communityPost.count({ where }), // Count based on filtered community posts
      ]);

      const formattedReports: ContentReport[] = reports.map((report: any) => ({ // Explicitly type report to any for now
        id: report.id,
        contentType: 'post', // Assuming all reports are for posts for now
        contentId: report.id,
        reason: 'Reported content', // Mock reason
        description: report.title,
        reporter: {
          id: report.user.id,
          username: report.user.username,
          email: report.user.email,
        },
        status: 'pending', // Mock status
        createdAt: report.createdAt,
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

      // Mock update for now, as no contentReport model exists
      logger.info('Content report reviewed (mock)', { reportId, action, userId });

      // await prisma.contentReport.update({
      //   where: { id: reportId },
      //   data: {
      //     status,
      //     reviewedAt: new Date(),
      //     reviewedBy: userId,
      //     resolution,
      //   },
      // });

      // logger.info('Content report reviewed', { reportId, action, userId });
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

      // No isSuspended field on User model, mock for now
      // await prisma.user.update({
      //   where: { id: targetUserId },
      //   data: {
      //     isSuspended: true,
      //     suspensionReason: reason,
      //     suspendedAt: new Date(),
      //     suspendedBy: userId,
      //   },
      // });

      logger.info('User suspended (mock)', { targetUserId, reason, suspendedBy: userId });
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

      // No isSuspended field on User model, mock for now
      // await prisma.user.update({
      //   where: { id: targetUserId },
      //   data: {
      //     isSuspended: false,
      //     suspensionReason: null,
      //     suspendedAt: null,
      //     suspendedBy: null,
      //   },
      // });

      logger.info('User unsuspended (mock)', { targetUserId, unsuspendedBy: userId });
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
              // deployments: true, // deployments not directly on Project
              _count: {
                select: {
                  // comments: true, // comments not directly on Project
                },
              },
            },
          },
          _count: {
            select: {
              projects: true,
              posts: true, // Use posts instead of communityPosts
              comments: true, // Use comments instead of communityComments
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Calculate user statistics
      const totalRevenue = Math.random() * 1000 + 100; // Mock data
      const deployedProjects = (user.projects as any).filter((p: any) => // Explicitly type p to any
        p.status === 'DEPLOYED'
      ).length;

      return {
        user: {
          id: user.id,
          username: user.username, // Use username
          email: user.email,
          profileImage: user.profileImage, // Use profileImage
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt, // Use updatedAt for lastLoginAt
          isSuspended: false, // Mock isSuspended
          suspensionReason: null, // Mock suspensionReason
          suspendedAt: null, // Mock suspendedAt
        },
        statistics: {
          projectsCount: (user as any)._count.projects,
          deployedProjects,
          communityPosts: (user as any)._count.posts, // Use posts
          communityComments: (user as any)._count.comments, // Use comments
          totalRevenue,
        },
        recentProjects: (user.projects as any).slice(0, 5).map((project: any) => ({ // Explicitly type project to any
          id: project.id,
          name: project.name,
          status: project.status,
          createdAt: project.createdAt,
          // deploymentsCount: project._count.deployments, // deployments not directly on Project
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

  /**
   * Get revenue trends for admin dashboard
   */
  async getRevenueTrends(userId: string, period: '30d' = '30d'): Promise<{
    totalRevenue: number;
    growth: number;
    dailyData: Array<{
      date: string;
      revenue: number;
      users: number;
    }>;
    topPerformers: Array<{
      userId: string;
      revenue: number;
      name: string;
    }>;
  }> {
    await this.checkAdminAccess(userId);

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
    return trends;
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(userId: string): Promise<{
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeployTime: number;
    deploymentsByPlatform: {
      cloudflare: number;
      vercel: number;
      netlify: number;
    };
    recentDeployments: Array<{
      id: string;
      projectName: string;
      status: string;
      platform: string;
      deployedAt: Date;
      duration: number;
    }>;
  }> {
    await this.checkAdminAccess(userId);

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
    return stats;
  }
}
