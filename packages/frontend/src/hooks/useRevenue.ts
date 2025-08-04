import { useState, useEffect } from 'react';
import { revenueApi, RevenueData, AdSenseConfig, RevenueOptimization } from '../services/api/revenue';

export const useRevenue = (projectId: string) => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [adSenseConfig, setAdSenseConfig] = useState<AdSenseConfig | null>(null);
  const [optimization, setOptimization] = useState<RevenueOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRevenueData = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await revenueApi.getRevenueData(projectId, period);
      if (response.success) {
        setRevenueData(response.data);
      } else {
        setError(response.error?.message || 'Failed to load revenue data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdSenseConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await revenueApi.getAdSenseConfig(projectId);
      if (response.success) {
        setAdSenseConfig(response.data);
      } else {
        setError(response.error?.message || 'Failed to load AdSense config');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdSenseConfig = async (config: Partial<AdSenseConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await revenueApi.updateAdSenseConfig(projectId, config);
      if (response.success) {
        setAdSenseConfig(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update AdSense config');
        throw new Error(response.error?.message || 'Failed to update AdSense config');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptimizationRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await revenueApi.getOptimizationRecommendations(projectId);
      if (response.success) {
        setOptimization(response.data);
      } else {
        setError(response.error?.message || 'Failed to load optimization recommendations');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyOptimization = async (optimizationType: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await revenueApi.applyOptimization(projectId, optimizationType);
      if (response.success) {
        // Reload optimization recommendations after applying
        await loadOptimizationRecommendations();
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to apply optimization');
        throw new Error(response.error?.message || 'Failed to apply optimization');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    revenueData,
    adSenseConfig,
    optimization,
    isLoading,
    error,
    loadRevenueData,
    loadAdSenseConfig,
    updateAdSenseConfig,
    loadOptimizationRecommendations,
    applyOptimization,
    clearError,
  };
};