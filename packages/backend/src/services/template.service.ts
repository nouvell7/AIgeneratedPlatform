import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';
import { Template } from '@prisma/client';

export class TemplateService {
  /**
   * Get all templates with filtering and pagination
   */
  static async getTemplates(
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

    return {
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(templateId: string): Promise<Template> {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Template');
    }

    return template;
  }

  /**
   * Get template categories
   */
  static async getCategories(): Promise<Array<{
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

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
    }));
  }

  /**
   * Get popular templates
   */
  static async getPopularTemplates(limit: number = 6): Promise<Template[]> {
    return prisma.template.findMany({
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Get featured templates
   */
  static async getFeaturedTemplates(limit: number = 6): Promise<Template[]> {
    return prisma.template.findMany({
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
  }

  /**
   * Increment template usage count
   */
  static async incrementUsageCount(templateId: string): Promise<void> {
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
  static async searchTemplates(
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

export default TemplateService;