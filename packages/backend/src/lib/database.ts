import { prisma } from './prisma';
import { logger } from '../utils/logger';

export class DatabaseService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection successful');
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Initialize database connection and run health checks
   */
  static async initialize(): Promise<void> {
    try {
      // Test connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      // Run any initialization queries if needed
      await this.runInitializationQueries();

      logger.info('🚀 Database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run any necessary initialization queries
   */
  private static async runInitializationQueries(): Promise<void> {
    try {
      // SQLite doesn't need extensions like PostgreSQL
      // Just ensure the database is ready
      await prisma.$queryRaw`SELECT 1`;
      
      logger.info('✅ Database ready');
    } catch (error) {
      logger.warn('⚠️ Could not enable database extensions:', error);
      // Don't throw error as extensions might already exist or user might not have permissions
    }
  }

  /**
   * Get database health status
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      responseTime: number;
      version?: string;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      // Get SQLite version
      const versionResult = await prisma.$queryRaw<[{ 'sqlite_version()': string }]>`SELECT sqlite_version()`;
      const version = `SQLite ${versionResult[0]?.['sqlite_version()']}` || 'Unknown';
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          responseTime,
          version,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime,
        },
      };
    }
  }

  /**
   * Gracefully disconnect from database
   */
  static async disconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      logger.info('✅ Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Error disconnecting from database:', error);
    }
  }
}

export default DatabaseService;