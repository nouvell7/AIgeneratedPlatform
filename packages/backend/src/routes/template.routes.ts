import { Router } from 'express';
import { container } from 'tsyringe';
import { TemplateController } from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const templateController = container.resolve(TemplateController);

// Public template routes
router.get('/', templateController.getTemplates);
router.get('/featured', templateController.getFeatured); // getFeaturedTemplates 대신 getFeatured
router.get('/categories', templateController.getCategories);
router.get('/:id', templateController.getTemplate);

// Protected template routes
router.use(authMiddleware);
router.post('/projects/from-template/:templateId', templateController.createFromTemplate); // useTemplate 대신 createFromTemplate, 경로 변경

export default router;
