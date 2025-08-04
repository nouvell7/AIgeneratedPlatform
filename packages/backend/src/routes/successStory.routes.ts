import { Router } from 'express';
import { container } from 'tsyringe';
import { SuccessStoryController } from '../controllers/successStory.controller';

const router = Router();
const successStoryController = container.resolve(SuccessStoryController);

// Public success story routes
router.get('/', successStoryController.getSuccessStories);
router.get('/:id', successStoryController.getSuccessStory);

export default router;
