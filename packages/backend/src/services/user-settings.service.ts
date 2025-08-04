import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';
import { loggers } from '../utils/logger';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    projectUpdates: boolean;
    communityActivity: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profilePublic: boolean;
    projectsPublic: boolean;
    activityPublic: boolean;
    emailVisible: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  developer: {
    apiAccessEnabled: boolean;
    webhooksEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    projectUpdates: true,
    communityActivity: true,
    marketingEmails: false,
  },
  privacy: {
    profilePublic: true,
    projectsPublic: true,
    activityPublic: true,
    emailVisible: false,
  },
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD',
  },
  developer: {
    apiAccessEnabled: false,
    webhooksEnabled: false,
    analyticsEnabled: true,
  },
};

@injectable()
export class UserSettingsService {
  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Merge with default settings to ensure all fields are present
    const userSettings = user.settings ? JSON.parse(user.settings) : {};
    return this.mergeWithDefaults(userSettings);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    updates: Partial<UserSettings>
  ): Promise<UserSettings> {
    // Get current settings
    const currentSettings = await this.getUserSettings(userId);

    // Merge updates with current settings
    const newSettings = this.deepMerge(currentSettings, updates);

    // Validate settings
    this.validateSettings(newSettings);

    // Update in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: JSON.stringify(newSettings),
        updatedAt: new Date(),
      },
    });

    loggers.business.projectCreated(userId, 'settings_updated');

    return newSettings;
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = { ...DEFAULT_USER_SETTINGS };

    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: JSON.stringify(defaultSettings),
        updatedAt: new Date(),
      },
    });

    loggers.business.projectCreated(userId, 'settings_reset');

    return defaultSettings;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    notifications: Partial<UserSettings['notifications']>
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    
    return this.updateUserSettings(userId, {
      notifications: {
        ...currentSettings.notifications,
        ...notifications,
      },
    });
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    privacy: Partial<UserSettings['privacy']>
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    
    return this.updateUserSettings(userId, {
      privacy: {
        ...currentSettings.privacy,
        ...privacy,
      },
    });
  }

  /**
   * Update preference settings
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserSettings['preferences']>
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    
    // Validate timezone if provided
    if (preferences.timezone) {
      if (!this.isValidTimezone(preferences.timezone)) {
        throw new ValidationError('Invalid timezone');
      }
    }

    // Validate language if provided
    if (preferences.language) {
      if (!this.isValidLanguage(preferences.language)) {
        throw new ValidationError('Invalid language code');
      }
    }

    return this.updateUserSettings(userId, {
      preferences: {
        ...currentSettings.preferences,
        ...preferences,
      },
    });
  }

  /**
   * Update developer settings
   */
  async updateDeveloperSettings(
    userId: string,
    developer: Partial<UserSettings['developer']>
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    
    return this.updateUserSettings(userId, {
      developer: {
        ...currentSettings.developer,
        ...developer,
      },
    });
  }

  /**
   * Export user settings
   */
  async exportSettings(userId: string): Promise<{
    settings: UserSettings;
    exportedAt: string;
    version: string;
  }> {
    const settings = await this.getUserSettings(userId);

    return {
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Import user settings
   */
  async importSettings(
    userId: string,
    importData: {
      settings: Partial<UserSettings>;
      version?: string;
    }
  ): Promise<UserSettings> {
    // Validate import data
    if (!importData.settings) {
      throw new ValidationError('Invalid import data');
    }

    // For now, we only support version 1.0
    if (importData.version && importData.version !== '1.0') {
      throw new ValidationError('Unsupported settings version');
    }

    return this.updateUserSettings(userId, importData.settings);
  }

  /**
   * Get settings schema for validation
   */
  getSettingsSchema(): Record<string, any> {
    return {
      notifications: {
        type: 'object',
        properties: {
          email: { type: 'boolean' },
          push: { type: 'boolean' },
          projectUpdates: { type: 'boolean' },
          communityActivity: { type: 'boolean' },
          marketingEmails: { type: 'boolean' },
        },
      },
      privacy: {
        type: 'object',
        properties: {
          profilePublic: { type: 'boolean' },
          projectsPublic: { type: 'boolean' },
          activityPublic: { type: 'boolean' },
          emailVisible: { type: 'boolean' },
        },
      },
      preferences: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
          language: { type: 'string' },
          timezone: { type: 'string' },
          dateFormat: { type: 'string' },
          currency: { type: 'string' },
        },
      },
      developer: {
        type: 'object',
        properties: {
          apiAccessEnabled: { type: 'boolean' },
          webhooksEnabled: { type: 'boolean' },
          analyticsEnabled: { type: 'boolean' },
        },
      },
    };
  }

  /**
   * Private helper methods
   */
  private mergeWithDefaults(userSettings: UserSettings): UserSettings {
    return this.deepMerge(DEFAULT_USER_SETTINGS, userSettings || {});
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private validateSettings(settings: UserSettings): void {
    // Validate theme
    if (!['light', 'dark', 'system'].includes(settings.preferences.theme)) {
      throw new ValidationError('Invalid theme value');
    }

    // Validate timezone
    if (!this.isValidTimezone(settings.preferences.timezone)) {
      throw new ValidationError('Invalid timezone');
    }

    // Validate language
    if (!this.isValidLanguage(settings.preferences.language)) {
      throw new ValidationError('Invalid language code');
    }

    // Validate currency
    if (!this.isValidCurrency(settings.preferences.currency)) {
      throw new ValidationError('Invalid currency code');
    }
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  private isValidLanguage(language: string): boolean {
    // Basic language code validation (ISO 639-1)
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(language);
  }

  private isValidCurrency(currency: string): boolean {
    // Basic currency code validation (ISO 4217)
    return /^[A-Z]{3}$/.test(currency);
  }
}
