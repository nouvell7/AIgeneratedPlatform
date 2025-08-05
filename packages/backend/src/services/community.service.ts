import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError, InsufficientPermissionsError } from '../utils/errors';
import { loggers } from '../utils/logger';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  projectId?: string | null;
  type: string;
  tags: string[];
  votes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  postId: string;
  votes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  title: string;
  content: string;
  type: string;
  tags?: string[];
  projectId?: string;
}

export interface CreateCommentData {
  content: string;
}

@injectable()
export class CommunityService {
  async createPost(userId: string, data: CreatePostData): Promise<CommunityPost> {
    try {
      const post = await prisma.communityPost.create({
        data: {
          title: data.title,
          content: data.content,
          userId: userId,
          projectId: data.projectId,
          type: data.type,
          tags: JSON.stringify(data.tags || []),
          votes: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      loggers.business.projectCreated(post.id, userId);

      return {
        ...post,
        tags: JSON.parse(post.tags || '[]'),
      };
    } catch (error) {
      loggers.external.error('community', 'createPost', error as Error);
      throw error;
    }
  }

  async getPosts(filters?: {
    type?: string;
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    posts: CommunityPost[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, ...searchFilters } = filters || {};
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (searchFilters.type) {
      whereClause.type = searchFilters.type;
    }

    if (searchFilters.search) {
      whereClause.OR = [
        { title: { contains: searchFilters.search, mode: 'insensitive' } },
        { content: { contains: searchFilters.search, mode: 'insensitive' } },
      ];
    }

    if (searchFilters.tags && searchFilters.tags.length > 0) {
      whereClause.tags = {
        contains: searchFilters.tags[0], // Simplified tag search
      };
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.communityPost.count({ where: whereClause }),
    ]);

    return {
      posts: posts.map(post => ({
        ...post,
        tags: JSON.parse(post.tags || '[]'),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(postId: string): Promise<CommunityPost> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundError('Community post');
    }

    return {
      ...post,
      tags: JSON.parse(post.tags || '[]'),
    };
  }

  async updatePost(postId: string, userId: string, data: Partial<CreatePostData>): Promise<CommunityPost> {
    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundError('Community post');
    }

    if (existingPost.userId !== userId) {
      throw new InsufficientPermissionsError('You can only edit your own posts');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.type) updateData.type = data.type;
    if (data.tags) updateData.tags = JSON.stringify(data.tags);

    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      ...updatedPost,
      tags: JSON.parse(updatedPost.tags || '[]'),
    };
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundError('Community post');
    }

    if (existingPost.userId !== userId) {
      throw new InsufficientPermissionsError('You can only delete your own posts');
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    });
  }

  async votePost(postId: string, userId: string, value: number): Promise<void> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Community post');
    }

    // Check if user already voted on this post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        throw new ValidationError('You have already voted on this post');
      }
      
      // Update existing vote
      await Promise.all([
        prisma.vote.update({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          data: { value },
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: {
            votes: {
              increment: value - existingVote.value,
            },
          },
        }),
      ]);
    } else {
      // Create new vote
      await Promise.all([
        prisma.vote.create({
          data: {
            userId,
            postId,
            value,
          },
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: {
            votes: {
              increment: value,
            },
          },
        }),
      ]);
    }
  }

  async createComment(postId: string, userId: string, data: CreateCommentData): Promise<Comment> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Community post');
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        userId: userId,
        postId,
        votes: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return comment;
  }

  async getComments(postId: string, page = 1, limit = 50): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostTypes(): Promise<Array<{ type: string; count: number }>> {
    const types = await prisma.communityPost.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
      orderBy: {
        _count: {
          type: 'desc',
        },
      },
    });

    return types.map(typeGroup => ({
      type: typeGroup.type,
      count: typeGroup._count.type,
    }));
  }

  async getUserPosts(userId: string, page = 1, limit = 20): Promise<{
    posts: CommunityPost[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.communityPost.count({ where: { userId } }),
    ]);

    return {
      posts: posts.map(post => ({
        ...post,
        tags: JSON.parse(post.tags || '[]'),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}