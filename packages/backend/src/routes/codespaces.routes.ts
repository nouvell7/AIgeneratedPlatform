import { Router } from 'express';
import { container } from 'tsyringe';
import { CodespacesController } from '../controllers/codespaces.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const codespacesController = container.resolve(CodespacesController);

// Codespace management routes
router.post('/:projectId/create', authMiddleware, codespacesController.createCodespace.bind(codespacesController));
router.get('/:projectId/status', authMiddleware, codespacesController.getCodespaceStatus.bind(codespacesController));
router.post('/:projectId/start', authMiddleware, codespacesController.startCodespace.bind(codespacesController));
router.post('/:projectId/stop', authMiddleware, codespacesController.stopCodespace.bind(codespacesController));
router.delete('/:projectId', authMiddleware, codespacesController.deleteCodespace.bind(codespacesController));

// Codespace configuration routes
router.get('/:projectId/config', authMiddleware, codespacesController.getCodespaceConfig.bind(codespacesController));
router.put('/:projectId/config', authMiddleware, codespacesController.updateCodespaceConfig.bind(codespacesController));

// Repository management routes
router.post('/:projectId/repository/create', authMiddleware, codespacesController.createRepository.bind(codespacesController));
router.get('/:projectId/repository/status', authMiddleware, codespacesController.getRepositoryStatus.bind(codespacesController));
router.post('/:projectId/repository/sync', authMiddleware, codespacesController.syncRepository.bind(codespacesController));

export default router;