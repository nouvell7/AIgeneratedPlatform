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
  app.get('/api/templates/popular', controller.getPopular);
  app.get('/api/templates/featured', controller.getFeatured);
  app.get('/api/templates/search', ...controller.searchTemplates);
  app.get('/api/templates/:id', ...controller.getTemplate);
  app.post('/api/projects/from-template/:id', ...controller.createFromTemplate);

  return app;
};

describe('Template Controller Integration Tests', () => {
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
            description: 'A real-time chat application',
            category: 'web',
            difficulty: 'intermediate',
            tags: ['react', 'websocket'],
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

describe('GET /api/templates/popular', () => {
    it('인기 템플릿 조회 성공', async () => {
      // Given
      const mockPopularTemplates = [
        {
          id: 'popular-1',
          name: 'Popular Template',
          usageCount: 500,
          rating: 4.8,
        },
      ];
      mockTemplateService.getPopularTemplates.mockResolvedValue(mockPopularTemplates);

      // When
      const response = await request(app)
        .get('/api/templates/popular')
        .query({ limit: 3 });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toEqual(mockPopularTemplates);
      expect(mockTemplateService.getPopularTemplates).toHaveBeenCalledWith(3);
    });
  });

  describe('GET /api/templates/featured', () => {
    it('추천 템플릿 조회 성공', async () => {
      // Given
      const mockFeaturedTemplates = [
        {
          id: 'featured-1',
          name: 'Featured Template',
          rating: 4.9,
          usageCount: 200,
        },
      ];
      mockTemplateService.getFeaturedTemplates.mockResolvedValue(mockFeaturedTemplates);

      // When
      const response = await request(app)
        .get('/api/templates/featured');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toEqual(mockFeaturedTemplates);
      expect(mockTemplateService.getFeaturedTemplates).toHaveBeenCalledWith(6);
    });
  });

  describe('GET /api/templates/search', () => {
    it('템플릿 검색 성공', async () => {
      // Given
      const mockSearchResult = {
        templates: [
          {
            id: 'search-1',
            name: 'React Template',
            description: 'React based template',
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockTemplateService.searchTemplates.mockResolvedValue(mockSearchResult);

      // When
      const response = await request(app)
        .get('/api/templates/search')
        .query({ q: 'react', category: 'web', page: 1, limit: 10 });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toEqual(mockSearchResult.templates);
      expect(response.body.data.query).toBe('react');
      expect(mockTemplateService.searchTemplates).toHaveBeenCalledWith(
        'react',
        { category: 'web' },
        { page: 1, limit: 10 }
      );
    });
  });

describe('POST /api/projects/from-template/:id', () => {
    it('템플릿으로부터 프로젝트 생성 성공', async () => {
      // Given
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        description: 'Template description',
        category: 'web',
        codeTemplate: 'template code',
      };
      const mockProject = {
        id: 'project-123',
        name: 'My New Project',
        description: 'Template description',
        category: 'web',
        userId: 'test-user-id',
      };

      mockTemplateService.getTemplateById.mockResolvedValue(mockTemplate);
      mockProjectService.createProject.mockResolvedValue(mockProject);
      mockTemplateService.incrementUsageCount.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .post('/api/projects/from-template/template-123')
        .send({
          name: 'My New Project',
          description: 'Custom description',
        });

      // Then
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project).toEqual(mockProject);
      expect(response.body.data.template).toMatchObject({
        id: mockTemplate.id,
        name: mockTemplate.name,
        codeTemplate: mockTemplate.codeTemplate,
      });
      expect(response.body.message).toBe('Project created from template successfully');

      expect(mockTemplateService.getTemplateById).toHaveBeenCalledWith('template-123');
      expect(mockProjectService.createProject).toHaveBeenCalledWith('test-user-id', {
        name: 'My New Project',
        description: 'Custom description',
        category: 'web',
      });
      expect(mockTemplateService.incrementUsageCount).toHaveBeenCalledWith('template-123');
    });
  });
});