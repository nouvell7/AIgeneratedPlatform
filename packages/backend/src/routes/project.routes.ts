import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(authMiddleware);

// Project CRUD routes
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Project sharing routes
router.post('/:id/share', projectController.shareProject);
router.get('/:id/share-status', projectController.getShareStatus);

export default router;