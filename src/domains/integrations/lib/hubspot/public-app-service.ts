/**
 * HubSpot Public App Service
 * 
 * This service handles the registration and management of Nexus as a HubSpot public app.
 * It includes app configuration, webhook management, and integration point setup.
 */

import { getHubSpotAppConfig, validateHubSpotAppConfig } from './app-config';
import type { HubSpotAppConfig, HubSpotAppCapability } from './app-config';

export interface HubSpotPublicAppRegistration {
  appId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  webhookUrl: string;
  iframeUrl: string;
  cardUrl: string;
  capabilities: HubSpotAppCapability[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotWebhookSubscription {
  id: string;
  eventType: string;
  propertyName?: string;
  active: boolean;
  subscriptionDetails: {
    url: string;
    maxConcurrentRequests: number;
  };
}

export interface HubSpotIntegrationPoint {
  id: string;
  name: string;
  type: 'iframe' | 'card' | 'workflow';
  url: string;
  scopes: string[];
  enabled: boolean;
}

/**
 * HubSpot Public App Service
 */
export class HubSpotPublicAppService {
  private config: HubSpotAppConfig;

  constructor() {
    this.config = getHubSpotAppConfig();
  }

  /**
   * Validate the app configuration
   */
  validateConfiguration(): string[] {
    return validateHubSpotAppConfig(this.config);
  }

  /**
   * Get app registration data for HubSpot
   */
  getAppRegistrationData(): HubSpotPublicAppRegistration {
    const errors = this.validateConfiguration();
    if (errors.length > 0) {
      throw new Error(`App configuration errors: ${errors.join(', ')}`);
    }

    return {
      appId: this.config.appId,
      appName: this.config.appName,
      appDescription: this.config.appDescription,
      appUrl: this.config.appUrl,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      scopes: this.config.capabilities.flatMap(cap => cap.scopes),
      webhookUrl: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
      iframeUrl: `${this.config.appUrl}/integrations/hubspot/dashboard`,
      cardUrl: `${this.config.appUrl}/integrations/hubspot/cards`,
      capabilities: this.config.capabilities.filter(cap => cap.enabled),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get webhook subscriptions for the app
   */
  getWebhookSubscriptions(): HubSpotWebhookSubscription[] {
    return [
      {
        id: 'contact-events',
        eventType: 'contact.creation',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'contact-updates',
        eventType: 'contact.propertyChange',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'contact-deletions',
        eventType: 'contact.deletion',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'company-events',
        eventType: 'company.creation',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'company-updates',
        eventType: 'company.propertyChange',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'company-deletions',
        eventType: 'company.deletion',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'deal-events',
        eventType: 'deal.creation',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'deal-updates',
        eventType: 'deal.propertyChange',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      },
      {
        id: 'deal-deletions',
        eventType: 'deal.deletion',
        active: true,
        subscriptionDetails: {
          url: `${this.config.appUrl}/functions/v1/hubspot-webhooks`,
          maxConcurrentRequests: 10
        }
      }
    ];
  }

  /**
   * Get integration points for the app
   */
  getIntegrationPoints(): HubSpotIntegrationPoint[] {
    return [
      {
        id: 'nexus-dashboard',
        name: 'Nexus Business Dashboard',
        type: 'iframe',
        url: `${this.config.appUrl}/integrations/hubspot/dashboard`,
        scopes: [
          'crm.objects.contacts.read',
          'crm.objects.companies.read',
          'crm.objects.deals.read'
        ],
        enabled: true
      },
      {
        id: 'contact-insights',
        name: 'Contact Insights Card',
        type: 'card',
        url: `${this.config.appUrl}/integrations/hubspot/cards/contact-insights`,
        scopes: [
          'crm.objects.contacts.read'
        ],
        enabled: true
      },
      {
        id: 'deal-analytics',
        name: 'Deal Analytics Card',
        type: 'card',
        url: `${this.config.appUrl}/integrations/hubspot/cards/deal-analytics`,
        scopes: [
          'crm.objects.deals.read'
        ],
        enabled: true
      },
      {
        id: 'lead-management',
        name: 'Lead Management Workflow',
        type: 'workflow',
        url: `${this.config.appUrl}/api/workflows/hubspot/lead-management`,
        scopes: [
          'crm.objects.contacts.read',
          'crm.objects.contacts.write'
        ],
        enabled: true
      }
    ];
  }

  /**
   * Generate app manifest for HubSpot
   */
  generateAppManifest(): any {
    const registration = this.getAppRegistrationData();
    const webhooks = this.getWebhookSubscriptions();
    const integrations = this.getIntegrationPoints();

    return {
      name: registration.appName,
      description: registration.appDescription,
      scopes: registration.scopes,
      public: true,
      auth: {
        type: 'oauth2',
        scopes: registration.scopes
      },
      webhooks: webhooks.map(webhook => ({
        subscriptionType: webhook.eventType,
        propertyName: webhook.propertyName,
        active: webhook.active,
        subscriptionDetails: webhook.subscriptionDetails
      })),
      integrations: integrations.map(integration => ({
        name: integration.name,
        type: integration.type,
        url: integration.url,
        scopes: integration.scopes
      })),
      settings: {
        appId: registration.appId,
        appUrl: registration.appUrl,
        redirectUri: registration.redirectUri
      }
    };
  }

  /**
   * Register webhooks with HubSpot
   */
  async registerWebhooks(accessToken: string): Promise<void> {
    const webhooks = this.getWebhookSubscriptions();
    
    for (const webhook of webhooks) {
      try {
        const response = await fetch('https://api.hubapi.com/webhooks/v1/portal/webhooks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscriptionType: webhook.eventType,
            propertyName: webhook.propertyName,
            active: webhook.active,
            subscriptionDetails: webhook.subscriptionDetails
          })
        });

        if (!response.ok) {
          console.error(`Failed to register webhook ${webhook.id}:`, response.statusText);
        } else {
          console.log(`✅ Registered webhook: ${webhook.id}`);
        }
      } catch (error) {
        console.error(`Error registering webhook ${webhook.id}:`, error);
      }
    }
  }

  /**
   * Get app capabilities summary
   */
  getCapabilitiesSummary(): { category: string; count: number; scopes: string[] }[] {
    const capabilities = this.config.capabilities.filter(cap => cap.enabled);
    const summary = new Map<string, { count: number; scopes: Set<string> }>();

    capabilities.forEach(cap => {
      if (!summary.has(cap.category)) {
        summary.set(cap.category, { count: 0, scopes: new Set() });
      }
      const category = summary.get(cap.category)!;
      category.count++;
      cap.scopes.forEach(scope => category.scopes.add(scope));
    });

    return Array.from(summary.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      scopes: Array.from(data.scopes)
    }));
  }

  /**
   * Validate OAuth scopes
   */
  validateOAuthScopes(): { valid: boolean; missing: string[]; extra: string[] } {
    const requiredScopes = [
      'oauth',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write'
    ];

    const currentScopes = this.config.capabilities.flatMap(cap => cap.scopes);
    const missing = requiredScopes.filter(scope => !currentScopes.includes(scope));
    const extra = currentScopes.filter(scope => !requiredScopes.includes(scope));

    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  }
}

// Export singleton instance
export const hubSpotPublicAppService = new HubSpotPublicAppService(); 