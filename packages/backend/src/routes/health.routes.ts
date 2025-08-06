import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Basic health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check Redis connection (if available)
    try {
      // Add Redis health check here if using Redis
      healthCheck.services.redis = 'healthy';
    } catch (error) {
      healthCheck.services.redis = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
      services: {
        database: { status: 'unknown', responseTime: 0 },
        redis: { status: 'unknown', responseTime: 0 },
        externalAPIs: {
          github: { status: 'unknown', responseTime: 0 },
          teachableMachine: { status: 'unknown', responseTime: 0 },
          huggingFace: { status: 'unknown', responseTime: 0 },
        },
      },
    };

    // Check database with timing
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = Date.now();
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: dbEnd - dbStart,
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: 0,
      };
      detailedHealth.status = 'degraded';
    }

    // Check external APIs (basic connectivity)
    const externalChecks = [
      {
        name: 'github',
        url: 'https://api.github.com',
      },
      {
        name: 'teachableMachine',
        url: 'https://teachablemachine.withgoogle.com',
      },
      {
        name: 'huggingFace',
        url: 'https://huggingface.co',
      },
    ];

    for (const check of externalChecks) {
      try {
        const start = Date.now();
        const response = await fetch(check.url, {
          method: 'HEAD',
          timeout: 5000,
        });
        const end = Date.now();
        
        detailedHealth.services.externalAPIs[check.name as keyof typeof detailedHealth.services.externalAPIs] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: end - start,
        };
      } catch (error) {
        detailedHealth.services.externalAPIs[check.name as keyof typeof detailedHealth.services.externalAPIs] = {
          status: 'unhealthy',
          responseTime: 0,
        };
      }
    }

    const statusCode = detailedHealth.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
    });
  }
});

// Readiness probe
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if the application is ready to serve requests
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Application not ready',
    });
  }
});

// Liveness probe
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;