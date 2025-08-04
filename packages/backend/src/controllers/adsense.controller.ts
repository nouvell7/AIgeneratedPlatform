import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AdSenseService } from '../services/adsense.service'; // Corrected import to class
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

@injectable()
export class AdSenseController {
  constructor(@inject(AdSenseService) private adsenseService: AdSenseService) {}

  /**
   * Connect AdSense account
   */
  async connectAdSenseAccount(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { authCode } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      if (!authCode) {
        throw new AppError('Authorization code is required', 400);
      }

      const account = await this.adsenseService.connectAdSenseAccount(projectId, userId, authCode);

      res.status(201).json({
        success: true,
        data: { account },
      });
    } catch (error: any) {
      logger.error('Failed to connect AdSense account', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'ADSENSE_CONNECT_FAILED',
        },
      });
    }
  }

  /**
   * Get AdSense status
   */
  async getAdSenseStatus(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const status = await this.adsenseService.getAdSenseStatus(projectId, userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Failed to get AdSense status', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'ADSENSE_STATUS_FAILED',
        },
      });
    }
  }

  /**
   * Create ad unit
   */
  async createAdUnit(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { name, type, size } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      if (!name || !type || !size) {
        throw new AppError('Name, type, and size are required', 400);
      }

      const adUnit = await this.adsenseService.createAdUnit(projectId, userId, {
        name,
        type,
        size,
      });

      res.status(201).json({
        success: true,
        data: { adUnit },
      });
    } catch (error: any) {
      logger.error('Failed to create ad unit', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'AD_UNIT_CREATE_FAILED',
        },
      });
    }
  }

  /**
   * Update AdSense settings
   */
  async updateAdSenseSettings(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const settings = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const config = await this.adsenseService.updateAdSenseSettings(projectId, userId, settings);

      res.json({
        success: true,
        data: { config },
      });
    } catch (error: any) {
      logger.error('Failed to update AdSense settings', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'ADSENSE_SETTINGS_UPDATE_FAILED',
        },
      });
    }
  }

  /**
   * Generate ad code
   */
  async generateAdCode(req: Request, res: Response) {
    try {
      const { projectId, adUnitId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId || !adUnitId) {
        throw new AppError('Project ID and Ad Unit ID are required', 400);
      }

      const adCode = await this.adsenseService.generateAdCode(projectId, userId, adUnitId);

      res.json({
        success: true,
        data: { adCode },
      });
    } catch (error: any) {
      logger.error('Failed to generate ad code', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'AD_CODE_GENERATE_FAILED',
        },
      });
    }
  }

  /**
   * Get revenue data
   */
  async getRevenueData(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      // Default to last 7 days if no date range provided
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const revenueData = await this.adsenseService.getRevenueData(projectId, userId, {
        startDate: (startDate as string) || defaultStartDate,
        endDate: (endDate as string) || defaultEndDate,
      });

      res.json({
        success: true,
        data: revenueData,
      });
    } catch (error: any) {
      logger.error('Failed to get revenue data', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REVENUE_DATA_FAILED',
        },
      });
    }
  }

  /**
   * Disconnect AdSense account
   */
  async disconnectAdSenseAccount(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      await this.adsenseService.disconnectAdSenseAccount(projectId, userId);

      res.json({
        success: true,
        message: 'AdSense account disconnected successfully',
      });
    } catch (error: any) {
      logger.error('Failed to disconnect AdSense account', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'ADSENSE_DISCONNECT_FAILED',
        },
      });
    }
  }

  /**
   * Get AdSense OAuth URL
   */
  async getAdSenseOAuthUrl(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      // Generate OAuth URL for AdSense
      const scopes = [
        'https://www.googleapis.com/auth/adsense.readonly',
        'https://www.googleapis.com/auth/adsense',
      ];

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${projectId}`;

      res.json({
        success: true,
        data: { authUrl },
      });
    } catch (error: any) {
      logger.error('Failed to get AdSense OAuth URL', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'ADSENSE_OAUTH_URL_FAILED',
        },
      });
    }
  }
}
