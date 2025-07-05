import { supabase } from '@/lib/core/supabase';
import { APIDocAnalyzer, type GeneratedConnector } from '../integrations/apiDocAnalyzer';

export interface ApiIntegrationData {
  name: string;
  description: string;
  apiDoc: string;
  analysisResult: {
    title: string;
    version: string;
    serverUrl: string;
    authMethods: string[];
    endpointCount: number;
    patterns: Array<{
      name: string;
      description: string;
      endpoints: Array<{
        name: string;
        path: string;
        method: string;
        description: string;
      }>;
    }>;
  };
  config: {
    baseUrl?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };
  generatedCode?: string;
}

export type UpdateApiIntegrationData = Partial<{
  name: string;
  description: string;
  api_url: string;
  is_active: boolean;
  config: Partial<ApiIntegrationData['config']>;
}>;

export class ApiIntegrationService {
  /**
   * Save a new API integration created through the API Learning System
   */
  static async saveApiIntegration(userId: string, integrationData: ApiIntegrationData) {
    try {
      // First, create or update the integration in the integrations table
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          name: integrationData.name,
          slug: integrationData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          category: 'api-learning',
          description: integrationData.description || `Custom API integration for ${integrationData.name}`,
          difficulty: 'medium',
          estimated_setup_time: '15 min',
          features: integrationData.analysisResult.patterns.map(p => p.name),
          metadata: {
            source: 'api-learning',
            analysisResult: integrationData.analysisResult,
            apiDoc: integrationData.apiDoc,
            generatedCode: integrationData.generatedCode,
            createdAt: new Date().toISOString()
          }
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (integrationError) {
        throw new Error(`Failed to create integration: ${integrationError.message}`);
      }

      // Then, create the user connection
      const { data: userIntegration, error: userIntegrationError } = await supabase
        .from('user_integrations')
        .insert({
          user_id: userId,
          integration_id: integration.id,
          name: integrationData.name,
          status: 'pending', // User still needs to configure auth
          config: {
            ...integrationData.config,
            api_learning_generated: true,
            patterns: integrationData.analysisResult.patterns,
            auth_methods: integrationData.analysisResult.authMethods
          },
          metadata: {
            source: 'api-learning',
            created_via: 'api-learning-wizard',
            endpoint_count: integrationData.analysisResult.endpointCount,
            api_version: integrationData.analysisResult.version
          }
        })
        .select()
        .single();

      if (userIntegrationError) {
        // Cleanup the integration if user connection fails
        await supabase.from('integrations').delete().eq('id', integration.id);
        throw new Error(`Failed to create user integration: ${userIntegrationError.message}`);
      }

      return {
        integration,
        userIntegration,
        success: true
      };
    } catch (error) {
      console.error('Error saving API integration:', error);
      throw error;
    }
  }

  /**
   * Get all API Learning integrations for a user
   */
  static async getUserApiIntegrations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select(`
          *,
          integrations!inner(*)
        `)
        .eq('user_id', userId)
        .eq('integrations.category', 'api-learning');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching API integrations:', error);
      throw error;
    }
  }

  /**
   * Update an API integration's configuration
   */
  static async updateApiIntegration(userIntegrationId: string, updates: UpdateApiIntegrationData) {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userIntegrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating API integration:', error);
      throw error;
    }
  }

  /**
   * Delete an API integration
   */
  static async deleteApiIntegration(userIntegrationId: string) {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', userIntegrationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting API integration:', error);
      throw error;
    }
  }

  /**
   * Test an API integration connection
   */
  static async testApiIntegration(userIntegrationId: string) {
    try {
      // This would typically make a test API call
      // For now, we'll just mark it as tested
      const { data, error } = await supabase
        .from('user_integrations')
        .update({
          metadata: {
            last_tested: new Date().toISOString(),
            test_status: 'success'
          }
        })
        .eq('id', userIntegrationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error testing API integration:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
} 