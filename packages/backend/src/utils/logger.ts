import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }) as any,
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    }) as any
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Utility functions for structured logging
export const loggers = {
  // Database operations
  database: {
    query: (query: string, duration?: number) => {
      logger.debug(`DB Query: ${query}${duration ? ` (${duration}ms)` : ''}`);
    },
    error: (operation: string, error: Error) => {
      logger.error(`DB Error in ${operation}:`, error);
    },
  },

  // API requests
  api: {
    request: (method: string, url: string, userId?: string) => {
      logger.http(`${method} ${url}${userId ? ` (User: ${userId})` : ''}`);
    },
    response: (method: string, url: string, statusCode: number, duration: number) => {
      logger.http(`${method} ${url} - ${statusCode} (${duration}ms)`);
    },
    error: (method: string, url: string, error: Error, userId?: string) => {
      logger.error(`API Error ${method} ${url}${userId ? ` (User: ${userId})` : ''}:`, error);
    },
  },

  // Authentication
  auth: {
    login: (userId: string, method: 'email' | 'google' | 'github') => {
      logger.info(`User login: ${userId} via ${method}`);
    },
    logout: (userId: string) => {
      logger.info(`User logout: ${userId}`);
    },
    register: (userId: string, method: 'email' | 'google' | 'github') => {
      logger.info(`User registration: ${userId} via ${method}`);
    },
    passwordChange: (userId: string) => {
      logger.info(`User password changed: ${userId}`);
    },
    oauthUnlink: (userId: string, provider: 'google' | 'github') => {
      logger.info(`User unlinked OAuth: ${userId} from ${provider}`);
    },
    error: (action: string, error: Error, userId?: string) => {
      logger.error(`Auth Error ${action}${userId ? ` (User: ${userId})` : ''}:`, error);
    },
  },

  // External services
  external: {
    request: (service: string, endpoint: string, method: string) => {
      logger.debug(`External API: ${method} ${service}${endpoint}`);
    },
    response: (service: string, endpoint: string, statusCode: number, duration: number) => {
      logger.debug(`External API Response: ${service}${endpoint} - ${statusCode} (${duration}ms)`);
    },
    error: (service: string, endpoint: string, error: Error) => {
      logger.error(`External API Error ${service}${endpoint}:`, error);
    },
  },

  // Business logic
  business: {
    projectCreated: (projectId: string, userId: string) => {
      logger.info(`Project created: ${projectId} by user ${userId}`);
    },
    projectDeployed: (projectId: string, platform: string) => {
      logger.info(`Project deployed: ${projectId} to ${platform}`);
    },
    revenueGenerated: (projectId: string, amount: number, currency: string) => {
      logger.info(`Revenue generated: ${projectId} - ${amount} ${currency}`);
    },
  },

  // Security
  security: {
    suspiciousActivity: (userId: string, activity: string, details?: any) => {
      logger.warn(`Suspicious activity: ${activity} by user ${userId}`, details);
    },
    rateLimitExceeded: (ip: string, endpoint: string) => {
      logger.warn(`Rate limit exceeded: ${ip} on ${endpoint}`);
    },
    unauthorizedAccess: (ip: string, endpoint: string, userId?: string) => {
      logger.warn(`Unauthorized access attempt: ${ip} on ${endpoint}${userId ? ` (User: ${userId})` : ''}`);
    },
  },
};

export default logger;
