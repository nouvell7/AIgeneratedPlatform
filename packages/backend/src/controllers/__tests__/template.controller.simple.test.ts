import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { TemplateService } from '../../services/template.service';
import { ProjectService } from '../../services/project.service';
import { TemplateController } from '../template.controller';

// Mock the services
const mockTemplateService = {
  getTemplates: jest.fn(),
  getTemplateById: jest.fn(),
  getCategories: jest.fn(),
  getPopularTemplates: jest.fn(),
  getFeaturedTemplates: jest.fn(),
  searchTemplates: jest.fn(),
  incrementUsageCount: jest.fn(),
};

const mockProjectService = {
  createProject: jest.fn(),
};

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  });

  const controller = new TemplateController();

  // Template routes
  app.get('/api/templates', ...controller.getTemplates);
  app.get('/api/templates/categories', controller.getCategories);
  app.get('/api/templates/:id', ...controller.getTemplate);

  return app;
};

describe('Template Controller Simple Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    container.clearInstances();
    container.registerInstance(TemplateService, mockTemplateService as any);
    container.registerInstance(ProjectService, mockProjectService as any);
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/templates', () => {
    it('템플릿 목록 조회 성공', async () => {
      // Given
      const mockResult = {
        templates: [
          {
            id: 'template-1',
            name: 'React Chat App',
            category: 'web',
            difficulty: 'intermediate',
            usageCount: 150,
            rating: 4.5,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockTemplateService.getTemplates.mockResolvedValue(mockResult);

      // When
      const response = await request(app)
        .get('/api/templates')
        .query({ page: 1, limit: 12 });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toEqual(mockResult.templates);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        total: 1,
        totalPages: 1,
        hasMore: false,
      });
    });
  });

  describe('GET /api/templates/:id', () => {
    it('템플릿 상세 조회 성공', async () => {
      // Given
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        description: 'Test description',
        category: 'web',
        difficulty: 'beginner',
        tags: ['test'],
        codeTemplate: 'test code',
        usageCount: 10,
        rating: 4.0,
      };
      mockTemplateService.getTemplateById.mockResolvedValue(mockTemplate);

      // When
      const response = await request(app)
        .get('/api/templates/template-123');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toEqual(mockTemplate);
      expect(mockTemplateService.getTemplateById).toHaveBeenCalledWith('template-123');
    });
  });

  describe('GET /api/templates/categories', () => {
    it('템플릿 카테고리 조회 성공', async () => {
      // Given
      const mockCategories = [
        { category: 'web', count: 15 },
        { category: 'ml', count: 8 },
      ];
      mockTemplateService.getCategories.mockResolvedValue(mockCategories);

      // When
      const response = await request(app)
        .get('/api/templates/categories');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toEqual(mockCategories);
    });
  });
});