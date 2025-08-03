import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Eye, 
  ExternalLink, 
  Code, 
  Search, 
  Filter,
  Star,
  Calendar,
  User,
  Tag,
  Share2,
  Download,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

interface SharedProject {
  id: string;
  title: string;
  description: string;
  projectId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    location: string;
  };
  previewUrl?: string;
  sourceUrl?: string;
  thumbnailUrl: string;
  tags: string[];
  category: string;
  likes: number;
  views: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  features: string[];
  techStack: string[];
  responsive: boolean;
}

interface ProjectGalleryProps {
  onViewProject?: (projectId: string) => void;
  onLikeProject?: (projectId: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Projects', icon: Globe },
  { id: 'business', name: 'Business', icon: Globe },
  { id: 'ecommerce', name: 'E-commerce', icon: Globe },
  { id: 'portfolio', name: 'Portfolio', icon: User },
  { id: 'blog', name: 'Blog', icon: Globe },
  { id: 'landing', name: 'Landing Page', icon: Monitor },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'views', label: 'Most Viewed' },
];

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  onViewProject,
  onLikeProject
}) => {
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<SharedProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [likedProjects, setLikedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, selectedCategory, searchQuery, sortBy]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProjects: SharedProject[] = Array.from({ length: 18 }, (_, i) => ({
        id: `shared-project-${i + 1}`,
        title: `${['Modern', 'Creative', 'Professional', 'Innovative', 'Elegant'][i % 5]} ${['Dashboard', 'Portfolio', 'E-commerce', 'Blog', 'Landing Page'][i % 5]}`,
        description: `A ${['stunning', 'beautiful', 'responsive', 'modern', 'clean'][i % 5]} ${['web application', 'website', 'platform', 'interface', 'solution'][i % 5]} built with the latest technologies. Features include responsive design, smooth animations, and excellent user experience.`,
        projectId: `project-${i + 1}`,
        author: {
          id: `user-${i + 1}`,
          name: `Developer ${i + 1}`,
          avatar: `https://i.pravatar.cc/50?img=${i + 10}`,
          location: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Tokyo, Japan', 'Berlin, Germany'][i % 5],
        },
        previewUrl: `https://example.com/preview/${i + 1}`,
        sourceUrl: Math.random() > 0.5 ? `https://github.com/user/project-${i + 1}` : undefined,
        thumbnailUrl: `https://picsum.photos/400/300?random=${i + 30}`,
        tags: [
          ['react', 'typescript', 'tailwind'],
          ['vue', 'javascript', 'css'],
          ['angular', 'scss', 'bootstrap'],
          ['nextjs', 'prisma', 'postgresql'],
          ['svelte', 'vite', 'supabase']
        ][i % 5],
        category: CATEGORIES[i % 5 + 1].id,
        likes: Math.floor(Math.random() * 200) + 10,
        views: Math.floor(Math.random() * 2000) + 100,
        isPublic: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        features: [
          'Responsive Design',
          'Dark Mode',
          'SEO Optimized',
          'Fast Loading',
          'Mobile First',
        ],
        techStack: [
          ['React', 'TypeScript', 'Tailwind CSS'],
          ['Vue.js', 'JavaScript', 'CSS3'],
          ['Angular', 'SCSS', 'Bootstrap'],
          ['Next.js', 'Prisma', 'PostgreSQL'],
          ['Svelte', 'Vite', 'Supabase']
        ][i % 5],
        responsive: true,
      }));
      
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort projects
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
    }

    setFilteredProjects(filtered);
  };

  const handleLike = async (projectId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isLiked = likedProjects.has(projectId);
      
      if (isLiked) {
        setLikedProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, likes: project.likes - 1 }
            : project
        ));
      } else {
        setLikedProjects(prev => new Set(prev).add(projectId));
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, likes: project.likes + 1 }
            : project
        ));
      }
      
      onLikeProject?.(projectId);
    } catch (error) {
      console.error('Failed to like project:', error);
    }
  };

  const handleShare = async (project: SharedProject) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: project.previewUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(project.previewUrl || '');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
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
          <h2 className="text-2xl font-bold">Project Gallery</h2>
          <p className="text-gray-600">Discover amazing projects built by our community</p>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">{projects.length} Projects</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
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
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Card key={project.id} className="group hover:shadow-lg transition-all duration-200">
            <div className="relative">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  {project.previewUrl && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={project.previewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Preview
                      </a>
                    </Button>
                  )}
                  {project.sourceUrl && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Code className="h-4 w-4 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Responsive indicators */}
              {project.responsive && (
                <div className="absolute top-2 left-2 flex space-x-1">
                  <div className="bg-white bg-opacity-90 rounded-full p-1">
                    <Monitor className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="bg-white bg-opacity-90 rounded-full p-1">
                    <Tablet className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="bg-white bg-opacity-90 rounded-full p-1">
                    <Smartphone className="h-3 w-3 text-gray-600" />
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{project.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {project.description}
                  </p>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1">
                  {project.techStack.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.techStack.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.techStack.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-2">
                  <img
                    src={project.author.avatar}
                    alt={project.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.author.name}</p>
                    <p className="text-xs text-gray-500 truncate">{project.author.location}</p>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{project.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTimeAgo(project.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare(project)}
                      className="p-1 h-8 w-8"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLike(project.id)}
                      className={`p-1 h-8 w-8 ${likedProjects.has(project.id) ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`h-4 w-4 ${likedProjects.has(project.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <span className="text-sm font-medium">{project.likes}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Globe className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or browse different categories.
          </p>
        </div>
      )}
    </div>
  );
};