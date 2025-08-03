import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against Zod schemas
 */
export function validateRequest(schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Invalid input format',
            details: {
              issues: error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          },
        });
      }

      next(error);
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().cuid('Invalid ID format'),
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Search query validation
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    category: z.string().optional(),
    tags: z.string().transform(val => val.split(',')).pipe(z.array(z.string())).optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1, 'Filename is required'),
    mimetype: z.string().regex(/^(image|video|audio)\//, 'Invalid file type'),
    size: z.number().max(10 * 1024 * 1024, 'File size too large (max 10MB)'),
  }),
};

/**
 * Database model validation schemas
 * These extend the shared schemas with additional backend-specific validation
 */
export const dbSchemas = {
  // User creation with password hashing
  createUser: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'ADMIN']).default('USER'),
  }),

  // User update (all fields optional)
  updateUser: z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long').optional(),
    profileImage: z.string().url('Invalid image URL').optional(),
    settings: z.object({
      notifications: z.object({
        email: z.boolean(),
        push: z.boolean(),
      }),
      privacy: z.object({
        profilePublic: z.boolean(),
        projectsPublic: z.boolean(),
      }),
    }).optional(),
  }),

  // Project creation
  createProject: z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
    category: z.string().min(1, 'Category is required'),
  }),

  // Project update
  updateProject: z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    status: z.enum(['DRAFT', 'DEVELOPING', 'DEPLOYED', 'ARCHIVED']).optional(),
    aiModel: z.object({
      type: z.enum(['teachable-machine', 'huggingface', 'custom']),
      modelUrl: z.string().url('Invalid model URL'),
      modelId: z.string().min(1, 'Model ID is required'),
      configuration: z.record(z.any()),
    }).optional(),
    deployment: z.object({
      platform: z.enum(['cloudflare-pages', 'vercel', 'netlify']),
      repositoryUrl: z.string().url('Invalid repository URL'),
      deploymentUrl: z.string().url('Invalid deployment URL').optional(),
      lastDeployedAt: z.string().datetime().optional(),
    }).optional(),
    revenue: z.object({
      adsenseEnabled: z.boolean(),
      adsensePublisherId: z.string().optional(),
      adUnits: z.array(z.object({
        id: z.string(),
        name: z.string(),
        position: z.string(),
        size: z.string(),
        code: z.string(),
      })),
    }).optional(),
  }),

  // Community post creation
  createCommunityPost: z.object({
    type: z.enum(['QUESTION', 'SHOWCASE', 'DISCUSSION']),
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    content: z.string().min(20, 'Content must be at least 20 characters').max(10000, 'Content too long'),
    tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
    projectId: z.string().cuid('Invalid project ID').optional(),
  }),

  // Comment creation
  createComment: z.object({
    content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  }),

  // Vote creation
  createVote: z.object({
    value: z.number().int().min(-1).max(1), // -1 for downvote, 1 for upvote
  }),

  // Template creation (admin only)
  createTemplate: z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
    category: z.string().min(1, 'Category is required'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
    codeTemplate: z.string().min(1, 'Code template is required'),
    aiModelType: z.string().min(1, 'AI model type is required'),
    previewImages: z.array(z.string().url('Invalid image URL')),
  }),
};

/**
 * Utility function to safely parse data with Zod schema
 */
export function safeParseData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: z.ZodError;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}