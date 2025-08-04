import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { UserSettingsService, UserSettings } from '../services/user-settings.service';
import { validateRequest } from '../lib/validation';
import { z } from 'zod';

// Validation schemas for settings endpoints
const notificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  communityActivity: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

const privacySettingsSchema = z.object({
  profilePublic: z.boolean().optional(),
  projectsPublic: z.boolean().optional(),
  activityPublic: z.boolean().optional(),
  emailVisible: z.boolean().optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code').optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Invalid currency code').optional(),
});

const developerSettingsSchema = z.object({
  apiAccessEnabled: z.boolean().optional(),
  webhooksEnabled: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional(),
});

const fullSettingsSchema = z.object({
  notifications: notificationSettingsSchema.optional(),
  privacy: privacySettingsSchema.optional(),
  preferences: preferencesSchema.optional(),
  developer: developerSettingsSchema.optional(),
});

const importSettingsSchema = z.object({
  settings: fullSettingsSchema,
  version: z.string().optional(),
});

@injectable()
export class UserSettingsController {
  constructor(@inject(UserSettingsService) private userSettingsService: UserSettingsService) {}

  /**
   * Get user settings
   * GET /users/settings
   */
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        });
      }

      const settings = await this.userSettingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user settings
   * PUT /users/settings
   */
  updateSettings = [
    validateRequest({ body: fullSettingsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.updateUserSettings(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Settings updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Reset settings to defaults
   * POST /users/settings/reset
   */
  resetSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        });
      }

      const settings = await this.userSettingsService.resetSettings(userId);

      res.json({
        success: true,
        data: { settings },
        message: 'Settings reset to defaults',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update notification settings
   * PUT /users/settings/notifications
   */
  updateNotifications = [
    validateRequest({ body: notificationSettingsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.updateNotificationSettings(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Notification settings updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update privacy settings
   * PUT /users/settings/privacy
   */
  updatePrivacy = [
    validateRequest({ body: privacySettingsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.updatePrivacySettings(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Privacy settings updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update preferences
   * PUT /users/settings/preferences
   */
  updatePreferences = [
    validateRequest({ body: preferencesSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.updatePreferences(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Preferences updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update developer settings
   * PUT /users/settings/developer
   */
  updateDeveloper = [
    validateRequest({ body: developerSettingsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.updateDeveloperSettings(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Developer settings updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Export user settings
   * GET /users/settings/export
   */
  exportSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        });
      }

      const exportData = await this.userSettingsService.exportSettings(userId);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="user-settings.json"');

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Import user settings
   * POST /users/settings/import
   */
  importSettings = [
    validateRequest({ body: importSettingsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const settings = await this.userSettingsService.importSettings(userId, req.body);

        res.json({
          success: true,
          data: { settings },
          message: 'Settings imported successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get settings schema
   * GET /users/settings/schema
   */
  getSchema = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = this.userSettingsService.getSettingsSchema();

      res.json({
        success: true,
        data: { schema },
      });
    } catch (error) {
      next(error);
    }
  };
}
