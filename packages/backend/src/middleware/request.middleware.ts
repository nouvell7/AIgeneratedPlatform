import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loggers } from '../utils/logger';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Request logging middleware
 * Adds request ID and logs request/response details
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log incoming request
  loggers.api.request(req.method, req.originalUrl, req.user?.userId);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - req.startTime;
    
    // Log response
    loggers.api.response(req.method, req.originalUrl, res.statusCode, duration);
    
    // Log error responses with more detail
    if (res.statusCode >= 400 && body?.error) {
      loggers.api.error(
        req.method, 
        req.originalUrl, 
        new Error(`${body.error.code}: ${body.error.message}`),
        req.user?.userId
      );
    }

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout',
            requestId: req.requestId,
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Request size limiter middleware
 */
export const requestSizeLimiter = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request payload too large. Maximum size: ${maxSizeBytes} bytes`,
          requestId: req.requestId,
        },
      });
    }

    next();
  };
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (!allowedIPs.includes(clientIP)) {
      loggers.security.unauthorizedAccess(clientIP, req.originalUrl, req.user?.userId);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address',
          requestId: req.requestId,
        },
      });
    }

    next();
  };
};

/**
 * User agent validation middleware
 */
export const userAgentValidator = (blockedPatterns: RegExp[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('user-agent') || '';
    
    // Block requests without user agent
    if (!userAgent) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_AGENT',
          message: 'User agent header is required',
          requestId: req.requestId,
        },
      });
    }

    // Check against blocked patterns
    for (const pattern of blockedPatterns) {
      if (pattern.test(userAgent)) {
        loggers.security.suspiciousActivity(
          req.user?.userId || 'anonymous',
          'blocked_user_agent',
          { userAgent, ip: req.ip }
        );
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_AGENT_BLOCKED',
            message: 'Access denied',
            requestId: req.requestId,
          },
        });
      }
    }

    next();
  };
};

export default requestLogger;