// API 관련 상수
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  PROJECTS: '/api/projects',
  TEMPLATES: '/api/templates',
  COMMUNITY: '/api/community',
  REVENUE: '/api/revenue',
  CODESPACES: '/api/codespaces',
  DEPLOYMENT: '/api/deployment',
  AI_MODELS: '/api/ai-models',
  USERS: '/api/users',
  SUCCESS_STORIES: '/api/success-stories',
} as const;

// 프로젝트 상태
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  DEVELOPING: 'developing',
  DEPLOYED: 'deployed',
  ARCHIVED: 'archived',
} as const;

// 프로젝트 타입
export const PROJECT_TYPE = {
  LOW_CODE: 'LOW_CODE',
  NO_CODE: 'NO_CODE',
} as const;

// AI 모델 타입
export const AI_MODEL_TYPE = {
  TEACHABLE_MACHINE: 'teachable-machine',
  HUGGINGFACE: 'huggingface',
  CUSTOM: 'custom',
} as const;

// 배포 플랫폼
export const DEPLOYMENT_PLATFORM = {
  CLOUDFLARE: 'cloudflare-pages',
  VERCEL: 'vercel',
  NETLIFY: 'netlify',
} as const;

// 커뮤니티 게시글 타입
export const COMMUNITY_POST_TYPE = {
  QUESTION: 'question',
  SHOWCASE: 'showcase',
  DISCUSSION: 'discussion',
  TUTORIAL: 'tutorial',
} as const;

// 템플릿 난이도
export const TEMPLATE_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// 사용자 역할
export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// 파일 업로드 제한
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/json', 'text/plain'],
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// 테마
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// 언어
export const LANGUAGE = {
  KO: 'ko',
  EN: 'en',
} as const;