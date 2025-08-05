import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { CommunityService } from '../../services/community.service';
import { CommunityController } from '../community.controller';

// Mock the service
const mockCommunityService = {
  createPost: jest.fn(),
  getPosts: jest.fn(),
  getPostById: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  votePost: jest.fn(),
  createComment: jest.fn(),
  getComments: jest.fn(),
  getPostTypes: jest.fn(),
  getUserPosts: jest.fn(),
};

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  });

  const controller = new CommunityController();

  // Community routes
  app.get('/api/community/posts', ...controller.getPosts);
  app.post('/api/community/posts', ...controller.createPost);
  app.get('/api/community/posts/:postId', ...controller.getPost);
  app.put('/api/community/posts/:postId', ...controller.updatePost);
  app.delete('/api/community/posts/:postId', ...controller.deletePost);
  app.post('/api/community/posts/:postId/vote', ...controller.votePost);
  app.post('/api/community/posts/:postId/comments', ...controller.createComment);
  app.get('/api/community/posts/:postId/comments', ...controller.getComments);
  app.get('/api/community/types', ...controller.getPostTypes);
  app.get('/api/community/users/:userId/posts', ...controller.getUserPosts);

  return app;
};

describe('Community Controller Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    container.clearInstances();
    container.registerInstance(CommunityService, mockCommunityService as any);
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/community/posts', () => {
    it('커뮤니티 포스트 목록 조회 성공', async () => {
      // Given
      const mockResult = {
        posts: [
          {
            id: 'post-1',
            title: 'Test Post',
            content: 'Test content',
            type: 'QUESTION',
            tags: ['test'],
            votes: 5,
            user: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockCommunityService.getPosts.mockResolvedValue(mockResult);

      // When
      const response = await request(app)
        .get('/api/community/posts')
        .query({ page: 1, limit: 20, type: 'QUESTION' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(mockCommunityService.getPosts).toHaveBeenCalledWith({
        type: 'QUESTION',
        search: undefined,
        tags: undefined,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('POST /api/community/posts', () => {
    it('커뮤니티 포스트 생성 성공', async () => {
      // Given
      const postData = {
        title: 'New Post',
        content: 'Post content',
        type: 'QUESTION',
        tags: ['help', 'question'],
      };
      const mockCreatedPost = {
        id: 'post-123',
        ...postData,
        userId: 'test-user-id',
        votes: 0,
        user: { id: 'test-user-id', username: 'testuser', email: 'test@example.com' },
      };
      mockCommunityService.createPost.mockResolvedValue(mockCreatedPost);

      // When
      const response = await request(app)
        .post('/api/community/posts')
        .send(postData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toEqual(mockCreatedPost);
      expect(response.body.message).toBe('Post created successfully');
      expect(mockCommunityService.createPost).toHaveBeenCalledWith('test-user-id', postData);
    });
  });

  describe('GET /api/community/posts/:postId', () => {
    it('커뮤니티 포스트 상세 조회 성공', async () => {
      // Given
      const postId = 'post-123';
      const mockPost = {
        id: postId,
        title: 'Test Post',
        content: 'Test content',
        type: 'QUESTION',
        tags: ['test'],
        votes: 5,
        user: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
      };
      mockCommunityService.getPostById.mockResolvedValue(mockPost);

      // When
      const response = await request(app)
        .get(`/api/community/posts/${postId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toEqual(mockPost);
      expect(mockCommunityService.getPostById).toHaveBeenCalledWith(postId);
    });
  });

  describe('PUT /api/community/posts/:postId', () => {
    it('커뮤니티 포스트 업데이트 성공', async () => {
      // Given
      const postId = 'post-123';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };
      const mockUpdatedPost = {
        id: postId,
        ...updateData,
        type: 'QUESTION',
        tags: ['updated'],
        votes: 5,
        user: { id: 'test-user-id', username: 'testuser', email: 'test@example.com' },
      };
      mockCommunityService.updatePost.mockResolvedValue(mockUpdatedPost);

      // When
      const response = await request(app)
        .put(`/api/community/posts/${postId}`)
        .send(updateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toEqual(mockUpdatedPost);
      expect(response.body.message).toBe('Post updated successfully');
      expect(mockCommunityService.updatePost).toHaveBeenCalledWith(
        postId,
        'test-user-id',
        updateData
      );
    });
  });

  describe('DELETE /api/community/posts/:postId', () => {
    it('커뮤니티 포스트 삭제 성공', async () => {
      // Given
      const postId = 'post-123';
      mockCommunityService.deletePost.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .delete(`/api/community/posts/${postId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post deleted successfully');
      expect(mockCommunityService.deletePost).toHaveBeenCalledWith(
        postId,
        'test-user-id'
      );
    });
  });

  describe('POST /api/community/posts/:postId/vote', () => {
    it('커뮤니티 포스트 투표 성공', async () => {
      // Given
      const postId = 'post-123';
      const voteData = { value: 1 }; // upvote
      mockCommunityService.votePost.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .post(`/api/community/posts/${postId}/vote`)
        .send(voteData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vote recorded successfully');
      expect(mockCommunityService.votePost).toHaveBeenCalledWith(
        postId,
        'test-user-id',
        1
      );
    });
  });

  describe('POST /api/community/posts/:postId/comments', () => {
    it('댓글 생성 성공', async () => {
      // Given
      const postId = 'post-123';
      const commentData = { content: 'This is a comment' };
      const mockCreatedComment = {
        id: 'comment-123',
        content: commentData.content,
        userId: 'test-user-id',
        postId,
        votes: 0,
        user: { id: 'test-user-id', username: 'testuser', email: 'test@example.com' },
      };
      mockCommunityService.createComment.mockResolvedValue(mockCreatedComment);

      // When
      const response = await request(app)
        .post(`/api/community/posts/${postId}/comments`)
        .send(commentData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment).toEqual(mockCreatedComment);
      expect(response.body.message).toBe('Comment created successfully');
      expect(mockCommunityService.createComment).toHaveBeenCalledWith(
        postId,
        'test-user-id',
        { content: commentData.content }
      );
    });
  });

  describe('GET /api/community/posts/:postId/comments', () => {
    it('댓글 목록 조회 성공', async () => {
      // Given
      const postId = 'post-123';
      const mockComments = {
        comments: [
          {
            id: 'comment-1',
            content: 'Comment 1',
            userId: 'user-1',
            postId,
            votes: 2,
            user: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockCommunityService.getComments.mockResolvedValue(mockComments);

      // When
      const response = await request(app)
        .get(`/api/community/posts/${postId}/comments`)
        .query({ page: 1, limit: 50 });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockComments);
      expect(mockCommunityService.getComments).toHaveBeenCalledWith(postId, 1, 50);
    });
  });

  describe('GET /api/community/types', () => {
    it('포스트 타입 목록 조회 성공', async () => {
      // Given
      const mockTypes = [
        { type: 'QUESTION', count: 25 },
        { type: 'SHOWCASE', count: 15 },
        { type: 'DISCUSSION', count: 10 },
      ];
      mockCommunityService.getPostTypes.mockResolvedValue(mockTypes);

      // When
      const response = await request(app)
        .get('/api/community/types');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.types).toEqual(mockTypes);
      expect(mockCommunityService.getPostTypes).toHaveBeenCalled();
    });
  });

  describe('GET /api/community/users/:userId/posts', () => {
    it('사용자 포스트 목록 조회 성공', async () => {
      // Given
      const userId = 'user-123';
      const mockUserPosts = {
        posts: [
          {
            id: 'post-1',
            title: 'User Post 1',
            content: 'Content 1',
            type: 'QUESTION',
            tags: ['user'],
            votes: 3,
            user: { id: userId, username: 'user123', email: 'user@example.com' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockCommunityService.getUserPosts.mockResolvedValue(mockUserPosts);

      // When
      const response = await request(app)
        .get(`/api/community/users/${userId}/posts`)
        .query({ page: 1, limit: 20 });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUserPosts);
      expect(mockCommunityService.getUserPosts).toHaveBeenCalledWith(userId, 1, 20);
    });
  });
});