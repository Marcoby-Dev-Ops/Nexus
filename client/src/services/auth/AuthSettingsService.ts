import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectOne, upsertOne, deleteOne } from '@/lib/api-client';
export interface AuthSettings {
  id?: string;
  user_id: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  darkMode: boolean;
  autoSave: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  language: string;
  timezone: string;
  profileVisibility: 'public' | 'private' | 'friends';
  dataCollection: boolean;
  locationServices: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateSettingsRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  darkMode?: boolean;
  autoSave?: boolean;
  twoFactorAuth?: boolean;
  sessionTimeout?: number;
  language?: string;
  timezone?: string;
  profileVisibility?: 'public' | 'private' | 'friends';
  dataCollection?: boolean;
  locationServices?: boolean;
}

export class AuthSettingsService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Get user settings by user ID
   */
  async getUserSettings(userId: string): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('getUserSettings', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const resp = await selectOne<AuthSettings>('user_settings', { user_id: userId });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to get user settings');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `get user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'getUserSettings');
    }
  }

  /**
   * Create or update user settings
   */
  async upsertUserSettings(userId: string, settings: Partial<AuthSettings>): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('upsertUserSettings', { userId, settings });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const payload = { user_id: userId, ...settings, updated_at: new Date().toISOString() } as Record<string, unknown>;
        // Use upsert on user_id
        const resp = await upsertOne<AuthSettings>('user_settings', payload, 'user_id');
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to upsert user settings');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `upsert user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'upsertUserSettings');
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, updates: UpdateSettingsRequest): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('updateUserSettings', { userId, updates });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const payload = { user_id: userId, ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>;
        const resp = await upsertOne<AuthSettings>('user_settings', payload, 'user_id');
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to update user settings');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `update user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'updateUserSettings');
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting(userId: string, key: keyof UpdateSettingsRequest, value: any): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('updateSetting', { userId, key, value });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    if (!key || typeof key !== 'string') {
      return this.createErrorResponse('Setting key is required');
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const payload = { user_id: userId, [key]: value, updated_at: new Date().toISOString() } as Record<string, unknown>;
        const resp = await upsertOne<AuthSettings>('user_settings', payload, 'user_id');
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to update setting');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `updateSetting user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'updateSetting');
    }
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(userId: string): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('resetUserSettings', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const defaultSettings: Partial<AuthSettings> = {
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        darkMode: false,
        autoSave: true,
        twoFactorAuth: false,
        sessionTimeout: 30,
        language: 'en',
        timezone: 'UTC',
        profileVisibility: 'public',
        dataCollection: true,
        locationServices: false,
      };

      return await this.executeDbOperation(async () => {
        const payload = { user_id: userId, ...defaultSettings, updated_at: new Date().toISOString() } as Record<string, unknown>;
        const resp = await upsertOne<AuthSettings>('user_settings', payload, 'user_id');
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to reset user settings');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `reset user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'resetUserSettings');
    }
  }

  /**
   * Delete user settings
   */
  async deleteUserSettings(userId: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('deleteUserSettings', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const resp = await deleteOne('user_settings', { user_id: userId });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to delete user settings');
        return { data: true, error: null, success: true };
      }, `delete user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'deleteUserSettings');
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings(): AuthSettings {
    return {
      user_id: '',
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      darkMode: false,
      autoSave: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      language: 'en',
      timezone: 'UTC',
      profileVisibility: 'public',
      dataCollection: true,
      locationServices: false,
    };
  }

  /**
   * Export user settings
   */
  async exportUserSettings(userId: string): Promise<ServiceResponse<{
    settings: AuthSettings;
    exportedAt: string;
    format: string;
  }>> {
    this.logMethodCall('exportUserSettings', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const resp = await selectOne<AuthSettings>('user_settings', { user_id: userId });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to export user settings');
        return { data: { settings: resp.data as AuthSettings, exportedAt: new Date().toISOString(), format: 'json' }, error: null, success: true } as ServiceResponse<any>;
      }, `export user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'exportUserSettings');
    }
  }

  /**
   * Import user settings
   */
  async importUserSettings(userId: string, settingsData: Partial<AuthSettings>): Promise<ServiceResponse<AuthSettings>> {
    this.logMethodCall('importUserSettings', { userId, settingsData });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    if (!settingsData || typeof settingsData !== 'object') {
      return this.createErrorResponse('Settings data is required');
    }
    
    try {
      return await this.executeDbOperation(async () => {
        const payload = { user_id: userId, ...settingsData, updated_at: new Date().toISOString() } as Record<string, unknown>;
        const resp = await upsertOne<AuthSettings>('user_settings', payload, 'user_id');
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to import user settings');
        return { data: resp.data as AuthSettings, error: null, success: true };
      }, `import user_settings ${userId}`);
    } catch (error) {
      return this.handleError(error, 'importUserSettings');
    }
  }
}

export const authSettingsService = new AuthSettingsService(); 
