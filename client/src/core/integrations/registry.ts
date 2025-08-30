/**
 * Connector Registry
 * 
 * Central registry for all available integrations
 * Provides unified interface for connector management and discovery
 */

import { ConnectorFactory, BaseConnector } from './connector-base';
import { HubSpotConnector } from './connectors/hubspot';
import { Microsoft365Connector } from './connectors/microsoft365';
import { SlackConnector } from './connectors/slack';
import { StripeConnector } from './connectors/stripe';
import { NotionConnector } from './connectors/notion';
import { QuickBooksConnector } from './connectors/quickbooks';
import { GitHubConnector } from './connectors/github';
import { ShopifyConnector } from './connectors/shopify';
import { ZoomConnector } from './connectors/zoom';
import { logger } from '@/shared/utils/logger';

/**
 * Available connector types
 */
export const CONNECTOR_TYPES = {
  HUBSPOT: 'hubspot',
  SLACK: 'slack',
  SALESFORCE: 'salesforce',
  MICROSOFT365: 'microsoft365',
  GOOGLE: 'google',
  NOTION: 'notion',
  QUICKBOOKS: 'quickbooks',
  GITHUB: 'github',
  SHOPIFY: 'shopify',
  ZOOM: 'zoom',
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

    // Register Microsoft 365 connector
    this.registerConnector({
      id: CONNECTOR_TYPES.MICROSOFT365,
      name: 'Microsoft 365',
      description: 'Microsoft 365 and Graph API integration for Teams, Outlook, OneDrive, and SharePoint',
      version: '1.0.0',
      icon: '/icons/microsoft.svg',
      authType: 'oauth2',
      scopes: [
        'User.Read',
        'Team.ReadBasic.All',
        'Mail.Read',
        'Calendars.Read',
        'Files.Read',
        'Sites.Read.All',
      ],
      features: [
        'user_sync',
        'team_sync',
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

    // Register Notion connector
    this.registerConnector({
      id: CONNECTOR_TYPES.NOTION,
      name: 'Notion',
      description: 'All-in-one workspace for notes, docs, and project management',
      version: '1.0.0',
      icon: '/icons/notion.svg',
      authType: 'oauth2',
      scopes: [
        'read_content',
        'update_content',
        'insert_content',
        'create_pages',
        'update_pages',
      ],
      features: [
        'page_sync',
        'database_sync',
        'block_sync',
        'user_sync',
        'webhook_support',
      ],
      configSchema: {
        syncPages: { type: 'boolean', default: true },
        syncDatabases: { type: 'boolean', default: true },
        syncBlocks: { type: 'boolean', default: true },
        syncUsers: { type: 'boolean', default: true },
        pageLimit: { type: 'number', min: 1, max: 100, default: 50 },
        databaseLimit: { type: 'number', min: 1, max: 100, default: 50 },
        includeArchived: { type: 'boolean', default: false },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 3,
        burstSize: 10,
      },
    });

    // Register QuickBooks connector
    this.registerConnector({
      id: CONNECTOR_TYPES.QUICKBOOKS,
      name: 'QuickBooks',
      description: 'Financial management and accounting software',
      version: '1.0.0',
      icon: '/icons/quickbooks.svg',
      authType: 'oauth2',
      scopes: [
        'com.intuit.quickbooks.accounting',
        'com.intuit.quickbooks.payment',
        'com.intuit.quickbooks.payroll',
      ],
      features: [
        'customer_sync',
        'invoice_sync',
        'payment_sync',
        'item_sync',
        'account_sync',
        'webhook_support',
      ],
      configSchema: {
        syncCustomers: { type: 'boolean', default: true },
        syncInvoices: { type: 'boolean', default: true },
        syncPayments: { type: 'boolean', default: true },
        syncItems: { type: 'boolean', default: true },
        syncAccounts: { type: 'boolean', default: true },
        customerLimit: { type: 'number', min: 1, max: 1000, default: 100 },
        invoiceLimit: { type: 'number', min: 1, max: 1000, default: 100 },
        includeInactive: { type: 'boolean', default: false },
      },
      webhookSupported: true,
      rateLimits: {
        requestsPerSecond: 5,
        burstSize: 15,
      },
    });

                 // Register GitHub connector
             this.registerConnector({
               id: CONNECTOR_TYPES.GITHUB,
               name: 'GitHub',
               description: 'Development platform and version control system',
               version: '1.0.0',
               icon: '/icons/github.svg',
               authType: 'oauth2',
               scopes: [
                 'repo',
                 'user',
                 'read:org',
                 'write:org',
                 'admin:org',
               ],
               features: [
                 'repository_sync',
                 'issue_sync',
                 'pull_request_sync',
                 'user_sync',
                 'commit_sync',
                 'webhook_support',
               ],
               configSchema: {
                 syncRepositories: { type: 'boolean', default: true },
                 syncIssues: { type: 'boolean', default: true },
                 syncPullRequests: { type: 'boolean', default: true },
                 syncUsers: { type: 'boolean', default: true },
                 syncCommits: { type: 'boolean', default: false },
                 repositoryLimit: { type: 'number', min: 1, max: 100, default: 50 },
                 issueLimit: { type: 'number', min: 1, max: 100, default: 50 },
                 includePrivate: { type: 'boolean', default: true },
                 includeForks: { type: 'boolean', default: false },
               },
               webhookSupported: true,
               rateLimits: {
                 requestsPerSecond: 5,
                 burstSize: 20,
               },
             });

             // Register Shopify connector
             this.registerConnector({
               id: CONNECTOR_TYPES.SHOPIFY,
               name: 'Shopify',
               description: 'E-commerce platform for online stores and retail point-of-sale systems',
               version: '1.0.0',
               icon: '/icons/shopify.svg',
               authType: 'oauth2',
               scopes: [
                 'read_products',
                 'write_products',
                 'read_orders',
                 'write_orders',
                 'read_customers',
                 'write_customers',
                 'read_inventory',
                 'write_inventory',
               ],
               features: [
                 'product_sync',
                 'order_sync',
                 'customer_sync',
                 'inventory_sync',
                 'webhook_support',
               ],
               configSchema: {
                 syncProducts: { type: 'boolean', default: true },
                 syncOrders: { type: 'boolean', default: true },
                 syncCustomers: { type: 'boolean', default: true },
                 syncInventory: { type: 'boolean', default: true },
                 productLimit: { type: 'number', min: 1, max: 250, default: 50 },
                 orderLimit: { type: 'number', min: 1, max: 250, default: 50 },
                 customerLimit: { type: 'number', min: 1, max: 250, default: 50 },
                 includeDraft: { type: 'boolean', default: false },
               },
               webhookSupported: true,
               rateLimits: {
                 requestsPerSecond: 2,
                 burstSize: 40,
               },
             });

             // Register Zoom connector
             this.registerConnector({
               id: CONNECTOR_TYPES.ZOOM,
               name: 'Zoom',
               description: 'Video conferencing and online meeting platform',
               version: '1.0.0',
               icon: '/icons/zoom.svg',
               authType: 'oauth2',
               scopes: [
                 'meeting:read',
                 'meeting:write',
                 'webinar:read',
                 'webinar:write',
                 'user:read',
                 'user:write',
                 'recording:read',
                 'recording:write',
               ],
               features: [
                 'meeting_sync',
                 'webinar_sync',
                 'user_sync',
                 'recording_sync',
                 'webhook_support',
               ],
               configSchema: {
                 syncUsers: { type: 'boolean', default: true },
                 syncMeetings: { type: 'boolean', default: true },
                 syncWebinars: { type: 'boolean', default: true },
                 syncRecordings: { type: 'boolean', default: true },
                 userLimit: { type: 'number', min: 1, max: 300, default: 50 },
                 meetingLimit: { type: 'number', min: 1, max: 300, default: 50 },
                 webinarLimit: { type: 'number', min: 1, max: 300, default: 50 },
                 includeDeleted: { type: 'boolean', default: false },
               },
               webhookSupported: true,
               rateLimits: {
                 requestsPerSecond: 10,
                 burstSize: 100,
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

  // Register Microsoft 365 connector
  const microsoft365Connector = new Microsoft365Connector();
  ConnectorFactory.register(microsoft365Connector);

  // Register Slack connector
  const slackConnector = new SlackConnector();
  ConnectorFactory.register(slackConnector);

  // Register Stripe connector
  const stripeConnector = new StripeConnector();
  ConnectorFactory.register(stripeConnector);

  // Register Notion connector
  const notionConnector = new NotionConnector();
  ConnectorFactory.register(notionConnector);

  // Register QuickBooks connector
  const quickbooksConnector = new QuickBooksConnector();
  ConnectorFactory.register(quickbooksConnector);

             // Register GitHub connector
           const githubConnector = new GitHubConnector();
           ConnectorFactory.register(githubConnector);

           // Register Shopify connector
           const shopifyConnector = new ShopifyConnector();
           ConnectorFactory.register(shopifyConnector);

           // Register Zoom connector
           const zoomConnector = new ZoomConnector();
           ConnectorFactory.register(zoomConnector);

  // TODO: Register other connectors as they are implemented
  // const salesforceConnector = new SalesforceConnector();
  // ConnectorFactory.register(salesforceConnector);
  
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
