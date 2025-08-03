import { prisma } from '../lib/prisma';
import { SuccessStory } from '@prisma/client';

export class SuccessStoryService {
  /**
   * Get all success stories
   */
  static async getSuccessStories(
    filters?: {
      category?: string;
      search?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    stories: SuccessStory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [stories, total] = await Promise.all([
      prisma.successStory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.successStory.count({ where: whereClause }),
    ]);

    return {
      stories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get success story by ID
   */
  static async getSuccessStoryById(storyId: string): Promise<SuccessStory> {
    const story = await prisma.successStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('Success story not found');
    }

    return story;
  }

  /**
   * Get success stories by category
   */
  static async getStoriesByCategory(category: string): Promise<SuccessStory[]> {
    return prisma.successStory.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get featured success stories
   */
  static async getFeaturedStories(limit: number = 3): Promise<SuccessStory[]> {
    return prisma.successStory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default SuccessStoryService;