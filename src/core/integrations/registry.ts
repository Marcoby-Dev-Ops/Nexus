/**
 * Connector Registry
 * 
 * Central registry for all available integrations
 * Provides unified interface for connector management and discovery
 */

import { ConnectorFactory, BaseConnector } from './connector-base';
import { HubSpotConnector } from './connectors/hubspot';
import { logger } from '@/shared/utils/logger';

/**
 * Available connector types
 */
export const CONNECTOR_TYPES = {
  HUBSPOT: 'hubspot',
  SLACK: 'slack',
  SALESFORCE: 'salesforce',
  MICROSOFT: 'microsoft',
  GOOGLE: 'google',
} as const;

export type ConnectorType = typeof CONNECTOR_TYPES[keyof typeof CONNECTOR_TYPES];

/**
 * Connector metadata
 */
export interface ConnectorMetadata {
  id: ConnectorType;
  name: string;
  description: string;
  version: string;
  icon: string;
  authType: 'oauth2' | 'api_key' | 'bearer';
  scopes: string[];
  features: string[];
  configSchema: any;
  webhookSupported: boolean;
  rateLimits: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

/**
 * Connector Registry
 * 
 * Manages all available connectors and provides discovery capabilities
 */
export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<ConnectorType, ConnectorMetadata> = new Map();

  private constructor() {
    this.initializeConnectors();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  /**
   * Initialize all available connectors
   */
  private initializeConnectors(): void {
    // Register HubSpot connector
    this.registerConnector({
      id: CONNECTOR_TYPES.HUBSPOT,
      name: 'HubSpot',
      description: 'CRM and marketing automation platform',
      version: '1.0.0',
      icon: '/icons/hubspot.svg',
      authType: 'oauth2',
      scopes: [
        'contacts',
        'companies',
        'deals',
        'tickets',
        'analytics',
      ],
      features: [
        'contact_sync',
        'company_sync',
        'deal_sync',
        'webhook_support',
        'real_time_updates',
      ],
      configSchema: {
        syncContacts: { type: 'boolean', default: true },
        syncCompanies: { type: 'boolean', default: true },
        syncDeals: { type: 'boolean', default: true },
        batchSize: { type: 'number', min: 1, max: 100, default: 50 },
        webhookEvents: { type: 'array', default: ['contact.creation', 'contact.propertyChange'] },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 4,
        burstSize: 10,
      },
    });

    // Register Slack connector
    this.registerConnector({
      id: CONNECTOR_TYPES.SLACK,
      name: 'Slack',
      description: 'Team communication and collaboration platform',
      version: '1.0.0',
      icon: '/icons/slack.svg',
      authType: 'oauth2',
      scopes: [
        'channels:read',
        'channels:history',
        'users:read',
        'files:read',
        'groups:read',
      ],
      features: [
        'message_sync',
        'channel_sync',
        'user_sync',
        'file_sync',
        'webhook_support',
      ],
      configSchema: {
        syncChannels: { type: 'boolean', default: true },
        syncMessages: { type: 'boolean', default: true },
        syncUsers: { type: 'boolean', default: true },
        messageLimit: { type: 'number', min: 1, max: 1000, default: 100 },
        includeFiles: { type: 'boolean', default: false },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 1,
        burstSize: 3,
      },
    });

    // Register Salesforce connector
    this.registerConnector({
      id: CONNECTOR_TYPES.SALESFORCE,
      name: 'Salesforce',
      description: 'Customer relationship management platform',
      version: '1.0.0',
      icon: '/icons/salesforce.svg',
      authType: 'oauth2',
      scopes: [
        'api',
        'refresh_token',
        'offline_access',
      ],
      features: [
        'lead_sync',
        'contact_sync',
        'account_sync',
        'opportunity_sync',
        'case_sync',
        'webhook_support',
      ],
      configSchema: {
        syncLeads: { type: 'boolean', default: true },
        syncContacts: { type: 'boolean', default: true },
        syncAccounts: { type: 'boolean', default: true },
        syncOpportunities: { type: 'boolean', default: true },
        syncCases: { type: 'boolean', default: true },
        batchSize: { type: 'number', min: 1, max: 200, default: 100 },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 2,
        burstSize: 5,
      },
    });

    // Register Microsoft connector
    this.registerConnector({
      id: CONNECTOR_TYPES.MICROSOFT,
      name: 'Microsoft 365',
      description: 'Microsoft 365 and Graph API integration',
      version: '1.0.0',
      icon: '/icons/microsoft.svg',
      authType: 'oauth2',
      scopes: [
        'User.Read',
        'Mail.Read',
        'Calendars.Read',
        'Files.Read',
        'Sites.Read.All',
      ],
      features: [
        'email_sync',
        'calendar_sync',
        'file_sync',
        'sharepoint_sync',
        'onedrive_sync',
        'webhook_support',
      ],
      configSchema: {
        syncEmails: { type: 'boolean', default: true },
        syncCalendar: { type: 'boolean', default: true },
        syncFiles: { type: 'boolean', default: true },
        syncSharePoint: { type: 'boolean', default: true },
        emailLimit: { type: 'number', min: 1, max: 1000, default: 100 },
        includeAttachments: { type: 'boolean', default: false },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 3,
        burstSize: 8,
      },
    });

    // Register Google connector
    this.registerConnector({
      id: CONNECTOR_TYPES.GOOGLE,
      name: 'Google Workspace',
      description: 'Google Workspace and Drive integration',
      version: '1.0.0',
      icon: '/icons/google.svg',
      authType: 'oauth2',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/contacts.readonly',
      ],
      features: [
        'gmail_sync',
        'calendar_sync',
        'drive_sync',
        'contacts_sync',
        'webhook_support',
      ],
      configSchema: {
        syncGmail: { type: 'boolean', default: true },
        syncCalendar: { type: 'boolean', default: true },
        syncDrive: { type: 'boolean', default: true },
        syncContacts: { type: 'boolean', default: true },
        emailLimit: { type: 'number', min: 1, max: 1000, default: 100 },
        includeAttachments: { type: 'boolean', default: false },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 5,
        burstSize: 15,
      },
    });

    logger.info('Connector registry initialized', {
      connectorCount: this.connectors.size,
    });
  }

  /**
   * Register a connector
   */
  private registerConnector(metadata: ConnectorMetadata): void {
    this.connectors.set(metadata.id, metadata);
    logger.info('Registered connector', {
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
    });
  }

  /**
   * Get all available connectors
   */
  getAllConnectors(): ConnectorMetadata[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Get connector by ID
   */
  getConnector(id: ConnectorType): ConnectorMetadata | undefined {
    return this.connectors.get(id);
  }

  /**
   * Check if connector exists
   */
  hasConnector(id: ConnectorType): boolean {
    return this.connectors.has(id);
  }

  /**
   * Get connectors by feature
   */
  getConnectorsByFeature(feature: string): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).filter(connector =>
      connector.features.includes(feature)
    );
  }

  /**
   * Get connectors by auth type
   */
  getConnectorsByAuthType(authType: string): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).filter(connector =>
      connector.authType === authType
    );
  }

  /**
   * Get connectors that support webhooks
   */
  getWebhookSupportedConnectors(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).filter(connector =>
      connector.webhookSupported
    );
  }

  /**
   * Get connector configuration schema
   */
  getConnectorConfigSchema(id: ConnectorType): any | undefined {
    const connector = this.connectors.get(id);
    return connector?.configSchema;
  }

  /**
   * Validate connector configuration
   */
  validateConnectorConfig(id: ConnectorType, config: any): boolean {
    const connector = this.connectors.get(id);
    if (!connector) {
      return false;
    }

    try {
      // Basic validation - in a real implementation, you'd use a schema validator
      return typeof config === 'object' && config !== null;
    } catch (error) {
      logger.error('Connector config validation failed', {
        connectorId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get connector rate limits
   */
  getConnectorRateLimits(id: ConnectorType): { requestsPerSecond: number; burstSize: number } | undefined {
    const connector = this.connectors.get(id);
    return connector?.rateLimits;
  }

  /**
   * Get connector scopes
   */
  getConnectorScopes(id: ConnectorType): string[] | undefined {
    const connector = this.connectors.get(id);
    return connector?.scopes;
  }

  /**
   * Get connector features
   */
  getConnectorFeatures(id: ConnectorType): string[] | undefined {
    const connector = this.connectors.get(id);
    return connector?.features;
  }
}

/**
 * Initialize all connector instances
 */
export function initializeConnectors(): void {
  logger.info('Initializing connector instances');

  // Register HubSpot connector
  const hubspotConnector = new HubSpotConnector();
  ConnectorFactory.register(hubspotConnector);

  // TODO: Register other connectors as they are implemented
  // const slackConnector = new SlackConnector();
  // ConnectorFactory.register(slackConnector);
  
  // const salesforceConnector = new SalesforceConnector();
  // ConnectorFactory.register(salesforceConnector);
  
  // const microsoftConnector = new MicrosoftConnector();
  // ConnectorFactory.register(microsoftConnector);
  
  // const googleConnector = new GoogleConnector();
  // ConnectorFactory.register(googleConnector);

  logger.info('Connector instances initialized', {
    registeredConnectors: ConnectorFactory.getAll().map(c => c.id),
  });
}

/**
 * Get connector registry instance
 */
export function getConnectorRegistry(): ConnectorRegistry {
  return ConnectorRegistry.getInstance();
}
