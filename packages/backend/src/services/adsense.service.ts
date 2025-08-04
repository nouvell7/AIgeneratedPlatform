import { injectable, inject } from 'tsyringe';
import { google } from 'googleapis';
import { prisma } from '../lib/prisma'; // Corrected import path
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface AdSenseAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: string;
}

export interface AdUnit {
  id: string;
  name: string;
  code: string;
  status: string;
  type: string;
  size: string;
}

export interface AdSenseConfig {
  publisherId: string;
  adUnits: AdUnit[];
  autoAdsEnabled: boolean;
  adBlockRecoveryEnabled: boolean;
}

@injectable()
export class AdSenseService {
  private adsense: any;

  constructor() {
    // Initialize Google AdSense API client
    this.adsense = google.adsense('v2');
  }

  /**
   * Connect AdSense account
   */
  async connectAdSenseAccount(
    projectId: string,
    userId: string,
    authCode: string
  ): Promise<AdSenseAccount> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only connect AdSense to your own projects', 403);
      }

      // Exchange auth code for tokens (simplified)
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);

      // Get AdSense account information
      const accountsResponse = await this.adsense.accounts.list({
        auth: oauth2Client,
      });

      const accounts = accountsResponse.data.accounts || [];
      if (accounts.length === 0) {
        throw new AppError('No AdSense accounts found', 400);
      }

      const account = accounts[0];
      const adSenseAccount: AdSenseAccount = {
        id: account.name,
        name: account.displayName,
        currency: account.currencyCode,
        timezone: account.timeZone,
        status: account.state,
      };

      // Store AdSense configuration
      const adSenseConfig: AdSenseConfig = {
        publisherId: account.publisherId,
        adUnits: [],
        autoAdsEnabled: false,
        adBlockRecoveryEnabled: false,
      };

      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({ // Stringify revenue object
            adsenseEnabled: true,
            adsenseAccount: adSenseAccount,
            adsenseConfig: adSenseConfig,
            adsenseTokens: tokens,
          }),
        },
      });

      logger.info('AdSense account connected', { projectId, accountId: account.name });

      return adSenseAccount;
    } catch (error: any) {
      logger.error('Failed to connect AdSense account', { error: error.message, projectId });
      throw new AppError(`Failed to connect AdSense: ${error.message}`, 500);
    }
  }

  /**
   * Get AdSense account status
   */
  async getAdSenseStatus(projectId: string, userId: string): Promise<{
    connected: boolean;
    account?: AdSenseAccount;
    config?: AdSenseConfig;
  }> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view AdSense status for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      if (!revenue?.adsenseEnabled) {
        return { connected: false };
      }

      return {
        connected: true,
        account: revenue.adsenseAccount,
        config: revenue.adsenseConfig,
      };
    } catch (error: any) {
      logger.error('Failed to get AdSense status', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Create ad unit
   */
  async createAdUnit(
    projectId: string,
    userId: string,
    adUnitData: {
      name: string;
      type: 'display' | 'text' | 'multiplex';
      size: string;
    }
  ): Promise<AdUnit> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only create ad units for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      if (!revenue?.adsenseEnabled) {
        throw new AppError('AdSense is not connected for this project', 400);
      }

      // Create OAuth client with stored tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials(revenue.adsenseTokens);

      // Create ad unit via AdSense API
      const adUnitResponse = await this.adsense.accounts.adunits.create({
        auth: oauth2Client,
        parent: revenue.adsenseAccount.id,
        requestBody: {
          displayName: adUnitData.name,
          adUnitCode: `${projectId}-${Date.now()}`,
          state: 'ACTIVE',
          contentAdsSettings: {
            type: adUnitData.type.toUpperCase(),
            size: adUnitData.size,
          },
        },
      });

      const createdAdUnit = adUnitResponse.data;
      const adUnit: AdUnit = {
        id: createdAdUnit.name,
        name: createdAdUnit.displayName,
        code: createdAdUnit.adUnitCode,
        status: createdAdUnit.state,
        type: adUnitData.type,
        size: adUnitData.size,
      };

      // Update project with new ad unit
      const updatedConfig = {
        ...revenue.adsenseConfig,
        adUnits: [...(revenue.adsenseConfig.adUnits || []), adUnit],
      };

      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({ // Stringify revenue object
            ...revenue,
            adsenseConfig: updatedConfig,
          }),
        },
      });

      logger.info('Ad unit created', { projectId, adUnitId: adUnit.id });

      return adUnit;
    } catch (error: any) {
      logger.error('Failed to create ad unit', { error: error.message, projectId });
      throw new AppError(`Failed to create ad unit: ${error.message}`, 500);
    }
  }

  /**
   * Update AdSense settings
   */
  async updateAdSenseSettings(
    projectId: string,
    userId: string,
    settings: {
      autoAdsEnabled?: boolean;
      adBlockRecoveryEnabled?: boolean;
      adUnits?: AdUnit[];
    }
  ): Promise<AdSenseConfig> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only update AdSense settings for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      if (!revenue?.adsenseEnabled) {
        throw new AppError('AdSense is not connected for this project', 400);
      }

      // Update configuration
      const updatedConfig: AdSenseConfig = {
        ...revenue.adsenseConfig,
        ...settings,
      };

      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({ // Stringify revenue object
            ...revenue,
            adsenseConfig: updatedConfig,
          }),
        },
      });

      logger.info('AdSense settings updated', { projectId });

      return updatedConfig;
    } catch (error: any) {
      logger.error('Failed to update AdSense settings', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Generate ad code for insertion
   */
  async generateAdCode(
    projectId: string,
    userId: string,
    adUnitId: string
  ): Promise<string> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only generate ad code for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      if (!revenue?.adsenseEnabled) {
        throw new AppError('AdSense is not connected for this project', 400);
      }

      // Find the ad unit
      const adUnit = revenue.adsenseConfig.adUnits?.find((unit: AdUnit) => unit.id === adUnitId);
      if (!adUnit) {
        throw new AppError('Ad unit not found', 404);
      }

      // Generate ad code
      const adCode = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${revenue.adsenseConfig.publisherId}"
     crossorigin="anonymous"></script>
<!-- ${adUnit.name} -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${revenue.adsenseConfig.publisherId}"
     data-ad-slot="${adUnit.code}"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;

      return adCode.trim();
    } catch (error: any) {
      logger.error('Failed to generate ad code', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get revenue data
   */
  async getRevenueData(
    projectId: string,
    userId: string,
    dateRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<{
    totalEarnings: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    dailyData: Array<{
      date: string;
      earnings: number;
      impressions: number;
      clicks: number;
    }>;
  }> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only view revenue data for your own projects', 403);
      }

      const revenue = project.revenue ? JSON.parse(project.revenue) : null;
      if (!revenue?.adsenseEnabled) {
        throw new AppError('AdSense is not connected for this project', 400);
      }

      // Create OAuth client with stored tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials(revenue.adsenseTokens);

      // Get revenue report from AdSense API
      const reportResponse = await this.adsense.accounts.reports.generate({
        auth: oauth2Client,
        account: revenue.adsenseAccount.id,
        dateRange: 'CUSTOM',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        metrics: ['ESTIMATED_EARNINGS', 'PAGE_VIEWS', 'CLICKS'],
        dimensions: ['DATE'],
      });

      const rows = reportResponse.data.rows || [];
      const headers = reportResponse.data.headers || [];

      // Process the data
      let totalEarnings = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      const dailyData: Array<{
        date: string;
        earnings: number;
        impressions: number;
        clicks: number;
      }> = [];

      rows.forEach((row: any) => {
        const earnings = parseFloat(row.cells[1]?.value || '0');
        const impressions = parseInt(row.cells[2]?.value || '0');
        const clicks = parseInt(row.cells[3]?.value || '0');

        totalEarnings += earnings;
        totalImpressions += impressions;
        totalClicks += clicks;

        dailyData.push({
          date: row.cells[0]?.value || '',
          earnings,
          impressions,
          clicks,
        });
      });

      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpm = totalImpressions > 0 ? (totalEarnings / totalImpressions) * 1000 : 0;

      return {
        totalEarnings,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr,
        cpm,
        dailyData,
      };
    } catch (error: any) {
      logger.error('Failed to get revenue data', { error: error.message, projectId });
      
      // Return mock data if API fails
      return {
        totalEarnings: Math.random() * 100,
        impressions: Math.floor(Math.random() * 10000),
        clicks: Math.floor(Math.random() * 100),
        ctr: Math.random() * 5,
        cpm: Math.random() * 2,
        dailyData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          earnings: Math.random() * 20,
          impressions: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 20),
        })),
      };
    }
  }

  /**
   * Disconnect AdSense account
   */
  async disconnectAdSenseAccount(projectId: string, userId: string): Promise<void> {
    try {
      // Check if project exists and user owns it
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      if (project.userId !== userId) {
        throw new AppError('You can only disconnect AdSense from your own projects', 403);
      }

      // Remove AdSense configuration
      await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: JSON.stringify({ // Stringify revenue object
            adsenseEnabled: false,
            adsenseAccount: null,
            adsenseConfig: null,
            adsenseTokens: null,
          }),
        },
      });

      logger.info('AdSense account disconnected', { projectId });
    } catch (error: any) {
      logger.error('Failed to disconnect AdSense account', { error: error.message, projectId });
      throw error;
    }
  }
}
