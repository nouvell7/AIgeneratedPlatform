import { injectable, inject } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface RevenueSettings {
  adPlacement: {
    headerAds: boolean;
    sidebarAds: boolean;
    contentAds: boolean;
    footerAds: boolean;
    mobileOptimized: boolean;
  };
  adFormats: {
    displayAds: boolean;
    textAds: boolean;
    videoAds: boolean;
    nativeAds: boolean;
    responsiveAds: boolean;
  };
  targeting: {
    geographicTargeting: boolean;
    demographicTargeting: boolean;
    behavioralTargeting: boolean;
    contextualTargeting: boolean;
  };
  optimization: {
    autoOptimization: boolean;
    adBlockRecovery: boolean;
    lazyLoading: boolean;
    adRefresh: boolean;
    adRefreshInterval: number; // seconds
  };
  filters: {
    adultContent: boolean;
    gambling: boolean;
    alcohol: boolean;
    politics: boolean;
    religion: boolean;
  };
}

export interface OptimizationRecommendation {
  id: string;
  type: 'placement' | 'format' | 'targeting' | 'content' | 'technical';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedIncrease: number; // percentage
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeToImplement: string;
  steps: string[];
  impact: {
    revenue: number;
    userExperience: number; // -5 to 5 scale
    pageSpeed: number; // -5 to 5 scale
  };
}

export interface RevenueOptimizationReport {
  currentPerformance: {
    score: number; // 0-100
    earnings: number;
    ctr: number;
    cpm: number;
    fillRate: number;
  };
  recommendations: OptimizationRecommendation[];
  projectedImprovements: {
    potentialEarningsIncrease: number;
    estimatedTimeframe: string;
    confidenceLevel: number; // 0-100
  };
  competitorBenchmark: {
    industryAverage: {
      ctr: number;
      cpm: number;
      earnings: number;
    };
    yourPosition: 'above' | 'average' | 'below';
    improvementOpportunity: number; // percentage
  };
}

@injectable()
export class RevenueOptimizationService {
  /**
   * Get revenue settings for a project
   */
  async getRevenueSettings(projectId: string, userId: string): Promise<RevenueSettings> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view settings for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      
      // Return default settings if none exist
      if (!revenue?.settings) {
        return this.getDefaultSettings();
      }

      return revenue.settings;
    } catch (error: any) {
      logger.error('Failed to get revenue settings', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Update revenue settings for a project
   */
  async updateRevenueSettings(
    projectId: string,
    userId: string,
    settings: Partial<RevenueSettings>
  ): Promise<RevenueSettings> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only update settings for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : {};
      const currentSettings = revenue.settings || this.getDefaultSettings();
      
      // Merge with existing settings
      const updatedSettings: RevenueSettings = {
        adPlacement: { ...currentSettings.adPlacement, ...settings.adPlacement },
        adFormats: { ...currentSettings.adFormats, ...settings.adFormats },
        targeting: { ...currentSettings.targeting, ...settings.targeting },
        optimization: { ...currentSettings.optimization, ...settings.optimization },
        filters: { ...currentSettings.filters, ...settings.filters },
      };

      // Update project
      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({ // Stringify revenue object
            ...revenue,
            settings: updatedSettings,
          }),
        },
      });

      logger.info('Revenue settings updated', { projectId });

      return updatedSettings;
    } catch (error: any) {
      logger.error('Failed to update revenue settings', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(
    projectId: string,
    userId: string
  ): Promise<OptimizationRecommendation[]> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only get recommendations for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      const settings = revenue?.settings || this.getDefaultSettings();

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze current settings and generate recommendations
      
      // Ad Placement Recommendations
      if (!settings.adPlacement.headerAds) {
        recommendations.push({
          id: 'header-ads',
          type: 'placement',
          priority: 'high',
          title: 'Enable Header Ad Placement',
          description: 'Adding ads in the header area can significantly increase visibility and earnings. Header ads typically have high viewability rates.',
          expectedIncrease: 25,
          implementationDifficulty: 'easy',
          estimatedTimeToImplement: '15 minutes',
          steps: [
            'Enable header ads in your revenue settings',
            'Choose appropriate ad sizes (728x90 or 320x50 for mobile)',
            'Test ad placement to ensure it doesn\'t interfere with navigation',
            'Monitor performance for 7 days',
          ],
          impact: {
            revenue: 4,
            userExperience: -1,
            pageSpeed: -1,
          },
        });
      }

      if (!settings.adPlacement.contentAds) {
        recommendations.push({
          id: 'content-ads',
          type: 'placement',
          priority: 'high',
          title: 'Add In-Content Ad Placements',
          description: 'Placing ads within content provides better user engagement and higher click-through rates.',
          expectedIncrease: 35,
          implementationDifficulty: 'medium',
          estimatedTimeToImplement: '30 minutes',
          steps: [
            'Enable content ads in settings',
            'Configure ad insertion after specific paragraphs',
            'Use responsive ad units for better mobile experience',
            'A/B test different positions',
          ],
          impact: {
            revenue: 5,
            userExperience: -2,
            pageSpeed: -1,
          },
        });
      }

      // Ad Format Recommendations
      if (!settings.adFormats.responsiveAds) {
        recommendations.push({
          id: 'responsive-ads',
          type: 'format',
          priority: 'high',
          title: 'Enable Responsive Ad Units',
          description: 'Responsive ads automatically adjust to different screen sizes, improving performance across all devices.',
          expectedIncrease: 20,
          implementationDifficulty: 'easy',
          estimatedTimeToImplement: '10 minutes',
          steps: [
            'Enable responsive ads in format settings',
            'Replace fixed-size ad units with responsive ones',
            'Test on different devices',
            'Monitor performance improvements',
          ],
          impact: {
            revenue: 3,
            userExperience: 2,
            pageSpeed: 1,
          },
        });
      }

      if (!settings.adFormats.nativeAds) {
        recommendations.push({
          id: 'native-ads',
          type: 'format',
          priority: 'medium',
          title: 'Implement Native Ad Formats',
          description: 'Native ads blend seamlessly with your content, providing better user experience and higher engagement.',
          expectedIncrease: 30,
          implementationDifficulty: 'medium',
          estimatedTimeToImplement: '45 minutes',
          steps: [
            'Enable native ads in format settings',
            'Design native ad templates that match your content style',
            'Configure native ad placements',
            'Monitor user engagement metrics',
          ],
          impact: {
            revenue: 4,
            userExperience: 1,
            pageSpeed: 0,
          },
        });
      }

      // Optimization Recommendations
      if (!settings.optimization.autoOptimization) {
        recommendations.push({
          id: 'auto-optimization',
          type: 'technical',
          priority: 'medium',
          title: 'Enable Auto-Optimization',
          description: 'Automatic optimization uses machine learning to improve ad performance without manual intervention.',
          expectedIncrease: 15,
          implementationDifficulty: 'easy',
          estimatedTimeToImplement: '5 minutes',
          steps: [
            'Enable auto-optimization in settings',
            'Allow 2-3 weeks for the system to learn',
            'Monitor performance improvements',
            'Fine-tune settings based on results',
          ],
          impact: {
            revenue: 3,
            userExperience: 0,
            pageSpeed: 0,
          },
        });
      }

      if (!settings.optimization.lazyLoading) {
        recommendations.push({
          id: 'lazy-loading',
          type: 'technical',
          priority: 'medium',
          title: 'Implement Ad Lazy Loading',
          description: 'Lazy loading ads improves page speed and user experience while maintaining ad revenue.',
          expectedIncrease: 10,
          implementationDifficulty: 'medium',
          estimatedTimeToImplement: '20 minutes',
          steps: [
            'Enable lazy loading in optimization settings',
            'Configure loading thresholds',
            'Test page speed improvements',
            'Monitor ad viewability metrics',
          ],
          impact: {
            revenue: 1,
            userExperience: 3,
            pageSpeed: 4,
          },
        });
      }

      // Targeting Recommendations
      if (!settings.targeting.contextualTargeting) {
        recommendations.push({
          id: 'contextual-targeting',
          type: 'targeting',
          priority: 'medium',
          title: 'Enable Contextual Targeting',
          description: 'Contextual targeting shows ads relevant to your content, improving click-through rates.',
          expectedIncrease: 18,
          implementationDifficulty: 'easy',
          estimatedTimeToImplement: '10 minutes',
          steps: [
            'Enable contextual targeting in settings',
            'Review and approve content categories',
            'Monitor ad relevance and performance',
            'Adjust targeting parameters as needed',
          ],
          impact: {
            revenue: 3,
            userExperience: 1,
            pageSpeed: 0,
          },
        });
      }

      // Content-based recommendations
      recommendations.push({
        id: 'content-quality',
        type: 'content',
        priority: 'high',
        title: 'Improve Content Quality and Length',
        description: 'Higher quality, longer content attracts better ads and higher CPMs. Aim for 1000+ words per page.',
        expectedIncrease: 40,
        implementationDifficulty: 'hard',
        estimatedTimeToImplement: '2-4 hours per page',
        steps: [
          'Audit existing content for quality and length',
          'Expand short articles to 1000+ words',
          'Add relevant images and media',
          'Improve SEO optimization',
          'Update content regularly',
        ],
        impact: {
          revenue: 5,
          userExperience: 4,
          pageSpeed: -1,
        },
      });

      // Sort recommendations by priority and expected increase
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedIncrease - a.expectedIncrease;
      });

      return recommendations;
    } catch (error: any) {
      logger.error('Failed to generate optimization recommendations', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get optimization report
   */
  async getOptimizationReport(
    projectId: string,
    userId: string
  ): Promise<RevenueOptimizationReport> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only get reports for your own projects', 403);
      }

      // Get current performance metrics (mock data for now)
      const currentPerformance = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        earnings: Math.random() * 200 + 50,
        ctr: Math.random() * 3 + 1,
        cpm: Math.random() * 2 + 0.5,
        fillRate: Math.random() * 0.2 + 0.8,
      };

      // Get recommendations
      const recommendations = await this.generateOptimizationRecommendations(projectId, userId);

      // Calculate projected improvements
      const totalPotentialIncrease = recommendations
        .filter(r => r.priority === 'high')
        .reduce((sum, r) => sum + r.expectedIncrease, 0);

      const projectedImprovements = {
        potentialEarningsIncrease: Math.min(totalPotentialIncrease, 100), // Cap at 100%
        estimatedTimeframe: '2-4 weeks',
        confidenceLevel: 85,
      };

      // Industry benchmark (mock data)
      const competitorBenchmark = {
        industryAverage: {
          ctr: 2.5,
          cpm: 1.2,
          earnings: 150,
        },
        yourPosition: currentPerformance.earnings > 150 ? 'above' : 
                     currentPerformance.earnings > 100 ? 'average' : 'below',
        improvementOpportunity: Math.max(0, ((150 - currentPerformance.earnings) / currentPerformance.earnings) * 100),
      } as const;

      const report: RevenueOptimizationReport = {
        currentPerformance,
        recommendations,
        projectedImprovements,
        competitorBenchmark,
      };

      return report;
    } catch (error: any) {
      logger.error('Failed to get optimization report', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Apply optimization recommendation
   */
  async applyOptimizationRecommendation(
    projectId: string,
    userId: string,
    recommendationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only apply optimizations to your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : {};
      const settings = revenue.settings || this.getDefaultSettings();

      // Apply the specific recommendation
      let updatedSettings = { ...settings };
      let message = '';

      switch (recommendationId) {
        case 'header-ads':
          updatedSettings.adPlacement.headerAds = true;
          message = 'Header ads have been enabled';
          break;
        case 'content-ads':
          updatedSettings.adPlacement.contentAds = true;
          message = 'In-content ads have been enabled';
          break;
        case 'responsive-ads':
          updatedSettings.adFormats.responsiveAds = true;
          message = 'Responsive ad units have been enabled';
          break;
        case 'native-ads':
          updatedSettings.adFormats.nativeAds = true;
          message = 'Native ad formats have been enabled';
          break;
        case 'auto-optimization':
          updatedSettings.optimization.autoOptimization = true;
          message = 'Auto-optimization has been enabled';
          break;
        case 'lazy-loading':
          updatedSettings.optimization.lazyLoading = true;
          message = 'Ad lazy loading has been enabled';
          break;
        case 'contextual-targeting':
          updatedSettings.targeting.contextualTargeting = true;
          message = 'Contextual targeting has been enabled';
          break;
        default:
          throw new AppError('Unknown recommendation ID', 400);
      }

      // Update project settings
      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({
            ...revenue,
            settings: updatedSettings,
          }),
        },
      });

      logger.info('Optimization recommendation applied', { projectId, recommendationId });

      return { success: true, message };
    } catch (error: any) {
      logger.error('Failed to apply optimization recommendation', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get default revenue settings
   */
  private getDefaultSettings(): RevenueSettings {
    return {
      adPlacement: {
        headerAds: false,
        sidebarAds: false,
        contentAds: false,
        footerAds: false,
        mobileOptimized: true,
      },
      adFormats: {
        displayAds: true,
        textAds: true,
        videoAds: false,
        nativeAds: false,
        responsiveAds: false,
      },
      targeting: {
        geographicTargeting: false,
        demographicTargeting: false,
        behavioralTargeting: false,
        contextualTargeting: false,
      },
      optimization: {
        autoOptimization: false,
        adBlockRecovery: false,
        lazyLoading: false,
        adRefresh: false,
        adRefreshInterval: 30,
      },
      filters: {
        adultContent: true,
        gambling: true,
        alcohol: false,
        politics: false,
        religion: false,
      },
    };
  }
}
