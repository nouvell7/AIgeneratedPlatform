import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client'; // Import Prisma for types

// Manually define the Template interface to ensure compatibility
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string | null; // Stored as JSON string
  codeTemplate: string;
  aiModelType: string;
  previewImages: string | null; // Stored as JSON string
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class TemplateService {
  /**
   * Get all templates with filtering and pagination
   */
  async getTemplates(
    filters?: {
      category?: string;
      difficulty?: string;
      search?: string;
      tags?: string[];
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    templates: Template[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 12 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.difficulty) {
      whereClause.difficulty = filters.difficulty;
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereClause.tags = {
        hasSome: filters.tags,
      };
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where: whereClause,
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.template.count({ where: whereClause }),
    ]);

    // Parse JSON fields
    const parsedTemplates = templates.map((template: Template) => ({
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      previewImages: template.previewImages ? JSON.parse(template.previewImages) : [],
    }));

    return {
      templates: parsedTemplates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<Template> {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Template');
    }

    // Parse JSON fields
    const parsedTemplate = {
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      previewImages: template.previewImages ? JSON.parse(template.previewImages) : [],
    };

    return parsedTemplate;
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<Array<{
    category: string;
    count: number;
  }>> {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    return categories.map((cat: { category: string; _count: { category: number; }; }) => ({
      category: cat.category,
      count: cat._count.category,
    }));
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 6): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    });

    // Parse JSON fields
    return templates.map((template: Template) => ({
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      previewImages: template.previewImages ? JSON.parse(template.previewImages) : [],
    }));
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit: number = 6): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: {
        rating: {
          gte: 4.0,
        },
      },
      orderBy: [
        { rating: 'desc' },
        { usageCount: 'desc' },
      ],
      take: limit,
    });

    // Parse JSON fields
    return templates.map((template: Template) => ({
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      previewImages: template.previewImages ? JSON.parse(template.previewImages) : [],
    }));
  }

  /**
   * Increment template usage count
   */
  async incrementUsageCount(templateId: string): Promise<void> {
    await prisma.template.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Search templates
   */
  async searchTemplates(
    query: string,
    filters?: {
      category?: string;
      difficulty?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    templates: Template[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.getTemplates(
      {
        search: query,
        ...filters,
      },
      pagination
    );
  }
}
