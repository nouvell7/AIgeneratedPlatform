import { apiClient } from './client';
import { ApiResponse, CommunityPost, Comment } from '@ai-service-platform/shared';

export interface CreatePostData {
  type: 'question' | 'showcase' | 'discussion';
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface PostFilters {
  type?: 'question' | 'showcase' | 'discussion';
  tags?: string[];
  sortBy?: 'newest' | 'oldest' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export const communityApi = {
  // Posts
  getPosts: async (filters?: PostFilters): Promise<ApiResponse<{
    posts: CommunityPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await apiClient.get(`/community/posts?${params}`);
    return response.data;
  },

  getPost: async (postId: string): Promise<ApiResponse<CommunityPost>> => {
    const response = await apiClient.get(`/community/posts/${postId}`);
    return response.data;
  },

  createPost: async (postData: CreatePostData): Promise<ApiResponse<CommunityPost>> => {
    const response = await apiClient.post('/community/posts', postData);
    return response.data;
  },

  updatePost: async (
    postId: string,
    updates: UpdatePostData
  ): Promise<ApiResponse<CommunityPost>> => {
    const response = await apiClient.put(`/community/posts/${postId}`, updates);
    return response.data;
  },

  deletePost: async (postId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/community/posts/${postId}`);
    return response.data;
  },

  // Comments
  getComments: async (postId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await apiClient.get(`/community/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (
    postId: string,
    content: string
  ): Promise<ApiResponse<Comment>> => {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, {
      content,
    });
    return response.data;
  },

  updateComment: async (
    commentId: string,
    content: string
  ): Promise<ApiResponse<Comment>> => {
    const response = await apiClient.put(`/community/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/community/comments/${commentId}`);
    return response.data;
  },

  // Voting
  votePost: async (
    postId: string,
    value: 1 | -1
  ): Promise<ApiResponse<{ votes: number }>> => {
    const response = await apiClient.post(`/community/posts/${postId}/vote`, {
      value,
    });
    return response.data;
  },

  voteComment: async (
    commentId: string,
    value: 1 | -1
  ): Promise<ApiResponse<{ votes: number }>> => {
    const response = await apiClient.post(`/community/comments/${commentId}/vote`, {
      value,
    });
    return response.data;
  },

  // Tags
  getPopularTags: async (): Promise<ApiResponse<Array<{
    tag: string;
    count: number;
  }>>> => {
    const response = await apiClient.get('/community/tags/popular');
    return response.data;
  },

  searchTags: async (query: string): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get(`/community/tags/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // User Activity
  getUserPosts: async (userId: string): Promise<ApiResponse<CommunityPost[]>> => {
    const response = await apiClient.get(`/community/users/${userId}/posts`);
    return response.data;
  },

  getUserComments: async (userId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await apiClient.get(`/community/users/${userId}/comments`);
    return response.data;
  },

  // Trending
  getTrendingPosts: async (period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<CommunityPost[]>> => {
    const response = await apiClient.get(`/community/trending?period=${period}`);
    return response.data;
  },
};