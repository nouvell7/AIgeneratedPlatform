import 'reflect-metadata';
import { RevenueService } from '../revenue.service';
import { AppError } from '../../utils/errors';

// Mock AdSenseService
jest.mock('../adsense.service', () => ({
  AdSenseService: jest.fn().mockImplementation(() => ({
    getRevenueData: jest.fn(),
  })),
}));

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockPrisma = require('../../lib/prisma').prisma;

const mockAdSenseService = {
  getRevenueData: jest.fn(),
};

describe('RevenueService', () => {
  let revenueService: RevenueService;

  beforeEach(() => {
    revenueService = new RevenueService(mockAdSenseService as any);
    jest.clearAllMocks();
  });

  describe('getRevenueDashboard', () => {
    const projectId = 'project-123';
    const userId = 'user-123';

    it('AdSense가 활성화된 프로젝트의 대시보드 데이터 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        revenue: JSON.stringify({
          adsenseEnabled: true,
          adsenseConfig: {
            adUnits: [
              { id: 'ad-1', name: 'Header Ad' },
              { id: 'ad-2', name: 'Sidebar Ad' },
            ],
          },
        }),
      };

      const mockRevenueData = {
        totalEarnings: 150.75,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpm: 15.08,
        dailyData: [
          { date: '2024-01-01', earnings: 25.5, impressions: 1500, clicks: 30 },
          { date: '2024-01-02', earnings: 30.2, impressions: 1800, clicks: 35 },
        ],
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockAdSenseService.getRevenueData.mockResolvedValue(mockRevenueData);

      // When
      const result = await revenueService.getRevenueDashboard(projectId, userId);

      // Then
      expect(result).toMatchObject({
        totalEarnings: 150.75,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpm: 15.08,
        earningsChart: mockRevenueData.dailyData,
      });
      expect(result.topPerformingAds).toHaveLength(2);
      expect(result.revenueBreakdown.adsense).toBe(150.75);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });

    it('AdSense가 비활성화된 프로젝트의 빈 대시보드 반환', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
        revenue: JSON.stringify({
          adsenseEnabled: false,
        }),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When
      const result = await revenueService.getRevenueDashboard(projectId, userId);

      // Then
      expect(result).toMatchObject({
        totalEarnings: 0,
        monthlyEarnings: 0,
        dailyEarnings: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        topPerformingAds: [],
        earningsChart: [],
      });
      expect(mockAdSenseService.getRevenueData).not.toHaveBeenCalled();
    });

    it('존재하지 않는 프로젝트 조회 시 AppError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(revenueService.getRevenueDashboard(projectId, userId))
        .rejects.toThrow(new AppError('Project not found', 404));
    });

    it('다른 사용자의 프로젝트 조회 시 AppError 발생', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId: 'other-user',
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When & Then
      await expect(revenueService.getRevenueDashboard(projectId, userId))
        .rejects.toThrow(new AppError('You can only view revenue data for your own projects', 403));
    });

    it('다양한 시간 범위로 대시보드 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        revenue: JSON.stringify({ adsenseEnabled: true, adsenseConfig: { adUnits: [] } }),
      };

      const mockRevenueData = {
        totalEarnings: 100,
        impressions: 5000,
        clicks: 100,
        ctr: 2.0,
        cpm: 20,
        dailyData: [],
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockAdSenseService.getRevenueData.mockResolvedValue(mockRevenueData);

      // When
      await revenueService.getRevenueDashboard(projectId, userId, '7d');
      await revenueService.getRevenueDashboard(projectId, userId, '90d');
      await revenueService.getRevenueDashboard(projectId, userId, '1y');

      // Then
      expect(mockAdSenseService.getRevenueData).toHaveBeenCalledTimes(3);
    });
  });

  describe('getRevenueAnalytics', () => {
    const projectId = 'project-123';
    const userId = 'user-123';

    it('수익 분석 데이터 조회 성공', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId,
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When
      const result = await revenueService.getRevenueAnalytics(projectId, userId);

      // Then
      expect(result).toHaveProperty('performanceMetrics');
      expect(result).toHaveProperty('audienceInsights');
      expect(result).toHaveProperty('optimizationSuggestions');
      expect(result).toHaveProperty('competitorAnalysis');

      expect(result.performanceMetrics).toHaveProperty('averageCTR');
      expect(result.performanceMetrics).toHaveProperty('averageCPM');
      expect(result.performanceMetrics).toHaveProperty('fillRate');
      expect(result.performanceMetrics).toHaveProperty('viewability');

      expect(result.audienceInsights.topCountries).toHaveLength(5);
      expect(result.audienceInsights.topCountries[0]).toHaveProperty('country');
      expect(result.audienceInsights.topCountries[0]).toHaveProperty('earnings');
      expect(result.audienceInsights.topCountries[0]).toHaveProperty('percentage');

      expect(result.optimizationSuggestions.length).toBeGreaterThan(0);
      expect(result.optimizationSuggestions[0]).toHaveProperty('type');
      expect(result.optimizationSuggestions[0]).toHaveProperty('title');
      expect(result.optimizationSuggestions[0]).toHaveProperty('description');
      expect(result.optimizationSuggestions[0]).toHaveProperty('potentialIncrease');
      expect(result.optimizationSuggestions[0]).toHaveProperty('priority');
    });

    it('존재하지 않는 프로젝트 분석 시 AppError 발생', async () => {
      // Given
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(revenueService.getRevenueAnalytics(projectId, userId))
        .rejects.toThrow(new AppError('Project not found', 404));
    });

    it('다른 사용자의 프로젝트 분석 시 AppError 발생', async () => {
      // Given
      const mockProject = {
        id: projectId,
        userId: 'other-user',
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      // When & Then
      await expect(revenueService.getRevenueAnalytics(projectId, userId))
        .rejects.toThrow(new AppError('You can only view analytics for your own projects', 403));
    });
  });

  describe('getRevenueSummary', () => {
    const userId = 'user-123';

    it('사용자의 전체 수익 요약 조회 성공', async () => {
      // Given
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          userId,
          revenue: JSON.stringify({
            adsenseEnabled: true,
            adsenseConfig: { adUnits: [] },
          }),
        },
        {
          id: 'project-2',
          name: 'Project 2',
          userId,
          revenue: JSON.stringify({
            adsenseEnabled: true,
            adsenseConfig: { adUnits: [] },
          }),
        },
        {
          id: 'project-3',
          name: 'Project 3',
          userId,
          revenue: JSON.stringify({
            adsenseEnabled: false,
          }),
        },
      ];

      const mockRevenueData = {
        totalEarnings: 100,
        monthlyEarnings: 80,
        dailyEarnings: 3.33,
        impressions: 5000,
        clicks: 100,
        ctr: 2.0,
        cpm: 20,
        dailyData: [],
      };

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockAdSenseService.getRevenueData.mockResolvedValue(mockRevenueData);

      // Mock getRevenueDashboard method
      jest.spyOn(revenueService, 'getRevenueDashboard').mockResolvedValue({
        totalEarnings: 100,
        monthlyEarnings: 80,
        dailyEarnings: 3.33,
        impressions: 5000,
        clicks: 100,
        ctr: 2.0,
        cpm: 20,
        topPerformingAds: [],
        earningsChart: [],
        revenueBreakdown: { adsense: 100, affiliate: 0, sponsored: 0, other: 0 },
        projectedEarnings: { thisMonth: 100, nextMonth: 110, thisYear: 1200 },
      });

      // When
      const result = await revenueService.getRevenueSummary(userId);

      // Then
      expect(result).toHaveProperty('totalEarnings');
      expect(result).toHaveProperty('monthlyEarnings');
      expect(result).toHaveProperty('activeProjects');
      expect(result).toHaveProperty('topProject');
      expect(result).toHaveProperty('recentActivity');

      expect(result.activeProjects).toBe(2); // Only projects with AdSense enabled
      expect(result.topProject).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        earnings: expect.any(Number),
      });
      expect(result.recentActivity).toHaveLength(2);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('AdSense가 활성화된 프로젝트가 없는 경우', async () => {
      // Given
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          userId,
          revenue: JSON.stringify({
            adsenseEnabled: false,
          }),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      // When
      const result = await revenueService.getRevenueSummary(userId);

      // Then
      expect(result.totalEarnings).toBe(0);
      expect(result.monthlyEarnings).toBe(0);
      expect(result.activeProjects).toBe(0);
      expect(result.topProject).toBeNull();
      expect(result.recentActivity).toHaveLength(0);
    });

    it('프로젝트가 없는 사용자의 요약 조회', async () => {
      // Given
      mockPrisma.project.findMany.mockResolvedValue([]);

      // When
      const result = await revenueService.getRevenueSummary(userId);

      // Then
      expect(result.totalEarnings).toBe(0);
      expect(result.monthlyEarnings).toBe(0);
      expect(result.activeProjects).toBe(0);
      expect(result.topProject).toBeNull();
      expect(result.recentActivity).toHaveLength(0);
    });
  });
});