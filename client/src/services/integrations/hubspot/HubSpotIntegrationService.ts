import { IntegrationBaseService, type IntegrationConfig, type TestConnectionResult, type SyncResult } from '../core/IntegrationBaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectOne, upsertOne } from '@/lib/api-client';
import { DataMappingService } from '../core/DataMappingService';
import { nowIsoUtc } from '@/shared/utils/time';
import { retryFetch } from '@/shared/utils/retry';

/**
 * HubSpot Integration Service
 * Provides HubSpot-specific integration functionality
 * 
 * Extends IntegrationBaseService for consistent interface
 */
export class HubSpotIntegrationService extends IntegrationBaseService {
  protected readonly integrationType = 'hubspot';
  protected readonly platform = 'hubspot';
  private dataMappingService = new DataMappingService();

  /**
   * Test connection to HubSpot
   */
  async testConnection(integrationId: string): Promise<ServiceResponse<TestConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Get integration details
      const { data: integration, success, error } = await selectOne<any>('integrations', { id: integrationId });

      if (!success) throw new Error(error || 'Integration not found');

      try {
        // Test HubSpot API connection
        const response = await retryFetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          headers: {
            'Authorization': `Bearer ${integration.credentials?.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        return {
          data: {
            success: true,
            details: {
              apiVersion: 'v3',
              rateLimit: response.headers.get('X-RateLimit-Limit'),
              remainingRequests: response.headers.get('X-RateLimit-Remaining'),
            },
          },
          error: null,
          success: true
        };
      } catch (error) {
        await this.logError(integrationId, error instanceof Error ? error.message : 'Unknown error');

        return {
          data: {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to HubSpot',
          },
          error: null,
          success: true
        } as ServiceResponse<TestConnectionResult>;
      }
    }, `test HubSpot connection for integration ${integrationId}`);
  }

  /**
   * Sync data from HubSpot
   */
  async syncData(integrationId: string): Promise<ServiceResponse<SyncResult>> {
    return this.executeDbOperation(async () => {
      const startTime = Date.now();
      const errors: string[] = [];
      let recordsProcessed = 0;

      try {
        // Get integration details
        const { data: integration, success, error } = await selectOne<any>('integrations', { id: integrationId });

        if (!success) throw new Error(error || 'Integration not found');

        // Sync contacts
        const contactsResult = await this.syncContacts(integration);
        recordsProcessed += contactsResult.recordsProcessed;
        errors.push(...contactsResult.errors);

        // Sync companies
        const companiesResult = await this.syncCompanies(integration);
        recordsProcessed += companiesResult.recordsProcessed;
        errors.push(...companiesResult.errors);

        // Sync deals
        const dealsResult = await this.syncDeals(integration);
        recordsProcessed += dealsResult.recordsProcessed;
        errors.push(...dealsResult.errors);

        // Update integration status
        await this.updateStatus(integrationId, 'connected', {
          lastSync: nowIsoUtc(),
          dataCount: recordsProcessed,
        });

        const duration = Date.now() - startTime;

        return {
          data: {
            success: errors.length === 0,
            recordsProcessed,
            errors,
            duration,
            lastSync: nowIsoUtc(),
          },
          error: null,
          success: true
        };
      } catch (error) {
        await this.logError(integrationId, error instanceof Error ? error.message : 'Unknown error');

        return {
          data: {
            success: false,
            recordsProcessed,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            duration: Date.now() - startTime,
            lastSync: new Date().toISOString(),
          },
          error: null,
          success: true
        };
      }
    }, `sync HubSpot data for integration ${integrationId}`);
  }

  /**
   * Connect to HubSpot
   */
  async connect(integrationId: string, credentials: any): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Test the connection first
      const testResult = await this.testConnection(integrationId);
      if (testResult.error || !testResult.data?.success) {
        throw new Error(testResult.data?.error || 'Failed to test connection');
      }

      // Update integration with credentials and status
      const result = await this.update(integrationId, {
        credentials,
        status: 'connected',
        updatedAt: new Date().toISOString(),
      });

      return result;
    }, `connect HubSpot integration ${integrationId}`);
  }

  /**
   * Disconnect from HubSpot
   */
  async disconnect(integrationId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      // Update integration status
      await this.updateStatus(integrationId, 'disconnected');
      return { data: true, error: null, success: true };
    }, `disconnect HubSpot integration ${integrationId}`);
  }

  /**
   * Get HubSpot integration metadata
   */
  async getMetadata(): Promise<ServiceResponse<{
    name: string;
    type: string;
    platform: string;
    description: string;
    capabilities: string[];
    requiredFields: string[];
    optionalFields: string[];
  }>> {
    return this.executeDbOperation(async () => {
      return {
        data: {
          name: 'HubSpot CRM',
          type: this.integrationType,
          platform: this.platform,
          description: 'Connect to HubSpot CRM to sync contacts, companies, and deals',
          capabilities: [
            'sync_contacts',
            'sync_companies',
            'sync_deals',
            'sync_engagements',
            'create_contacts',
            'update_contacts',
            'create_companies',
            'update_companies',
            'create_deals',
            'update_deals',
          ],
          requiredFields: ['accessToken'],
          optionalFields: ['refreshToken', 'clientId', 'clientSecret'],
        },
        error: null,
        success: true
      };
    }, 'get HubSpot metadata');
  }

  /**
   * Validate HubSpot configuration
   */
  async validateConfig(config: IntegrationConfig): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    return this.executeDbOperation(async () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!config.credentials?.accessToken) {
        errors.push('HubSpot access token is required');
      }

      // Validate access token format (basic check)
      if (config.credentials?.accessToken && !config.credentials.accessToken.startsWith('pat-')) {
        warnings.push('Access token should start with "pat-" for HubSpot private apps');
      }

      // Validate optional fields
      if (!config.credentials?.refreshToken) {
        warnings.push('Refresh token not provided - token may expire');
      }

      return {
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
        },
        error: null,
        success: true
      };
    }, `validate HubSpot config`);
  }

  /**
   * Sync contacts from HubSpot
   */
  private async syncContacts(integration: any): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      const response = await retryFetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100', {
        headers: {
          'Authorization': `Bearer ${integration.credentials?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`);
      }

      const data = await response.json();
      const contacts = data.results || [];
      let recordsProcessed = 0;

      for (const contact of contacts) {
        try {
          // Transform HubSpot contact to internal format
          const transformedContact = await this.dataMappingService.transformData(
            this.integrationType,
            'contact',
            contact
          );

          if (transformedContact.error) {
            throw new Error(transformedContact.error);
          }

          // Store in internal database
          const { success, error } = await upsertOne('integration_data', {
            integration_id: integration.id,
            entity_type: 'contact',
            external_id: contact.id,
            data: transformedContact.data,
            synced_at: nowIsoUtc(),
          }, 'integration_id,entity_type,external_id');

          if (!success) throw new Error(error || 'Failed to upsert contact');
          recordsProcessed++;
        } catch (error) {
          this.logger.error(`Failed to sync contact ${contact.id}:`, error);
        }
      }

      return { recordsProcessed, errors: [] };
    } catch (error) {
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Sync companies from HubSpot
   */
  private async syncCompanies(integration: any): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      const response = await retryFetch('https://api.hubapi.com/crm/v3/objects/companies?limit=100', {
        headers: {
          'Authorization': `Bearer ${integration.credentials?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }

      const data = await response.json();
      const companies = data.results || [];
      let recordsProcessed = 0;

      for (const company of companies) {
        try {
          // Transform HubSpot company to internal format
          const transformedCompany = await this.dataMappingService.transformData(
            this.integrationType,
            'company',
            company
          );

          if (transformedCompany.error) {
            throw new Error(transformedCompany.error);
          }

          // Store in internal database
          const { success, error } = await upsertOne('integration_data', {
            integration_id: integration.id,
            entity_type: 'company',
            external_id: company.id,
            data: transformedCompany.data,
            synced_at: nowIsoUtc(),
          }, 'integration_id,entity_type,external_id');

          if (!success) throw new Error(error || 'Failed to upsert company');
          recordsProcessed++;
        } catch (error) {
          this.logger.error(`Failed to sync company ${company.id}:`, error);
        }
      }

      return { recordsProcessed, errors: [] };
    } catch (error) {
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Sync deals from HubSpot
   */
  private async syncDeals(integration: any): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      const response = await retryFetch('https://api.hubapi.com/crm/v3/objects/deals?limit=100', {
        headers: {
          'Authorization': `Bearer ${integration.credentials?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

      const data = await response.json();
      const deals = data.results || [];
      let recordsProcessed = 0;

      for (const deal of deals) {
        try {
          // Transform HubSpot deal to internal format
          const transformedDeal = await this.dataMappingService.transformData(
            this.integrationType,
            'deal',
            deal
          );

          if (transformedDeal.error) {
            throw new Error(transformedDeal.error);
          }

          // Store in internal database
          const { success, error } = await upsertOne('integration_data', {
            integration_id: integration.id,
            entity_type: 'deal',
            external_id: deal.id,
            data: transformedDeal.data,
            synced_at: nowIsoUtc(),
          }, 'integration_id,entity_type,external_id');

          if (!success) throw new Error(error || 'Failed to upsert deal');
          recordsProcessed++;
        } catch (error) {
          this.logger.error(`Failed to sync deal ${deal.id}:`, error);
        }
      }

      return { recordsProcessed, errors: [] };
    } catch (error) {
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
} 
