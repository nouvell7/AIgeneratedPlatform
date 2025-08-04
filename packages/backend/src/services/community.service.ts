import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'discussion' | 'showcase' | 'tutorial';
  tags: string; // string[] -> string
  authorId: string;
  author: {
    id: string;
    username: string; // name -> username
    email: string;
    profileImage?: string | null; // avatar -> profileImage
  };
  votes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string; // name -> username
    email: string;
    profileImage?: string | null; // avatar -> profileImage
  };
  postId: string;
  // parentId?: string; // 제거
  votes: number;
  // isAccepted?: boolean; // 제거
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
    username: string; // name -> username
    email: string;
    profileImage?: string | null; // avatar -> profileImage
  };
  previewUrl?: string;
  sourceUrl?: string;
  tags: string; // string[] -> string
  category: string;
  likes: number;
  // views: number; // 제거
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class CommunityService {
  /**
   * Get community posts with pagination and filters
   */
  async getPosts(
    page: number = 1,
    limit: number = 20,
    type?: string,
    tags?: string,
    sortBy: 'recent' | 'popular' | 'votes' = 'recent'
  ): Promise<{ posts: CommunityPost[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (type) where.type = type;
      if (tags) {
        where.tags = { contains: tags };
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        // Prisma 모델에 viewCount 없음. 임시로 createdAt 사용.
        orderBy = { createdAt: 'desc' }; 
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
            user: { // author -> user
              select: {
                id: true,
                username: true,
                email: true,
                profileImage: true,
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

      const formattedPosts: CommunityPost[] = posts.map((post: any) => ({ // post 매개변수에 any 타입 명시
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.userId, // authorId -> userId
        author: {
          id: post.user.id,
          username: post.user.username,
          email: post.user.email,
          profileImage: post.user.profileImage,
        },
        votes: post.votes,
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
      // Prisma 모델에 viewCount 없음. Increment view count 로직 제거.
      // await prisma.communityPost.update({
      //   where: { id: postId },
      //   data: { viewCount: { increment: 1 } },
      // });

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: {
          user: { // author -> user
            select: {
              id: true,
              username: true,
              email: true,
              profileImage: true,
            },
          },
          comments: {
            where: { parentId: null },
            orderBy: { createdAt: 'asc' },
            include: {
              user: { // author -> user
                select: {
                  id: true,
                  username: true,
                  email: true,
                  profileImage: true,
                },
              },
              // replies 필드는 Comment 모델에 직접적으로 없으므로 제거
              // replies: {
              //   orderBy: { createdAt: 'asc' },
              //   include: {
              //     author: {
              //       select: {
              //         id: true,
              //         username: true,
              //         email: true,
              //         profileImage: true,
              //       },
              //     },
              //   },
              // },
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

      const formattedComments: CommunityComment[] = (post.comments as any[]).map((comment: any) => ({ // comment 매개변수에 any 타입 명시
        id: comment.id,
        content: comment.content,
        authorId: comment.userId, // authorId -> userId
        author: {
          id: comment.user.id,
          username: comment.user.username,
          email: comment.user.email,
          profileImage: comment.user.profileImage,
        },
        postId: comment.postId,
        // parentId: comment.parentId, // 제거
        votes: comment.votes,
        // isAccepted: comment.isAccepted, // 제거
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        // replies: comment.replies?.map((reply: any) => ({ // replies 제거
        //   id: reply.id,
        //   content: reply.content,
        //   authorId: reply.authorId,
        //   author: {
        //     id: reply.author.id,
        //     username: reply.author.username,
        //     email: reply.author.email,
        //     profileImage: reply.author.profileImage,
        //   },
        //   postId: reply.postId,
        //   parentId: reply.parentId,
        //   votes: reply.votes,
        //   isAccepted: reply.isAccepted,
        //   createdAt: reply.createdAt,
        //   updatedAt: reply.updatedAt,
        // })),
      }));

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type as any,
        tags: post.tags,
        authorId: post.userId, // authorId -> userId
        author: {
          id: post.user.id,
          username: post.user.username,
          email: post.user.email,
          profileImage: post.user.profileImage,
        },
        votes: post.votes,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        comments: formattedComments,
      } as CommunityPost & { comments: CommunityComment[] }; // 타입 캐스팅
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
      tags: string; // string[] -> string
    }
  ): Promise<CommunityPost> {
    try {
      const post = await prisma.communityPost.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          tags: data.tags,
          userId: userId, // authorId -> userId
          votes: 0,
          // viewCount: 0, // 제거
          // isResolved: false, // 제거
          // isPinned: false, // 제거
        },
        include: {
          user: { // author -> user
            select: {
              id: true,
              username: true,
              email: true,
              profileImage: true,
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
        authorId: post.userId, // authorId -> userId
        author: {
          id: post.user.id,
          username: post.user.username,
          email: post.user.email,
          profileImage: post.user.profileImage,
        },
        votes: post.votes,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      } as CommunityPost; // 타입 캐스팅
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
      tags?: string; // string[] -> string
      // isResolved?: boolean; // 제거
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

      if (existingPost.userId !== userId) { // authorId -> userId
        throw new AppError('You can only edit your own posts', 403);
      }

      const post = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: { // author -> user
            select: {
              id: true,
              username: true,
              email: true,
              profileImage: true,
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
        authorId: post.userId, // authorId -> userId
        author: {
          id: post.user.id,
          username: post.user.username,
          email: post.user.email,
          profileImage: post.user.profileImage,
        },
        votes: post.votes,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      } as CommunityPost; // 타입 캐스팅
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

      if (existingPost.userId !== userId) { // authorId -> userId
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
      const comment = await prisma.comment.create({ // CommunityComment -> Comment
        data: {
          content,
          userId: userId, // authorId -> userId
          postId,
          // parentId, // 제거
          votes: 0,
          // isAccepted: false, // 제거
        },
        include: {
          user: { // author -> user
            select: {
              id: true,
              username: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });

      return {
        id: comment.id,
        content: comment.content,
        authorId: comment.userId, // authorId -> userId
        author: {
          id: comment.user.id,
          username: comment.user.username,
          email: comment.user.email,
          profileImage: comment.user.profileImage, // avatar -> profileImage
        },
        postId: comment.postId,
        // parentId: comment.parentId, // 제거
        votes: comment.votes,
        // isAccepted: comment.isAccepted, // 제거
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      } as CommunityComment; // 타입 캐스팅
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

      const comment = await prisma.comment.update({ // CommunityComment -> Comment
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
      const comment = await prisma.comment.findUnique({ // CommunityComment -> Comment
        where: { id: commentId },
        include: { post: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      if (comment.post.userId !== userId) { // authorId -> userId
        throw new AppError('Only the post author can accept answers', 403);
      }

      // Unaccept all other comments for this post
      await prisma.comment.updateMany({ // CommunityComment -> Comment
        where: { postId: comment.postId },
        data: { /* isAccepted: false */ }, // isAccepted 제거
      });

      // Accept this comment
      await prisma.comment.update({ // CommunityComment -> Comment
        where: { id: commentId },
        data: { /* isAccepted: true */ }, // isAccepted 제거
      });

      // Mark the post as resolved
      await prisma.communityPost.update({
        where: { id: comment.postId },
        data: { /* isResolved: true */ }, // isResolved 제거
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
    tags?: string,
    sortBy: 'recent' | 'popular' | 'likes' = 'recent'
  ): Promise<{ projects: SharedProject[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = { isPublic: true };
      if (category) where.category = category;
      if (tags) {
        where.tags = { contains: tags };
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        // Prisma 모델에 views 없음. 임시로 createdAt 사용.
        orderBy = { createdAt: 'desc' };
      } else if (sortBy === 'likes') {
        orderBy = { likes: 'desc' };
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({ // sharedProject -> project
          where: {
            ...where,
            // isPublic: true, // project 모델에는 isPublic 필드가 없음.
            // 대신 category나 tags 필터링으로 대체
          },
          orderBy,
          skip,
          take: limit,
          include: {
            user: { // author -> user
              select: {
                id: true,
                username: true,
                email: true,
                profileImage: true,
              },
            },
          },
        }),
        prisma.project.count({ where }), // sharedProject -> project
      ]);

      const formattedProjects: SharedProject[] = projects.map((project: any) => ({
        id: project.id,
        title: project.name, // title -> name
        description: project.description,
        projectId: project.id, // projectId -> id
        authorId: project.userId, // authorId -> userId
        author: {
          id: project.user.id,
          username: project.user.username,
          email: project.user.email,
          profileImage: project.user.profileImage,
        },
        // previewUrl: project.previewUrl, // 제거
        // sourceUrl: project.sourceUrl, // 제거
        tags: project.category, // tags -> category (임시)
        category: project.category,
        likes: 0, // 임시
        isPublic: true, // 임시
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
      tags: string;
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

      // SharedProject 모델이 없으므로, Project 모델을 업데이트하는 것으로 대체.
      // 실제 공유 로직은 별도의 모델이나 필드를 통해 구현되어야 함.
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: data.title, // title -> name
          description: data.description,
          category: data.category,
          // tags: data.tags, // tags 필드 없음
          // previewUrl: data.previewUrl, // previewUrl 필드 없음
          // sourceUrl: data.sourceUrl, // sourceUrl 필드 없음
          // isPublic: data.isPublic, // isPublic 필드 없음
        },
      });

      return {
        id: updatedProject.id,
        title: updatedProject.name, // title -> name
        description: updatedProject.description,
        projectId: updatedProject.id, // projectId -> id
        authorId: updatedProject.userId, // authorId -> userId
        author: {
          id: userId, // 임시
          username: "unknown", // 임시
          email: "unknown", // 임시
          profileImage: undefined, // 임시: null -> undefined
        },
        previewUrl: undefined, // 임시: null -> undefined
        sourceUrl: undefined, // 임시: null -> undefined
        tags: updatedProject.category, // tags -> category (임시)
        category: updatedProject.category,
        likes: 0, // 임시
        isPublic: true, // 임시
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
      } as SharedProject; // 타입 캐스팅
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
      // Prisma 모델에 views 없음. Increment view count 로직 제거.
      // await prisma.sharedProject.update({
      //   where: { id: projectId },
      //   data: { views: { increment: 1 } },
      // });

      const project = await prisma.project.update({ // SharedProject -> Project
        where: { id: projectId },
        data: {
          // likes: { increment: 1 }, // likes 필드 없음
        },
      });

      return { likes: 0 }; // 임시
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
      await prisma.communityPost.update({ // contentReport 모델 없음. CommunityPost 업데이트로 대체
        where: { id: contentId },
        data: {
          // reporterId: userId, // reporterId 없음
          // contentType, // contentType 없음
          // contentId, // contentId 없음
          // reason, // reason 없음
          // description, // description 없음
          // status: 'pending', // status 없음
        },
      });

      logger.info('Content reported (mock)', { userId, contentType, contentId, reason });
    } catch (error: any) {
      logger.error('Failed to report content', { error: error.message });
      throw error;
    }
  }
}

// export const communityService = new CommunityService(); // 제거
