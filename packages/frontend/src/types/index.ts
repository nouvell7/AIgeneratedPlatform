// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'development' | 'deployed' | 'archived';
  userId: string;
  templateId?: string;
  aiModel?: AIModel;
  deployments: Deployment[];
  revenue?: RevenueData;
  createdAt: string;
  updatedAt: string;
}

// AI Model types
export interface AIModel {
  id: string;
  name: string;
  url: string;
  type: 'teachable-machine' | 'custom';
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Template types
export interface Template {
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
  lastUpdated: string;
}

// Deployment types
export interface Deployment {
  id: string;
  projectId: string;
  platform: 'cloudflare' | 'vercel' | 'netlify';
  status: 'pending' | 'building' | 'deployed' | 'failed';
  url?: string;
  domain?: string;
  environmentVariables?: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  logs: DeploymentLog[];
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

// Revenue types
export interface RevenueData {
  totalEarnings: number;
  monthlyEarnings: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  settings: RevenueSettings;
}

export interface RevenueSettings {
  enableAds: boolean;
  adSensePublisherId?: string;
  adPlacements: ('header' | 'sidebar' | 'content' | 'footer')[];
  adDensity: 'low' | 'medium' | 'high';
}

// Community types
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'discussion' | 'showcase' | 'tutorial';
  tags: string[];
  authorId: string;
  author: User;
  votes: number;
  viewCount: number;
  commentCount: number;
  isResolved?: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  postId: string;
  parentId?: string;
  votes: number;
  isAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}