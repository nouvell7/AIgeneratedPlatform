import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { DeploymentService, DeploymentConfig } from '../services/deployment.service';

export class DeploymentController {
  private deploymentService: DeploymentService;

  constructor() {
    this.deploymentService = container.resolve(DeploymentService);
  }

  startDeployment = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const userId = (req as any).user?.userId;
        const config: DeploymentConfig = req.body;

        const deployment = await this.deploymentService.startDeployment(projectId, userId, config);

        res.status(201).json({
          success: true,
          data: { deployment },
          message: 'Deployment started successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getDeploymentStatus = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const userId = (req as any).user?.userId;

        const status = await this.deploymentService.getDeploymentStatus(projectId, userId);

        res.json({
          success: true,
          data: { status },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getDeploymentLogs = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const { deploymentId } = req.query;
        const userId = (req as any).user?.userId;

        const logs = await this.deploymentService.getDeploymentLogs(
          projectId, 
          userId, 
          deploymentId as string
        );

        res.json({
          success: true,
          data: { logs },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  cancelDeployment = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId, deploymentId } = req.params;
        const userId = (req as any).user?.userId;

        await this.deploymentService.cancelDeployment(projectId, deploymentId, userId);

        res.json({
          success: true,
          message: 'Deployment cancelled successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  rollbackDeployment = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId, targetDeploymentId } = req.params;
        const userId = (req as any).user?.userId;

        const deployment = await this.deploymentService.rollbackDeployment(
          projectId,
          targetDeploymentId,
          userId
        );

        res.status(201).json({
          success: true,
          data: { deployment },
          message: 'Rollback started successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getDeploymentHistory = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const { limit } = req.query;
        const userId = (req as any).user?.userId;

        const history = await this.deploymentService.getDeploymentHistory(
          projectId,
          userId,
          limit ? parseInt(limit as string) : 10
        );

        res.json({
          success: true,
          data: { history },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getDeploymentMetrics = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const { timeRange } = req.query;
        const userId = (req as any).user?.userId;

        const metrics = await this.deploymentService.getDeploymentMetrics(
          projectId,
          userId,
          (timeRange as '1h' | '24h' | '7d' | '30d') || '24h'
        );

        res.json({
          success: true,
          data: { metrics },
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}