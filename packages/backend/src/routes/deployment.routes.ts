import { Router } from 'express';
import { container } from 'tsyringe';
import { DeploymentController } from '../controllers/deployment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const deploymentController = container.resolve(DeploymentController);

// All deployment routes require authentication
router.use(authMiddleware);

// Deployment routes
router.post('/:projectId', deploymentController.startDeployment);
router.get('/:projectId/status', deploymentController.getDeploymentStatus);
router.get('/:projectId/logs', deploymentController.getDeploymentLogs);
router.post('/:projectId/rollback', deploymentController.rollbackDeployment);
router.delete('/:projectId', deploymentController.cancelDeployment);

export default router;
