import { ERROR_CODES } from '../../../shared/src/constants';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.SYS_002,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super(message, 401, ERROR_CODES.AUTH_001, true, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: Record<string, any>) {
    super(message, 401, ERROR_CODES.AUTH_002, true, details);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, 403, ERROR_CODES.AUTH_003, true, details);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Invalid input format', details?: Record<string, any>) {
    super(message, 400, ERROR_CODES.VAL_001, true, details);
  }
}

export class MissingFieldsError extends AppError {
  constructor(message: string = 'Missing required fields', details?: Record<string, any>) {
    super(message, 400, ERROR_CODES.VAL_002, true, details);
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message: string = 'Business rule violation', details?: Record<string, any>) {
    super(message, 400, ERROR_CODES.VAL_003, true, details);
  }
}

/**
 * Resource related errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    statusCode: number = 502,
    details?: Record<string, any>
  ) {
    const errorCode = service === 'teachable-machine' ? ERROR_CODES.EXT_001 :
                     service === 'replit' ? ERROR_CODES.EXT_002 :
                     service === 'cloudflare' ? ERROR_CODES.EXT_003 :
                     service === 'adsense' ? ERROR_CODES.EXT_004 :
                     'EXT_UNKNOWN';
    
    super(`${service}: ${message}`, statusCode, errorCode, true, details);
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, any>) {
    super(message, 500, ERROR_CODES.SYS_001, true, details);
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, details);
  }
}

/**
 * File upload errors
 */
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: Record<string, any>) {
    super(message, 400, 'FILE_UPLOAD_ERROR', true, details);
  }
}

/**
 * Utility functions for error handling
 */
export const errorUtils = {
  /**
   * Check if error is operational (expected) or programming error
   */
  isOperationalError: (error: Error): boolean => {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   * Extract error details for logging
   */
  getErrorDetails: (error: Error): Record<string, any> => {
    const details: Record<string, any> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error instanceof AppError) {
      details.statusCode = error.statusCode;
      details.code = error.code;
      details.isOperational = error.isOperational;
      if (error.details) {
        details.details = error.details;
      }
    }

    return details;
  },

  /**
   * Create standardized error response
   */
  createErrorResponse: (error: Error, requestId?: string) => {
    const isAppError = error instanceof AppError;
    
    return {
      success: false,
      error: {
        code: isAppError ? error.code : ERROR_CODES.SYS_002,
        message: isAppError ? error.message : 'Internal server error',
        details: isAppError ? error.details : undefined,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  },

  /**
   * Handle Prisma errors and convert to AppError
   */
  handlePrismaError: (error: any): AppError => {
    // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return new ConflictError('Resource already exists', {
          field: error.meta?.target,
          prismaCode: error.code,
        });
      
      case 'P2025':
        // Record not found
        return new NotFoundError('Record', {
          prismaCode: error.code,
        });
      
      case 'P2003':
        // Foreign key constraint violation
        return new ValidationError('Invalid reference', {
          field: error.meta?.field_name,
          prismaCode: error.code,
        });
      
      case 'P2011':
        // Null constraint violation
        return new ValidationError('Required field missing', {
          field: error.meta?.constraint,
          prismaCode: error.code,
        });
      
      default:
        return new DatabaseError('Database operation failed', {
          prismaCode: error.code,
          prismaMessage: error.message,
        });
    }
  },

  /**
   * Handle JWT errors
   */
  handleJWTError: (error: any): AppError => {
    switch (error.name) {
      case 'TokenExpiredError':
        return new TokenExpiredError('JWT token has expired');
      
      case 'JsonWebTokenError':
        return new AuthenticationError('Invalid JWT token');
      
      case 'NotBeforeError':
        return new AuthenticationError('JWT token not active yet');
      
      default:
        return new AuthenticationError('JWT verification failed');
    }
  },
};

export default AppError;