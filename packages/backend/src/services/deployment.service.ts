import { injectable, inject } from 'tsyringe';
import { prisma } from '../lib/prisma'; // Corrected import path
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';
import { Octokit } from '@octokit/rest';
import { ProjectService } from './project.service'; // Import ProjectService
import { generateStaticPage } from '../utils/static-page-generator'; // Import static page generator

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
  // buildLogs?: string[]; // 제거
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  status: string;
  platform: string;
  configuration: string; // Record<string, any> -> string (JSON string)
  isRollback?: boolean;
  rollbackFromId?: string;
  url?: string; // 다시 추가
  previewUrl?: string; // 다시 추가
  // buildLogs?: string[]; // 제거
  error?: string;
  createdAt: Date;
  updatedAt: Date; // 다시 추가
  completedAt?: Date; // 다시 추가
  logs?: string; // LogEntry[] -> string (JSON string)
}

@injectable()
export class DeploymentService {
  private octokit: Octokit;

  constructor(
    @inject(ProjectService) private projectService: ProjectService // Inject ProjectService
  ) {
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
      const project = await this.projectService.getProjectById(projectId, userId);

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
          configuration: JSON.stringify(config), // config 객체를 JSON 문자열로 변환
        },
      }) as unknown as DeploymentRecord; // Cast to new interface

      logger.info('Deployment started', { deploymentId: deployment.id, projectId });

      if (project.projectType === 'NO_CODE') {
        // For No-Code projects, generate static HTML and simulate deployment
        if (!project.pageContent) {
          throw new ValidationError('No-Code project must have page content to deploy.');
        }
        const htmlContent = generateStaticPage(project.pageContent as unknown as Record<string, any>);
        
        // Simulate static site deployment
        await this.simulateStaticSiteDeployment(deployment.id, htmlContent);
        
      } else {
        // For Low-Code projects, proceed with existing codespaces/repo-based deployment logic
        this.processDeployment(deployment.id, config);
      }

      return {
        id: deployment.id,
        projectId: deployment.projectId,
        status: 'pending', // Initial status
        platform: config.platform,
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
  ): Promise<LogEntry[]> {
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

      let deployment: DeploymentRecord | null;
      if (deploymentId) {
        deployment = await prisma.deploymentLog.findUnique({
          where: { id: deploymentId },
        }) as unknown as DeploymentRecord | null;
      } else {
        deployment = await prisma.deploymentLog.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
        }) as unknown as DeploymentRecord | null;
      }

      if (!deployment) {
        return [];
      }

      // Get logs from deployment record
      const logs = JSON.parse(deployment.logs || '[]') as LogEntry[]; // logs 필드를 JSON 문자열로 파싱
      
      return logs.map((log: LogEntry, index) => ({
        id: `${deployment.id}-${index}`, // This ID is for the log entry, not the deployment record
        deploymentId: deployment.id,
        level: log.level,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString(), // Convert Date object to ISO string
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
          completedAt: new Date(), // 다시 추가
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
          configuration: targetDeployment.configuration, // config 객체를 JSON 문자열로 변환
          isRollback: true,
          rollbackFromId: targetDeploymentId,
        },
      }) as unknown as DeploymentRecord;

      logger.info('Rollback deployment started', { 
        deploymentId: rollbackDeployment.id, 
        targetDeploymentId,
        projectId 
      });

      // Start rollback process
      this.processRollback(rollbackDeployment.id, targetDeployment as DeploymentRecord);

      return {
        id: rollbackDeployment.id,
        projectId: rollbackDeployment.projectId,
        status: rollbackDeployment.status as any,
        platform: rollbackDeployment.platform,
        createdAt: rollbackDeployment.createdAt,
        updatedAt: rollbackDeployment.updatedAt, // 다시 추가
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
          logs: JSON.stringify([
            {
              level: 'info',
              message: 'Starting deployment process...',
              timestamp: new Date().toISOString(),
            },
          ]),
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
          completedAt: new Date(), // 다시 추가
        },
      });
    }
  }

  /**
   * Process rollback (background task)
   */
  private async processRollback(deploymentId: string, targetDeployment: DeploymentRecord): Promise<void> {
    try {
      // Update status to building
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'building',
          logs: JSON.stringify([
            {
              level: 'info',
              message: `Rolling back to deployment ${targetDeployment.id}...`,
              timestamp: new Date().toISOString(),
            },
          ]),
        },
      });

      // Simulate rollback process
      this.simulateRollbackProcess(deploymentId, targetDeployment);

    } catch (error: any) {
      logger.error('Rollback process failed', { error: error.message, deploymentId });
      
      await prisma.deploymentLog.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(), // 다시 추가
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

      const logEntry = { // logs[0] 대신 logEntry 변수 사용
        level: 'info',
        message: steps[i],
        timestamp: new Date().toISOString(),
      };

      const existingDeployment = await prisma.deploymentLog.findUnique({ where: { id: deploymentId } });
      const existingLogs = existingDeployment?.logs ? JSON.parse(existingDeployment.logs) : [];
      const updatedLogs = [...existingLogs, logEntry];

      if (i === steps.length - 1) {
        // Final step - mark as success
        const deploymentUrl = `https://${deploymentId}.example.com`;
        
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            status: 'success',
            url: deploymentUrl,
            previewUrl: deploymentUrl,
            completedAt: new Date(), // 다시 추가
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      } else {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      }
    }
  }

  /**
   * Simulate static site deployment
   */
  private async simulateStaticSiteDeployment(deploymentId: string, htmlContent: string): Promise<void> {
    const steps = [
      'Generating static page...',
      'Uploading HTML to CDN...',
      'Configuring domain...',
      'Deployment complete!',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

      const logEntry = { // logs[0] 대신 logEntry 변수 사용
        level: 'info',
        message: steps[i],
        timestamp: new Date().toISOString(),
      };

      const existingDeployment = await prisma.deploymentLog.findUnique({ where: { id: deploymentId } });
      const existingLogs = existingDeployment?.logs ? JSON.parse(existingDeployment.logs) : [];
      const updatedLogs = [...existingLogs, logEntry];

      if (i === steps.length - 1) {
        // Final step - mark as success
        const deploymentUrl = `https://${deploymentId}-nocode.example.com`; // Unique URL for no-code
        
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            status: 'success',
            url: deploymentUrl,
            previewUrl: deploymentUrl,
            completedAt: new Date(), // 다시 추가
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      } else {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      }
    }
  }

  /**
   * Simulate rollback process
   */
  private async simulateRollbackProcess(deploymentId: string, targetDeployment: DeploymentRecord): Promise<void> {
    const steps = [
      'Preparing rollback...',
      'Switching to previous version...',
      'Updating CDN configuration...',
      'Rollback complete!',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

      const logEntry = { // logs[0] 대신 logEntry 변수 사용
        level: 'info',
        message: steps[i],
        timestamp: new Date().toISOString(),
      };

      const existingDeployment = await prisma.deploymentLog.findUnique({ where: { id: deploymentId } });
      const existingLogs = existingDeployment?.logs ? JSON.parse(existingDeployment.logs) : [];
      const updatedLogs = [...existingLogs, logEntry];

      if (i === steps.length - 1) {
        // Final step - mark as success
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            status: 'success',
            url: targetDeployment.url,
            previewUrl: targetDeployment.previewUrl,
            completedAt: new Date(), // 다시 추가
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      } else {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: {
            logs: JSON.stringify(updatedLogs), // JSON 문자열로 저장
          },
        });
      }
    }
  }
}
