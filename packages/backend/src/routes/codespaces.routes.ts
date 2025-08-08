import { Router } from 'express';
import { container } from 'tsyringe';
import { CodespacesController } from '../controllers/codespaces.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const codespacesController = container.resolve(CodespacesController);

// Codespace management routes
router.post('/:projectId/create', authMiddleware, codespacesController.createCodespace.bind(codespacesController));
router.get('/:projectId/status', authMiddleware, codespacesController.getCodespace.bind(codespacesController));
router.post('/:projectId/start', authMiddleware, codespacesController.startCodespace.bind(codespacesController));
router.post('/:projectId/stop', authMiddleware, codespacesController.stopCodespace.bind(codespacesController));
router.delete('/:projectId', authMiddleware, codespacesController.deleteCodespace.bind(codespacesController));

// Available machines route
router.get('/machines', authMiddleware, codespacesController.getAvailableMachines.bind(codespacesController));

export default router;