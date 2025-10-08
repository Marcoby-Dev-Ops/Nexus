import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction, callPublicEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

export interface DiscoveredService {
  id: string;
  name: string;
  description: string;
  available: boolean;
  icon: string;
  category: string;
  scopes: string[];
  endpoint?: string;
  data?: any;
}

export interface ServiceDiscoveryResponse {
  success: boolean;
  data?: DiscoveredService[];
  error?: string;
}

/**
 * Microsoft 365 Discovery Service
 * Handles discovery and setup of available Microsoft 365 services
 */
export class Microsoft365DiscoveryService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Discover available Microsoft 365 services for the current user
   */
  async discoverServices(): Promise<ServiceDiscoveryResponse> {
    let user: any = null;
    
    try {
      // Get the current user from Authentik session
      const result = await authentikAuthService.getSession();
      user = result.data?.user;
      if (!user?.id) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Get Microsoft 365 integration with access token
      const { data: integrations, error: integrationError } = await selectData('user_integrations', 'access_token, status', {
        user_id: user.id,
        integration_slug: 'microsoft365'
      });

      const integration = integrations && integrations.length > 0 ? integrations[0] : null;

      if (integrationError || !integration) {
        return {
          success: false,
          error: 'Microsoft 365 integration not found'
        };
      }

      if ((integration as any).status !== 'active') {
        return {
          success: false,
          error: 'Microsoft 365 integration not connected'
        };
      }

      if (!(integration as any).access_token) {
        return {
          success: false,
          error: 'No access token available for Microsoft 365'
        };
      }

      // Use the callPublicEdgeFunction helper to call the discovery edge function
      // This bypasses authentication since we're passing the Microsoft 365 access token in the payload
      const response = await callPublicEdgeFunction<{
        success: boolean;
        data?: DiscoveredService[];
        error?: string;
      }>('microsoft_services_discovery', {
        accessToken: (integration as any).access_token
      });

      if (!response.success) {
        logger.error('Edge function call failed', { error: response.error, userId: user.id });
        return {
          success: false,
          error: `Failed to discover Microsoft 365 services: ${response.error}`
        };
      }

      logger.info('Microsoft 365 service discovery completed', {
        userId: user.id,
        servicesFound: response.data?.length || 0,
        availableServices: response.data?.filter(s => s.available).length || 0
      });

      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      logger.error('Service discovery failed', { error, userId: user?.id });
      return {
        success: false,
        error: `Failed to discover Microsoft 365 services: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Set up selected Microsoft 365 services
   */
  async setupServices(selectedServices: string[]): Promise<ServiceResponse<{ success: boolean }>> {
    return this.executeDbOperation(async () => {
      try {
        const userResult = await authentikAuthService.getSession();
        const user = userResult.data?.user;
        if (!user?.id) {
          return this.createErrorResponse('User not authenticated');
        }

        // Get current Microsoft 365 integration
        const { data: integrations, error: integrationError } = await selectData('user_integrations', 'id, config', {
          user_id: user.id,
          integration_slug: 'microsoft365'
        });

        const integration = integrations && integrations.length > 0 ? integrations[0] : null;

        if (integrationError || !integration) {
          return this.createErrorResponse('Microsoft 365 integration not found');
        }

        // Update integration config with selected services
        const currentConfig = (integration as any).config || {};
        const updatedConfig = {
          ...currentConfig,
          enabledServices: selectedServices,
          servicesSetupAt: new Date().toISOString()
        };

        const { error: updateError } = await updateOne('user_integrations', (integration as any).id, { 
          config: updatedConfig 
        });

        if (updateError) {
          return this.createErrorResponse('Failed to update integration configuration');
        }

        // Log the service setup
        logger.info('Microsoft 365 services setup completed', {
          userId: user.id,
          selectedServices,
          integrationId: (integration as any).id
        });

        return this.createSuccessResponse({ success: true });
      } catch (error) {
        return this.handleError(error, 'Failed to setup Microsoft 365 services');
      }
    }, 'setup Microsoft 365 services');
  }

  /**
   * Get currently enabled services for the user
   */
  async getEnabledServices(): Promise<ServiceResponse<string[]>> {
    return this.executeDbOperation(async () => {
      try {
        const authResult = await authentikAuthService.getSession();
        const user = authResult.data?.user;
        if (!user?.id) {
          return this.createErrorResponse('User not authenticated');
        }

        const { data: integrations, error: integrationError } = await selectData('user_integrations', 'config', {
          user_id: user.id,
          integration_slug: 'microsoft365'
        });

        const integration = integrations && integrations.length > 0 ? integrations[0] : null;

        if (integrationError || !integration) {
          return this.createSuccessResponse([]);
        }

        const enabledServices = (integration as any).config?.enabledServices || [];
        return this.createSuccessResponse(enabledServices);
      } catch (error) {
        return this.handleError(error, 'Failed to get enabled Microsoft 365 services');
      }
    }, 'get enabled Microsoft 365 services');
  }

  /**
   * Check if a specific service is enabled
   */
  async isServiceEnabled(serviceId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const enabledServicesResult = await this.getEnabledServices();
        if (!enabledServicesResult.success) {
          return this.createErrorResponse('Failed to get enabled services');
        }

        const isEnabled = enabledServicesResult.data?.includes(serviceId) || false;
        return this.createSuccessResponse(isEnabled);
      } catch (error) {
        return this.handleError(error, `Failed to check if service ${serviceId} is enabled`);
      }
    }, `check if service ${serviceId} is enabled`);
  }
}

export const microsoft365DiscoveryService = new Microsoft365DiscoveryService();
