import { renderHook, act } from '@testing-library/react';
import { useCommunity } from '../useCommunity';
import { communityApi } from '../../services/api/community';

// Mock the community API
jest.mock('../../services/api/community', () => ({
  communityApi: {
    getPosts: jest.fn(),
    getPost: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    getComments: jest.fn(),
    createComment: jest.fn(),
    votePost: jest.fn(),
    voteComment: jest.fn(),
  },
}));

const mockCommunityApi = communityApi as jest.Mocked<typeof communityApi>;

describe('useCommunity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPosts', () => {
    it('포스트 목록 로드 성공', async () => {
      // Given
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          content: 'Content 1',
          author: { id: 'user-1', username: 'user1' },
          category: 'general',
          votes: 5,
          createdAt: new Date().toISOString(),
        },
      ];
      const mockResponse = {
        success: true,
        data: {
          posts: mockPosts,
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };
      mockCommunityApi.getPosts.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.loadPosts();
      });

      // Then
      expect(result.current.posts).toEqual(mockPosts);
      expect(result.current.pagination).toEqual(mockResponse.data.pagination);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('포스트 목록 로드 실패', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Failed to load posts' },
      };
      mockCommunityApi.getPosts.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.loadPosts();
      });

      // Then
      expect(result.current.posts).toEqual([]);
      expect(result.current.error).toBe('Failed to load posts');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadPost', () => {
    it('개별 포스트 로드 성공', async () => {
      // Given
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        author: { id: 'user-1', username: 'user1' },
        category: 'general',
        votes: 5,
        createdAt: new Date().toISOString(),
      };
      const mockResponse = {
        success: true,
        data: mockPost,
      };
      mockCommunityApi.getPost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.loadPost('post-1');
      });

      // Then
      expect(result.current.currentPost).toEqual(mockPost);
      expect(result.current.error).toBeNull();
    });
  });

  describe('createPost', () => {
    it('포스트 생성 성공', async () => {
      // Given
      const postData = {
        title: 'New Post',
        content: 'New content',
        category: 'general' as const,
      };
      const mockCreatedPost = {
        id: 'post-new',
        ...postData,
        author: { id: 'user-1', username: 'user1' },
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      const mockResponse = {
        success: true,
        data: mockCreatedPost,
      };
      mockCommunityApi.createPost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      let createdPost;
      await act(async () => {
        createdPost = await result.current.createPost(postData);
      });

      // Then
      expect(createdPost).toEqual(mockCreatedPost);
      expect(result.current.posts).toContain(mockCreatedPost);
      expect(result.current.error).toBeNull();
    });

    it('포스트 생성 실패', async () => {
      // Given
      const postData = {
        title: 'New Post',
        content: 'New content',
        category: 'general' as const,
      };
      const mockResponse = {
        success: false,
        error: { message: 'Failed to create post' },
      };
      mockCommunityApi.createPost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      let error;
      await act(async () => {
        try {
          await result.current.createPost(postData);
        } catch (e) {
          error = e;
        }
      });

      // Then
      expect(error).toBeDefined();
      expect(result.current.error).toBe('Failed to create post');
    });
  });

  describe('updatePost', () => {
    it('포스트 업데이트 성공', async () => {
      // Given
      const initialPost = {
        id: 'post-1',
        title: 'Original Title',
        content: 'Original content',
        author: { id: 'user-1', username: 'user1' },
        category: 'general' as const,
        votes: 5,
        createdAt: new Date().toISOString(),
      };
      const updates = { title: 'Updated Title' };
      const updatedPost = { ...initialPost, ...updates };
      
      const mockResponse = {
        success: true,
        data: updatedPost,
      };
      mockCommunityApi.updatePost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      // Set initial posts
      act(() => {
        result.current.posts.push(initialPost);
      });
      
      await act(async () => {
        await result.current.updatePost('post-1', updates);
      });

      // Then
      expect(mockCommunityApi.updatePost).toHaveBeenCalledWith('post-1', updates);
    });
  });

  describe('deletePost', () => {
    it('포스트 삭제 성공', async () => {
      // Given
      const mockResponse = {
        success: true,
      };
      mockCommunityApi.deletePost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.deletePost('post-1');
      });

      // Then
      expect(mockCommunityApi.deletePost).toHaveBeenCalledWith('post-1');
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadComments', () => {
    it('댓글 목록 로드 성공', async () => {
      // Given
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Test comment',
          author: { id: 'user-1', username: 'user1' },
          votes: 2,
          createdAt: new Date().toISOString(),
        },
      ];
      const mockResponse = {
        success: true,
        data: mockComments,
      };
      mockCommunityApi.getComments.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.loadComments('post-1');
      });

      // Then
      expect(result.current.comments).toEqual(mockComments);
      expect(result.current.error).toBeNull();
    });
  });

  describe('createComment', () => {
    it('댓글 생성 성공', async () => {
      // Given
      const mockComment = {
        id: 'comment-new',
        content: 'New comment',
        author: { id: 'user-1', username: 'user1' },
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      const mockResponse = {
        success: true,
        data: mockComment,
      };
      mockCommunityApi.createComment.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      let createdComment;
      await act(async () => {
        createdComment = await result.current.createComment('post-1', 'New comment');
      });

      // Then
      expect(createdComment).toEqual(mockComment);
      expect(result.current.comments).toContain(mockComment);
    });
  });

  describe('votePost', () => {
    it('포스트 투표 성공', async () => {
      // Given
      const mockResponse = {
        success: true,
        data: { votes: 6 },
      };
      mockCommunityApi.votePost.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.votePost('post-1', 1);
      });

      // Then
      expect(mockCommunityApi.votePost).toHaveBeenCalledWith('post-1', 1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('voteComment', () => {
    it('댓글 투표 성공', async () => {
      // Given
      const mockResponse = {
        success: true,
        data: { votes: 3 },
      };
      mockCommunityApi.voteComment.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useCommunity());
      await act(async () => {
        await result.current.voteComment('comment-1', 1);
      });

      // Then
      expect(mockCommunityApi.voteComment).toHaveBeenCalledWith('comment-1', 1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('에러 상태 초기화', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Some error' },
      };
      mockCommunityApi.getPosts.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommunity());
      
      // Set error state by triggering a failed API call
      await act(async () => {
        await result.current.loadPosts();
      });
      
      expect(result.current.error).toBe('Some error');

      // When
      act(() => {
        result.current.clearError();
      });

      // Then
      expect(result.current.error).toBeNull();
    });
  });
});