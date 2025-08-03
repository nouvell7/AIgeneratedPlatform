import { Router } from 'express';
import { SuccessStoryController } from '../controllers/success-story.controller';

const router = Router();
const successStoryController = new SuccessStoryController();

// Public success story routes
router.get('/', successStoryController.getSuccessStories);
router.get('/categories', successStoryController.getCategories);
router.get('/:id', successStoryController.getSuccessStory);

export default router;