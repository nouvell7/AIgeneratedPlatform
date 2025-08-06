import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    backend: 'healthy' | 'unhealthy' | 'unknown';
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        backend: 'unknown',
      },
    });
  }

  try {
    const healthCheck: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        backend: 'unknown',
      },
    };

    // Check backend API health
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        healthCheck.services.backend = 'healthy';
      } else {
        healthCheck.services.backend = 'unhealthy';
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      healthCheck.services.backend = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        backend: 'unknown',
      },
    });
  }
}