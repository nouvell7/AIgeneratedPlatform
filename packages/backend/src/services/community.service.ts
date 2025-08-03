import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'discussion' | 'showcase' | 'tutorial';
  tags: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  votes: number;
  viewCount: number;
  commentCount: number;
  isResolved?: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  postId: string;
  parentId?: string;
  votes: number;
  isAccepted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: CommunityComment[];
}

export interface SharedProject {
  id: string;
  title: string;
  description: string;
  projectId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  previewUrl?: string;
  sourceUrl?: string;
  tags: string[];
  category: string;
  likes: number;
  views: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class CommunityService {
  /**
   * Get community posts with pagination and filters
   */
  async getPosts(
    page: number = 1,
    limit: number = 20,
    type?: string,
    tags?: string[],
    sortBy: 'recent' | 'popular' | 'votes' = 'recent'
  ): Promise<{ posts: CommunityPost[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (type) where.type = type;
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        orderBy = { viewCount: 'desc' };
      } else if (sortBy === 'votes') {
        orderBy = { votes: 'desc' };
      }

      const [posts, total] = await Promise.all([
        prisma.communityPost.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
        }),
        prisma.communityPost.count({ where }),
      ]);

      const formattedPosts: CommunityPost[] = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.authorId,
        author: post.author,
        votes: post.votes,
        viewCount: post.viewCount,
        commentCount: post._count.comments,
        isResolved: post.isResolved,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));

      return {
        posts: formattedPosts,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error: any) {
      logger.error('Failed to get community posts', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a single post with comments
   */
  async getPost(postId: string, userId?: string): Promise<CommunityPost & { comments: CommunityComment[] }> {
    try {
      // Increment view count
      await prisma.communityPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          comments: {
            where: { parentId: null },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              replies: {
                orderBy: { createdAt: 'asc' },
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      if (!post) {
        throw new AppError('Post not found', 404);
      }

      const formattedComments: CommunityComment[] = post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        author: comment.author,
        postId: comment.postId,
        parentId: comment.parentId,
        votes: comment.votes,
        isAccepted: comment.isAccepted,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replies: comment.replies?.map(reply => ({
          id: reply.id,
          content: reply.content,
          authorId: reply.authorId,
          author: reply.author,
          postId: reply.postId,
          parentId: reply.parentId,
          votes: reply.votes,
          isAccepted: reply.isAccepted,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        })),
      }));

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.authorId,
        author: post.author,
        votes: post.votes,
        viewCount: post.viewCount,
        commentCount: post._count.comments,
        isResolved: post.isResolved,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        comments: formattedComments,
      };
    } catch (error: any) {
      logger.error('Failed to get community post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * Create a new community post
   */
  async createPost(
    userId: string,
    data: {
      title: string;
      content: string;
      type: 'question' | 'discussion' | 'showcase' | 'tutorial';
      tags: string[];
    }
  ): Promise<CommunityPost> {
    try {
      const post = await prisma.communityPost.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          tags: data.tags,
          authorId: userId,
          votes: 0,
          viewCount: 0,
          isResolved: false,
          isPinned: false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.authorId,
        author: post.author,
        votes: post.votes,
        viewCount: post.viewCount,
        commentCount: post._count.comments,
        isResolved: post.isResolved,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to create community post', { error: error.message });
      throw error;
    }
  }

  /**
   * Update a community post
   */
  async updatePost(
    postId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      tags?: string[];
      isResolved?: boolean;
    }
  ): Promise<CommunityPost> {
    try {
      // Check if user owns the post
      const existingPost = await prisma.communityPost.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new AppError('Post not found', 404);
      }

      if (existingPost.authorId !== userId) {
        throw new AppError('You can only edit your own posts', 403);
      }

      const post = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.authorId,
        author: post.author,
        votes: post.votes,
        viewCount: post.viewCount,
        commentCount: post._count.comments,
        isResolved: post.isResolved,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to update community post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * Delete a community post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      // Check if user owns the post
      const existingPost = await prisma.communityPost.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new AppError('Post not found', 404);
      }

      if (existingPost.authorId !== userId) {
        throw new AppError('You can only delete your own posts', 403);
      }

      await prisma.communityPost.delete({
        where: { id: postId },
      });

      logger.info('Community post deleted', { postId, userId });
    } catch (error: any) {
      logger.error('Failed to delete community post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * Vote on a post
   */
  async votePost(postId: string, userId: string, voteType: 'up' | 'down'): Promise<{ votes: number }> {
    try {
      const increment = voteType === 'up' ? 1 : -1;

      const post = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          votes: { increment },
        },
      });

      return { votes: post.votes };
    } catch (error: any) {
      logger.error('Failed to vote on post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<CommunityComment> {
    try {
      const comment = await prisma.communityComment.create({
        data: {
          content,
          authorId: userId,
          postId,
          parentId,
          votes: 0,
          isAccepted: false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return {
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        author: comment.author,
        postId: comment.postId,
        parentId: comment.parentId,
        votes: comment.votes,
        isAccepted: comment.isAccepted,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to add comment', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * Vote on a comment
   */
  async voteComment(commentId: string, userId: string, voteType: 'up' | 'down'): Promise<{ votes: number }> {
    try {
      const increment = voteType === 'up' ? 1 : -1;

      const comment = await prisma.communityComment.update({
        where: { id: commentId },
        data: {
          votes: { increment },
        },
      });

      return { votes: comment.votes };
    } catch (error: any) {
      logger.error('Failed to vote on comment', { error: error.message, commentId });
      throw error;
    }
  }

  /**
   * Accept a comment as the answer
   */
  async acceptComment(commentId: string, userId: string): Promise<void> {
    try {
      // Get the comment and post to verify ownership
      const comment = await prisma.communityComment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      if (comment.post.authorId !== userId) {
        throw new AppError('Only the post author can accept answers', 403);
      }

      // Unaccept all other comments for this post
      await prisma.communityComment.updateMany({
        where: { postId: comment.postId },
        data: { isAccepted: false },
      });

      // Accept this comment
      await prisma.communityComment.update({
        where: { id: commentId },
        data: { isAccepted: true },
      });

      // Mark the post as resolved
      await prisma.communityPost.update({
        where: { id: comment.postId },
        data: { isResolved: true },
      });

      logger.info('Comment accepted as answer', { commentId, userId });
    } catch (error: any) {
      logger.error('Failed to accept comment', { error: error.message, commentId });
      throw error;
    }
  }

  /**
   * Get shared projects
   */
  async getSharedProjects(
    page: number = 1,
    limit: number = 20,
    category?: string,
    tags?: string[],
    sortBy: 'recent' | 'popular' | 'likes' = 'recent'
  ): Promise<{ projects: SharedProject[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = { isPublic: true };
      if (category) where.category = category;
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        orderBy = { views: 'desc' };
      } else if (sortBy === 'likes') {
        orderBy = { likes: 'desc' };
      }

      const [projects, total] = await Promise.all([
        prisma.sharedProject.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.sharedProject.count({ where }),
      ]);

      const formattedProjects: SharedProject[] = projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        projectId: project.projectId,
        authorId: project.authorId,
        author: project.author,
        previewUrl: project.previewUrl,
        sourceUrl: project.sourceUrl,
        tags: project.tags,
        category: project.category,
        likes: project.likes,
        views: project.views,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));

      return {
        projects: formattedProjects,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error: any) {
      logger.error('Failed to get shared projects', { error: error.message });
      throw error;
    }
  }

  /**
   * Share a project
   */
  async shareProject(
    userId: string,
    projectId: string,
    data: {
      title: string;
      description: string;
      category: string;
      tags: string[];
      previewUrl?: string;
      sourceUrl?: string;
      isPublic: boolean;
    }
  ): Promise<SharedProject> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only share your own projects', 403);
      }

      const sharedProject = await prisma.sharedProject.create({
        data: {
          title: data.title,
          description: data.description,
          projectId,
          authorId: userId,
          category: data.category,
          tags: data.tags,
          previewUrl: data.previewUrl,
          sourceUrl: data.sourceUrl,
          isPublic: data.isPublic,
          likes: 0,
          views: 0,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return {
        id: sharedProject.id,
        title: sharedProject.title,
        description: sharedProject.description,
        projectId: sharedProject.projectId,
        authorId: sharedProject.authorId,
        author: sharedProject.author,
        previewUrl: sharedProject.previewUrl,
        sourceUrl: sharedProject.sourceUrl,
        tags: sharedProject.tags,
        category: sharedProject.category,
        likes: sharedProject.likes,
        views: sharedProject.views,
        isPublic: sharedProject.isPublic,
        createdAt: sharedProject.createdAt,
        updatedAt: sharedProject.updatedAt,
      };
    } catch (error: any) {
      logger.error('Failed to share project', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Like a shared project
   */
  async likeProject(projectId: string, userId: string): Promise<{ likes: number }> {
    try {
      // Increment view count
      await prisma.sharedProject.update({
        where: { id: projectId },
        data: { views: { increment: 1 } },
      });

      const project = await prisma.sharedProject.update({
        where: { id: projectId },
        data: {
          likes: { increment: 1 },
        },
      });

      return { likes: project.likes };
    } catch (error: any) {
      logger.error('Failed to like project', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Report inappropriate content
   */
  async reportContent(
    userId: string,
    contentType: 'post' | 'comment' | 'project',
    contentId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      await prisma.contentReport.create({
        data: {
          reporterId: userId,
          contentType,
          contentId,
          reason,
          description,
          status: 'pending',
        },
      });

      logger.info('Content reported', { userId, contentType, contentId, reason });
    } catch (error: any) {
      logger.error('Failed to report content', { error: error.message });
      throw error;
    }
  }
}

export const communityService = new CommunityService();