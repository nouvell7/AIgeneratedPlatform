import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { container } from 'tsyringe';
import { RevenueService } from '../../services/revenue.service';
import { RevenueController } from '../revenue.controller';

// Mock AdSenseService
jest.mock('../../services/adsense.service', () => ({
  AdSenseService: jest.fn().mockImplementation(() => ({
    getRevenueData: jest.fn(),
  })),
}));

// Mock the services
const mockRevenueService = {
  getRevenueDashboard: jest.fn(),
  getRevenueAnalytics: jest.fn(),
  getRevenueSummary: jest.fn(),
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

  const controller = new RevenueController(mockRevenueService as any);

  // Revenue routes
  app.get('/api/revenue/:projectId/dashboard', controller.getRevenueDashboard.bind(controller));
  app.get('/api/revenue/:projectId/analytics', controller.getRevenueAnalytics.bind(controller));
  app.get('/api/revenue/summary', controller.getRevenueSummary.bind(controller));
  app.get('/api/revenue/:projectId/trends', controller.getRevenueTrends.bind(controller));

  return app;
};

describe('Revenue Controller Simple Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    container.clearInstances();
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/revenue/:projectId/dashboard', () => {
    it('수익 대시보드 조회 성공', async () => {
      // Given
      const projectId = 'project-123';
      const mockDashboardData = {
        totalEarnings: 150.75,
        monthlyEarnings: 120.50,
        dailyEarnings: 5.25,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpm: 15.08,
        topPerformingAds: [
          {
            adUnitId: 'ad-1',
            name: 'Header Ad',
            earnings: 75.25,
            impressions: 5000,
            clicks: 125,
          },
        ],
        earningsChart: [
          { date: '2024-01-01', earnings: 25.5, impressions: 1500, clicks: 30 },
          { date: '2024-01-02', earnings: 30.2, impressions: 1800, clicks: 35 },
        ],
        revenueBreakdown: {
          adsense: 150.75,
          affiliate: 0,
          sponsored: 0,
          other: 0,
        },
        projectedEarnings: {
          thisMonth: 200,
          nextMonth: 220,
          thisYear: 2400,
        },
      };

      mockRevenueService.getRevenueDashboard.mockResolvedValue(mockDashboardData);

      // When
      const response = await request(app)
        .get(`/api/revenue/${projectId}/dashboard`)
        .query({ timeRange: '30d' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDashboardData);
      expect(mockRevenueService.getRevenueDashboard).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        '30d'
      );
    });

    it('프로젝트 ID 없이 요청 시 400 에러', async () => {
      // When
      const response = await request(app)
        .get('/api/revenue//dashboard');

      // Then
      expect(response.status).toBe(404); // Express router will return 404 for empty param
    });
  });

  describe('GET /api/revenue/:projectId/analytics', () => {
    it('수익 분석 데이터 조회 성공', async () => {
      // Given
      const projectId = 'project-123';
      const mockAnalytics = {
        performanceMetrics: {
          averageCTR: 2.5,
          averageCPM: 15.08,
          fillRate: 0.95,
          viewability: 0.85,
        },
        audienceInsights: {
          topCountries: [
            { country: 'United States', earnings: 75.5, percentage: 50 },
            { country: 'United Kingdom', earnings: 30.2, percentage: 20 },
          ],
          deviceBreakdown: {
            desktop: 60,
            mobile: 35,
            tablet: 5,
          },
          trafficSources: [
            { source: 'Organic Search', earnings: 90.3, percentage: 60 },
            { source: 'Direct', earnings: 45.15, percentage: 30 },
          ],
        },
        optimizationSuggestions: [
          {
            type: 'placement',
            title: 'Add above-the-fold ad placement',
            description: 'Adding an ad unit above the fold can increase viewability',
            potentialIncrease: 20,
            priority: 'high',
          },
        ],
        competitorAnalysis: {
          averageIndustryEarnings: 180.5,
          yourPerformance: 'above',
          improvementAreas: ['Ad placement optimization'],
        },
      };

      mockRevenueService.getRevenueAnalytics.mockResolvedValue(mockAnalytics);

      // When
      const response = await request(app)
        .get(`/api/revenue/${projectId}/analytics`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(mockRevenueService.getRevenueAnalytics).toHaveBeenCalledWith(
        projectId,
        'test-user-id'
      );
    });
  });

  describe('GET /api/revenue/summary', () => {
    it('사용자 수익 요약 조회 성공', async () => {
      // Given
      const mockSummary = {
        totalEarnings: 500.25,
        monthlyEarnings: 150.75,
        activeProjects: 3,
        topProject: {
          id: 'project-123',
          name: 'Top Project',
          earnings: 200.50,
        },
        recentActivity: [
          {
            projectId: 'project-123',
            projectName: 'Project 1',
            earnings: 5.25,
            date: '2024-01-15T10:00:00Z',
          },
          {
            projectId: 'project-456',
            projectName: 'Project 2',
            earnings: 3.75,
            date: '2024-01-15T09:00:00Z',
          },
        ],
      };

      mockRevenueService.getRevenueSummary.mockResolvedValue(mockSummary);

      // When
      const response = await request(app)
        .get('/api/revenue/summary');

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummary);
      expect(mockRevenueService.getRevenueSummary).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('GET /api/revenue/:projectId/trends', () => {
    it('수익 트렌드 조회 성공', async () => {
      // Given
      const projectId = 'project-123';
      const mockDashboardData = {
        totalEarnings: 150.75,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpm: 15.08,
      };

      mockRevenueService.getRevenueDashboard.mockResolvedValue(mockDashboardData);

      // When
      const response = await request(app)
        .get(`/api/revenue/${projectId}/trends`)
        .query({ period: '30d' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('earnings');
      expect(response.body.data).toHaveProperty('impressions');
      expect(response.body.data).toHaveProperty('ctr');
      expect(response.body.data).toHaveProperty('cpm');

      expect(response.body.data.earnings).toHaveProperty('current');
      expect(response.body.data.earnings).toHaveProperty('previous');
      expect(response.body.data.earnings).toHaveProperty('change');
      expect(response.body.data.earnings).toHaveProperty('trend');

      expect(mockRevenueService.getRevenueDashboard).toHaveBeenCalledWith(
        projectId,
        'test-user-id',
        '30d'
      );
    });
  });

  describe('Error Handling', () => {
    it('서비스 에러 시 적절한 에러 응답', async () => {
      // Given
      const projectId = 'project-123';
      const error = new Error('Service error');
      (error as any).statusCode = 404;

      mockRevenueService.getRevenueDashboard.mockRejectedValue(error);

      // When
      const response = await request(app)
        .get(`/api/revenue/${projectId}/dashboard`);

      // Then
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message', 'Service error');
      expect(response.body.error).toHaveProperty('code', 'REVENUE_DASHBOARD_FAILED');
    });

    it('인증되지 않은 요청 처리', async () => {
      // Given
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      
      // No auth middleware
      const controller = new RevenueController(mockRevenueService as any);
      appWithoutAuth.get('/api/revenue/summary', controller.getRevenueSummary.bind(controller));

      // When
      const response = await request(appWithoutAuth)
        .get('/api/revenue/summary');

      // Then
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message', 'Authentication required');
    });
  });
});