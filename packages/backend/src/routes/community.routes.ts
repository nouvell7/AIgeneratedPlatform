import { Router } from 'express';
import { container } from 'tsyringe';
import { CommunityController } from '../controllers/community.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const communityController = container.resolve(CommunityController);

// Posts routes
router.get('/posts', communityController.getPosts.bind(communityController));
router.get('/posts/:id', communityController.getPost.bind(communityController));
router.post('/posts', authMiddleware, communityController.createPost.bind(communityController));
router.put('/posts/:id', authMiddleware, communityController.updatePost.bind(communityController));
router.delete('/posts/:id', authMiddleware, communityController.deletePost.bind(communityController));

// Comments routes
router.get('/posts/:postId/comments', communityController.getComments.bind(communityController));
router.post('/posts/:postId/comments', authMiddleware, communityController.createComment.bind(communityController));
router.put('/comments/:id', authMiddleware, communityController.updateComment.bind(communityController));
router.delete('/comments/:id', authMiddleware, communityController.deleteComment.bind(communityController));

// Voting routes
router.post('/posts/:id/vote', authMiddleware, communityController.votePost.bind(communityController));
router.post('/comments/:id/vote', authMiddleware, communityController.voteComment.bind(communityController));

// Tags routes
router.get('/tags/popular', communityController.getPopularTags.bind(communityController));
router.get('/tags/search', communityController.searchTags.bind(communityController));

// User activity routes
router.get('/users/:userId/posts', communityController.getUserPosts.bind(communityController));
router.get('/users/:userId/comments', communityController.getUserComments.bind(communityController));

// Trending routes
router.get('/trending', communityController.getTrendingPosts.bind(communityController));

export default router;