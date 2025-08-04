import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { DeploymentService, DeploymentConfig } from '../services/deployment.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

@injectable()
export class DeploymentController {
  constructor(@inject(DeploymentService) private deploymentService: DeploymentService) {}

  /**
   * Start deployment
   */
  async startDeployment(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const config: DeploymentConfig = req.body;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const deployment = await this.deploymentService.startDeployment(projectId, userId, config);

      res.status(201).json({
        success: true,
        data: deployment,
      });
    } catch (error: any) {
      logger.error('Failed to start deployment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_START_FAILED',
        },
      });
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const deployment = await this.deploymentService.getDeploymentStatus(projectId, userId);

      res.json({
        success: true,
        data: deployment,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment status', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_STATUS_FAILED',
        },
      });
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(req: Request, res: Response) {
    try {
      const { projectId, deploymentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const logs = await this.deploymentService.getDeploymentLogs(projectId, userId, deploymentId);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment logs', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_LOGS_FAILED',
        },
      });
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(req: Request, res: Response) {
    try {
      const { projectId, deploymentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId || !deploymentId) {
        throw new AppError('Project ID and Deployment ID are required', 400);
      }

      await this.deploymentService.cancelDeployment(projectId, deploymentId, userId);

      res.json({
        success: true,
        message: 'Deployment cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Failed to cancel deployment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_CANCEL_FAILED',
        },
      });
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { targetDeploymentId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      if (!targetDeploymentId) {
        throw new AppError('Target deployment ID is required', 400);
      }

      const deployment = await this.deploymentService.rollbackDeployment(
        projectId,
        targetDeploymentId,
        userId
      );

      res.json({
        success: true,
        data: deployment,
      });
    } catch (error: any) {
      logger.error('Failed to rollback deployment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_ROLLBACK_FAILED',
        },
      });
    }
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { limit } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const deployments = await this.deploymentService.getDeploymentHistory(
        projectId,
        userId,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: deployments,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment history', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_HISTORY_FAILED',
        },
      });
    }
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { timeRange } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const metrics = await this.deploymentService.getDeploymentMetrics(
        projectId,
        userId,
        timeRange as '1h' | '24h' | '7d' | '30d'
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment metrics', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_METRICS_FAILED',
        },
      });
    }
  }

  /**
   * Get available deployment platforms
   */
  async getDeploymentPlatforms(req: Request, res: Response) {
    try {
      const platforms = [
        {
          id: 'cloudflare-pages',
          name: 'Cloudflare Pages',
          description: 'Fast, secure, and free static site hosting',
          features: [
            'Global CDN',
            'Automatic HTTPS',
            'Custom domains',
            'Preview deployments',
            'Edge functions',
          ],
          limits: {
            builds: '500/month',
            bandwidth: '100GB/month',
            storage: '25GB',
          },
        },
        {
          id: 'vercel',
          name: 'Vercel',
          description: 'The platform for frontend developers',
          features: [
            'Global edge network',
            'Serverless functions',
            'Preview deployments',
            'Custom domains',
            'Analytics',
          ],
          limits: {
            builds: '100/day',
            bandwidth: '100GB/month',
            storage: '1GB',
          },
        },
        {
          id: 'netlify',
          name: 'Netlify',
          description: 'Build, deploy, and manage modern web projects',
          features: [
            'Continuous deployment',
            'Form handling',
            'Split testing',
            'Custom domains',
            'Edge functions',
          ],
          limits: {
            builds: '300/month',
            bandwidth: '100GB/month',
            storage: '1GB',
          },
        },
      ];

      res.json({
        success: true,
        data: platforms,
      });
    } catch (error: any) {
      logger.error('Failed to get deployment platforms', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_PLATFORMS_FAILED',
        },
      });
    }
  }

  /**
   * Test deployment configuration
   */
  async testDeploymentConfig(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const config: DeploymentConfig = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      // Validate configuration
      const issues: string[] = [];

      if (!config.platform) {
        issues.push('Platform is required');
      }

      if (config.buildCommand && config.buildCommand.length > 200) {
        issues.push('Build command is too long (max 200 characters)');
      }

      if (config.outputDirectory && !/^[a-zA-Z0-9_\-\/]+$/.test(config.outputDirectory)) {
        issues.push('Output directory contains invalid characters');
      }

      if (config.environmentVariables) {
        const envVarCount = Object.keys(config.environmentVariables).length;
        if (envVarCount > 50) {
          issues.push('Too many environment variables (max 50)');
        }
      }

      const isValid = issues.length === 0;

      res.json({
        success: true,
        data: {
          valid: isValid,
          issues: isValid ? undefined : issues,
        },
      });
    } catch (error: any) {
      logger.error('Failed to test deployment config', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'DEPLOYMENT_CONFIG_TEST_FAILED',
        },
      });
    }
  }
}
