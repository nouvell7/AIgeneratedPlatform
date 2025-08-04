import { useState, useEffect } from 'react';
import { communityApi, CreatePostData, PostFilters } from '../services/api/community';
import { CommunityPost, Comment } from '@ai-service-platform/shared';

export const useCommunity = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentPost, setCurrentPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadPosts = async (filters?: PostFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.getPosts(filters);
      if (response.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to load posts');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPost = async (postId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.getPost(postId);
      if (response.success) {
        setCurrentPost(response.data);
      } else {
        setError(response.error?.message || 'Failed to load post');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (postData: CreatePostData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.createPost(postData);
      if (response.success) {
        setPosts(prev => [response.data, ...prev]);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create post');
        throw new Error(response.error?.message || 'Failed to create post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (postId: string, updates: Partial<CreatePostData>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.updatePost(postId, updates);
      if (response.success) {
        setPosts(prev => 
          prev.map(post => post.id === postId ? response.data : post)
        );
        if (currentPost?.id === postId) {
          setCurrentPost(response.data);
        }
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update post');
        throw new Error(response.error?.message || 'Failed to update post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.deletePost(postId);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        if (currentPost?.id === postId) {
          setCurrentPost(null);
        }
      } else {
        setError(response.error?.message || 'Failed to delete post');
        throw new Error(response.error?.message || 'Failed to delete post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.getComments(postId);
      if (response.success) {
        setComments(response.data);
      } else {
        setError(response.error?.message || 'Failed to load comments');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const createComment = async (postId: string, content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await communityApi.createComment(postId, content);
      if (response.success) {
        setComments(prev => [...prev, response.data]);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create comment');
        throw new Error(response.error?.message || 'Failed to create comment');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const votePost = async (postId: string, value: 1 | -1) => {
    try {
      const response = await communityApi.votePost(postId, value);
      if (response.success) {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId ? { ...post, votes: response.data.votes } : post
          )
        );
        if (currentPost?.id === postId) {
          setCurrentPost(prev => prev ? { ...prev, votes: response.data.votes } : null);
        }
      } else {
        setError(response.error?.message || 'Failed to vote on post');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const voteComment = async (commentId: string, value: 1 | -1) => {
    try {
      const response = await communityApi.voteComment(commentId, value);
      if (response.success) {
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId ? { ...comment, votes: response.data.votes } : comment
          )
        );
      } else {
        setError(response.error?.message || 'Failed to vote on comment');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    posts,
    currentPost,
    comments,
    isLoading,
    error,
    pagination,
    loadPosts,
    loadPost,
    createPost,
    updatePost,
    deletePost,
    loadComments,
    createComment,
    votePost,
    voteComment,
    clearError,
  };
};