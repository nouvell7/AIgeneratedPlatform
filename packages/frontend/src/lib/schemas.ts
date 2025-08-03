import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

export const registerSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, '프로젝트 이름을 입력해주세요'),
  description: z.string().optional(),
  templateId: z.string().optional(),
  aiModelUrl: z.string().url('유효한 URL을 입력해주세요').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, '프로젝트 이름을 입력해주세요').optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'development', 'deployed', 'archived']).optional(),
});

// AI Model schemas
export const aiModelSchema = z.object({
  name: z.string().min(1, '모델 이름을 입력해주세요'),
  url: z.string().url('유효한 URL을 입력해주세요'),
  type: z.enum(['teachable-machine', 'custom']),
  description: z.string().optional(),
});

// Deployment schemas
export const deploymentConfigSchema = z.object({
  platform: z.enum(['cloudflare', 'vercel', 'netlify']),
  domain: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
});

// Revenue schemas
export const revenueSettingsSchema = z.object({
  enableAds: z.boolean(),
  adSensePublisherId: z.string().optional(),
  adPlacements: z.array(z.enum(['header', 'sidebar', 'content', 'footer'])),
  adDensity: z.enum(['low', 'medium', 'high']),
});

// Community schemas
export const communityPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  type: z.enum(['question', 'discussion', 'showcase', 'tutorial']),
  tags: z.array(z.string()),
});

export const commentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요'),
  parentId: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AIModelInput = z.infer<typeof aiModelSchema>;
export type DeploymentConfigInput = z.infer<typeof deploymentConfigSchema>;
export type RevenueSettingsInput = z.infer<typeof revenueSettingsSchema>;
export type CommunityPostInput = z.infer<typeof communityPostSchema>;
export type CommentInput = z.infer<typeof commentSchema>;