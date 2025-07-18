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

class UserN8nConfigService {
  private configs: Map<string, UserN8nConfig> = new Map();
  private credentials: Map<string, N8nCredential> = new Map();
  private webhookConfigs: Map<string, N8nWebhookConfig> = new Map();

  constructor() {
    this.loadConfigs();
  }

  /**
   * Create or update user N8N configuration
   */
  async setUserConfig(config: Omit<UserN8nConfig, 'lastSync' | 'syncStatus' | 'errorMessage'>): Promise<void> {
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
  }

  /**
   * Get user N8N configuration
   */
  getUserConfig(userId: string): UserN8nConfig | undefined {
    return this.configs.get(userId);
  }

  /**
   * Get all configurations for an organization
   */
  getOrganizationConfigs(organizationId: string): UserN8nConfig[] {
    return Array.from(this.configs.values()).filter(config => config.organizationId === organizationId);
  }

  /**
   * Test N8N connection
   */
  async testConnection(userId: string): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    const config = this.configs.get(userId);
    if (!config) {
      return {
        success: false,
        message: 'User configuration not found'
      };
    }

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Simulate occasional connection failures
      if (Math.random() < 0.2) {
        throw new Error('Connection failed: Invalid API key or instance URL');
      }

      return {
        success: true,
        message: 'Connection successful',
        details: {
          instanceUrl: config.n8nInstanceUrl,
          apiVersion: '1.0.0',
          workflowsCount: Math.floor(Math.random() * 50),
          activeWebhooks: Math.floor(Math.random() * 10)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Sync user workflows from N8N
   */
  async syncUserWorkflows(userId: string): Promise<{
    success: boolean;
    workflowsSynced: number;
    message: string;
  }> {
    const config = this.configs.get(userId);
    if (!config) {
      return {
        success: false,
        workflowsSynced: 0,
        message: 'User configuration not found'
      };
    }

    try {
      config.syncStatus = 'syncing';
      await this.saveConfigs();

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
      
      const workflowsSynced = Math.floor(Math.random() * 20) + 5;
      
      config.syncStatus = 'success';
      config.lastSync = new Date();
      config.errorMessage = undefined;

      await this.saveConfigs();

      return {
        success: true,
        workflowsSynced,
        message: `Successfully synced ${workflowsSynced} workflows`
      };
    } catch (error) {
      config.syncStatus = 'error';
      config.errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      await this.saveConfigs();

      return {
        success: false,
        workflowsSynced: 0,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Add N8N credential
   */
  async addCredential(credential: Omit<N8nCredential, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newCredential: N8nCredential = {
      ...credential,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.credentials.set(id, newCredential);
    await this.saveCredentials();
    return id;
  }

  /**
   * Get user credentials
   */
  getUserCredentials(userId: string): N8nCredential[] {
    return Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
  }

  /**
   * Update credential
   */
  async updateCredential(credentialId: string, updates: Partial<N8nCredential>): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    Object.assign(credential, updates, { updatedAt: new Date() });
    await this.saveCredentials();
  }

  /**
   * Delete credential
   */
  async deleteCredential(credentialId: string): Promise<void> {
    this.credentials.delete(credentialId);
    await this.saveCredentials();
  }

  /**
   * Configure webhook
   */
  async configureWebhook(webhookConfig: Omit<N8nWebhookConfig, 'id'>): Promise<string> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newWebhookConfig: N8nWebhookConfig = {
      ...webhookConfig,
      id
    };

    this.webhookConfigs.set(id, newWebhookConfig);
    await this.saveWebhookConfigs();
    return id;
  }

  /**
   * Get webhook configurations for user
   */
  getUserWebhookConfigs(userId: string): N8nWebhookConfig[] {
    const config = this.configs.get(userId);
    if (!config) return [];

    // Filter webhooks based on user's workflows
    return Array.from(this.webhookConfigs.values()).filter(_webhook => {
      // In a real implementation, you'd check if the user has access to the workflow
      return true;
    });
  }

  /**
   * Update webhook configuration
   */
  async updateWebhookConfig(webhookId: string, updates: Partial<N8nWebhookConfig>): Promise<void> {
    const webhook = this.webhookConfigs.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook configuration ${webhookId} not found`);
    }

    Object.assign(webhook, updates);
    await this.saveWebhookConfigs();
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhookConfig(webhookId: string): Promise<void> {
    this.webhookConfigs.delete(webhookId);
    await this.saveWebhookConfigs();
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string): {
    workflowsCount: number;
    activeWebhooks: number;
    credentialsCount: number;
    lastSync?: Date;
    syncStatus: string;
  } {
    const config = this.configs.get(userId);
    const userCredentials = this.getUserCredentials(userId);
    const userWebhooks = this.getUserWebhookConfigs(userId);

    return {
      workflowsCount: Math.floor(Math.random() * 50), // Simulated
      activeWebhooks: userWebhooks.filter(w => w.isActive).length,
      credentialsCount: userCredentials.length,
      lastSync: config?.lastSync,
      syncStatus: config?.syncStatus || 'idle'
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<UserN8nConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.n8nInstanceUrl) {
      errors.push('N8N instance URL is required');
    } else if (!config.n8nInstanceUrl.startsWith('http')) {
      errors.push('N8N instance URL must be a valid HTTP URL');
    }

    if (!config.apiKey) {
      errors.push('API key is required');
    }

    if (config.settings?.syncInterval && config.settings.syncInterval < 1) {
      errors.push('Sync interval must be at least 1 minute');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export user configuration
   */
  exportUserConfig(userId: string): {
    config: UserN8nConfig | undefined;
    credentials: N8nCredential[];
    webhooks: N8nWebhookConfig[];
  } {
    return {
      config: this.configs.get(userId),
      credentials: this.getUserCredentials(userId),
      webhooks: this.getUserWebhookConfigs(userId)
    };
  }

  private async loadConfigs(): Promise<void> {
    // In a real implementation, this would load from database
    // For now, we'll start with an empty map
  }

  private async saveConfigs(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }

  private async saveCredentials(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }

  private async saveWebhookConfigs(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }
}

export const userN8nConfigService = new UserN8nConfigService(); 