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
  category: string; // Added category
  status: 'draft' | 'development' | 'deployed' | 'archived';
  projectType: 'LOW_CODE' | 'NO_CODE'; // Added projectType
  pageContent?: Record<string, any>; // Added pageContent
  userId: string;
  templateId?: string;
  aiModel?: Record<string, any>; // Changed to Record<string, any> for flexibility
  deploymentConfig?: Record<string, any>; // Added for singular deployment config
  deploymentLogs: DeploymentRecordFrontend[]; // Renamed and clarified
  revenue?: RevenueData;
  createdAt: string;
  updatedAt: string;
}

// AI Model types (aligned with backend AIModelConfig)
export interface AIModelConfig {
  type: 'teachable-machine' | 'huggingface' | 'custom';
  modelUrl: string;
  modelId: string;
  configuration: Record<string, any>;
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

// Deployment types (aligned with backend DeploymentLog)
export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface DeploymentRecordFrontend {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled'; // Aligned with backend
  platform: string;
  configuration?: Record<string, any>; // Added configuration
  isRollback?: boolean; // Added isRollback
  rollbackFromId?: string; // Added rollbackFromId
  url?: string;
  previewUrl?: string;
  buildLogs?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Changed to string
  logs?: LogEntry[]; // Aligned logs type
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
