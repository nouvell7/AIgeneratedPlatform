import 'reflect-metadata';
import { CommunityService, CreatePostData, CreateCommentData } from '../community.service';
import { NotFoundError, ValidationError, InsufficientPermissionsError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    communityPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  loggers: {
    business: {
      projectCreated: jest.fn(),
    },
    external: {
      error: jest.fn(),
    },
  },
}));

const mockPrisma = require('../../lib/prisma').prisma;

describe('CommunityService', () => {
  let communityService: CommunityService;

  beforeEach(() => {
    communityService = new CommunityService();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const userId = 'user-123';
    const postData: CreatePostData = {
      title: 'Test Post',
      content: 'This is a test post content',
      type: 'QUESTION',
      tags: ['test', 'example'],
    };

    it('커뮤니티 포스트 생성 성공', async () => {
      // Given
      const mockCreatedPost = {
        id: 'post-123',
        title: postData.title,
        content: postData.content,
        userId: userId,
        projectId: null,
        type: postData.type,
        tags: JSON.stringify(postData.tags),
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      mockPrisma.communityPost.create.mockResolvedValue(mockCreatedPost);

      // When
      const result = await communityService.createPost(userId, postData);

      // Then
      expect(result).toEqual({
        ...mockCreatedPost,
        tags: ['test', 'example'],
      });
      expect(mockPrisma.communityPost.create).toHaveBeenCalledWith({
        data: {
          title: postData.title,
          content: postData.content,
          userId: userId,
          projectId: undefined,
          type: postData.type,
          tags: JSON.stringify(postData.tags),
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
    });

    it('태그 없이 포스트 생성 성공', async () => {
      // Given
      const postDataWithoutTags = {
        title: 'Test Post',
        content: 'Content',
        type: 'DISCUSSION',
      };

      const mockCreatedPost = {
        id: 'post-123',
        tags: '[]',
        user: { id: userId, username: 'testuser', email: 'test@example.com' },
      };

      mockPrisma.communityPost.create.mockResolvedValue(mockCreatedPost);

      // When
      const result = await communityService.createPost(userId, postDataWithoutTags);

      // Then
      expect(result.tags).toEqual([]);
      expect(mockPrisma.communityPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: JSON.stringify([]),
          }),
        })
      );
    });
  });

  describe('getPosts', () => {
    it('필터 없이 포스트 목록 조회 성공', async () => {
      // Given
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          content: 'Content 1',
          type: 'QUESTION',
          tags: '["tag1"]',
          votes: 5,
          user: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.communityPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.communityPost.count.mockResolvedValue(1);

      // When
      const result = await communityService.getPosts();

      // Then
      expect(result).toEqual({
        posts: [
          {
            ...mockPosts[0],
            tags: ['tag1'],
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('타입 필터로 포스트 조회 성공', async () => {
      // Given
      mockPrisma.communityPost.findMany.mockResolvedValue([]);
      mockPrisma.communityPost.count.mockResolvedValue(0);

      // When
      await communityService.getPosts({ type: 'SHOWCASE' });

      // Then
      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith({
        where: { type: 'SHOWCASE' },
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
        take: 20,
        skip: 0,
      });
    });

    it('검색어로 포스트 조회 성공', async () => {
      // Given
      mockPrisma.communityPost.findMany.mockResolvedValue([]);
      mockPrisma.communityPost.count.mockResolvedValue(0);

      // When
      await communityService.getPosts({ search: 'test query' });

      // Then
      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test query', mode: 'insensitive' } },
            { content: { contains: 'test query', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('getPostById', () => {
    const postId = 'post-123';

    it('포스트 ID로 조회 성공', async () => {
      // Given
      const mockPost = {
        id: postId,
        title: 'Test Post',
        content: 'Test content',
        type: 'QUESTION',
        tags: '["test"]',
        votes: 10,
        user: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.communityPost.findUnique.mockResolvedValue(mockPost);

      // When
      const result = await communityService.getPostById(postId);

      // Then
      expect(result).toEqual({
        ...mockPost,
        tags: ['test'],
      });
      expect(mockPrisma.communityPost.findUnique).toHaveBeenCalledWith({
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
    });

    it('존재하지 않는 포스트 조회 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.communityPost.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(communityService.getPostById(postId))
        .rejects.toThrow(NotFoundError);
      await expect(communityService.getPostById(postId))
        .rejects.toThrow('Community post');
    });
  });

  describe('updatePost', () => {
    const postId = 'post-123';
    const userId = 'user-123';
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('포스트 업데이트 성공', async () => {
      // Given
      const existingPost = {
        id: postId,
        userId: userId,
      };

      const updatedPost = {
        id: postId,
        title: updateData.title,
        content: updateData.content,
        tags: '["updated"]',
        user: { id: userId, username: 'user', email: 'user@example.com' },
      };

      mockPrisma.communityPost.findUnique.mockResolvedValue(existingPost);
      mockPrisma.communityPost.update.mockResolvedValue(updatedPost);

      // When
      const result = await communityService.updatePost(postId, userId, updateData);

      // Then
      expect(result).toEqual({
        ...updatedPost,
        tags: ['updated'],
      });
      expect(mockPrisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          title: updateData.title,
          content: updateData.content,
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
    });

    it('다른 사용자의 포스트 업데이트 시 InsufficientPermissionsError 발생', async () => {
      // Given
      const existingPost = {
        id: postId,
        userId: 'other-user-id',
      };

      mockPrisma.communityPost.findUnique.mockResolvedValue(existingPost);

      // When & Then
      await expect(communityService.updatePost(postId, userId, updateData))
        .rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('votePost', () => {
    const postId = 'post-123';
    const userId = 'user-123';

    it('포스트 투표 성공 (새로운 투표)', async () => {
      // Given
      const mockPost = { id: postId, votes: 5 };
      mockPrisma.communityPost.findUnique.mockResolvedValue(mockPost);
      mockPrisma.vote.findUnique.mockResolvedValue(null);
      mockPrisma.vote.create.mockResolvedValue({});
      mockPrisma.communityPost.update.mockResolvedValue({});

      // When
      await communityService.votePost(postId, userId, 1);

      // Then
      expect(mockPrisma.vote.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
          value: 1,
        },
      });
      expect(mockPrisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          votes: {
            increment: 1,
          },
        },
      });
    });

    it('기존 투표 변경 성공', async () => {
      // Given
      const mockPost = { id: postId };
      const existingVote = { userId, postId, value: 1 };
      mockPrisma.communityPost.findUnique.mockResolvedValue(mockPost);
      mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
      mockPrisma.vote.update.mockResolvedValue({});
      mockPrisma.communityPost.update.mockResolvedValue({});

      // When
      await communityService.votePost(postId, userId, -1);

      // Then
      expect(mockPrisma.vote.update).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
        data: { value: -1 },
      });
      expect(mockPrisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          votes: {
            increment: -2, // -1 - 1 = -2
          },
        },
      });
    });

    it('동일한 투표 반복 시 ValidationError 발생', async () => {
      // Given
      const mockPost = { id: postId };
      const existingVote = { userId, postId, value: 1 };
      mockPrisma.communityPost.findUnique.mockResolvedValue(mockPost);
      mockPrisma.vote.findUnique.mockResolvedValue(existingVote);

      // When & Then
      await expect(communityService.votePost(postId, userId, 1))
        .rejects.toThrow(ValidationError);
      await expect(communityService.votePost(postId, userId, 1))
        .rejects.toThrow('You have already voted on this post');
    });
  });

  describe('createComment', () => {
    const postId = 'post-123';
    const userId = 'user-123';
    const commentData: CreateCommentData = {
      content: 'This is a comment',
    };

    it('댓글 생성 성공', async () => {
      // Given
      const mockPost = { id: postId };
      const mockComment = {
        id: 'comment-123',
        content: commentData.content,
        userId: userId,
        postId,
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: userId, username: 'user', email: 'user@example.com' },
      };

      mockPrisma.communityPost.findUnique.mockResolvedValue(mockPost);
      mockPrisma.comment.create.mockResolvedValue(mockComment);

      // When
      const result = await communityService.createComment(postId, userId, commentData);

      // Then
      expect(result).toEqual(mockComment);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: commentData.content,
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
    });

    it('존재하지 않는 포스트에 댓글 작성 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.communityPost.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(communityService.createComment(postId, userId, commentData))
        .rejects.toThrow(NotFoundError);
      await expect(communityService.createComment(postId, userId, commentData))
        .rejects.toThrow('Community post');
    });
  });

  describe('getPostTypes', () => {
    it('포스트 타입 목록 조회 성공', async () => {
      // Given
      const mockTypes = [
        {
          type: 'QUESTION',
          _count: { type: 25 },
        },
        {
          type: 'SHOWCASE',
          _count: { type: 15 },
        },
        {
          type: 'DISCUSSION',
          _count: { type: 10 },
        },
      ];

      mockPrisma.communityPost.groupBy.mockResolvedValue(mockTypes);

      // When
      const result = await communityService.getPostTypes();

      // Then
      expect(result).toEqual([
        { type: 'QUESTION', count: 25 },
        { type: 'SHOWCASE', count: 15 },
        { type: 'DISCUSSION', count: 10 },
      ]);
      expect(mockPrisma.communityPost.groupBy).toHaveBeenCalledWith({
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
    });
  });

  describe('getUserPosts', () => {
    const userId = 'user-123';

    it('사용자 포스트 목록 조회 성공', async () => {
      // Given
      const mockPosts = [
        {
          id: 'post-1',
          title: 'User Post 1',
          content: 'Content 1',
          type: 'QUESTION',
          tags: '["user", "post"]',
          votes: 3,
          user: { id: userId, username: 'user', email: 'user@example.com' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.communityPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.communityPost.count.mockResolvedValue(1);

      // When
      const result = await communityService.getUserPosts(userId);

      // Then
      expect(result).toEqual({
        posts: [
          {
            ...mockPosts[0],
            tags: ['user', 'post'],
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith({
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
        take: 20,
        skip: 0,
      });
    });
  });
});