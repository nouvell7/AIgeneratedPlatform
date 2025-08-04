import { apiClient } from './client';
import { ApiResponse } from '@ai-service-platform/shared';

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  adImpressions: number;
  adClicks: number;
  ctr: number;
  rpm: number;
}

export interface AdSenseConfig {
  publisherId: string;
  adUnits: Array<{
    id: string;
    name: string;
    position: string;
    size: string;
    code: string;
  }>;
}

export interface RevenueOptimization {
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
  performanceMetrics: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
}

export const revenueApi = {
  // Revenue Analytics
  getRevenueData: async (
    projectId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<RevenueData>> => {
    const response = await apiClient.get(
      `/revenue/${projectId}/analytics?period=${period}`
    );
    return response.data;
  },

  getRevenueHistory: async (
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<RevenueData[]>> => {
    const response = await apiClient.get(
      `/revenue/${projectId}/history?start=${startDate}&end=${endDate}`
    );
    return response.data;
  },

  // AdSense Configuration
  getAdSenseConfig: async (
    projectId: string
  ): Promise<ApiResponse<AdSenseConfig>> => {
    const response = await apiClient.get(`/revenue/${projectId}/adsense`);
    return response.data;
  },

  updateAdSenseConfig: async (
    projectId: string,
    config: Partial<AdSenseConfig>
  ): Promise<ApiResponse<AdSenseConfig>> => {
    const response = await apiClient.put(
      `/revenue/${projectId}/adsense`,
      config
    );
    return response.data;
  },

  // Revenue Optimization
  getOptimizationRecommendations: async (
    projectId: string
  ): Promise<ApiResponse<RevenueOptimization>> => {
    const response = await apiClient.get(
      `/revenue/${projectId}/optimization`
    );
    return response.data;
  },

  applyOptimization: async (
    projectId: string,
    optimizationType: string
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.post(
      `/revenue/${projectId}/optimization/apply`,
      { type: optimizationType }
    );
    return response.data;
  },

  // A/B Testing
  createABTest: async (
    projectId: string,
    testConfig: {
      name: string;
      description: string;
      variants: Array<{
        name: string;
        adConfig: Partial<AdSenseConfig>;
        trafficSplit: number;
      }>;
    }
  ): Promise<ApiResponse<{ testId: string }>> => {
    const response = await apiClient.post(
      `/revenue/${projectId}/ab-test`,
      testConfig
    );
    return response.data;
  },

  getABTestResults: async (
    projectId: string,
    testId: string
  ): Promise<ApiResponse<{
    testId: string;
    status: 'running' | 'completed' | 'paused';
    results: Array<{
      variant: string;
      impressions: number;
      clicks: number;
      revenue: number;
      ctr: number;
      rpm: number;
    }>;
  }>> => {
    const response = await apiClient.get(
      `/revenue/${projectId}/ab-test/${testId}`
    );
    return response.data;
  },
};