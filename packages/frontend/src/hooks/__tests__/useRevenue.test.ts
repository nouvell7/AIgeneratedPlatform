import { renderHook, act } from '@testing-library/react';
import { useRevenue } from '../useRevenue';
import { revenueApi } from '../../services/api/revenue';

// Mock the revenue API
jest.mock('../../services/api/revenue', () => ({
  revenueApi: {
    getRevenueData: jest.fn(),
    getAdSenseConfig: jest.fn(),
    updateAdSenseConfig: jest.fn(),
    getOptimizationRecommendations: jest.fn(),
    applyOptimization: jest.fn(),
  },
}));

const mockRevenueApi = revenueApi as jest.Mocked<typeof revenueApi>;

describe('useRevenue', () => {
  const projectId = 'project-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadRevenueData', () => {
    it('수익 데이터 로드 성공', async () => {
      // Given
      const mockRevenueData = {
        totalEarnings: 150.75,
        monthlyEarnings: 120.50,
        dailyEarnings: 5.25,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpm: 15.08,
        earningsChart: [
          { date: '2024-01-01', earnings: 25.5, impressions: 1500, clicks: 30 },
          { date: '2024-01-02', earnings: 30.2, impressions: 1800, clicks: 35 },
        ],
        topPerformingAds: [
          {
            adUnitId: 'ad-1',
            name: 'Header Ad',
            earnings: 75.25,
            impressions: 5000,
            clicks: 125,
          },
        ],
      };

      const mockResponse = {
        success: true,
        data: mockRevenueData,
      };

      mockRevenueApi.getRevenueData.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadRevenueData('month');
      });

      // Then
      expect(result.current.revenueData).toEqual(mockRevenueData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockRevenueApi.getRevenueData).toHaveBeenCalledWith(projectId, 'month');
    });

    it('수익 데이터 로드 실패', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Failed to load revenue data' },
      };

      mockRevenueApi.getRevenueData.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadRevenueData('week');
      });

      // Then
      expect(result.current.revenueData).toBeNull();
      expect(result.current.error).toBe('Failed to load revenue data');
      expect(result.current.isLoading).toBe(false);
    });

    it('기본 기간으로 수익 데이터 로드', async () => {
      // Given
      const mockResponse = {
        success: true,
        data: { totalEarnings: 100 },
      };

      mockRevenueApi.getRevenueData.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadRevenueData(); // No period specified
      });

      // Then
      expect(mockRevenueApi.getRevenueData).toHaveBeenCalledWith(projectId, 'month');
    });
  });

  describe('loadAdSenseConfig', () => {
    it('AdSense 설정 로드 성공', async () => {
      // Given
      const mockAdSenseConfig = {
        publisherId: 'pub-123456789',
        adUnits: [
          {
            id: 'ad-unit-1',
            name: 'Header Ad',
            code: 'header-ad-code',
            status: 'active',
            type: 'display',
            size: '728x90',
          },
        ],
        autoAdsEnabled: true,
        adBlockRecoveryEnabled: false,
      };

      const mockResponse = {
        success: true,
        data: mockAdSenseConfig,
      };

      mockRevenueApi.getAdSenseConfig.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadAdSenseConfig();
      });

      // Then
      expect(result.current.adSenseConfig).toEqual(mockAdSenseConfig);
      expect(result.current.error).toBeNull();
      expect(mockRevenueApi.getAdSenseConfig).toHaveBeenCalledWith(projectId);
    });

    it('AdSense 설정 로드 실패', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Failed to load AdSense config' },
      };

      mockRevenueApi.getAdSenseConfig.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadAdSenseConfig();
      });

      // Then
      expect(result.current.adSenseConfig).toBeNull();
      expect(result.current.error).toBe('Failed to load AdSense config');
    });
  });

  describe('updateAdSenseConfig', () => {
    it('AdSense 설정 업데이트 성공', async () => {
      // Given
      const configUpdate = {
        autoAdsEnabled: true,
        adBlockRecoveryEnabled: true,
      };

      const updatedConfig = {
        publisherId: 'pub-123456789',
        adUnits: [],
        autoAdsEnabled: true,
        adBlockRecoveryEnabled: true,
      };

      const mockResponse = {
        success: true,
        data: updatedConfig,
      };

      mockRevenueApi.updateAdSenseConfig.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      let returnedConfig;
      await act(async () => {
        returnedConfig = await result.current.updateAdSenseConfig(configUpdate);
      });

      // Then
      expect(returnedConfig).toEqual(updatedConfig);
      expect(result.current.adSenseConfig).toEqual(updatedConfig);
      expect(result.current.error).toBeNull();
      expect(mockRevenueApi.updateAdSenseConfig).toHaveBeenCalledWith(projectId, configUpdate);
    });

    it('AdSense 설정 업데이트 실패', async () => {
      // Given
      const configUpdate = { autoAdsEnabled: false };
      const mockResponse = {
        success: false,
        error: { message: 'Failed to update AdSense config' },
      };

      mockRevenueApi.updateAdSenseConfig.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      let error;
      await act(async () => {
        try {
          await result.current.updateAdSenseConfig(configUpdate);
        } catch (e) {
          error = e;
        }
      });

      // Then
      expect(error).toBeDefined();
      expect(result.current.error).toBe('Failed to update AdSense config');
    });
  });

  describe('loadOptimizationRecommendations', () => {
    it('최적화 권장사항 로드 성공', async () => {
      // Given
      const mockOptimization = {
        recommendations: [
          {
            type: 'placement',
            title: 'Add above-the-fold ad placement',
            description: 'Adding an ad unit above the fold can increase viewability',
            potentialIncrease: 20,
            priority: 'high',
          },
          {
            type: 'format',
            title: 'Enable responsive ad units',
            description: 'Responsive ads adapt to different screen sizes',
            potentialIncrease: 15,
            priority: 'medium',
          },
        ],
        currentScore: 75,
        potentialScore: 90,
      };

      const mockResponse = {
        success: true,
        data: mockOptimization,
      };

      mockRevenueApi.getOptimizationRecommendations.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadOptimizationRecommendations();
      });

      // Then
      expect(result.current.optimization).toEqual(mockOptimization);
      expect(result.current.error).toBeNull();
      expect(mockRevenueApi.getOptimizationRecommendations).toHaveBeenCalledWith(projectId);
    });

    it('최적화 권장사항 로드 실패', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Failed to load optimization recommendations' },
      };

      mockRevenueApi.getOptimizationRecommendations.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      await act(async () => {
        await result.current.loadOptimizationRecommendations();
      });

      // Then
      expect(result.current.optimization).toBeNull();
      expect(result.current.error).toBe('Failed to load optimization recommendations');
    });
  });

  describe('applyOptimization', () => {
    it('최적화 적용 성공', async () => {
      // Given
      const optimizationType = 'placement';
      const mockApplyResponse = {
        success: true,
        data: { applied: true, message: 'Optimization applied successfully' },
      };

      const mockOptimizationResponse = {
        success: true,
        data: {
          recommendations: [],
          currentScore: 85,
          potentialScore: 90,
        },
      };

      mockRevenueApi.applyOptimization.mockResolvedValue(mockApplyResponse);
      mockRevenueApi.getOptimizationRecommendations.mockResolvedValue(mockOptimizationResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      let returnedData;
      await act(async () => {
        returnedData = await result.current.applyOptimization(optimizationType);
      });

      // Then
      expect(returnedData).toEqual(mockApplyResponse.data);
      expect(result.current.optimization).toEqual(mockOptimizationResponse.data);
      expect(result.current.error).toBeNull();
      expect(mockRevenueApi.applyOptimization).toHaveBeenCalledWith(projectId, optimizationType);
      expect(mockRevenueApi.getOptimizationRecommendations).toHaveBeenCalledWith(projectId);
    });

    it('최적화 적용 실패', async () => {
      // Given
      const optimizationType = 'format';
      const mockResponse = {
        success: false,
        error: { message: 'Failed to apply optimization' },
      };

      mockRevenueApi.applyOptimization.mockResolvedValue(mockResponse);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      let error;
      await act(async () => {
        try {
          await result.current.applyOptimization(optimizationType);
        } catch (e) {
          error = e;
        }
      });

      // Then
      expect(error).toBeDefined();
      expect(result.current.error).toBe('Failed to apply optimization');
    });
  });

  describe('clearError', () => {
    it('에러 상태 초기화', async () => {
      // Given
      const mockResponse = {
        success: false,
        error: { message: 'Some error' },
      };

      mockRevenueApi.getRevenueData.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevenue(projectId));
      
      // Set error state by triggering a failed API call
      await act(async () => {
        await result.current.loadRevenueData();
      });
      
      expect(result.current.error).toBe('Some error');

      // When
      act(() => {
        result.current.clearError();
      });

      // Then
      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading states', () => {
    it('API 호출 중 로딩 상태 관리', async () => {
      // Given
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockRevenueApi.getRevenueData.mockReturnValue(promise);

      // When
      const { result } = renderHook(() => useRevenue(projectId));
      
      act(() => {
        result.current.loadRevenueData();
      });

      // Then - Loading should be true
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true, data: { totalEarnings: 100 } });
        await promise;
      });

      // Then - Loading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });
});