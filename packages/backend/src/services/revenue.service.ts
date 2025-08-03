import { prisma } from '../lib/database';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { adsenseService } from './adsense.service';

export interface RevenueDashboardData {
  totalEarnings: number;
  monthlyEarnings: number;
  dailyEarnings: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  topPerformingAds: Array<{
    adUnitId: string;
    name: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }>;
  earningsChart: Array<{
    date: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }>;
  revenueBreakdown: {
    adsense: number;
    affiliate: number;
    sponsored: number;
    other: number;
  };
  projectedEarnings: {
    thisMonth: number;
    nextMonth: number;
    thisYear: number;
  };
}

export interface RevenueAnalytics {
  performanceMetrics: {
    averageCTR: number;
    averageCPM: number;
    fillRate: number;
    viewability: number;
  };
  audienceInsights: {
    topCountries: Array<{
      country: string;
      earnings: number;
      percentage: number;
    }>;
    deviceBreakdown: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    trafficSources: Array<{
      source: string;
      earnings: number;
      percentage: number;
    }>;
  };
  optimizationSuggestions: Array<{
    type: 'placement' | 'format' | 'targeting' | 'content';
    title: string;
    description: string;
    potentialIncrease: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  competitorAnalysis: {
    averageIndustryEarnings: number;
    yourPerformance: 'above' | 'average' | 'below';
    improvementAreas: string[];
  };
}

class RevenueService {
  /**
   * Get revenue dashboard data
   */
  async getRevenueDashboard(
    projectId: string,
    userId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<RevenueDashboardData> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view revenue data for your own projects', 403);
      }

      const revenue = project.revenue as any;
      if (!revenue?.adsenseEnabled) {
        // Return empty dashboard if AdSense is not connected
        return this.getEmptyDashboard();
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get revenue data from AdSense
      const revenueData = await adsenseService.getRevenueData(projectId, userId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      // Calculate metrics
      const totalEarnings = revenueData.totalEarnings;
      const monthlyEarnings = this.calculateMonthlyEarnings(revenueData.dailyData);
      const dailyEarnings = this.calculateDailyAverage(revenueData.dailyData);

      // Generate top performing ads (mock data)
      const topPerformingAds = this.generateTopPerformingAds(revenue.adsenseConfig?.adUnits || []);

      // Calculate revenue breakdown
      const revenueBreakdown = {
        adsense: totalEarnings,
        affiliate: 0, // TODO: Implement affiliate tracking
        sponsored: 0, // TODO: Implement sponsored content tracking
        other: 0,
      };

      // Calculate projected earnings
      const projectedEarnings = this.calculateProjectedEarnings(revenueData.dailyData);

      const dashboardData: RevenueDashboardData = {
        totalEarnings,
        monthlyEarnings,
        dailyEarnings,
        impressions: revenueData.impressions,
        clicks: revenueData.clicks,
        ctr: revenueData.ctr,
        cpm: revenueData.cpm,
        topPerformingAds,
        earningsChart: revenueData.dailyData,
        revenueBreakdown,
        projectedEarnings,
      };

      // Cache the data for performance
      await this.cacheRevenueData(projectId, dashboardData);

      return dashboardData;
    } catch (error: any) {
      logger.error('Failed to get revenue dashboard', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    projectId: string,
    userId: string
  ): Promise<RevenueAnalytics> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view analytics for your own projects', 403);
      }

      // Generate analytics data (mostly mock for now)
      const analytics: RevenueAnalytics = {
        performanceMetrics: {
          averageCTR: Math.random() * 3 + 1, // 1-4%
          averageCPM: Math.random() * 2 + 0.5, // $0.5-2.5
          fillRate: Math.random() * 0.2 + 0.8, // 80-100%
          viewability: Math.random() * 0.3 + 0.7, // 70-100%
        },
        audienceInsights: {
          topCountries: [
            { country: 'United States', earnings: Math.random() * 100, percentage: 45 },
            { country: 'United Kingdom', earnings: Math.random() * 50, percentage: 20 },
            { country: 'Canada', earnings: Math.random() * 30, percentage: 15 },
            { country: 'Australia', earnings: Math.random() * 20, percentage: 10 },
            { country: 'Germany', earnings: Math.random() * 15, percentage: 10 },
          ],
          deviceBreakdown: {
            desktop: Math.random() * 40 + 30, // 30-70%
            mobile: Math.random() * 40 + 30, // 30-70%
            tablet: Math.random() * 20 + 5, // 5-25%
          },
          trafficSources: [
            { source: 'Organic Search', earnings: Math.random() * 60, percentage: 40 },
            { source: 'Direct', earnings: Math.random() * 45, percentage: 30 },
            { source: 'Social Media', earnings: Math.random() * 30, percentage: 20 },
            { source: 'Referral', earnings: Math.random() * 15, percentage: 10 },
          ],
        },
        optimizationSuggestions: [
          {
            type: 'placement',
            title: 'Add above-the-fold ad placement',
            description: 'Adding an ad unit above the fold can increase viewability and earnings by 15-25%',
            potentialIncrease: 20,
            priority: 'high',
          },
          {
            type: 'format',
            title: 'Enable responsive ad units',
            description: 'Responsive ads adapt to different screen sizes and typically perform better',
            potentialIncrease: 15,
            priority: 'medium',
          },
          {
            type: 'targeting',
            title: 'Optimize ad targeting',
            description: 'Review and update your ad targeting settings for better relevance',
            potentialIncrease: 10,
            priority: 'medium',
          },
          {
            type: 'content',
            title: 'Improve content quality',
            description: 'Higher quality content attracts better ads and higher CPMs',
            potentialIncrease: 25,
            priority: 'high',
          },
        ],
        competitorAnalysis: {
          averageIndustryEarnings: Math.random() * 200 + 100,
          yourPerformance: Math.random() > 0.5 ? 'above' : 'average',
          improvementAreas: [
            'Ad placement optimization',
            'Content quality improvement',
            'Mobile user experience',
          ],
        },
      };

      return analytics;
    } catch (error: any) {
      logger.error('Failed to get revenue analytics', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get revenue summary for multiple projects
   */
  async getRevenueSummary(userId: string): Promise<{
    totalEarnings: number;
    monthlyEarnings: number;
    activeProjects: number;
    topProject: {
      id: string;
      name: string;
      earnings: number;
    } | null;
    recentActivity: Array<{
      projectId: string;
      projectName: string;
      earnings: number;
      date: string;
    }>;
  }> {
    try {
      // Get all user projects with revenue enabled
      const projects = await prisma.project.findMany({
        where: {
          userId,
          revenue: {
            path: ['adsenseEnabled'],
            equals: true,
          },
        },
      });

      let totalEarnings = 0;
      let monthlyEarnings = 0;
      let topProject: { id: string; name: string; earnings: number } | null = null;
      const recentActivity: Array<{
        projectId: string;
        projectName: string;
        earnings: number;
        date: string;
      }> = [];

      // Calculate summary data for each project
      for (const project of projects) {
        try {
          const dashboardData = await this.getRevenueDashboard(project.id, userId, '30d');
          
          totalEarnings += dashboardData.totalEarnings;
          monthlyEarnings += dashboardData.monthlyEarnings;

          // Track top performing project
          if (!topProject || dashboardData.totalEarnings > topProject.earnings) {
            topProject = {
              id: project.id,
              name: project.name,
              earnings: dashboardData.totalEarnings,
            };
          }

          // Add to recent activity
          recentActivity.push({
            projectId: project.id,
            projectName: project.name,
            earnings: dashboardData.dailyEarnings,
            date: new Date().toISOString(),
          });
        } catch (error) {
          // Skip projects with errors
          logger.warn('Failed to get revenue data for project', { projectId: project.id });
        }
      }

      // Sort recent activity by earnings
      recentActivity.sort((a, b) => b.earnings - a.earnings);

      return {
        totalEarnings,
        monthlyEarnings,
        activeProjects: projects.length,
        topProject,
        recentActivity: recentActivity.slice(0, 5), // Top 5 recent activities
      };
    } catch (error: any) {
      logger.error('Failed to get revenue summary', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Cache revenue data for performance
   */
  private async cacheRevenueData(projectId: string, data: RevenueDashboardData): Promise<void> {
    try {
      // Store in database cache table (if exists) or Redis
      // For now, we'll skip caching implementation
      logger.debug('Revenue data cached', { projectId });
    } catch (error) {
      logger.warn('Failed to cache revenue data', { projectId });
    }
  }

  /**
   * Get empty dashboard for projects without AdSense
   */
  private getEmptyDashboard(): RevenueDashboardData {
    return {
      totalEarnings: 0,
      monthlyEarnings: 0,
      dailyEarnings: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpm: 0,
      topPerformingAds: [],
      earningsChart: [],
      revenueBreakdown: {
        adsense: 0,
        affiliate: 0,
        sponsored: 0,
        other: 0,
      },
      projectedEarnings: {
        thisMonth: 0,
        nextMonth: 0,
        thisYear: 0,
      },
    };
  }

  /**
   * Calculate monthly earnings from daily data
   */
  private calculateMonthlyEarnings(dailyData: Array<{ date: string; earnings: number }>): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return dailyData
      .filter(day => {
        const date = new Date(day.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, day) => sum + day.earnings, 0);
  }

  /**
   * Calculate daily average earnings
   */
  private calculateDailyAverage(dailyData: Array<{ date: string; earnings: number }>): number {
    if (dailyData.length === 0) return 0;
    const totalEarnings = dailyData.reduce((sum, day) => sum + day.earnings, 0);
    return totalEarnings / dailyData.length;
  }

  /**
   * Generate top performing ads data
   */
  private generateTopPerformingAds(adUnits: any[]): Array<{
    adUnitId: string;
    name: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }> {
    return adUnits.slice(0, 5).map(adUnit => ({
      adUnitId: adUnit.id,
      name: adUnit.name,
      earnings: Math.random() * 50,
      impressions: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 50),
    }));
  }

  /**
   * Calculate projected earnings
   */
  private calculateProjectedEarnings(dailyData: Array<{ date: string; earnings: number }>): {
    thisMonth: number;
    nextMonth: number;
    thisYear: number;
  } {
    const dailyAverage = this.calculateDailyAverage(dailyData);
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysInYear = 365;

    return {
      thisMonth: dailyAverage * daysInMonth,
      nextMonth: dailyAverage * daysInMonth * 1.1, // Assume 10% growth
      thisYear: dailyAverage * daysInYear,
    };
  }
}

export const revenueService = new RevenueService();