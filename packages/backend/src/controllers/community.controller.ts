import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CommunityService } from '../services/community.service';

export class CommunityController {
  private communityService: CommunityService;

  constructor() {
    this.communityService = container.resolve(CommunityService);
  }

  getPosts = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, type, search, tags } = req.query;
        
        const filters = {
          type: type as string,
          search: search as string,
          tags: tags ? (tags as string).split(',') : undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        };

        const result = await this.communityService.getPosts(filters);

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getPost = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const post = await this.communityService.getPostById(postId);

        res.json({
          success: true,
          data: { post },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  createPost = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user?.userId;
        const { title, content, type, tags, projectId } = req.body;

        const post = await this.communityService.createPost(userId, {
          title,
          content,
          type,
          tags,
          projectId,
        });

        res.status(201).json({
          success: true,
          data: { post },
          message: 'Post created successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  updatePost = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const userId = (req as any).user?.userId;
        const { title, content, type, tags } = req.body;

        const post = await this.communityService.updatePost(postId, userId, {
          title,
          content,
          type,
          tags,
        });

        res.json({
          success: true,
          data: { post },
          message: 'Post updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  deletePost = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const userId = (req as any).user?.userId;

        await this.communityService.deletePost(postId, userId);

        res.json({
          success: true,
          message: 'Post deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  votePost = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const { value } = req.body; // 1 for upvote, -1 for downvote
        const userId = (req as any).user?.userId;

        await this.communityService.votePost(postId, userId, value);

        res.json({
          success: true,
          message: 'Vote recorded successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  createComment = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = (req as any).user?.userId;

        const comment = await this.communityService.createComment(postId, userId, {
          content,
        });

        res.status(201).json({
          success: true,
          data: { comment },
          message: 'Comment created successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getComments = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { postId } = req.params;
        const { page, limit } = req.query;

        const result = await this.communityService.getComments(
          postId,
          page ? parseInt(page as string) : 1,
          limit ? parseInt(limit as string) : 50
        );

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getPostTypes = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const types = await this.communityService.getPostTypes();

        res.json({
          success: true,
          data: { types },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getUserPosts = [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.params;
        const { page, limit } = req.query;

        const result = await this.communityService.getUserPosts(
          userId,
          page ? parseInt(page as string) : 1,
          limit ? parseInt(limit as string) : 20
        );

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}