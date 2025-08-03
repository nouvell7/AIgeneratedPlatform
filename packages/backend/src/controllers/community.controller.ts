import { Request, Response } from 'express';
import { communityService } from '../services/community.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class CommunityController {
  /**
   * Get community posts
   */
  async getPosts(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        type,
        tags,
        sortBy = 'recent'
      } = req.query;

      const tagsArray = typeof tags === 'string' ? tags.split(',') : undefined;

      const result = await communityService.getPosts(
        parseInt(page as string),
        parseInt(limit as string),
        type as string,
        tagsArray,
        sortBy as 'recent' | 'popular' | 'votes'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to get community posts', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POSTS_FAILED',
        },
      });
    }
  }

  /**
   * Get a single post
   */
  async getPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      const post = await communityService.getPost(postId, userId);

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      logger.error('Failed to get community post', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POST_FAILED',
        },
      });
    }
  }

  /**
   * Create a new post
   */
  async createPost(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { title, content, type, tags } = req.body;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!title || !content || !type) {
        throw new AppError('Title, content, and type are required', 400);
      }

      const post = await communityService.createPost(userId, {
        title,
        content,
        type,
        tags: tags || [],
      });

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      logger.error('Failed to create community post', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POST_CREATE_FAILED',
        },
      });
    }
  }

  /**
   * Update a post
   */
  async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;
      const { title, content, tags, isResolved } = req.body;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      const post = await communityService.updatePost(postId, userId, {
        title,
        content,
        tags,
        isResolved,
      });

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      logger.error('Failed to update community post', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POST_UPDATE_FAILED',
        },
      });
    }
  }

  /**
   * Delete a post
   */
  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      await communityService.deletePost(postId, userId);

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete community post', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POST_DELETE_FAILED',
        },
      });
    }
  }

  /**
   * Vote on a post
   */
  async votePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { voteType } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      if (!voteType || !['up', 'down'].includes(voteType)) {
        throw new AppError('Valid vote type is required (up or down)', 400);
      }

      const result = await communityService.votePost(postId, userId, voteType);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to vote on post', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_POST_VOTE_FAILED',
        },
      });
    }
  }

  /**
   * Add a comment
   */
  async addComment(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      if (!content) {
        throw new AppError('Comment content is required', 400);
      }

      const comment = await communityService.addComment(postId, userId, content, parentId);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error: any) {
      logger.error('Failed to add comment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_COMMENT_ADD_FAILED',
        },
      });
    }
  }

  /**
   * Vote on a comment
   */
  async voteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const { voteType } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!commentId) {
        throw new AppError('Comment ID is required', 400);
      }

      if (!voteType || !['up', 'down'].includes(voteType)) {
        throw new AppError('Valid vote type is required (up or down)', 400);
      }

      const result = await communityService.voteComment(commentId, userId, voteType);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to vote on comment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_COMMENT_VOTE_FAILED',
        },
      });
    }
  }

  /**
   * Accept a comment as answer
   */
  async acceptComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!commentId) {
        throw new AppError('Comment ID is required', 400);
      }

      await communityService.acceptComment(commentId, userId);

      res.json({
        success: true,
        message: 'Comment accepted as answer',
      });
    } catch (error: any) {
      logger.error('Failed to accept comment', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'COMMUNITY_COMMENT_ACCEPT_FAILED',
        },
      });
    }
  }

  /**
   * Get shared projects
   */
  async getSharedProjects(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        category,
        tags,
        sortBy = 'recent'
      } = req.query;

      const tagsArray = typeof tags === 'string' ? tags.split(',') : undefined;

      const result = await communityService.getSharedProjects(
        parseInt(page as string),
        parseInt(limit as string),
        category as string,
        tagsArray,
        sortBy as 'recent' | 'popular' | 'likes'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to get shared projects', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'SHARED_PROJECTS_FAILED',
        },
      });
    }
  }

  /**
   * Share a project
   */
  async shareProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const { title, description, category, tags, previewUrl, sourceUrl, isPublic } = req.body;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      if (!title || !description || !category) {
        throw new AppError('Title, description, and category are required', 400);
      }

      const sharedProject = await communityService.shareProject(userId, projectId, {
        title,
        description,
        category,
        tags: tags || [],
        previewUrl,
        sourceUrl,
        isPublic: isPublic !== false, // Default to true
      });

      res.status(201).json({
        success: true,
        data: sharedProject,
      });
    } catch (error: any) {
      logger.error('Failed to share project', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_SHARE_FAILED',
        },
      });
    }
  }

  /**
   * Like a shared project
   */
  async likeProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const result = await communityService.likeProject(projectId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to like project', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'PROJECT_LIKE_FAILED',
        },
      });
    }
  }

  /**
   * Report inappropriate content
   */
  async reportContent(req: Request, res: Response) {
    try {
      const { contentType, contentId, reason, description } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!contentType || !contentId || !reason) {
        throw new AppError('Content type, content ID, and reason are required', 400);
      }

      if (!['post', 'comment', 'project'].includes(contentType)) {
        throw new AppError('Invalid content type', 400);
      }

      await communityService.reportContent(userId, contentType, contentId, reason, description);

      res.json({
        success: true,
        message: 'Content reported successfully',
      });
    } catch (error: any) {
      logger.error('Failed to report content', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CONTENT_REPORT_FAILED',
        },
      });
    }
  }
}

export const communityController = new CommunityController();