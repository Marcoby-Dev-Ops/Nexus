/**
 * HubSpot Integration Adapter
 * 
 * This adapter connects Nexus to HubSpot's API using the API Documentation analyzer
 * to automatically generate integration code from the OpenAPI documentation.
 */

import axios from 'axios';
import { apiDocAnalyzer } from '@/domains/integrations/lib/apiDocAnalyzer';
import type { APIDocumentation, IntegrationPattern, GeneratedConnector } from '@/domains/integrations/lib/apiDocAnalyzer';

// Types for HubSpot integration
export interface HubSpotConfig {
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotCompany {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  associations?: {
    contacts?: { results: Array<{ id: string }> };
    companies?: { results: Array<{ id: string }> };
  };
}

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Main HubSpot Integration Class
export class HubSpotIntegration {
  private config: HubSpotConfig;
  private apiClient: any;
  private connector: GeneratedConnector | null = null;
  
  constructor(config: HubSpotConfig) {
    this.config = config;
    this.apiClient = null;
  }
  
  /**
   * Initialize the integration by fetching and analyzing API documentation
   */
  async initialize(): Promise<void> {
    try {
      // If we already have a connector generated from the documentation, use it
      if (this.connector) {
        await this.setupClient();
        return;
      }
      
      // Fetch HubSpot OpenAPI documentation
      // Note: In a real implementation, we might fetch this directly from HubSpot
      // For demo purposes, we'll use a mockup of what the OpenAPI might look like
      const hubspotOpenApi = this.getMockHubSpotOpenAPI();
      
      // Parse the OpenAPI documentation
      const apiDoc = await apiDocAnalyzer.parseOpenAPIDoc(hubspotOpenApi);
      
      // Analyze the documentation to find integration patterns
      const patterns = await apiDocAnalyzer.analyzeDocumentation(apiDoc);
      
      // Generate connector code
      this.connector = await apiDocAnalyzer.generateConnector(apiDoc, patterns);
      
      // Set up API client using the generated connector
      await this.setupClient();
      
      console.log('HubSpot integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HubSpot integration:', error);
      throw new Error(`HubSpot integration initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Set up the API client based on authentication configuration
   */
  private async setupClient(): Promise<void> {
    // Check if we have API key authentication
    if (this.config.apiKey) {
      this.apiClient = axios.create({
        baseURL: this.config.baseUrl || 'https://api.hubapi.com',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return;
    }
    
    // Check if we have OAuth2 authentication
    if (this.config.accessToken) {
      this.apiClient = axios.create({
        baseURL: this.config.baseUrl || 'https://api.hubapi.com',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Enhanced token refresh interceptor with best practices
      this.apiClient.interceptors.response.use(
        (response: any) => response,
        async (error: any) => {
          const originalRequest = error.config;
          
          // Only attempt refresh on 401 errors and if we haven't retried yet
          if (error.response?.status === 401 && !originalRequest._retry && this.config.refreshToken) {
            originalRequest._retry = true;
            
            try {
              // Check if token is expired or will expire soon (5 minutes buffer)
              const shouldRefresh = this.shouldRefreshToken();
              
              if (shouldRefresh) {
                console.log('🔄 [HubSpot] Token expired or expiring soon, refreshing...');
                await this.refreshAccessToken();
                
                // Update authorization header with new token
                originalRequest.headers['Authorization'] = `Bearer ${this.config.accessToken}`;
                
                // Retry the original request with new token
                return this.apiClient(originalRequest);
              } else {
                console.warn('⚠️ [HubSpot] Token refresh needed but no refresh token available');
                throw new Error('Authentication token expired and cannot be refreshed');
              }
            } catch (refreshError) {
              console.error('❌ [HubSpot] Token refresh failed:', refreshError);
              
              // Clear invalid tokens
              this.config.accessToken = undefined;
              this.config.refreshToken = undefined;
              this.config.expiresAt = undefined;
              
              throw new Error('Authentication failed - please reconnect your HubSpot account');
            }
          }
          
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Check if token should be refreshed (expired or expiring within 5 minutes)
   */
  private shouldRefreshToken(): boolean {
    if (!this.config.expiresAt) return false;
    
    const now = Date.now();
    const expiresAt = typeof this.config.expiresAt === 'number' 
      ? this.config.expiresAt 
      : new Date(this.config.expiresAt).getTime();
    
    const fiveMinutes = 5 * 60 * 1000;
    return now + fiveMinutes >= expiresAt;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('Missing refresh token or client credentials');
    }

    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken
      });

      const responseData = response.data as { 
        access_token: string; 
        refresh_token?: string; 
        expires_in: number;
      };

      // Update tokens in config
      this.config.accessToken = responseData.access_token;
      this.config.refreshToken = responseData.refresh_token || this.config.refreshToken;
      this.config.expiresAt = Date.now() + (responseData.expires_in * 1000);

      console.log('✅ [HubSpot] Token refreshed successfully');
    } catch (error) {
      console.error('❌ [HubSpot] Token refresh failed:', error);
      throw error;
    }
  }
  
  /**
   * Get OAuth2 authorization URL
   */
  async getAuthorizationUrl(): Promise<string> {
    if (!this.config.clientId || !this.config.redirectUri) {
      throw new Error('Client ID and redirect URI are required for OAuth2 authorization');
    }
    
    // Use consolidated HubSpot scopes
    const { HUBSPOT_REQUIRED_SCOPES } = await import('./hubspot/constants');
    const scopes = HUBSPOT_REQUIRED_SCOPES;
    
    return `https://app.hubspot.com/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=code`;
  }
  
  /**
   * Handle OAuth2 callback
   */
  async handleOAuthCallback(code: string): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
      throw new Error('Client ID, client secret, and redirect URI are required for OAuth2 token exchange');
    }
    
    try {
      const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const responseData = tokenResponse.data as { 
        access_token: string; 
        refresh_token: string; 
        expires_in: number;
      };
      
      // Update config with tokens
      this.config.accessToken = responseData.access_token;
      this.config.refreshToken = responseData.refresh_token;
      this.config.expiresAt = Date.now() + (responseData.expires_in * 1000);
      
      // Set up API client with new tokens
      await this.setupClient();
    } catch (error) {
      console.error('OAuth token exchange failed:', error);
      throw new Error(`Failed to exchange authorization code for tokens: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Get contacts from HubSpot
   */
  async getContacts(limit = 10, after?: string): Promise<HubSpotContact[]> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      const response = await this.apiClient.get('/crm/v3/objects/contacts', {
        params: {
          limit,
          after,
          properties: ['firstname', 'lastname', 'email', 'phone', 'company']
        }
      });
      
      return response.data.results.map((contact: any) => ({
        id: contact.id,
        properties: contact.properties,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }));
    } catch (error) {
      console.error('Failed to get contacts:', error);
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }
  
  /**
   * Get companies from HubSpot
   */
  async getCompanies(limit = 10, after?: string): Promise<HubSpotCompany[]> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      const response = await this.apiClient.get('/crm/v3/objects/companies', {
        params: {
          limit,
          after,
          properties: ['name', 'domain', 'industry', 'website', 'phone', 'address']
        }
      });
      
      return response.data.results.map((company: any) => ({
        id: company.id,
        properties: company.properties,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }));
    } catch (error) {
      console.error('Failed to get companies:', error);
      throw new Error(`Failed to get companies: ${error.message}`);
    }
  }
  
  /**
   * Get deals from HubSpot
   */
  async getDeals(limit = 10, after?: string): Promise<HubSpotDeal[]> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      const response = await this.apiClient.get('/crm/v3/objects/deals', {
        params: {
          limit,
          after,
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline'],
          associations: ['contacts', 'companies']
        }
      });
      
      return response.data.results.map((deal: any) => ({
        id: deal.id,
        properties: deal.properties,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        associations: deal.associations
      }));
    } catch (error) {
      console.error('Failed to get deals:', error);
      throw new Error(`Failed to get deals: ${error.message}`);
    }
  }
  
  /**
   * Create a contact in HubSpot
   */
  async createContact(properties: Record<string, string>): Promise<HubSpotContact> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      const response = await this.apiClient.post('/crm/v3/objects/contacts', {
        properties
      });
      
      return {
        id: response.data.id,
        properties: response.data.properties,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }
  
  /**
   * Create a company in HubSpot
   */
  async createCompany(properties: Record<string, string>): Promise<HubSpotCompany> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      const response = await this.apiClient.post('/crm/v3/objects/companies', {
        properties
      });
      
      return {
        id: response.data.id,
        properties: response.data.properties,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error('Failed to create company:', error);
      throw new Error(`Failed to create company: ${error.message}`);
    }
  }
  
  /**
   * Create a deal in HubSpot
   */
  async createDeal(
    properties: Record<string, string>,
    associations?: {
      contactIds?: string[],
      companyIds?: string[]
    }
  ): Promise<HubSpotDeal> {
    if (!this.apiClient) {
      throw new Error('HubSpot integration not initialized');
    }
    
    try {
      // Prepare request body
      const requestBody: any = {
        properties
      };
      
      // Add associations if provided
      if (associations) {
        requestBody.associations = [];
        
        if (associations.contactIds && associations.contactIds.length > 0) {
          associations.contactIds.forEach(contactId => {
            requestBody.associations.push({
              to: { id: contactId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
            });
          });
        }
        
        if (associations.companyIds && associations.companyIds.length > 0) {
          associations.companyIds.forEach(companyId => {
            requestBody.associations.push({
              to: { id: companyId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }]
            });
          });
        }
      }
      
      const response = await this.apiClient.post('/crm/v3/objects/deals', requestBody);
      
      return {
        id: response.data.id,
        properties: response.data.properties,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw new Error(`Failed to create deal: ${error.message}`);
    }
  }
  
  /**
   * Get a mock HubSpot OpenAPI document for demo purposes
   */
  getMockHubSpotOpenAPI(): string {
    // This is a simplified version of what HubSpot's OpenAPI spec might look like
    const mockOpenAPI = {
      openapi: '3.0.0',
      info: {
        title: 'HubSpot API',
        description: 'HubSpot API for CRM objects and more',
        version: '3.0.0'
      },
      servers: [
        {
          url: 'https://api.hubapi.com',
          description: 'HubSpot API Server'
        }
      ],
      components: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            description: 'OAuth 2.0 authentication',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
                tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
                refreshUrl: 'https://api.hubapi.com/oauth/v1/token',
                scopes: {
                  'crm.objects.contacts.read': 'Read contacts',
                  'crm.objects.contacts.write': 'Write contacts',
                  'crm.objects.companies.read': 'Read companies',
                  'crm.objects.companies.write': 'Write companies',
                  'crm.objects.deals.read': 'Read deals',
                  'crm.objects.deals.write': 'Write deals'
                }
              }
            }
          },
          apiKey: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'API key authentication using Bearer token'
          }
        },
        schemas: {
          Contact: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          Company: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          Deal: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              associations: {
                type: 'object',
                properties: {
                  contacts: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' }
                          }
                        }
                      }
                    }
                  },
                  companies: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      paths: {
        '/crm/v3/objects/contacts': {
          get: {
            summary: 'Get contacts',
            description: 'Get a list of contacts',
            tags: ['Contacts'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: { type: 'integer', default: 10 }
              },
              {
                name: 'after',
                in: 'query',
                required: false,
                schema: { type: 'string' }
              },
              {
                name: 'properties',
                in: 'query',
                required: false,
                schema: { type: 'array', items: { type: 'string' } }
              }
            ],
            responses: {
              '200': {
                description: 'Successful operation',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'array',
                          items: { '$ref': '#/components/schemas/Contact' }
                        },
                        paging: {
                          type: 'object',
                          properties: {
                            next: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.contacts.read'] },
              { apiKey: [] }
            ]
          },
          post: {
            summary: 'Create contact',
            description: 'Create a new contact',
            tags: ['Contacts'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'object',
                        additionalProperties: { type: 'string' }
                      }
                    },
                    required: ['properties']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Contact' }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.contacts.write'] },
              { apiKey: [] }
            ]
          }
        },
        '/crm/v3/objects/contacts/{contactId}': {
          get: {
            summary: 'Get contact by ID',
            description: 'Get a specific contact by ID',
            tags: ['Contacts'],
            parameters: [
              {
                name: 'contactId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              },
              {
                name: 'properties',
                in: 'query',
                required: false,
                schema: { type: 'array', items: { type: 'string' } }
              }
            ],
            responses: {
              '200': {
                description: 'Successful operation',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Contact' }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.contacts.read'] },
              { apiKey: [] }
            ]
          },
          patch: {
            summary: 'Update contact',
            description: 'Update a specific contact',
            tags: ['Contacts'],
            parameters: [
              {
                name: 'contactId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'object',
                        additionalProperties: { type: 'string' }
                      }
                    },
                    required: ['properties']
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Successfully updated',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Contact' }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.contacts.write'] },
              { apiKey: [] }
            ]
          }
        },
        '/crm/v3/objects/companies': {
          get: {
            summary: 'Get companies',
            description: 'Get a list of companies',
            tags: ['Companies'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: { type: 'integer', default: 10 }
              },
              {
                name: 'after',
                in: 'query',
                required: false,
                schema: { type: 'string' }
              },
              {
                name: 'properties',
                in: 'query',
                required: false,
                schema: { type: 'array', items: { type: 'string' } }
              }
            ],
            responses: {
              '200': {
                description: 'Successful operation',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'array',
                          items: { '$ref': '#/components/schemas/Company' }
                        },
                        paging: {
                          type: 'object',
                          properties: {
                            next: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.companies.read'] },
              { apiKey: [] }
            ]
          },
          post: {
            summary: 'Create company',
            description: 'Create a new company',
            tags: ['Companies'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'object',
                        additionalProperties: { type: 'string' }
                      }
                    },
                    required: ['properties']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Company' }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.companies.write'] },
              { apiKey: [] }
            ]
          }
        },
        '/crm/v3/objects/deals': {
          get: {
            summary: 'Get deals',
            description: 'Get a list of deals',
            tags: ['Deals'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: { type: 'integer', default: 10 }
              },
              {
                name: 'after',
                in: 'query',
                required: false,
                schema: { type: 'string' }
              },
              {
                name: 'properties',
                in: 'query',
                required: false,
                schema: { type: 'array', items: { type: 'string' } }
              },
              {
                name: 'associations',
                in: 'query',
                required: false,
                schema: { type: 'array', items: { type: 'string' } }
              }
            ],
            responses: {
              '200': {
                description: 'Successful operation',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'array',
                          items: { '$ref': '#/components/schemas/Deal' }
                        },
                        paging: {
                          type: 'object',
                          properties: {
                            next: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.deals.read'] },
              { apiKey: [] }
            ]
          },
          post: {
            summary: 'Create deal',
            description: 'Create a new deal',
            tags: ['Deals'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'object',
                        additionalProperties: { type: 'string' }
                      },
                      associations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            to: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' }
                              }
                            },
                            types: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  associationCategory: { type: 'string' },
                                  associationTypeId: { type: 'integer' }
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    required: ['properties']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Deal' }
                  }
                }
              }
            },
            security: [
              { oauth2: ['crm.objects.deals.write'] },
              { apiKey: [] }
            ]
          }
        }
      }
    };
    
    return JSON.stringify(mockOpenAPI);
  }
}

// Export singleton instance
export const hubspotIntegration = new HubSpotIntegration({
  baseUrl: 'https://api.hubapi.com'
});

 