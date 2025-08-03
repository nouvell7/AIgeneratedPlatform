import { Router } from 'express';
import { AIModelController } from '../controllers/ai-model.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const aiModelController = new AIModelController();

// All AI model routes require authentication
router.use(authMiddleware);

// AI model routes
router.post('/connect', aiModelController.connectModel);
router.get('/project/:projectId', aiModelController.getProjectModel);
router.put('/project/:projectId', aiModelController.updateProjectModel);
router.delete('/project/:projectId', aiModelController.disconnectModel);
router.post('/test', aiModelController.testModel);

export default router;