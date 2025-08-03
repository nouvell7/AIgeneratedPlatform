import { Request, Response } from 'express';
import { revenueService } from '../services/revenue.service';
import { revenueOptimizationService } from '../services/revenue-optimization.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class RevenueController {
  /**
   * Get revenue dashboard data
   */
  async getRevenueDashboard(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { timeRange } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const dashboardData = await revenueService.getRevenueDashboard(
        projectId,
        userId,
        timeRange as '7d' | '30d' | '90d' | '1y'
      );

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue dashboard', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_DASHBOARD_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const analytics = await revenueService.getRevenueAnalytics(projectId, userId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue analytics', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_ANALYTICS_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue summary for user
   */
  async getRevenueSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const summary = await revenueService.getRevenueSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue summary', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_SUMMARY_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { period } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      // Get dashboard data for different periods to calculate trends
      const currentPeriod = await revenueService.getRevenueDashboard(
        projectId,
        userId,
        (period as any) || '30d'
      );

      // Calculate trends (simplified)
      const trends = {
        earnings: {
          current: currentPeriod.totalEarnings,
          previous: currentPeriod.totalEarnings * 0.85, // Mock previous period
          change: 15, // Mock 15% increase
          trend: 'up' as const,
        },
        impressions: {
          current: currentPeriod.impressions,
          previous: Math.floor(currentPeriod.impressions * 0.9),
          change: 10,
          trend: 'up' as const,
        },
        ctr: {
          current: currentPeriod.ctr,
          previous: currentPeriod.ctr * 0.95,
          change: 5,
          trend: 'up' as const,
        },
        cpm: {
          current: currentPeriod.cpm,
          previous: currentPeriod.cpm * 1.1,
          change: -10,
          trend: 'down' as const,
        },
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
   * Get revenue comparison
   */
  async getRevenueComparison(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { compareWith } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const currentData = await revenueService.getRevenueDashboard(projectId, userId, '30d');

      let comparisonData;
      switch (compareWith) {
        case 'previous_month':
          // Mock previous month data
          comparisonData = {
            ...currentData,
            totalEarnings: currentData.totalEarnings * 0.85,
            impressions: Math.floor(currentData.impressions * 0.9),
            clicks: Math.floor(currentData.clicks * 0.88),
          };
          break;
        case 'same_month_last_year':
          // Mock same month last year data
          comparisonData = {
            ...currentData,
            totalEarnings: currentData.totalEarnings * 0.7,
            impressions: Math.floor(currentData.impressions * 0.8),
            clicks: Math.floor(currentData.clicks * 0.75),
          };
          break;
        default:
          comparisonData = currentData;
      }

      const comparison = {
        current: {
          earnings: currentData.totalEarnings,
          impressions: currentData.impressions,
          clicks: currentData.clicks,
          ctr: currentData.ctr,
          cpm: currentData.cpm,
        },
        comparison: {
          earnings: comparisonData.totalEarnings,
          impressions: comparisonData.impressions,
          clicks: comparisonData.clicks,
          ctr: comparisonData.ctr,
          cpm: comparisonData.cpm,
        },
        changes: {
          earnings: ((currentData.totalEarnings - comparisonData.totalEarnings) / comparisonData.totalEarnings) * 100,
          impressions: ((currentData.impressions - comparisonData.impressions) / comparisonData.impressions) * 100,
          clicks: ((currentData.clicks - comparisonData.clicks) / comparisonData.clicks) * 100,
          ctr: ((currentData.ctr - comparisonData.ctr) / comparisonData.ctr) * 100,
          cpm: ((currentData.cpm - comparisonData.cpm) / comparisonData.cpm) * 100,
        },
      };

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue comparison', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_COMPARISON_FAILED',
        },
      });
    }
  }

  /**
   * Export revenue data
   */
  async exportRevenueData(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { format, startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const dashboardData = await revenueService.getRevenueDashboard(projectId, userId, '90d');

      // Format data for export
      const exportData = {
        project: projectId,
        exportDate: new Date().toISOString(),
        dateRange: {
          start: startDate || '90 days ago',
          end: endDate || 'today',
        },
        summary: {
          totalEarnings: dashboardData.totalEarnings,
          totalImpressions: dashboardData.impressions,
          totalClicks: dashboardData.clicks,
          averageCTR: dashboardData.ctr,
          averageCPM: dashboardData.cpm,
        },
        dailyData: dashboardData.earningsChart,
        topPerformingAds: dashboardData.topPerformingAds,
        revenueBreakdown: dashboardData.revenueBreakdown,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="revenue-${projectId}-${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        // Return JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="revenue-${projectId}-${Date.now()}.json"`);
        res.json(exportData);
      }
    } catch (error: any) {
      logger.error('Failed to export revenue data', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_EXPORT_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue settings
   */
  async getRevenueSettings(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const settings = await revenueOptimizationService.getRevenueSettings(projectId, userId);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue settings', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_SETTINGS_FAILED',
        },
      });
    }
  }

  /**
   * Update revenue settings
   */
  async updateRevenueSettings(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const settings = req.body;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const updatedSettings = await revenueOptimizationService.updateRevenueSettings(
        projectId,
        userId,
        settings
      );

      res.json({
        success: true,
        data: updatedSettings,
      });
    } catch (error: any) {
      logger.error('Failed to update revenue settings', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_SETTINGS_UPDATE_FAILED',
        },
      });
    }
  }

  /**
   * Get optimization report
   */
  async getOptimizationReport(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const report = await revenueOptimizationService.getOptimizationReport(projectId, userId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Failed to get optimization report', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'OPTIMIZATION_REPORT_FAILED',
        },
      });
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const recommendations = await revenueOptimizationService.generateOptimizationRecommendations(
        projectId,
        userId
      );

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      logger.error('Failed to get optimization recommendations', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'OPTIMIZATION_RECOMMENDATIONS_FAILED',
        },
      });
    }
  }

  /**
   * Apply optimization recommendation
   */
  async applyOptimizationRecommendation(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { recommendationId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      if (!recommendationId) {
        throw new AppError('Recommendation ID is required', 400);
      }

      const result = await revenueOptimizationService.applyOptimizationRecommendation(
        projectId,
        userId,
        recommendationId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to apply optimization recommendation', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'OPTIMIZATION_APPLY_FAILED',
        },
      });
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const headers = ['Date', 'Earnings', 'Impressions', 'Clicks', 'CTR', 'CPM'];
    const rows = data.dailyData.map((day: any) => [
      day.date,
      day.earnings.toFixed(2),
      day.impressions,
      day.clicks,
      ((day.clicks / day.impressions) * 100).toFixed(2),
      ((day.earnings / day.impressions) * 1000).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

export const revenueController = new RevenueController();