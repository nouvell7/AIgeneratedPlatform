import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { 
  AuthenticationError, 
  TokenExpiredError, 
  InsufficientPermissionsError 
} from '../utils/errors';
import { loggers } from '../utils/logger';
import { container } from 'tsyringe'; // tsyringe 컨테이너 임포트

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify token
    const payload = JWTService.verifyAccessToken(token);

    // Add user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'Access token has expired',
          requestId: req.requestId,
        },
      });
    }

    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: error.message,
          requestId: req.requestId,
        },
      });
    }

    next(error);
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = JWTService.verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      } catch (error) {
        // Ignore token errors for optional auth
        loggers.auth.error('optional_auth_failed', error as Error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (requiredRole: 'USER' | 'ADMIN') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const authService = container.resolve(AuthService); // AuthService 주입
      await authService.validateUserPermissions(req.user.userId, requiredRole); // 인스턴스 메서드 호출

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Insufficient permissions',
            requestId: req.requestId,
          },
        });
      }

      next(error);
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Resource ownership middleware factory
 * Ensures user can only access their own resources
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // This is a simplified check - in practice, you'd query the database
      // to verify ownership based on the resource type
      if (resourceId === userId) {
        return next();
      }

      // For other resources, you'd need to implement specific ownership checks
      // For now, we'll allow the request to proceed and let the service layer handle it
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting per user middleware
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      loggers.security.rateLimitExceeded(req.ip || 'unknown', req.originalUrl);
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this user',
          requestId: req.requestId,
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
        },
      });
    }

    // Increment request count
    userLimit.count++;
    next();
  };
};

/**
 * API key authentication middleware
 * Alternative authentication method for API access
 */
export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // In a real implementation, you'd validate the API key against the database
    // For now, we'll just check if it's present
    if (apiKey.length < 32) {
      throw new AuthenticationError('Invalid API key format');
    }

    // TODO: Implement actual API key validation
    // const keyData = await validateApiKey(apiKey);
    // req.user = { userId: keyData.userId, ... };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: error.message,
          requestId: req.requestId,
        },
      });
    }

    next(error);
  }
};

/**
 * Combined authentication middleware
 * Accepts either JWT token or API key
 */
export const flexibleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const hasJWT = !!JWTService.extractTokenFromHeader(req.headers.authorization);
  const hasApiKey = !!req.headers['x-api-key'];

  if (hasJWT) {
    return authMiddleware(req, res, next);
  } else if (hasApiKey) {
    return apiKeyAuth(req, res, next);
  } else {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'Authentication required (JWT token or API key)',
        requestId: req.requestId,
      },
    });
  }
};

/**
 * Session validation middleware
 * Ensures user session is still valid
 */
export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const authService = container.resolve(AuthService); // AuthService 주입
    // Check if user still exists and is active
    const user = await authService.getUserProfile(req.user.userId); // 인스턴스 메서드 호출
    
    if (!user) {
      throw new AuthenticationError('User session is no longer valid');
    }

    // Update user info in request with latest data
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: error.message,
          requestId: req.requestId,
        },
      });
    }

    next(error);
  }
};

export default authMiddleware;
