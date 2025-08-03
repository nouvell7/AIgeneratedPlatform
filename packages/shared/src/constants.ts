// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
  },
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    AI_MODEL: (id: string) => `/projects/${id}/ai-model`,
    STATUS: (id: string) => `/projects/${id}/status`,
    FROM_TEMPLATE: (templateId: string) => `/projects/from-template/${templateId}`,
  },
  DEPLOY: {
    DEPLOY: (projectId: string) => `/deploy/${projectId}`,
    STATUS: (projectId: string) => `/deploy/${projectId}/status`,
    LOGS: (projectId: string) => `/deploy/${projectId}/logs`,
    ROLLBACK: (projectId: string) => `/deploy/${projectId}/rollback`,
  },
  REVENUE: {
    ADSENSE_CONNECT: '/revenue/adsense/connect',
    DASHBOARD: (projectId: string) => `/revenue/dashboard/${projectId}`,
    ANALYTICS: (projectId: string) => `/revenue/analytics/${projectId}`,
    SETTINGS: (projectId: string) => `/revenue/settings/${projectId}`,
  },
  TEMPLATES: {
    BASE: '/templates',
    BY_ID: (id: string) => `/templates/${id}`,
    CATEGORIES: '/templates/categories',
  },
  COMMUNITY: {
    POSTS: '/community/posts',
    POST_BY_ID: (id: string) => `/community/posts/${id}`,
    COMMENTS: (postId: string) => `/community/posts/${postId}/comments`,
    SHARED_PROJECTS: '/community/projects/shared',
    SHARE_PROJECT: (id: string) => `/community/projects/${id}/share`,
  },
  SUCCESS_STORIES: '/success-stories',
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_001: 'INVALID_CREDENTIALS',
  AUTH_002: 'TOKEN_EXPIRED',
  AUTH_003: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VAL_001: 'INVALID_INPUT_FORMAT',
  VAL_002: 'MISSING_REQUIRED_FIELDS',
  VAL_003: 'BUSINESS_RULE_VIOLATION',
  
  // External service errors
  EXT_001: 'TEACHABLE_MACHINE_API_ERROR',
  EXT_002: 'REPLIT_API_ERROR',
  EXT_003: 'CLOUDFLARE_PAGES_API_ERROR',
  EXT_004: 'ADSENSE_API_ERROR',
  
  // System errors
  SYS_001: 'DATABASE_CONNECTION_ERROR',
  SYS_002: 'INTERNAL_SERVER_ERROR',
  SYS_003: 'SERVICE_UNAVAILABLE',
} as const;

// Project categories
export const PROJECT_CATEGORIES = [
  'image-classification',
  'text-analysis',
  'audio-recognition',
  'pose-detection',
  'object-detection',
  'sentiment-analysis',
  'chatbot',
  'recommendation',
  'other',
] as const;

// Template difficulties
export const TEMPLATE_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

// Project statuses
export const PROJECT_STATUSES = [
  'draft',
  'developing',
  'deployed',
  'archived',
] as const;

// Community post types
export const COMMUNITY_POST_TYPES = [
  'question',
  'showcase',
  'discussion',
] as const;

// User roles
export const USER_ROLES = [
  'user',
  'admin',
] as const;

// AI model types
export const AI_MODEL_TYPES = [
  'teachable-machine',
  'huggingface',
  'custom',
] as const;

// Deployment platforms
export const DEPLOYMENT_PLATFORMS = [
  'cloudflare-pages',
  'vercel',
  'netlify',
] as const;