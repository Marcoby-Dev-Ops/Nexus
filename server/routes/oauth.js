const express = require('express');
const { z } = require('zod');

const router = express.Router();

// OAuth provider configurations (server-side only)
const OAUTH_PROVIDERS = {
  authentik: {
    clientId: process.env.VITE_AUTHENTIK_CLIENT_ID,
    clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    authorizationUrl: 'https://identity.marcoby.com/application/o/authorize/',
    tokenUrl: 'https://identity.marcoby.com/application/o/token/',
    userInfoUrl: 'https://identity.marcoby.com/application/o/userinfo/',
    scope: 'openid profile email groups',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email',
  },
  google_analytics: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email',
  },
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scope: 'contacts crm.objects.contacts.read crm.objects.companies.read',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    authorizationUrl: process.env.PAYPAL_ENV === 'live' 
      ? 'https://www.paypal.com/signin/authorize' 
      : 'https://www.sandbox.paypal.com/signin/authorize',
    tokenUrl: process.env.PAYPAL_ENV === 'live'
      ? 'https://api.paypal.com/v1/oauth2/token'
      : 'https://api.sandbox.paypal.com/v1/oauth2/token',
    scope: 'openid profile https://uri.paypal.com/services/paypalattributes',
    baseUrl: process.env.PAYPAL_ENV === 'live' 
      ? 'https://www.paypal.com' 
      : 'https://www.sandbox.paypal.com',
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read',
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scope: 'channels:read channels:history users:read',
  },
  'google-workspace': {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly',
  },
};

// Validation schemas
const OAuthStateSchema = z.object({
  userId: z.string(),
  integrationSlug: z.string(),
  redirectUri: z.string().optional(),
});

const TokenRefreshSchema = z.object({
  provider: z.string(),
  refreshToken: z.string(),
});

/**
 * Get OAuth configuration for a provider (public info only)
 */
router.get('/config/:provider', (req, res) => {
  const { provider } = req.params;
  const config = OAUTH_PROVIDERS[provider];
  
  if (!config) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  // Only return public configuration (no secrets)
  const publicConfig = {
    clientId: config.clientId,
    authorizationUrl: config.authorizationUrl,
    scope: config.scope,
    redirectUri: provider === 'authentik' 
      ? `${process.env.VITE_DEV_APP_URL || 'http://localhost:5173'}/auth/callback`
      : `${process.env.VITE_DEV_APP_URL || 'http://localhost:5173'}/integrations/${provider}/callback`,
  };

  // Add provider-specific public config
  if (config.baseUrl) {
    publicConfig.baseUrl = config.baseUrl;
  }

  res.json(publicConfig);
});

/**
 * Generate OAuth state for CSRF protection
 */
router.post('/state', async (req, res) => {
  try {
    const { userId, integrationSlug, redirectUri } = OAuthStateSchema.parse(req.body);
    
    // Generate state and code verifier
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(128);
    
    const oauthState = {
      state,
      codeVerifier,
      userId,
      integrationSlug,
      timestamp: Date.now(),
      redirectUri,
    };

    // TODO: Store state in database
    // await storeOAuthState(oauthState);

    res.json({ data: oauthState });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

/**
 * Exchange authorization code for tokens (server-side)
 */
router.post('/token', async (req, res) => {
  try {
    const { provider, code, redirectUri, codeVerifier } = req.body;
    
    const config = OAUTH_PROVIDERS[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await response.json();

    if (!response.ok) {
      return res.status(400).json({ 
        error: 'Token exchange failed', 
        details: tokenData.error_description || tokenData.error 
      });
    }

    // For Authentik, return the full token response
    if (provider === 'authentik') {
      return res.json({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
        id_token: tokenData.id_token,
      });
    } else {
      // For other providers, return the standard format
      return res.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      });
    }
  } catch (error) {
    // Check if response has already been sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Refresh OAuth tokens (server-side)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { provider, refreshToken } = TokenRefreshSchema.parse(req.body);
    
    const config = OAUTH_PROVIDERS[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await response.json();

    if (!response.ok) {
      return res.status(400).json({ 
        error: 'Token refresh failed', 
        details: tokenData.error_description || tokenData.error 
      });
    }

    // For Authentik, return the full token response
    if (provider === 'authentik') {
      res.json({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token || refreshToken,
        scope: tokenData.scope,
        id_token: tokenData.id_token,
      });
    } else {
      // For other providers, return the standard format
      res.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Utility function to generate random strings
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;
