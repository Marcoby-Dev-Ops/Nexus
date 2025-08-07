/**
 * Integration Service
 * 
 * Provides a unified interface for managing user integrations
 * Wraps database operations and provides consistent error handling
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { sessionUtils } from '@/lib/supabase-compatibility';

// Integration Platform Schema
export interface IntegrationPlatform {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api_key' | 'webhook';
  scopes: string[];
  features: string[];
}

// User Integration Schema
export interface UserIntegration {
  id: string;
  user_id: string;
  integration_id: string | null;
  integration_name: string;
  status: string | null;
  config: any;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Integration Service
 * 
 * Provides a unified interface for managing user integrations
 */
export class IntegrationService extends BaseService {
  /**
   * Validate authentication and session before making database calls
   */
  private async validateAuth(): Promise<{ userId: string; error?: string }> {
    try {
      // Get session with retries
      const { session, error } = await sessionUtils.getSession();
      
      if (error || !session) {
        this.logger.error('Authentication validation failed', { error });
        return { userId: '', error: 'No valid session found' };
      }

      if (!session.user?.id) {
        this.logger.error('Session exists but no user ID found');
        return { userId: '', error: 'Invalid session - no user ID' };
      }

      // Validate session is not expired
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        this.logger.error('Session has expired');
        return { userId: '', error: 'Session expired' };
      }

      return { userId: session.user.id };
    } catch (error) {
      this.logger.error('Unexpected error during auth validation', { error });
      return { userId: '', error: 'Authentication validation failed' };
    }
  }

  /**
   * Get user integrations
   */
  async getUserIntegrations(userId?: string): Promise<ServiceResponse<UserIntegration[]>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integrations
      const { data: userIntegrations, error: integrationsError } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (integrationsError) {
        return { data: null, error: integrationsError };
      }

      return { data: userIntegrations || [], error: null };
    }, `get user integrations for user ${userId}`);
  }

  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<ServiceResponse<IntegrationPlatform[]>> {
    return this.executeDbOperation(async () => {
      // Get available platforms from integrations table
      const { data: platforms, error: platformsError } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (platformsError) {
        return { data: null, error: platformsError };
      }

      // Transform to expected format
      const transformedPlatforms = (platforms || []).map(platform => ({
        name: platform.slug,
        displayName: platform.name,
        description: platform.description || '',
        icon: platform.icon_url || '🔗',
        authType: 'api_key' as const, // Default auth type since it's not in the schema
        scopes: [], // Default empty array since it's not in the schema
        features: [], // Default empty array since it's not in the schema
      }));

      return { data: transformedPlatforms, error: null };
    }, 'get available platforms');
  }

  /**
   * Connect integration
   */
  async connectIntegration(userId: string, platform: string, credentials: any): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details
      const { data: integration, error: integrationError } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('slug', platform)
        .single();

      if (integrationError || !integration) {
        return { data: null, error: 'Integration not found' };
      }

      // Create or update user integration
      const { data: userIntegration, error: upsertError } = await this.supabase
        .from('user_integrations')
        .upsert({
          user_id: targetUserId,
          integration_id: integration.id,
          integration_name: integration.name,
          status: 'active',
          config: credentials,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (upsertError) {
        return { data: null, error: upsertError };
      }

      return { data: { success: true }, error: null };
    }, `connect integration ${platform} for user ${userId}`);
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(userId: string, platform: string): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details
      const { data: integration, error: integrationError } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('slug', platform)
        .single();

      if (integrationError || !integration) {
        return { data: null, error: 'Integration not found' };
      }

      // Update user integration status
      const { error: updateError } = await this.supabase
        .from('user_integrations')
        .update({
          status: 'inactive',
          config: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId)
        .eq('integration_id', integration.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: { success: true }, error: null };
    }, `disconnect integration ${platform} for user ${userId}`);
  }

  /**
   * Sync integration
   */
  async syncIntegration(userId: string, platform: string): Promise<ServiceResponse<{ success: boolean; recordsProcessed: number; errors: string[] }>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details
      const { data: integration, error: integrationError } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('slug', platform)
        .single();

      if (integrationError || !integration) {
        return { data: null, error: 'Integration not found' };
      }

      // Update last sync time
      const { error: updateError } = await this.supabase
        .from('user_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId)
        .eq('integration_id', integration.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      // For now, return mock sync results
      // In a real implementation, this would trigger actual data sync
      return { 
        data: { 
          success: true, 
          recordsProcessed: 0, 
          errors: [] 
        }, 
        error: null 
      };
    }, `sync integration ${platform} for user ${userId}`);
  }
}

// Export singleton instance
export const integrationService = new IntegrationService(); 