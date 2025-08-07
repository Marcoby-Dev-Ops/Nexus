/**
 * User N8N Configuration Service
 * Manages user-specific N8N configurations and settings
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

export interface UserN8nConfig {
  userId: string;
  organizationId?: string;
  n8nInstanceUrl: string;
  apiKey: string;
  isActive: boolean;
  settings: {
    autoSync: boolean;
    syncInterval: number; // in minutes
    webhookEndpoint?: string;
    defaultTimezone: string;
    notificationSettings: {
      onWorkflowSuccess: boolean;
      onWorkflowFailure: boolean;
      onWebhookReceived: boolean;
    };
  };
  permissions: {
    canCreateWorkflows: boolean;
    canEditWorkflows: boolean;
    canDeleteWorkflows: boolean;
    canExecuteWorkflows: boolean;
    canManageWebhooks: boolean;
    canViewExecutions: boolean;
  };
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  isEncrypted: boolean;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface N8nWebhookConfig {
  id: string;
  workflowId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isActive: boolean;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'custom';
    credentials?: Record<string, any>;
  };
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    timeWindow: number; // in seconds
  };
  responseConfig: {
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  message: string;
  workflowsCount?: number;
  webhooksCount?: number;
}

export class UserN8nConfigService extends BaseService {
  private configs: Map<string, UserN8nConfig> = new Map();
  private credentials: Map<string, N8nCredential> = new Map();
  private webhookConfigs: Map<string, N8nWebhookConfig> = new Map();

  constructor() {
    super();
    this.loadConfigs();
  }

  /**
   * Create or update user N8N configuration
   */
  async setUserConfig(config: Omit<UserN8nConfig, 'lastSync' | 'syncStatus' | 'errorMessage'>): Promise<ServiceResponse<void>> {
    const userIdValidation = this.validateIdParam(config.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const urlValidation = this.validateRequiredParam(config.n8nInstanceUrl, 'n8nInstanceUrl');
    if (urlValidation) {
      return this.createErrorResponse(urlValidation);
    }

    const apiKeyValidation = this.validateRequiredParam(config.apiKey, 'apiKey');
    if (apiKeyValidation) {
      return this.createErrorResponse(apiKeyValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const existingConfig = this.configs.get(config.userId);
          
          if (existingConfig) {
            Object.assign(existingConfig, config);
          } else {
            const newConfig: UserN8nConfig = {
              ...config,
              lastSync: undefined,
              syncStatus: 'idle',
              errorMessage: undefined
            };
            this.configs.set(config.userId, newConfig);
          }

          await this.saveConfigs();
          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to save configuration' };
        }
      },
      'setUserConfig'
    );
  }

  /**
   * Get user N8N configuration
   */
  async getUserConfig(userId: string): Promise<ServiceResponse<UserN8nConfig | undefined>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = this.configs.get(userId);
          return { data: config, error: null };
        } catch (error) {
          return { data: undefined, error: error instanceof Error ? error.message : 'Failed to get configuration' };
        }
      },
      'getUserConfig'
    );
  }

  /**
   * Get all configurations for an organization
   */
  async getOrganizationConfigs(organizationId: string): Promise<ServiceResponse<UserN8nConfig[]>> {
    const validation = this.validateIdParam(organizationId, 'organizationId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const configs = Array.from(this.configs.values()).filter(config => config.organizationId === organizationId);
          return { data: configs, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get organization configurations' };
        }
      },
      'getOrganizationConfigs'
    );
  }

  /**
   * Test N8N connection
   */
  async testConnection(userId: string): Promise<ServiceResponse<ConnectionTestResult>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = this.configs.get(userId);
          if (!config) {
            return {
              data: {
                success: false,
                message: 'User configuration not found'
              },
              error: null
            };
          }

          // Simulate connection test
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
          
          // Simulate occasional connection failures
          if (Math.random() < 0.2) {
            throw new Error('Connection failed: Invalid API key or instance URL');
          }

          return {
            data: {
              success: true,
              message: 'Connection successful',
              details: {
                instanceUrl: config.n8nInstanceUrl,
                apiVersion: '1.0.0',
                workflowsCount: Math.floor(Math.random() * 50),
                activeWebhooks: Math.floor(Math.random() * 10)
              }
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              success: false,
              message: error instanceof Error ? error.message : 'Connection test failed',
              details: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            },
            error: null
          };
        }
      },
      'testConnection'
    );
  }

  /**
   * Sync user workflows from N8N
   */
  async syncUserWorkflows(userId: string): Promise<ServiceResponse<SyncResult>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = this.configs.get(userId);
          if (!config || !config.isActive) {
            return {
              data: {
                success: false,
                message: 'No active N8N configuration found'
              },
              error: null
            };
          }

          // Update sync status
          config.syncStatus = 'syncing';
          config.lastSync = new Date();
          await this.saveConfigs();

          // Simulate sync process
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

          // Simulate occasional sync failures
          if (Math.random() < 0.1) {
            config.syncStatus = 'error';
            config.errorMessage = 'Sync failed: Network timeout';
            await this.saveConfigs();
            
            return {
              data: {
                success: false,
                message: 'Sync failed: Network timeout'
              },
              error: null
            };
          }

          // Success
          config.syncStatus = 'success';
          config.errorMessage = undefined;
          await this.saveConfigs();

          return {
            data: {
              success: true,
              message: 'Sync completed successfully',
              workflowsCount: Math.floor(Math.random() * 20) + 5,
              webhooksCount: Math.floor(Math.random() * 10) + 2
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              success: false,
              message: error instanceof Error ? error.message : 'Sync failed'
            },
            error: null
          };
        }
      },
      'syncUserWorkflows'
    );
  }

  /**
   * Add credential for user
   */
  async addCredential(credential: Omit<N8nCredential, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<string>> {
    const userIdValidation = this.validateIdParam(credential.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const nameValidation = this.validateRequiredParam(credential.name, 'name');
    if (nameValidation) {
      return this.createErrorResponse(nameValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const newCredential: N8nCredential = {
            ...credential,
            id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.credentials.set(newCredential.id, newCredential);
          await this.saveCredentials();

          return { data: newCredential.id, error: null };
        } catch (error) {
          return { data: '', error: error instanceof Error ? error.message : 'Failed to add credential' };
        }
      },
      'addCredential'
    );
  }

  /**
   * Get user credentials
   */
  async getUserCredentials(userId: string): Promise<ServiceResponse<N8nCredential[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const userCredentials = Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
          return { data: userCredentials, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get credentials' };
        }
      },
      'getUserCredentials'
    );
  }

  /**
   * Update credential
   */
  async updateCredential(credentialId: string, updates: Partial<N8nCredential>): Promise<ServiceResponse<void>> {
    const validation = this.validateIdParam(credentialId, 'credentialId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const credential = this.credentials.get(credentialId);
          if (!credential) {
            return { data: null, error: 'Credential not found' };
          }

          Object.assign(credential, updates, { updatedAt: new Date() });
          await this.saveCredentials();

          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to update credential' };
        }
      },
      'updateCredential'
    );
  }

  /**
   * Delete credential
   */
  async deleteCredential(credentialId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(credentialId, 'credentialId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const deleted = this.credentials.delete(credentialId);
          if (deleted) {
            await this.saveCredentials();
          }
          return { data: deleted, error: null };
        } catch (error) {
          return { data: false, error: error instanceof Error ? error.message : 'Failed to delete credential' };
        }
      },
      'deleteCredential'
    );
  }

  /**
   * Configure webhook
   */
  async configureWebhook(webhookConfig: Omit<N8nWebhookConfig, 'id'>): Promise<ServiceResponse<string>> {
    const workflowIdValidation = this.validateIdParam(webhookConfig.workflowId, 'workflowId');
    if (workflowIdValidation) {
      return this.createErrorResponse(workflowIdValidation);
    }

    const pathValidation = this.validateRequiredParam(webhookConfig.path, 'path');
    if (pathValidation) {
      return this.createErrorResponse(pathValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const newWebhook: N8nWebhookConfig = {
            ...webhookConfig,
            id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };

          this.webhookConfigs.set(newWebhook.id, newWebhook);
          await this.saveWebhookConfigs();

          return { data: newWebhook.id, error: null };
        } catch (error) {
          return { data: '', error: error instanceof Error ? error.message : 'Failed to configure webhook' };
        }
      },
      'configureWebhook'
    );
  }

  /**
   * Get user webhook configurations
   */
  async getUserWebhookConfigs(userId: string): Promise<ServiceResponse<N8nWebhookConfig[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Filter webhooks by user (this would need to be implemented based on your data structure)
          const userWebhooks = Array.from(this.webhookConfigs.values());
          return { data: userWebhooks, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get webhook configurations' };
        }
      },
      'getUserWebhookConfigs'
    );
  }

  /**
   * Update webhook configuration
   */
  async updateWebhookConfig(webhookId: string, updates: Partial<N8nWebhookConfig>): Promise<ServiceResponse<void>> {
    const validation = this.validateIdParam(webhookId, 'webhookId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhook = this.webhookConfigs.get(webhookId);
          if (!webhook) {
            return { data: null, error: 'Webhook configuration not found' };
          }

          Object.assign(webhook, updates);
          await this.saveWebhookConfigs();

          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to update webhook configuration' };
        }
      },
      'updateWebhookConfig'
    );
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhookConfig(webhookId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(webhookId, 'webhookId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const deleted = this.webhookConfigs.delete(webhookId);
          if (deleted) {
            await this.saveWebhookConfigs();
          }
          return { data: deleted, error: null };
        } catch (error) {
          return { data: false, error: error instanceof Error ? error.message : 'Failed to delete webhook configuration' };
        }
      },
      'deleteWebhookConfig'
    );
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ServiceResponse<{
    workflowsCount: number;
    activeWebhooks: number;
    credentialsCount: number;
    lastSync?: Date;
    syncStatus: string;
  }>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = this.configs.get(userId);
          const userCredentials = Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
          const userWebhooks = Array.from(this.webhookConfigs.values()).filter(w => w.isActive);

          return {
            data: {
              workflowsCount: Math.floor(Math.random() * 50),
              activeWebhooks: userWebhooks.length,
              credentialsCount: userCredentials.length,
              lastSync: config?.lastSync,
              syncStatus: config?.syncStatus || 'idle'
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              workflowsCount: 0,
              activeWebhooks: 0,
              credentialsCount: 0,
              syncStatus: 'error'
            },
            error: error instanceof Error ? error.message : 'Failed to get user stats'
          };
        }
      },
      'getUserStats'
    );
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<UserN8nConfig>): ServiceResponse<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!config.userId) {
      errors.push('User ID is required');
    }

    if (!config.n8nInstanceUrl) {
      errors.push('N8N instance URL is required');
    } else if (!config.n8nInstanceUrl.startsWith('http')) {
      errors.push('N8N instance URL must be a valid HTTP URL');
    }

    if (!config.apiKey) {
      errors.push('API key is required');
    }

    if (config.settings?.syncInterval && (config.settings.syncInterval < 1 || config.settings.syncInterval > 1440)) {
      errors.push('Sync interval must be between 1 and 1440 minutes');
    }

    return {
      data: {
        isValid: errors.length === 0,
        errors
      },
      error: null
    };
  }

  /**
   * Export user configuration
   */
  async exportUserConfig(userId: string): Promise<ServiceResponse<{
    config: UserN8nConfig | undefined;
    credentials: N8nCredential[];
    webhooks: N8nWebhookConfig[];
  }>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = this.configs.get(userId);
          const userCredentials = Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
          const userWebhooks = Array.from(this.webhookConfigs.values());

          return {
            data: {
              config,
              credentials: userCredentials,
              webhooks: userWebhooks
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              config: undefined,
              credentials: [],
              webhooks: []
            },
            error: error instanceof Error ? error.message : 'Failed to export configuration'
          };
        }
      },
      'exportUserConfig'
    );
  }

  // Private methods for data persistence
  private async loadConfigs(): Promise<void> {
    try {
      // Load configurations from storage (implement based on your storage mechanism)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error loading configurations', { error });
    }
  }

  private async saveConfigs(): Promise<void> {
    try {
      // Save configurations to storage (implement based on your storage mechanism)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error saving configurations', { error });
    }
  }

  private async saveCredentials(): Promise<void> {
    try {
      // Save credentials to storage (implement based on your storage mechanism)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error saving credentials', { error });
    }
  }

  private async saveWebhookConfigs(): Promise<void> {
    try {
      // Save webhook configurations to storage (implement based on your storage mechanism)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error saving webhook configurations', { error });
    }
  }
}

// Export singleton instance
export const userN8nConfigService = new UserN8nConfigService(); 
