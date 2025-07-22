/**
 * Integration Service
 * Server-side integration management using Supabase Edge Functions
 */

import { supabase } from '@/core/supabase';

export interface IntegrationCheckResult {
  success: boolean;
  userId: string;
  integrations: any[];
  integrationDefinitions: any[];
  count: number;
  timestamp: string;
}

export interface IntegrationActionResult {
  success: boolean;
  message: string;
  integration?: any;
  userId?: string;
}

export class IntegrationService {
  private static instance: IntegrationService;
  private functionUrl: string;

  constructor() {
    this.functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-user-integrations`;
  }

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * Check user integrations server-side
   */
  async checkUserIntegrations(userId: string): Promise<IntegrationCheckResult> {
    try {
      console.log('🔍 [IntegrationService] Checking integrations for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('check-user-integrations', {
        body: {
          userId,
          action: 'check'
        }
      });

      if (error) {
        console.error('❌ [IntegrationService] Function error:', error);
        throw error;
      }

      console.log('✅ [IntegrationService] Integration check result:', data);
      return data as IntegrationCheckResult;

    } catch (error) {
      console.error('❌ [IntegrationService] Check error:', error);
      throw error;
    }
  }

  /**
   * Add HubSpot integration server-side
   */
  async addHubSpotIntegration(userId: string): Promise<IntegrationActionResult> {
    try {
      console.log('🔧 [IntegrationService] Adding HubSpot integration for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('check-user-integrations', {
        body: {
          userId,
          action: 'add-hubspot'
        }
      });

      if (error) {
        console.error('❌ [IntegrationService] Function error:', error);
        throw error;
      }

      console.log('✅ [IntegrationService] HubSpot integration result:', data);
      return data as IntegrationActionResult;

    } catch (error) {
      console.error('❌ [IntegrationService] Add HubSpot error:', error);
      throw error;
    }
  }

  /**
   * List all integrations with details
   */
  async listAllIntegrations(userId: string): Promise<IntegrationCheckResult> {
    try {
      console.log('📋 [IntegrationService] Listing all integrations for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('check-user-integrations', {
        body: {
          userId,
          action: 'list-all'
        }
      });

      if (error) {
        console.error('❌ [IntegrationService] Function error:', error);
        throw error;
      }

      console.log('✅ [IntegrationService] List integrations result:', data);
      return data as IntegrationCheckResult;

    } catch (error) {
      console.error('❌ [IntegrationService] List error:', error);
      throw error;
    }
  }

  /**
   * Clear all user integrations
   */
  async clearUserIntegrations(userId: string): Promise<IntegrationActionResult> {
    try {
      console.log('🗑️ [IntegrationService] Clearing integrations for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('check-user-integrations', {
        body: {
          userId,
          action: 'clear'
        }
      });

      if (error) {
        console.error('❌ [IntegrationService] Function error:', error);
        throw error;
      }

      console.log('✅ [IntegrationService] Clear integrations result:', data);
      return data as IntegrationActionResult;

    } catch (error) {
      console.error('❌ [IntegrationService] Clear error:', error);
      throw error;
    }
  }

  /**
   * Force refresh integrations by clearing and re-adding
   */
  async forceRefreshIntegrations(userId: string): Promise<IntegrationActionResult> {
    try {
      console.log('🔄 [IntegrationService] Force refreshing integrations for user:', userId);
      
      // First clear all integrations
      await this.clearUserIntegrations(userId);
      
      // Then add HubSpot integration
      const result = await this.addHubSpotIntegration(userId);
      
      console.log('✅ [IntegrationService] Force refresh completed');
      return result;

    } catch (error) {
      console.error('❌ [IntegrationService] Force refresh error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance(); 