import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

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
    super('microsoft365-discovery');
  }

  /**
   * Discover available Microsoft 365 services for the current user
   */
  async discoverServices(): Promise<ServiceDiscoveryResponse> {
    return this.executeDbOperation(async () => {
      try {
        // Get the current user from Authentik session
        const result = await authentikAuthService.getSession();
        const user = result.data?.user;
        if (!user?.id) {
          return this.createErrorResponse('User not authenticated');
        }

        // Get Microsoft 365 integration with access token
        const { data: integration, error: integrationError } = await selectOne('user_integrations', 'access_token, status', {
          user_id: user.id,
          integration_slug: 'microsoft365'
        });

        if (integrationError || !integration) {
          return this.createErrorResponse('Microsoft 365 integration not found');
        }

        if (integration.status !== 'connected') {
          return this.createErrorResponse('Microsoft 365 integration not connected');
        }

        if (!integration.access_token) {
          return this.createErrorResponse('No access token available for Microsoft 365');
        }

        const response = await fetch(`${import.meta.env.VITE_POSTGRES_URL}/functions/v1/microsoft_services_discovery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${integration.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return this.createErrorResponse(
            'Failed to discover Microsoft 365 services',
            errorData.error || `HTTP ${response.status}`
          );
        }

        const responseData = await response.json();
        return this.createResponse(responseData.data || []);
      } catch (error) {
        return this.handleError(error);
      }
    }, 'discover Microsoft 365 services');
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
        const { data: integration, error: integrationError } = await selectOne('user_integrations', 'id, config', {
          user_id: user.id,
          integration_slug: 'microsoft365'
        });

        if (integrationError || !integration) {
          return this.createErrorResponse('Microsoft 365 integration not found');
        }

        // Update integration config with selected services
        const updatedConfig = {
          ...integration.config,
          enabledServices: selectedServices,
          servicesSetupAt: new Date().toISOString()
        };

        const { error: updateError } = await updateOne('user_integrations', { config: updatedConfig }, { id: integration.id });

        if (updateError) {
          return this.createErrorResponse('Failed to update integration configuration');
        }

        // Log the service setup
        logger.info('Microsoft 365 services setup completed', {
          userId: user.id,
          selectedServices,
          integrationId: integration.id
        });

        return this.createResponse({ success: true });
      } catch (error) {
        return this.handleError(error);
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

        const { data: integration, error: integrationError } = await selectOne('user_integrations', 'config', {
          user_id: user.id,
          integration_slug: 'microsoft365'
        });

        if (integrationError || !integration) {
          return this.createResponse([]);
        }

        const enabledServices = integration.config?.enabledServices || [];
        return this.createResponse(enabledServices);
      } catch (error) {
        return this.handleError(error);
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
        return this.createResponse(isEnabled);
      } catch (error) {
        return this.handleError(error);
      }
    }, `check if service ${serviceId} is enabled`);
  }
}

export const microsoft365DiscoveryService = new Microsoft365DiscoveryService();

// Debug: Verify exports are available
console.log('Microsoft365DiscoveryService exports:', {
  DiscoveredService: typeof DiscoveredService,
  ServiceDiscoveryResponse: typeof ServiceDiscoveryResponse,
  Microsoft365DiscoveryService: typeof Microsoft365DiscoveryService,
  microsoft365DiscoveryService: typeof microsoft365DiscoveryService
});
