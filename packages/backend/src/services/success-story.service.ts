import { injectable } from 'tsyringe'; // injectable 임포트
import { prisma } from '../lib/prisma';
import { SuccessStory } from '@prisma/client';

@injectable() // injectable 데코레이터 추가
export class SuccessStoryService {
  /**
   * Get all success stories
   */
  async getSuccessStories( // static 제거
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
  async getSuccessStoryById(storyId: string): Promise<SuccessStory> { // static 제거
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
  async getStoriesByCategory(category: string): Promise<SuccessStory[]> { // static 제거
    return prisma.successStory.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get featured success stories
   */
  async getFeaturedStories(limit: number = 3): Promise<SuccessStory[]> { // static 제거
    return prisma.successStory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default SuccessStoryService;
