/**
 * userN8nConfig.ts
 * Service for managing user-specific n8n configurations
 * Handles storage, retrieval, and validation of n8n connection settings
 */
import { supabase } from '@/core/supabase';

export interface UserN8nConfig {
  id?: string;
  userId: string;
  instanceName?: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface N8nConfigurationTableRow {
  id: string;
  userid: string;
  instance_name?: string;
  baseurl: string;
  apikey: string;
  isactive: boolean;
  created_at?: string;
  updated_at?: string;
}

class UserN8nConfigService {
  private currentConfig: UserN8nConfig | null = null;
  private configCache = new Map<string, UserN8nConfig>();
  private isN8nEnabled = false; // Disable n8n by default until user wants to configure it

  /**
   * Enable n8n integration for the user
   */
  enableN8nIntegration(): void {
    this.isN8nEnabled = true;
  }

  /**
   * Disable n8n integration for the user
   */
  disableN8nIntegration(): void {
    this.isN8nEnabled = false;
    this.configCache.clear();
    this.currentConfig = null;
  }

  /**
   * Check if n8n integration is enabled
   */
  isEnabled(): boolean {
    return this.isN8nEnabled;
  }

  /**
   * Get the active n8n configuration for the current user
   * Only attempts to fetch if n8n integration is enabled
   */
  async getCurrentUserConfig(): Promise<UserN8nConfig | null> {
    // Return null immediately if n8n integration is disabled
    if (!this.isN8nEnabled) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('No authenticated user found');
        return null;
      }

      // Check cache first
      const cached = this.configCache.get(user.id);
      if (cached) {
        return cached;
      }

      // Try to get from database first
      const dbConfig = await this.getFromDatabase(user.id);
      if (dbConfig) {
        this.configCache.set(user.id, dbConfig);
        this.currentConfig = dbConfig;
        return dbConfig;
      }

      // Fallback to localStorage
      const stored = this.getFromLocalStorage(user.id);
      if (stored) {
        this.configCache.set(user.id, stored);
        this.currentConfig = stored;
        return stored;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get current user config: ', error);
      return null;
    }
  }

  /**
   * Save n8n configuration for the current user
   */
  async saveUserConfig(config: Omit<UserN8nConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      // First deactivate any existing configurations
      await supabase
        .from('n8n_configurations')
        .update({ isactive: false })
        .eq('user_id', user.id);

      // Insert new configuration
      const { data, error } = await supabase
        .from('n8n_configurations')
        .insert([
          {
            userid: user.id,
            instancename: config.instanceName || 'My n8n Instance',
            baseurl: config.baseUrl.replace(/\/$/, ''),
            apikey: config.apiKey,
            isactive: config.isActive
          }
        ])
        .select()
        .single<N8nConfigurationTableRow>();

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Database save failed, falling back to localStorage: ', error);
        // Fallback to localStorage if database save fails
        const fullConfig: UserN8nConfig = {
          ...config,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          id: `${user.id}-${Date.now()}`
        };
        this.saveToLocalStorage(user.id, fullConfig);
        this.configCache.set(user.id, fullConfig);
        this.currentConfig = fullConfig;
        return true;
      }

      if (!data) {
        throw new Error('Failed to save configuration to database and did not receive data.');
      }
      
      // Convert database response to UserN8nConfig format
      const fullConfig: UserN8nConfig = {
        id: data.id,
        userId: data.user_id,
        instanceName: data.instance_name || undefined,
        baseUrl: data.base_url,
        apiKey: data.api_key,
        isActive: data.is_active || false,
        createdAt: data.created_at || undefined,
        updatedAt: data.updated_at || undefined
      };

      // Update cache
      this.configCache.set(user.id, fullConfig);
      this.currentConfig = fullConfig;

      // Also save to localStorage as backup
      this.saveToLocalStorage(user.id, fullConfig);

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to save user config: ', error);
      return false;
    }
  }

  /**
   * Test connection to n8n instance
   */
  async testConnection(baseUrl: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Clean up URL
      const cleanUrl = baseUrl.replace(/\/$/, '');
      
      // Test health endpoint first
      const healthResponse = await fetch(`${cleanUrl}/healthz`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!healthResponse.ok) {
        return { success: false, error: 'n8n instance is not accessible' };
      }

      // Test API key with workflows endpoint
      const apiResponse = await fetch(`${cleanUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!apiResponse.ok) {
        if (apiResponse.status === 401) {
          return { success: false, error: 'Invalid API key' };
        } else if (apiResponse.status === 403) {
          return { success: false, error: 'API key does not have sufficient permissions' };
        } else {
          return { success: false, error: `API request failed: ${apiResponse.status}` };
        }
      }

      return { success: true };
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Connection test failed: ', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to n8n instance'
      };
    }
  }

  /**
   * Get all configurations for current user
   */
  async getUserConfigs(): Promise<UserN8nConfig[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];

      const stored = this.getFromLocalStorage(user.id);
      return stored ? [stored] : [];
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get user configs: ', error);
      return [];
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(configId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return false;

      // Remove from localStorage
      this.removeFromLocalStorage(user.id);
      
      // Clear cache
      this.configCache.delete(user.id);
      this.currentConfig = null;

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to delete config: ', error);
      return false;
    }
  }

  /**
   * Check if user has any n8n configuration
   */
  async hasConfiguration(): Promise<boolean> {
    const config = await this.getCurrentUserConfig();
    return config !== null;
  }

  /**
   * Clear all cached configurations
   */
  clearCache(): void {
    this.configCache.clear();
    this.currentConfig = null;
  }

  // Private methods for localStorage handling

  private getStorageKey(userId: string): string {
    return `nexus_n8n_config_${userId}`;
  }

  private saveToLocalStorage(userId: string, config: UserN8nConfig): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to save to localStorage: ', error);
    }
  }

  private getFromLocalStorage(userId: string): UserN8nConfig | null {
    try {
      const key = this.getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as UserN8nConfig;
      }
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get from localStorage: ', error);
      return null;
    }
  }

  private removeFromLocalStorage(userId: string): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.removeItem(key);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to remove from localStorage: ', error);
    }
  }

  // Database methods for Supabase persistence
  
  private async saveToDatabase(config: UserN8nConfig): Promise<void> {
    const { error } = await (supabase as any)
      .from('n8n_configurations')
      .upsert([
        {
          id: config.id,
          userid: config.userId,
          instancename: config.instanceName,
          baseurl: config.baseUrl,
          apikey: config.apiKey,
          isactive: config.isActive
        }
      ]);
      
    if (error) {
      throw error;
    }
  }

  private async getFromDatabase(userId: string): Promise<UserN8nConfig | null> {
    try {
      const { data, error } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single<N8nConfigurationTableRow>();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        instanceName: data.instance_name,
        baseUrl: data.base_url,
        apiKey: data.api_key,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (dbError) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching from database: ', dbError);
      return null;
    }
  }
}

// Export singleton instance
export const userN8nConfigService = new UserN8nConfigService();

// Export types and service
export default userN8nConfigService; 