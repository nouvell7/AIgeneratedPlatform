import { Request, Response, NextFunction } from 'express';
import { AppError, errorUtils } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    // Handle Zod validation errors
    appError = new AppError(
      'Validation failed',
      400,
      'VAL_001',
      true,
      {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      }
    );
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    // Handle JWT errors
    appError = errorUtils.handleJWTError(error);
  } else if (error.name?.startsWith('Prisma')) {
    // Handle Prisma errors
    appError = errorUtils.handlePrismaError(error);
  } else {
    // Handle unknown errors
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      500,
      'SYS_002',
      false
    );
  }

  // Log error details
  const errorDetails = errorUtils.getErrorDetails(appError);
  
  if (appError.statusCode >= 500) {
    logger.error('Server Error:', {
      ...errorDetails,
      requestId: req.requestId,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
    });
  } else if (appError.statusCode >= 400) {
    logger.warn('Client Error:', {
      ...errorDetails,
      requestId: req.requestId,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.userId,
    });
  }

  // Create error response
  const errorResponse = errorUtils.createErrorResponse(appError, req.requestId);

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
  
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Development error handler with detailed stack traces
 */
export const developmentErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let appError: AppError;
  if (error instanceof AppError) {
    appError = error;
  } else {
    appError = new AppError(error.message, 500, 'SYS_002', false);
  }

  // Enhanced error response for development
  const errorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      ...(isDevelopment && {
        stack: error.stack,
        originalError: {
          name: error.name,
          message: error.message,
        },
        request: {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
          params: req.params,
          query: req.query,
        },
      }),
    },
  };

  // Log error
  logger.error('Error Handler:', {
    error: errorUtils.getErrorDetails(error),
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId,
  });

  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Production error handler with minimal error exposure
 */
export const productionErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error);
  }

  let appError: AppError;
  if (error instanceof AppError && error.isOperational) {
    appError = error;
  } else {
    // Don't expose internal errors in production
    appError = new AppError('Internal server error', 500, 'SYS_002', true);
  }

  const errorResponse = errorUtils.createErrorResponse(appError, req.requestId);

  // Log all errors in production
  logger.error('Production Error:', {
    error: errorUtils.getErrorDetails(error),
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId,
  });

  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Get appropriate error handler based on environment
 */
export const getErrorHandler = () => {
  return process.env.NODE_ENV === 'production' 
    ? productionErrorHandler 
    : developmentErrorHandler;
};

export default errorHandler;