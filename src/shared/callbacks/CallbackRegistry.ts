/**
 * Unified Callback Registry
 * Manages all callback configurations in a centralized, type-safe manner
 */

import type {
  CallbackConfig,
  CallbackRegistry,
  ValidationResult,
  CallbackTemplate
} from '@/core/types/callbacks';

// Global initialization guard to prevent multiple initializations in React StrictMode
let globalInitializationGuard = false;

/**
 * Implementation of the callback registry
 */
export class CallbackRegistryImpl implements CallbackRegistry {
  public callbacks: Map<string, CallbackConfig> = new Map();
  public pathMap: Map<string, string> = new Map();
  public integrationMap: Map<string, string[]> = new Map();
  
  private templates: Map<string, CallbackTemplate> = new Map();
  private isInitialized = false;

  /**
   * Initialize the registry with built-in configurations
   */
  public async initialize(): Promise<void> {
    // Global guard to prevent multiple initializations
    if (globalInitializationGuard) {
      console.log('✅ Callback registry already initialized globally, skipping...');
      return;
    }
    
    if (this.isInitialized) {
      console.log('✅ Callback registry already initialized, skipping...');
      return;
    }
    
    console.log('🔄 Initializing callback registry...');
    
    // Set global guard
    globalInitializationGuard = true;
    
    // Load built-in templates
    await this.loadBuiltInTemplates();
    
    // Load existing callback configurations
    await this.loadExistingCallbacks();
    
    this.isInitialized = true;
    console.log('✅ Callback registry initialized successfully');
  }

  /**
   * Register a new callback configuration
   */
  public register(config: CallbackConfig): void {
    // Validate configuration
    const validation = this.validate(config);
    if (!validation.isValid) {
      throw new Error(`Invalid callback configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check for path conflicts
    const existingCallbackId = this.pathMap.get(config.path);
    if (existingCallbackId && existingCallbackId !== config.id) {
      throw new Error(`Path conflict: ${config.path} is already registered by callback ${existingCallbackId}`);
    }

    // Register callback
    this.callbacks.set(config.id, config);
    this.pathMap.set(config.path, config.id);

    // Update integration mapping
    const integrationCallbacks = this.integrationMap.get(config.integrationSlug) || [];
    if (!integrationCallbacks.includes(config.id)) {
      integrationCallbacks.push(config.id);
      this.integrationMap.set(config.integrationSlug, integrationCallbacks);
    }

    console.log(`Registered callback: ${config.id} for ${config.integrationSlug}`);
  }

  /**
   * Unregister a callback
   */
  public unregister(id: string): void {
    const config = this.callbacks.get(id);
    if (!config) {
      console.warn(`Callback ${id} not found for unregistration`);
      return;
    }

    // Remove from all mappings
    this.callbacks.delete(id);
    this.pathMap.delete(config.path);

    // Update integration mapping
    const integrationCallbacks = this.integrationMap.get(config.integrationSlug) || [];
    const updatedCallbacks = integrationCallbacks.filter(callbackId => callbackId !== id);
    if (updatedCallbacks.length > 0) {
      this.integrationMap.set(config.integrationSlug, updatedCallbacks);
    } else {
      this.integrationMap.delete(config.integrationSlug);
    }

    console.log(`Unregistered callback: ${id}`);
  }

  /**
   * Get callback by ID
   */
  public get(id: string): CallbackConfig | undefined {
    return this.callbacks.get(id);
  }

  /**
   * Get callbacks by integration slug
   */
  public getByIntegration(integrationSlug: string): CallbackConfig[] {
    const callbackIds = this.integrationMap.get(integrationSlug) || [];
    return callbackIds
      .map(id => this.callbacks.get(id))
      .filter((config): config is CallbackConfig => config !== undefined);
  }

  /**
   * Get callback by path
   */
  public getByPath(path: string): CallbackConfig | undefined {
    const callbackId = this.pathMap.get(path);
    return callbackId ? this.callbacks.get(callbackId) : undefined;
  }

  /**
   * Find callback by path pattern matching
   */
  public findByPathPattern(requestPath: string): CallbackConfig | undefined {
    // First try exact match
    const exactMatch = this.getByPath(requestPath);
    if (exactMatch) return exactMatch;

    // Try pattern matching for parameterized paths
    for (const [registeredPath, callbackId] of this.pathMap.entries()) {
      if (this.matchesPathPattern(registeredPath, requestPath)) {
        return this.callbacks.get(callbackId);
      }
    }

    return undefined;
  }

  /**
   * Validate callback configuration
   */
  public validate(config: CallbackConfig): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Required fields validation
    if (!config.id) {
      errors.push({ field: 'id', message: 'Callback ID is required', code: 'REQUIRED_FIELD' });
    }

    if (!config.integrationSlug) {
      errors.push({ field: 'integrationSlug', message: 'Integration slug is required', code: 'REQUIRED_FIELD' });
    }

    if (!config.path) {
      errors.push({ field: 'path', message: 'Callback path is required', code: 'REQUIRED_FIELD' });
    }

    if (!config.methods || config.methods.length === 0) {
      errors.push({ field: 'methods', message: 'At least one HTTP method is required', code: 'REQUIRED_FIELD' });
    }

    if (!config.handler) {
      errors.push({ field: 'handler', message: 'Callback handler is required', code: 'REQUIRED_FIELD' });
    }

    // Path format validation
    if (config.path && !config.path.startsWith('/')) {
      errors.push({ field: 'path', message: 'Path must start with /', code: 'INVALID_FORMAT' });
    }

    // OAuth-specific validation
    if (config.type === 'oauth' && config.config.oauth) {
      if (!config.config.oauth.redirectUrl) {
        warnings.push({ field: 'config.oauth.redirectUrl', message: 'OAuth redirect URL is recommended', code: 'RECOMMENDED_FIELD' });
      }
    }

    // Webhook-specific validation
    if (config.type === 'webhook' && config.config.webhook) {
      if (!config.config.webhook.secret) {
        warnings.push({ field: 'config.webhook.secret', message: 'Webhook secret is recommended for security', code: 'SECURITY_WARNING' });
      }
    }

    // Security validation
    if (config.type === 'webhook' && !config.security.signatureVerification) {
      warnings.push({ field: 'security.signatureVerification', message: 'Signature verification is recommended for webhooks', code: 'SECURITY_WARNING' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get all callback configurations
   */
  public getAll(): CallbackConfig[] {
    return Array.from(this.callbacks.values());
  }

  /**
   * Get all active callback configurations
   */
  public getActive(): CallbackConfig[] {
    return this.getAll().filter(config => config.isActive);
  }

  /**
   * Get callback templates
   */
  public getTemplates(): CallbackTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): CallbackTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create callback from template
   */
  public createFromTemplate(
    templateId: string,
    integrationSlug: string,
    overrides: Partial<CallbackConfig> = {}
  ): CallbackConfig {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const config: CallbackConfig = {
      ...template.template,
      id: overrides.id || `${integrationSlug}-${template.id}-${Date.now()}`,
      integrationSlug,
      createdAt: new Date().toISOString(),
      ...overrides
    };

    return config;
  }

  /**
   * Export configuration for backup/migration
   */
  public export(): {
    callbacks: CallbackConfig[];
    templates: CallbackTemplate[];
    metadata: {
      exportedAt: string;
      version: string;
    };
  } {
    return {
      callbacks: this.getAll(),
      templates: this.getTemplates(),
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Import configuration from backup
   */
  public import(data: {
    callbacks: CallbackConfig[];
    templates?: CallbackTemplate[];
  }): void {
    // Import callbacks
    data.callbacks.forEach(config => {
      try {
        this.register(config);
      } catch (error) {
        console.error(`Failed to import callback ${config.id}:`, error);
      }
    });

    // Import templates if provided
    if (data.templates) {
      data.templates.forEach(template => {
        this.templates.set(template.id, template);
      });
    }
  }

  /**
   * Load built-in callback templates
   */
  private async loadBuiltInTemplates(): Promise<void> {
    const templates: CallbackTemplate[] = [
      {
        id: 'oauth-standard',
        name: 'Standard OAuth Callback',
        description: 'Standard OAuth 2.0 callback handler',
        integrationType: 'oauth',
        template: {
          type: 'oauth',
          path: '/oauth/callback',
          methods: ['GET', 'POST'],
          handler: 'handleOAuthCallback',
          config: {
            oauth: {
              validateState: true,
              flowType: 'redirect',
              redirectUrl: '/integrations'
            }
          },
          security: {
            requireAuth: false,
            cors: {
              origins: ['*'],
              methods: ['GET', 'POST'],
              headers: ['Content-Type']
            }
          },
          metadata: {
            description: 'Handles OAuth 2.0 authorization code flow',
            tags: ['oauth', 'authentication'],
            analytics: {
              trackEvents: true,
              eventPrefix: 'oauth'
            },
            errorHandling: {
              logErrors: true,
              notifyOnError: true
            }
          },
          isActive: true
        },
        requiredEnvVars: ['CLIENT_ID', 'CLIENT_SECRET'],
        setupInstructions: 'Configure OAuth client credentials in environment variables'
      },
      {
        id: 'webhook-standard',
        name: 'Standard Webhook Handler',
        description: 'Standard webhook receiver with signature verification',
        integrationType: 'webhook',
        template: {
          type: 'webhook',
          path: '/webhook',
          methods: ['POST'],
          handler: 'handleWebhook',
          config: {
            webhook: {
              requiredHeaders: ['X-Signature'],
              retryConfig: {
                maxRetries: 3,
                backoffMs: 1000
              }
            }
          },
          security: {
            requireAuth: false,
            signatureVerification: {
              algorithm: 'hmac-sha256',
              secretKey: '',
              headerName: 'X-Signature'
            }
          },
          metadata: {
            description: 'Handles incoming webhooks with signature verification',
            tags: ['webhook', 'real-time'],
            analytics: {
              trackEvents: true,
              eventPrefix: 'webhook'
            },
            errorHandling: {
              logErrors: true,
              notifyOnError: true
            }
          },
          isActive: true
        },
        requiredEnvVars: ['WEBHOOK_SECRET'],
        setupInstructions: 'Configure webhook secret for signature verification'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Load existing callback configurations (from database/storage)
   */
  private async loadExistingCallbacks(): Promise<void> {
    // Load built-in callback configurations
    try {
      const { registerAllCallbacks } = await import('./configs/integrationCallbacks');
      await registerAllCallbacks();
      console.log('✅ Loaded all callback configurations');
    } catch (error) {
      console.error('❌ Failed to load callback configurations:', error);
    }
  }

  /**
   * Check if a request path matches a registered path pattern
   */
  private matchesPathPattern(pattern: string, path: string): boolean {
    // Convert pattern to regex
    // Example: /oauth/:integration/callback -> /oauth/([^/]+)/callback
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }
}

/**
 * Global callback registry instance
 */
export const callbackRegistry = new CallbackRegistryImpl();

/**
 * Initialize the callback registry
 */
export const initializeCallbackRegistry = async (): Promise<void> => {
  await callbackRegistry.initialize();
};

/**
 * Helper function to register a callback with validation
 */
export const registerCallback = (config: CallbackConfig): void => {
  callbackRegistry.register(config);
};

/**
 * Helper function to create and register a callback from template
 */
export const registerCallbackFromTemplate = (
  templateId: string,
  integrationSlug: string,
  overrides: Partial<CallbackConfig> = {}
): CallbackConfig => {
  const config = callbackRegistry.createFromTemplate(templateId, integrationSlug, overrides);
  callbackRegistry.register(config);
  return config;
}; 