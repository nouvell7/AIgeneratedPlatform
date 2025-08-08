import { Router } from 'express';
import { container } from 'tsyringe';
import { CommunityController } from '../controllers/community.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const communityController = container.resolve(CommunityController);

// Posts routes
router.get('/posts', ...communityController.getPosts);
router.get('/posts/:id', ...communityController.getPost);
router.post('/posts', authMiddleware, ...communityController.createPost);
router.put('/posts/:id', authMiddleware, ...communityController.updatePost);
router.delete('/posts/:id', authMiddleware, ...communityController.deletePost);

// Comments routes
router.get('/posts/:postId/comments', ...communityController.getComments);

export default router;