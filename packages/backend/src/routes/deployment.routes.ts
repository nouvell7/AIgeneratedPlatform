import { Router } from 'express';
import { DeploymentController } from '../controllers/deployment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const deploymentController = new DeploymentController();

// All deployment routes require authentication
router.use(authMiddleware);

// Deployment routes
router.post('/:projectId', deploymentController.deployProject);
router.get('/:projectId/status', deploymentController.getDeploymentStatus);
router.get('/:projectId/logs', deploymentController.getDeploymentLogs);
router.post('/:projectId/rollback', deploymentController.rollbackDeployment);
router.delete('/:projectId', deploymentController.stopDeployment);

export default router;