import { Router } from 'express';
import { container } from 'tsyringe';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const projectController = container.resolve(ProjectController);

router.get('/public', projectController.getPublicProjects);
router.get('/categories', projectController.getCategories);
router.get('/search', authMiddleware, projectController.searchProjects);

router.post('/', authMiddleware, projectController.createProject);
router.get('/', authMiddleware, projectController.getUserProjects);

router.get('/:id', authMiddleware, projectController.getProject);
router.put('/:id', authMiddleware, projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

// New route for updating page content
router.put('/:id/page-content', authMiddleware, projectController.updatePageContent);

router.post('/:id/duplicate', authMiddleware, projectController.duplicateProject);
router.post('/:id/archive', authMiddleware, projectController.archiveProject);
router.post('/:id/restore', authMiddleware, projectController.restoreProject);
router.get('/:id/stats', authMiddleware, projectController.getProjectStats);

export default router;
