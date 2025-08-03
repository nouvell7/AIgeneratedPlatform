import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Calendar,
  ExternalLink,
  Star,
  Users,
  BarChart3,
  Trophy,
  Target,
  Lightbulb
} from 'lucide-react';

interface SuccessStory {
  id: string;
  title: string;
  description: string;
  templateId: string;
  templateName: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    location: string;
  };
  metrics: {
    monthlyRevenue: number;
    totalRevenue: number;
    monthlyVisitors: number;
    conversionRate: number;
    launchDate: Date;
  };
  highlights: string[];
  tips: string[];
  previewUrl: string;
  thumbnailUrl: string;
  tags: string[];
  featured: boolean;
}

interface SuccessStoriesProps {
  onViewTemplate?: (templateId: string) => void;
}

export const SuccessStories: React.FC<SuccessStoriesProps> = ({
  onViewTemplate
}) => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<SuccessStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Stories' },
    { id: 'business', name: 'Business' },
    { id: 'ecommerce', name: 'E-commerce' },
    { id: 'portfolio', name: 'Portfolio' },
    { id: 'blog', name: 'Blog' },
    { id: 'landing', name: 'Landing Page' },
  ];

  useEffect(() => {
    fetchSuccessStories();
  }, []);

  useEffect(() => {
    filterStories();
  }, [stories, selectedCategory, sortBy]);

  const fetchSuccessStories = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStories: SuccessStory[] = Array.from({ length: 12 }, (_, i) => ({
        id: `story-${i + 1}`,
        title: `How I Built a $${(Math.random() * 50 + 10).toFixed(0)}K/Month Business`,
        description: `A detailed case study of how I transformed my idea into a profitable online business using our platform. Learn the strategies, tools, and techniques that led to success.`,
        templateId: `template-${i + 1}`,
        templateName: `Template ${i + 1}`,
        category: categories[i % 5 + 1].id,
        author: {
          name: `Success Story ${i + 1}`,
          avatar: `https://i.pravatar.cc/60?img=${i + 10}`,
          location: ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia'][i % 4],
        },
        metrics: {
          monthlyRevenue: Math.random() * 50000 + 5000,
          totalRevenue: Math.random() * 500000 + 50000,
          monthlyVisitors: Math.floor(Math.random() * 100000) + 10000,
          conversionRate: Math.random() * 5 + 1,
          launchDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        },
        highlights: [
          'Achieved profitability within 3 months',
          'Scaled to 6-figure revenue in first year',
          'Built loyal customer base of 10,000+ users',
          'Featured in major industry publications',
        ],
        tips: [
          'Focus on solving a real problem',
          'Start with MVP and iterate quickly',
          'Invest in SEO from day one',
          'Build an email list early',
          'Listen to customer feedback',
        ],
        previewUrl: `https://example.com/preview/${i + 1}`,
        thumbnailUrl: `https://picsum.photos/600/400?random=${i + 20}`,
        tags: ['profitable', 'scalable', 'seo-optimized', 'conversion-focused'],
        featured: i < 3,
      }));
      
      setStories(mockStories);
    } catch (error) {
      console.error('Failed to fetch success stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStories = () => {
    let filtered = stories;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }

    // Sort stories
    switch (sortBy) {
      case 'revenue':
        filtered.sort((a, b) => b.metrics.monthlyRevenue - a.metrics.monthlyRevenue);
        break;
      case 'visitors':
        filtered.sort((a, b) => b.metrics.monthlyVisitors - a.metrics.monthlyVisitors);
        break;
      case 'recent':
        filtered.sort((a, b) => b.metrics.launchDate.getTime() - a.metrics.launchDate.getTime());
        break;
    }

    setFilteredStories(filtered);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const getMonthsSinceLaunch = (launchDate: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - launchDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
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
          <h2 className="text-2xl font-bold">Success Stories</h2>
          <p className="text-gray-600">Real stories from entrepreneurs who built profitable businesses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span className="text-sm font-medium">{stories.length} Success Stories</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="revenue">Highest Revenue</option>
          <option value="visitors">Most Visitors</option>
          <option value="recent">Recently Launched</option>
        </select>
      </div>

      {/* Featured Stories */}
      {selectedCategory === 'all' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Featured Success Stories
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stories.filter(story => story.featured).map(story => (
              <Card key={story.id} className="border-2 border-yellow-200 bg-yellow-50">
                <div className="relative">
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg line-clamp-2">{story.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-green-600">
                        {formatCurrency(story.metrics.monthlyRevenue)}/month
                      </span>
                      <span className="text-gray-500">
                        {formatNumber(story.metrics.monthlyVisitors)} visitors
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img
                        src={story.author.avatar}
                        alt={story.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{story.author.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStories.map(story => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow">
            <div className="flex">
              <img
                src={story.thumbnailUrl}
                alt={story.title}
                className="w-32 h-32 object-cover rounded-l-lg"
              />
              <div className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {story.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(story.metrics.monthlyRevenue)}/mo
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>{formatNumber(story.metrics.monthlyVisitors)} visitors</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span>{story.metrics.conversionRate.toFixed(1)}% conversion</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span>{getMonthsSinceLaunch(story.metrics.launchDate)} months</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={story.author.avatar}
                          alt={story.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="text-xs">
                          <p className="font-medium">{story.author.name}</p>
                          <p className="text-gray-500">{story.author.location}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewTemplate?.(story.templateId)}
                        >
                          View Template
                        </Button>
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Read Story
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Success Tips Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
            Common Success Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Revenue Growth</h4>
              <ul className="text-sm space-y-1">
                <li>• Focus on customer retention</li>
                <li>• Implement upselling strategies</li>
                <li>• Optimize pricing models</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Traffic Generation</h4>
              <ul className="text-sm space-y-1">
                <li>• Invest in SEO optimization</li>
                <li>• Create valuable content</li>
                <li>• Leverage social media</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600">Conversion Optimization</h4>
              <ul className="text-sm space-y-1">
                <li>• A/B test key elements</li>
                <li>• Simplify user journey</li>
                <li>• Build trust signals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredStories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No success stories found</h3>
          <p className="text-gray-500">
            Try selecting a different category or check back later for new stories.
          </p>
        </div>
      )}
    </div>
  );
};