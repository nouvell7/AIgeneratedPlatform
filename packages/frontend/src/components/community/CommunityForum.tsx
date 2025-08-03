import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Clock,
  CheckCircle,
  Pin,
  User,
  Tag,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Code
} from 'lucide-react';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'discussion' | 'showcase' | 'tutorial';
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  votes: number;
  viewCount: number;
  commentCount: number;
  isResolved?: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityForumProps {
  onCreatePost?: () => void;
  onViewPost?: (postId: string) => void;
}

const POST_TYPES = [
  { id: 'all', name: 'All Posts', icon: MessageSquare },
  { id: 'question', name: 'Questions', icon: HelpCircle },
  { id: 'discussion', name: 'Discussions', icon: MessageSquare },
  { id: 'showcase', name: 'Showcase', icon: TrendingUp },
  { id: 'tutorial', name: 'Tutorials', icon: Lightbulb },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'votes', label: 'Most Voted' },
  { value: 'unanswered', label: 'Unanswered' },
];

export const CommunityForum: React.FC<CommunityForumProps> = ({
  onCreatePost,
  onViewPost
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'question' as 'question' | 'discussion' | 'showcase' | 'tutorial',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedType, searchQuery, sortBy]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPosts: CommunityPost[] = Array.from({ length: 20 }, (_, i) => ({
        id: `post-${i + 1}`,
        title: `${['How to', 'Best practices for', 'Need help with', 'Showcase:', 'Tutorial:'][i % 5]} ${['building responsive layouts', 'optimizing performance', 'implementing authentication', 'creating animations', 'deploying applications'][i % 5]}`,
        content: `This is a detailed post about ${['web development', 'mobile apps', 'AI integration', 'database design', 'user experience'][i % 5]}. Looking for advice and feedback from the community.`,
        type: ['question', 'discussion', 'showcase', 'tutorial'][i % 4] as any,
        tags: [
          ['react', 'javascript', 'frontend'],
          ['nodejs', 'backend', 'api'],
          ['css', 'design', 'ui'],
          ['deployment', 'devops', 'cloud'],
          ['ai', 'machine-learning', 'python']
        ][i % 5],
        author: {
          id: `user-${i + 1}`,
          name: `User ${i + 1}`,
          avatar: `https://i.pravatar.cc/40?img=${i + 1}`,
        },
        votes: Math.floor(Math.random() * 50) - 10,
        viewCount: Math.floor(Math.random() * 1000) + 50,
        commentCount: Math.floor(Math.random() * 20),
        isResolved: Math.random() > 0.7,
        isPinned: i < 2,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      }));
      
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort posts
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'votes':
        filtered.sort((a, b) => b.votes - a.votes);
        break;
      case 'unanswered':
        filtered = filtered.filter(post => post.commentCount === 0);
        break;
    }

    // Pin posts to top
    const pinnedPosts = filtered.filter(post => post.isPinned);
    const regularPosts = filtered.filter(post => !post.isPinned);
    
    setFilteredPosts([...pinnedPosts, ...regularPosts]);
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const post: CommunityPost = {
        id: `post-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        type: newPost.type,
        tags: newPost.tags,
        author: {
          id: 'current-user',
          name: 'Current User',
          avatar: 'https://i.pravatar.cc/40?img=1',
        },
        votes: 0,
        viewCount: 0,
        commentCount: 0,
        isResolved: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setPosts(prev => [post, ...prev]);
      setNewPost({ title: '', content: '', type: 'question', tags: [] });
      setShowCreateForm(false);
      onCreatePost?.();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, votes: post.votes + (voteType === 'up' ? 1 : -1) }
          : post
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return HelpCircle;
      case 'discussion': return MessageSquare;
      case 'showcase': return TrendingUp;
      case 'tutorial': return Lightbulb;
      default: return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'discussion': return 'bg-green-100 text-green-800';
      case 'showcase': return 'bg-purple-100 text-purple-800';
      case 'tutorial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Forum</h2>
          <p className="text-gray-600">Connect with other developers and share knowledge</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Post Type</label>
              <select
                value={newPost.type}
                onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="question">Question</option>
                <option value="discussion">Discussion</option>
                <option value="showcase">Showcase</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter post title..."
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="Write your post content..."
                rows={6}
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {POST_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span>{type.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map(post => {
          const TypeIcon = getTypeIcon(post.type);
          return (
            <Card 
              key={post.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${post.isPinned ? 'border-yellow-200 bg-yellow-50' : ''}`}
              onClick={() => onViewPost?.(post.id)}
            >
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center space-y-1 min-w-[60px]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post.id, 'up');
                      }}
                      className="p-1 h-8 w-8"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className={`text-sm font-medium ${post.votes > 0 ? 'text-green-600' : post.votes < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {post.votes}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post.id, 'down');
                      }}
                      className="p-1 h-8 w-8"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {post.isPinned && <Pin className="h-4 w-4 text-yellow-600" />}
                          <Badge className={getTypeColor(post.type)}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {post.type}
                          </Badge>
                          {post.isResolved && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2">{post.content}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Post Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{post.author.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MessageSquare className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or create the first post!
          </p>
          <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Post
          </Button>
        </div>
      )}
    </div>
  );
};