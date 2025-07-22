/**
 * Integration Callback Configurations
 * Defines callback configurations for all existing integrations
 */

import type { CallbackConfig } from '@/core/types/callbacks';

/**
 * Google Analytics OAuth Callback Configuration
 */
export const googleAnalyticsCallback: CallbackConfig = {
  id: 'google-analytics-oauth',
  integrationSlug: 'google-analytics',
  type: 'oauth',
  path: '/auth/google-analytics-callback',
  methods: ['GET'],
  handler: 'handleOAuthCallback',
  config: {
    oauth: {
      validateState: true,
      requiredScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      redirectUrl: '/integrations',
      flowType: 'popup'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://accounts.google.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'Google Analytics OAuth 2.0 callback handler',
    tags: ['oauth', 'google', 'analytics'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'google_analytics'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * Google Workspace OAuth Callback Configuration
 */
export const googleWorkspaceCallback: CallbackConfig = {
  id: 'google-workspace-oauth',
  integrationSlug: 'google-workspace',
  type: 'oauth',
  path: '/integrations/google-workspace/callback',
  methods: ['GET'],
  handler: 'handleOAuthCallback',
  config: {
    oauth: {
      validateState: true,
      requiredScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      redirectUrl: '/integrations',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://accounts.google.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'Google Workspace OAuth 2.0 callback handler',
    tags: ['oauth', 'google', 'workspace'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'google_workspace'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * HubSpot OAuth Callback Configuration
 * Note: OAuth goes to Supabase function first, then redirects to Nexus
 */
export const hubspotCallback: CallbackConfig = {
  id: 'hubspot-oauth',
  integrationSlug: 'hubspot',
  type: 'oauth',
  path: '/integrations/hubspot/callback',
  methods: ['GET'],
  handler: 'handleSupabaseRedirectCallback',
  config: {
          oauth: {
        validateState: false, // Frontend handles state validation
        redirectUrl: '/integrations',
        flowType: 'redirect'
      }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://app.hubspot.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'HubSpot OAuth 2.0 callback handler',
    tags: ['oauth', 'hubspot', 'crm'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'hubspot'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * PayPal OAuth Callback Configuration
 * Note: OAuth goes to Supabase function first, then redirects to Nexus
 */
export const paypalCallback: CallbackConfig = {
  id: 'paypal-oauth',
  integrationSlug: 'paypal',
  type: 'oauth',
  path: '/integrations/paypal/callback',
  methods: ['GET'],
  handler: 'handleSupabaseRedirectCallback',
  config: {
    oauth: {
      validateState: false, // Supabase function handles state validation
      supabaseFunctionUrl: '/functions/v1/paypal_oauth_callback',
      redirectUrl: '/integrations',
      flowType: 'popup'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://www.paypal.com', 'https://www.sandbox.paypal.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'PayPal OAuth 2.0 callback handler',
    tags: ['oauth', 'paypal', 'payment'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'paypal'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * NinjaRMM OAuth Callback Configuration
 * Note: OAuth goes to Supabase function first, then redirects to Nexus
 */
export const ninjaRmmCallback: CallbackConfig = {
  id: 'ninjarmm-oauth',
  integrationSlug: 'ninjarmm',
  type: 'oauth',
  path: '/integrations/ninjarmm/callback',
  methods: ['GET'],
  handler: 'handleSupabaseRedirectCallback',
  config: {
    oauth: {
      validateState: false, // Supabase function handles state validation
      supabaseFunctionUrl: '/functions/v1/ninjarmm-oauth-callback',
      redirectUrl: '/integrations',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://app.ninjarmm.com'],
      methods: ['GET', 'POST'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'NinjaRMM OAuth 2.0 callback handler',
    tags: ['oauth', 'ninjarmm', 'monitoring'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'ninjarmm'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * LinkedIn OAuth Callback Configuration
 * Note: This integration doesn't have a Supabase function yet, so it uses direct callback
 */
export const linkedinCallback: CallbackConfig = {
  id: 'linkedin-oauth',
  integrationSlug: 'linkedin',
  type: 'oauth',
  path: '/integrations/linkedin/callback',
  methods: ['GET'],
  handler: 'handleOAuthCallback',
  config: {
    oauth: {
      validateState: true,
      requiredScopes: ['r_liteprofile', 'r_emailaddress'],
      tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
      redirectUrl: '/integrations',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://www.linkedin.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'LinkedIn OAuth 2.0 callback handler',
    tags: ['oauth', 'linkedin', 'social'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'linkedin'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * Slack OAuth Callback Configuration
 * Note: OAuth goes to Supabase function first, then redirects to Nexus
 */
export const slackCallback: CallbackConfig = {
  id: 'slack-oauth',
  integrationSlug: 'slack',
  type: 'oauth',
  path: '/integrations/slack/callback',
  methods: ['GET'],
  handler: 'handleSupabaseRedirectCallback',
  config: {
    oauth: {
      validateState: false, // Supabase function handles state validation
      supabaseFunctionUrl: '/functions/v1/slack-oauth-callback',
      redirectUrl: '/integrations',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://slack.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'Slack OAuth 2.0 callback handler',
    tags: ['oauth', 'slack', 'communication'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'slack'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * Supabase Auth Callback Configuration
 */
export const supabaseAuthCallback: CallbackConfig = {
  id: 'supabase-auth',
  integrationSlug: 'supabase',
  type: 'oauth',
  path: '/auth/callback',
  methods: ['GET'],
  handler: 'handleOAuthCallback',
  config: {
    oauth: {
      validateState: false,
      redirectUrl: '/dashboard',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['*'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'Supabase authentication callback handler',
    tags: ['oauth', 'supabase', 'auth'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'supabase_auth'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

export const microsoftCallback: CallbackConfig = {
  id: 'microsoft-oauth',
  integrationSlug: 'microsoft',
  type: 'oauth',
  path: '/integrations/microsoft/callback',
  methods: ['GET'],
  handler: 'handleSupabaseRedirectCallback',
  config: {
    oauth: {
      validateState: true,
      supabaseFunctionUrl: '/functions/v1/microsoft-graph-oauth-callback',
      redirectUrl: '/onboarding',
      flowType: 'redirect'
    }
  },
  security: {
    requireAuth: false,
    cors: {
      origins: ['https://login.microsoftonline.com'],
      methods: ['GET'],
      headers: ['Content-Type', 'Authorization']
    }
  },
  metadata: {
    description: 'Microsoft OAuth 2.0 callback handler',
    tags: ['oauth', 'microsoft', 'teams'],
    version: '1.0.0',
    analytics: {
      trackEvents: true,
      eventPrefix: 'microsoft'
    },
    errorHandling: {
      logErrors: true,
      notifyOnError: true
    }
  },
  isActive: true,
  createdAt: new Date().toISOString()
};

/**
 * All callback configurations
 */
export const allCallbackConfigs: CallbackConfig[] = [
  googleAnalyticsCallback,
  googleWorkspaceCallback,
  hubspotCallback,
  paypalCallback,
  ninjaRmmCallback,
  linkedinCallback,
  slackCallback,
  supabaseAuthCallback,
  microsoftCallback
];

/**
 * Register all callback configurations
 */
export const registerAllCallbacks = async () => {
  const { callbackRegistry } = await import('../CallbackRegistry');
  
  allCallbackConfigs.forEach(config => {
    try {
      callbackRegistry.register(config);
      console.log(`✅ Registered callback: ${config.id}`);
    } catch (error) {
      console.error(`❌ Failed to register callback ${config.id}:`, error);
    }
  });
  
  console.log(`📋 Registered ${allCallbackConfigs.length} callback configurations`);
};

/**
 * Get callback configuration by integration slug
 */
export const getCallbackByIntegration = (integrationSlug: string): CallbackConfig | undefined => {
  return allCallbackConfigs.find(config => config.integrationSlug === integrationSlug);
};

/**
 * Get callback configuration by path
 */
export const getCallbackByPath = (path: string): CallbackConfig | undefined => {
  return allCallbackConfigs.find(config => config.path === path);
}; 