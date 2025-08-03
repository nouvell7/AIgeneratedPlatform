import { prisma } from '../lib/database';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { Octokit } from '@octokit/rest';

export interface DeploymentConfig {
  platform: 'cloudflare-pages' | 'vercel' | 'netlify';
  environmentVariables?: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
}

export interface DeploymentStatus {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled';
  platform: string;
  url?: string;
  previewUrl?: string;
  buildLogs?: string[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

class DeploymentService {
  private octokit: Octokit;

  constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new AppError('GitHub token is required for deployment', 500);
    }

    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  /**
   * Start deployment for a project
   */
  async startDeployment(
    projectId: string,
    userId: string,
    config: DeploymentConfig
  ): Promise<DeploymentStatus> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only deploy your own projects', 403);
      }

      // Create deployment record
      const deployment = await prisma.deploymentLog.create({
        data: {
          projectId,
          status: 'pending',
          platform: config.platform,
          configuration: config as any,
        },
      });

      logger.info('Deployment started', { deploymentId: deployment.id, projectId });

      // Start deployment process based on platform
      this.processDeployment(deployment.id, config);

      return {
        id: deployment.id,
        projectId: deployment.projectId,
        status: deployment.status as any,
        platform: deployment.platform,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to start deployment', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(projectId: string, userId: string): Promise<DeploymentStatus | null> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view your own project deployments', 403);
      }

      // Get latest deployment
      const deployment = await prisma.deploymentLog.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      if (!deployment) {
        return null;
      }

      return {
        id: deployment.id,
        projectId: deployment.projectId,
        status: deployment.status as any,
        platform: deployment.platform,
        url: deployment.url || undefined,
        previewUrl: deployment.previewUrl || undefined,
        error: deployment.error || undefined,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
        completedAt: deployment.completedAt || undefined,
      };
    } catch (error: any) {
      logger.error('Failed to get deployment status', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(
    projectId: string,
    userId: string,
    deploymentId?: string
  ): Promise<DeploymentLog[]> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view your own project logs', 403);
      }

      let deployment;
      if (deploymentId) {
        deployment = await prisma.deploymentLog.findUnique({
          where: { id: deploymentId },
        });
      } else {
        deployment = await prisma.deploymentLog.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (!deployment) {
        return [];
      }

      // Get logs from deployment record
      const logs = deployment.logs as any[] || [];
      
      return logs.map((log, index) => ({
        id: `${deployment.id}-${index}`,
        deploymentId: deployment.id,
        level: log.level || 'info',
        message: log.message || '',
        timestamp: new Date(log.timestamp || deployment.createdAt),
      }));
    } catch (error: any) {
      logger.error('Failed to get deployment logs', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(
    projectId: string,
    deploymentId: string,
    userId: string
  ): Promise<void> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only cancel your own deployments', 403);
      }

      // Update deployment status
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      logger.info('Deployment cancelled', { deploymentId, projectId });
    } catch (error: any) {
      logger.error('Failed to cancel deployment', { error: error.message, deploymentId });
      throw error;
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(
    projectId: string,
    targetDeploymentId: string,
    userId: string
  ): Promise<DeploymentStatus> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only rollback your own deployments', 403);
      }

      // Get target deployment
      const targetDeployment = await prisma.deploymentLog.findUnique({
        where: { id: targetDeploymentId },
      });

      if (!targetDeployment || targetDeployment.projectId !== projectId) {
        throw new AppError('Target deployment not found', 404);
      }

      if (targetDeployment.status !== 'success') {
        throw new AppError('Can only rollback to successful deployments', 400);
      }

      // Create new deployment record for rollback
      const rollbackDeployment = await prisma.deploymentLog.create({
        data: {
          projectId,
          status: 'pending',
          platform: targetDeployment.platform,
          configuration: targetDeployment.configuration,
          isRollback: true,
          rollbackFromId: targetDeploymentId,
        },
      });

      logger.info('Rollback deployment started', { 
        deploymentId: rollbackDeployment.id, 
        targetDeploymentId,
        projectId 
      });

      // Start rollback process
      this.processRollback(rollbackDeployment.id, targetDeployment);

      return {
        id: rollbackDeployment.id,
        projectId: rollbackDeployment.projectId,
        status: rollbackDeployment.status as any,
        platform: rollbackDeployment.platform,
        createdAt: rollbackDeployment.createdAt,
        updatedAt: rollbackDeployment.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to rollback deployment', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(
    projectId: string,
    userId: string,
    limit = 10
  ): Promise<DeploymentStatus[]> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view your own deployment history', 403);
      }

      const deployments = await prisma.deploymentLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return deployments.map(deployment => ({
        id: deployment.id,
        projectId: deployment.projectId,
        status: deployment.status as any,
        platform: deployment.platform,
        url: deployment.url || undefined,
        previewUrl: deployment.previewUrl || undefined,
        error: deployment.error || undefined,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
        completedAt: deployment.completedAt || undefined,
      }));
    } catch (error: any) {
      logger.error('Failed to get deployment history', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(
    projectId: string,
    userId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    requests: number;
    bandwidth: number;
    errors: number;
    responseTime: number;
    uptime: number;
    timeline: Array<{
      timestamp: string;
      requests: number;
      errors: number;
      responseTime: number;
    }>;
  }> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view your own project metrics', 403);
      }

      // For now, return mock data
      // In a real implementation, this would fetch from analytics service
      const mockMetrics = {
        requests: Math.floor(Math.random() * 10000),
        bandwidth: Math.floor(Math.random() * 1000000000), // bytes
        errors: Math.floor(Math.random() * 100),
        responseTime: Math.floor(Math.random() * 500) + 100, // ms
        uptime: 0.98 + Math.random() * 0.02,
        timeline: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          requests: Math.floor(Math.random() * 100),
          errors: Math.floor(Math.random() * 5),
          responseTime: Math.floor(Math.random() * 200) + 100,
        })),
      };

      return mockMetrics;
    } catch (error: any) {
      logger.error('Failed to get deployment metrics', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Process deployment (background task)
   */
  private async processDeployment(deploymentId: string, config: DeploymentConfig): Promise<void> {
    try {
      // Update status to building
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'building',
          logs: [
            {
              level: 'info',
              message: 'Starting deployment process...',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      // Simulate deployment process
      await this.simulateDeploymentProcess(deploymentId, config);

    } catch (error: any) {
      logger.error('Deployment process failed', { error: error.message, deploymentId });
      
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Process rollback (background task)
   */
  private async processRollback(deploymentId: string, targetDeployment: any): Promise<void> {
    try {
      // Update status to building
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'building',
          logs: [
            {
              level: 'info',
              message: `Rolling back to deployment ${targetDeployment.id}...`,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      // Simulate rollback process
      await this.simulateRollbackProcess(deploymentId, targetDeployment);

    } catch (error: any) {
      logger.error('Rollback process failed', { error: error.message, deploymentId });
      
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Simulate deployment process
   */
  private async simulateDeploymentProcess(deploymentId: string, config: DeploymentConfig): Promise<void> {
    const steps = [
      'Cloning repository...',
      'Installing dependencies...',
      'Running build command...',
      'Optimizing assets...',
      'Deploying to CDN...',
      'Configuring domain...',
      'Deployment complete!',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work

      const logs = [
        {
          level: 'info',
          message: steps[i],
          timestamp: new Date().toISOString(),
        },
      ];

      if (i === steps.length - 1) {
        // Final step - mark as success
        const deploymentUrl = `https://${deploymentId}.example.com`;
        
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            status: 'success',
            url: deploymentUrl,
            previewUrl: deploymentUrl,
            completedAt: new Date(),
            logs: { push: logs[0] },
          },
        });
      } else {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            logs: { push: logs[0] },
          },
        });
      }
    }
  }

  /**
   * Simulate rollback process
   */
  private async simulateRollbackProcess(deploymentId: string, targetDeployment: any): Promise<void> {
    const steps = [
      'Preparing rollback...',
      'Switching to previous version...',
      'Updating CDN configuration...',
      'Rollback complete!',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

      const logs = [
        {
          level: 'info',
          message: steps[i],
          timestamp: new Date().toISOString(),
        },
      ];

      if (i === steps.length - 1) {
        // Final step - mark as success
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            status: 'success',
            url: targetDeployment.url,
            previewUrl: targetDeployment.previewUrl,
            completedAt: new Date(),
            logs: { push: logs[0] },
          },
        });
      } else {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            logs: { push: logs[0] },
          },
        });
      }
    }
  }
}

export const deploymentService = new DeploymentService();