import 'reflect-metadata';
import { TemplateService } from '../template.service';
import { NotFoundError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    template: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = require('../../lib/prisma').prisma;

describe('TemplateService', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'React Chat App',
        description: 'A real-time chat application built with React',
        category: 'web',
        difficulty: 'intermediate',
        tags: '["react", "websocket", "chat"]',
        codeTemplate: 'template code here',
        aiModelType: 'teachable-machine',
        previewImages: '["image1.jpg", "image2.jpg"]',
        usageCount: 150,
        rating: 4.5,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      {
        id: 'template-2',
        name: 'Python ML Model',
        description: 'Machine learning model template',
        category: 'ml',
        difficulty: 'advanced',
        tags: '["python", "ml", "tensorflow"]',
        codeTemplate: 'python template code',
        aiModelType: 'hugging-face',
        previewImages: '["ml1.jpg"]',
        usageCount: 89,
        rating: 4.2,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
      },
    ];

    it('필터 없이 템플릿 목록 조회 성공', async () => {
      // Given
      mockPrisma.template.findMany.mockResolvedValue(mockTemplates);
      mockPrisma.template.count.mockResolvedValue(2);

      // When
      const result = await templateService.getTemplates();

      // Then
      expect(result).toEqual({
        templates: [
          {
            ...mockTemplates[0],
            tags: ['react', 'websocket', 'chat'],
            previewImages: ['image1.jpg', 'image2.jpg'],
          },
          {
            ...mockTemplates[1],
            tags: ['python', 'ml', 'tensorflow'],
            previewImages: ['ml1.jpg'],
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      });

      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 12,
        skip: 0,
      });
    });

    it('카테고리 필터로 템플릿 조회 성공', async () => {
      // Given
      const webTemplates = [mockTemplates[0]];
      mockPrisma.template.findMany.mockResolvedValue(webTemplates);
      mockPrisma.template.count.mockResolvedValue(1);

      // When
      const result = await templateService.getTemplates(
        { category: 'web' },
        { page: 1, limit: 10 }
      );

      // Then
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].category).toBe('web');
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: { category: 'web' },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
        skip: 0,
      });
    });

    it('검색어로 템플릿 조회 성공', async () => {
      // Given
      mockPrisma.template.findMany.mockResolvedValue([mockTemplates[0]]);
      mockPrisma.template.count.mockResolvedValue(1);

      // When
      const result = await templateService.getTemplates(
        { search: 'chat' }
      );

      // Then
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'chat', mode: 'insensitive' } },
            { description: { contains: 'chat', mode: 'insensitive' } },
          ],
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 12,
        skip: 0,
      });
    });

    it('태그 필터로 템플릿 조회 성공', async () => {
      // Given
      mockPrisma.template.findMany.mockResolvedValue([mockTemplates[0]]);
      mockPrisma.template.count.mockResolvedValue(1);

      // When
      const result = await templateService.getTemplates(
        { tags: ['react', 'websocket'] }
      );

      // Then
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            hasSome: ['react', 'websocket'],
          },
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 12,
        skip: 0,
      });
    });

    it('페이지네이션으로 템플릿 조회 성공', async () => {
      // Given
      mockPrisma.template.findMany.mockResolvedValue([mockTemplates[1]]);
      mockPrisma.template.count.mockResolvedValue(2);

      // When
      const result = await templateService.getTemplates(
        {},
        { page: 2, limit: 1 }
      );

      // Then
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 1,
        skip: 1,
      });
    });
  });

  describe('getTemplateById', () => {
    const templateId = 'template-123';

    it('템플릿 ID로 조회 성공', async () => {
      // Given
      const mockTemplate = {
        id: templateId,
        name: 'Test Template',
        description: 'Test description',
        category: 'web',
        difficulty: 'beginner',
        tags: '["test", "example"]',
        codeTemplate: 'test code',
        aiModelType: 'teachable-machine',
        previewImages: '["test.jpg"]',
        usageCount: 10,
        rating: 4.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);

      // When
      const result = await templateService.getTemplateById(templateId);

      // Then
      expect(result).toEqual({
        ...mockTemplate,
        tags: ['test', 'example'],
        previewImages: ['test.jpg'],
      });
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: templateId },
      });
    });

    it('존재하지 않는 템플릿 조회 시 NotFoundError 발생', async () => {
      // Given
      mockPrisma.template.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(templateService.getTemplateById(templateId))
        .rejects.toThrow(NotFoundError);
      await expect(templateService.getTemplateById(templateId))
        .rejects.toThrow('Template');
    });
  });

  describe('getCategories', () => {
    it('템플릿 카테고리 목록 조회 성공', async () => {
      // Given
      const mockCategories = [
        {
          category: 'web',
          _count: { category: 15 },
        },
        {
          category: 'ml',
          _count: { category: 8 },
        },
        {
          category: 'mobile',
          _count: { category: 5 },
        },
      ];

      mockPrisma.template.groupBy.mockResolvedValue(mockCategories);

      // When
      const result = await templateService.getCategories();

      // Then
      expect(result).toEqual([
        { category: 'web', count: 15 },
        { category: 'ml', count: 8 },
        { category: 'mobile', count: 5 },
      ]);
      expect(mockPrisma.template.groupBy).toHaveBeenCalledWith({
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
    });
  });

  describe('getPopularTemplates', () => {
    it('인기 템플릿 목록 조회 성공', async () => {
      // Given
      const mockPopularTemplates = [
        {
          id: 'popular-1',
          name: 'Popular Template 1',
          description: 'Most used template',
          category: 'web',
          difficulty: 'intermediate',
          tags: '["popular", "trending"]',
          codeTemplate: 'popular code',
          aiModelType: 'teachable-machine',
          previewImages: '["popular1.jpg"]',
          usageCount: 500,
          rating: 4.8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.template.findMany.mockResolvedValue(mockPopularTemplates);

      // When
      const result = await templateService.getPopularTemplates(3);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockPopularTemplates[0],
        tags: ['popular', 'trending'],
        previewImages: ['popular1.jpg'],
      });
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
        ],
        take: 3,
      });
    });

    it('기본 limit으로 인기 템플릿 조회', async () => {
      // Given
      mockPrisma.template.findMany.mockResolvedValue([]);

      // When
      await templateService.getPopularTemplates();

      // Then
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
        ],
        take: 6,
      });
    });
  });

  describe('getFeaturedTemplates', () => {
    it('추천 템플릿 목록 조회 성공', async () => {
      // Given
      const mockFeaturedTemplates = [
        {
          id: 'featured-1',
          name: 'Featured Template 1',
          description: 'High rated template',
          category: 'web',
          difficulty: 'advanced',
          tags: '["featured", "quality"]',
          codeTemplate: 'featured code',
          aiModelType: 'hugging-face',
          previewImages: '["featured1.jpg"]',
          usageCount: 200,
          rating: 4.9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.template.findMany.mockResolvedValue(mockFeaturedTemplates);

      // When
      const result = await templateService.getFeaturedTemplates(4);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockFeaturedTemplates[0],
        tags: ['featured', 'quality'],
        previewImages: ['featured1.jpg'],
      });
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          rating: {
            gte: 4.0,
          },
        },
        orderBy: [
          { rating: 'desc' },
          { usageCount: 'desc' },
        ],
        take: 4,
      });
    });
  });

  describe('incrementUsageCount', () => {
    it('템플릿 사용 횟수 증가 성공', async () => {
      // Given
      const templateId = 'template-123';
      mockPrisma.template.update.mockResolvedValue({});

      // When
      await templateService.incrementUsageCount(templateId);

      // Then
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('searchTemplates', () => {
    it('템플릿 검색 성공', async () => {
      // Given
      const mockSearchResults = [
        {
          id: 'search-1',
          name: 'Search Result',
          description: 'Found template',
          category: 'web',
          difficulty: 'beginner',
          tags: '["search", "result"]',
          codeTemplate: 'search code',
          aiModelType: 'teachable-machine',
          previewImages: '["search1.jpg"]',
          usageCount: 25,
          rating: 4.1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.template.findMany.mockResolvedValue(mockSearchResults);
      mockPrisma.template.count.mockResolvedValue(1);

      // When
      const result = await templateService.searchTemplates(
        'react',
        { category: 'web', difficulty: 'beginner' },
        { page: 1, limit: 5 }
      );

      // Then
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]).toEqual({
        ...mockSearchResults[0],
        tags: ['search', 'result'],
        previewImages: ['search1.jpg'],
      });
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          category: 'web',
          difficulty: 'beginner',
          OR: [
            { name: { contains: 'react', mode: 'insensitive' } },
            { description: { contains: 'react', mode: 'insensitive' } },
          ],
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5,
        skip: 0,
      });
    });
  });
});