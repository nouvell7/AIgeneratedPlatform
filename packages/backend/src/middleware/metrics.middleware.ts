import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  timestamp: string;
}

interface SystemMetrics {
  memory: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: string;
}

class MetricsCollector {
  private requestMetrics: RequestMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  // Collect request metrics
  collectRequestMetrics(req: Request, res: Response, responseTime: number) {
    const metrics: RequestMetrics = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      timestamp: new Date().toISOString(),
    };

    this.requestMetrics.push(metrics);

    // Keep only the last N metrics to prevent memory issues
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
    }

    // Log metrics for external monitoring systems
    logger.info('Request metrics', {
      ...metrics,
      type: 'request_metrics',
    });
  }

  // Collect system metrics
  collectSystemMetrics() {
    const metrics: SystemMetrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    this.systemMetrics.push(metrics);

    // Keep only the last N metrics
    if (this.systemMetrics.length > this.maxMetricsHistory) {
      this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsHistory);
    }

    // Log system metrics
    logger.info('System metrics', {
      ...metrics,
      type: 'system_metrics',
    });
  }

  // Get request metrics summary
  getRequestMetricsSummary(timeWindow: number = 300000) { // 5 minutes default
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.requestMetrics.filter(
      m => new Date(m.timestamp).getTime() > cutoff
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodes: {},
        topEndpoints: [],
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    // Status code distribution
    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Top endpoints by request count
    const endpointCounts = recentMetrics.reduce((acc, m) => {
      const endpoint = `${m.method} ${m.url}`;
      acc[endpoint] = (acc[endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      statusCodes,
      topEndpoints,
    };
  }

  // Get system metrics summary
  getSystemMetricsSummary() {
    if (this.systemMetrics.length === 0) {
      return null;
    }

    const latest = this.systemMetrics[this.systemMetrics.length - 1];
    return {
      memory: {
        used: Math.round(latest.memory.heapUsed / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(latest.memory.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(latest.memory.external / 1024 / 1024 * 100) / 100, // MB
        rss: Math.round(latest.memory.rss / 1024 / 1024 * 100) / 100, // MB
      },
      uptime: Math.round(latest.uptime),
      timestamp: latest.timestamp,
    };
  }

  // Get all metrics for monitoring dashboard
  getAllMetrics() {
    return {
      requests: this.getRequestMetricsSummary(),
      system: this.getSystemMetricsSummary(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

// Collect system metrics every 30 seconds
setInterval(() => {
  metricsCollector.collectSystemMetrics();
}, 30000);

// Request metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    metricsCollector.collectRequestMetrics(req, res, responseTime);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Metrics endpoint
export const getMetrics = (req: Request, res: Response) => {
  try {
    const timeWindow = req.query.window ? parseInt(req.query.window as string) : undefined;
    const metrics = metricsCollector.getAllMetrics();
    
    if (timeWindow) {
      metrics.requests = metricsCollector.getRequestMetricsSummary(timeWindow);
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
};

export { metricsCollector };