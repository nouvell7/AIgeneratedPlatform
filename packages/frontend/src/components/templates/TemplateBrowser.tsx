import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Code, 
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  ShoppingCart,
  Briefcase,
  Camera,
  BookOpen
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  previewUrl: string;
  thumbnailUrl: string;
  rating: number;
  downloads: number;
  price: number;
  isPremium: boolean;
  author: {
    name: string;
    avatar: string;
  };
  features: string[];
  responsive: boolean;
  lastUpdated: Date;
}

interface TemplateBrowserProps {
  onSelectTemplate?: (template: Template) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Globe },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'portfolio', name: 'Portfolio', icon: Camera },
  { id: 'blog', name: 'Blog', icon: BookOpen },
  { id: 'landing', name: 'Landing Page', icon: Monitor },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
];

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery, sortBy]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTemplates: Template[] = Array.from({ length: 24 }, (_, i) => ({
        id: `template-${i + 1}`,
        name: `Template ${i + 1}`,
        description: `A beautiful and modern template perfect for ${CATEGORIES[i % 5 + 1].name.toLowerCase()} websites. Features responsive design and clean code.`,
        category: CATEGORIES[i % 5 + 1].id,
        tags: ['responsive', 'modern', 'clean', 'professional'],
        previewUrl: `https://example.com/preview/${i + 1}`,
        thumbnailUrl: `https://picsum.photos/400/300?random=${i + 1}`,
        rating: Math.random() * 2 + 3, // 3-5 stars
        downloads: Math.floor(Math.random() * 10000) + 100,
        price: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0,
        isPremium: Math.random() > 0.7,
        author: {
          name: `Author ${i + 1}`,
          avatar: `https://i.pravatar.cc/40?img=${i + 1}`,
        },
        features: [
          'Responsive Design',
          'SEO Optimized',
          'Fast Loading',
          'Cross-browser Compatible',
        ],
        responsive: true,
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        filtered.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate?.(template);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
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
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-gray-600">Choose from our collection of professional templates</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
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

        {/* Category Filter */}
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
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  Premium
                </Badge>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Code className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg truncate">{template.name}</h3>
                  {template.price > 0 ? (
                    <span className="text-lg font-bold text-green-600">
                      ${template.price}
                    </span>
                  ) : (
                    <Badge variant="secondary">Free</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {renderStars(template.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({template.rating.toFixed(1)})
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{template.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {template.responsive && (
                      <>
                        <Monitor className="h-4 w-4" />
                        <Tablet className="h-4 w-4" />
                        <Smartphone className="h-4 w-4" />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <img
                    src={template.author.avatar}
                    alt={template.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600">{template.author.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or browse different categories.
          </p>
        </div>
      )}
    </div>
  );
};