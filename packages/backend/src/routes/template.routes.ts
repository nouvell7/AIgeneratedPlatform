import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const templateController = new TemplateController();

// Public template routes
router.get('/', templateController.getTemplates);
router.get('/featured', templateController.getFeaturedTemplates);
router.get('/categories', templateController.getCategories);
router.get('/:id', templateController.getTemplate);

// Protected template routes
router.use(authMiddleware);
router.post('/:id/use', templateController.useTemplate);

export default router;