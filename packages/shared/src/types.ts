// Shared TypeScript types
export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  role: 'user' | 'admin';
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  privacy: {
    profilePublic: boolean;
    projectsPublic: boolean;
  };
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'developing' | 'deployed' | 'archived';
  aiModel?: AIModelConfig;
  deploymentConfig?: DeploymentConfig;
  revenueConfig?: RevenueConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModelConfig {
  type: 'teachable-machine' | 'huggingface' | 'custom';
  modelUrl: string;
  modelId: string;
  configuration: Record<string, any>;
}

export interface DeploymentConfig {
  platform: 'cloudflare-pages' | 'vercel' | 'netlify';
  repositoryUrl: string;
  deploymentUrl?: string;
  lastDeployedAt?: Date;
  cfProjectId?: string;
  cfProjectName?: string;
  cfProjectDomains?: string[];
  latestDeploymentId?: string;
  githubRepoUrl?: string;
}

export interface RevenueConfig {
  adsenseEnabled: boolean;
  adsensePublisherId?: string;
  adUnits: AdUnit[];
}

export interface AdUnit {
  id: string;
  name: string;
  position: string;
  size: string;
  code: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  codeTemplate: string;
  aiModelType: string;
  previewImages: string[];
  usageCount: number;
  rating: number;
  createdAt: Date;
}

export interface CommunityPost {
  id: string;
  userId: string;
  type: 'question' | 'showcase' | 'discussion';
  title: string;
  content: string;
  tags: string[];
  votes: number;
  comments: Comment[];
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  votes: number;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
