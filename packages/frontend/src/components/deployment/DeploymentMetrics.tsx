import React, { useState, useEffect } from 'react';
import { getDeploymentMetrics } from '../../services/api/deployment';

interface DeploymentMetricsProps {
  projectId: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const DeploymentMetrics: React.FC<DeploymentMetricsProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [projectId, timeRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await getDeploymentMetrics(projectId, timeRange);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return bytes + ' B';
  };

  const formatResponseTime = (ms: number): string => {
    if (ms >= 1000) {
      return (ms / 1000).toFixed(1) + 's';
    }
    return ms.toFixed(0) + 'ms';
  };

  const getMetricCards = (): MetricCard[] => {
    if (!metrics) return [];

    return [
      {
        title: 'Total Requests',
        value: formatNumber(metrics.requests),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        color: 'text-blue-600',
      },
      {
        title: 'Bandwidth Used',
        value: formatBytes(metrics.bandwidth),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
          </svg>
        ),
        color: 'text-green-600',
      },
      {
        title: 'Error Rate',
        value: metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + '%' : '0%',
        changeType: metrics.errors > 0 ? 'negative' : 'positive',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        color: metrics.errors > 0 ? 'text-red-600' : 'text-green-600',
      },
      {
        title: 'Avg Response Time',
        value: formatResponseTime(metrics.responseTime),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-purple-600',
      },
      {
        title: 'Uptime',
        value: (metrics.uptime * 100).toFixed(2) + '%',
        changeType: metrics.uptime >= 0.99 ? 'positive' : metrics.uptime >= 0.95 ? 'neutral' : 'negative',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: metrics.uptime >= 0.99 ? 'text-green-600' : metrics.uptime >= 0.95 ? 'text-yellow-600' : 'text-red-600',
      },
    ];
  };

  const renderChart = () => {
    if (!metrics?.timeline || metrics.timeline.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No data available for the selected time range</p>
        </div>
      );
    }

    const maxRequests = Math.max(...metrics.timeline.map((point: any) => point.requests));
    const maxResponseTime = Math.max(...metrics.timeline.map((point: any) => point.responseTime));

    return (
      <div className="space-y-4">
        {/* Simple bar chart representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requests Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Requests Over Time</h4>
            <div className="space-y-2">
              {metrics.timeline.slice(-10).map((point: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 w-16">
                    {new Date(point.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(point.requests / maxRequests) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">
                    {point.requests}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Response Time</h4>
            <div className="space-y-2">
              {metrics.timeline.slice(-10).map((point: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 w-16">
                    {new Date(point.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(point.responseTime / maxResponseTime) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12">
                    {formatResponseTime(point.responseTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="animate-pulse">
                  <div className="skeleton h-4 w-20 mb-2"></div>
                  <div className="skeleton h-8 w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-body">
            <div className="animate-pulse">
              <div className="skeleton h-6 w-32 mb-4"></div>
              <div className="skeleton h-64 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = getMetricCards();

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        <div className="flex items-center space-x-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === range
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricCards.map((metric, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                  {metric.change && (
                    <p className={`text-xs ${
                      metric.changeType === 'positive' ? 'text-green-600' :
                      metric.changeType === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {metric.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-gray-50 ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-lg font-semibold text-gray-900">Performance Timeline</h4>
        </div>
        <div className="card-body">
          {renderChart()}
        </div>
      </div>

      {/* Health Status */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-lg font-semibold text-gray-900">Service Health</h4>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                metrics?.uptime >= 0.99 ? 'bg-green-100' : 
                metrics?.uptime >= 0.95 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  metrics?.uptime >= 0.99 ? 'text-green-600' : 
                  metrics?.uptime >= 0.95 ? 'text-yellow-600' : 'text-red-600'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Service Status</p>
              <p className={`text-xs ${
                metrics?.uptime >= 0.99 ? 'text-green-600' : 
                metrics?.uptime >= 0.95 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics?.uptime >= 0.99 ? 'Healthy' : 
                 metrics?.uptime >= 0.95 ? 'Degraded' : 'Unhealthy'}
              </p>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                metrics?.responseTime < 500 ? 'bg-green-100' : 
                metrics?.responseTime < 1000 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  metrics?.responseTime < 500 ? 'text-green-600' : 
                  metrics?.responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Performance</p>
              <p className={`text-xs ${
                metrics?.responseTime < 500 ? 'text-green-600' : 
                metrics?.responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics?.responseTime < 500 ? 'Fast' : 
                 metrics?.responseTime < 1000 ? 'Moderate' : 'Slow'}
              </p>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                (metrics?.errors / metrics?.requests) < 0.01 ? 'bg-green-100' : 
                (metrics?.errors / metrics?.requests) < 0.05 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  (metrics?.errors / metrics?.requests) < 0.01 ? 'text-green-600' : 
                  (metrics?.errors / metrics?.requests) < 0.05 ? 'text-yellow-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Error Rate</p>
              <p className={`text-xs ${
                (metrics?.errors / metrics?.requests) < 0.01 ? 'text-green-600' : 
                (metrics?.errors / metrics?.requests) < 0.05 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(metrics?.errors / metrics?.requests) < 0.01 ? 'Low' : 
                 (metrics?.errors / metrics?.requests) < 0.05 ? 'Medium' : 'High'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentMetrics;