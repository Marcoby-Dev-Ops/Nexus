const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');

const router = express.Router();
const { logger } = require('../src/utils/logger');

// Helper function to generate random strings
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64url');
}

// Helper function to decode JWT payload (without signature verification)
// Safe to use when token is received directly from the IdP over HTTPS
function decodeJwtPayload(jwt) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    logger.warn('Failed to decode JWT payload', e);
    return null;
  }
}

// OAuth provider configurations (server-side only) - Dynamic function to read env vars at runtime
function getOAuthProviders() {
  return {
    authentik: {
      clientId: process.env.AUTHENTIK_CLIENT_ID,
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
}

// Helper to determine the frontend URL used for redirects. Prefer FRONTEND_URL in production,
// fall back to VITE_DEV_APP_URL for local/dev, then to localhost default.
function getFrontendUrl() {
  return process.env.FRONTEND_URL || process.env.VITE_DEV_APP_URL || 'http://localhost:5173';
}

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
  const config = getOAuthProviders()[provider];
  
  if (!config) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  // Only return public configuration (no secrets)
  const publicConfig = {
    clientId: config.clientId,
    authorizationUrl: config.authorizationUrl,
    scope: config.scope,
    redirectUri: (() => {
      const front = getFrontendUrl();
      return provider === 'authentik'
        ? `${front}/auth/callback`
        : `${front}/integrations/${provider}/callback`;
    })(),
  };

  // Add provider-specific public config
  if (config.baseUrl) {
    publicConfig.baseUrl = config.baseUrl;
  }

  res.json(publicConfig);
});

// In-memory OAuth state storage (for development)
const oauthStates = new Map();

/**
 * Generate OAuth state for CSRF protection
 */
router.post('/state', async (req, res) => {
  try {
    // Log incoming request info to help diagnose proxy / rate-limit issues
    try {
      logger.info('Incoming OAuth state generation request', {
        ip: req.ip,
        xForwardedFor: req.get('X-Forwarded-For'),
        path: req.path,
        method: req.method,
        bodyPreview: typeof req.body === 'object' ? { ...(req.body), _len: Object.keys(req.body).length } : String(req.body)
      });
    } catch (logErr) {
      // Non-fatal logging error
      console.warn('Failed to log OAuth state request details', logErr);
    }

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
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    };

    // Store OAuth state in memory
    oauthStates.set(state, oauthState);

    // Clean up expired states
    const now = Date.now();
    for (const [key, value] of oauthStates.entries()) {
      if (value.expiresAt < now) {
        oauthStates.delete(key);
      }
    }

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
    const { provider, code, redirectUri, codeVerifier, state } = req.body;
    
    const config = getOAuthProviders()[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Validate OAuth state for security
    if (state) {
      try {
        const oauthState = oauthStates.get(state);
        
        if (!oauthState || oauthState.expiresAt < Date.now()) {
          console.error('Invalid or expired OAuth state');
          return res.status(400).json({ error: 'Invalid or expired OAuth state' });
        }

        // Clean up the used state
        oauthStates.delete(state);
        
        // Use the stored code verifier if available
        if (oauthState.codeVerifier && !codeVerifier) {
          codeVerifier = oauthState.codeVerifier;
        }
      } catch (error) {
        console.error('Error validating OAuth state:', error);
        return res.status(400).json({ error: 'Invalid OAuth state' });
      }
    }

    // Debug logging
    console.log('🔍 [OAuth Token Exchange] Provider:', provider);
    console.log('🔍 [OAuth Token Exchange] Client ID:', config.clientId);
    console.log('🔍 [OAuth Token Exchange] Client Secret:', config.clientSecret ? 'SET' : 'NOT SET');
    console.log('🔍 [OAuth Token Exchange] Redirect URI:', redirectUri);
    console.log('🔍 [OAuth Token Exchange] Code Verifier:', codeVerifier ? 'SET' : 'NOT SET');
    console.log('🔍 [OAuth Token Exchange] Token URL:', config.tokenUrl);

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

    console.log('🔍 [OAuth Token Exchange] Request body:', params.toString());

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

    // For Authentik, decode id_token and include user info in response
    if (provider === 'authentik') {
      const idTokenPayload = decodeJwtPayload(tokenData.id_token);

      // Extract user info from id_token claims
      const user = idTokenPayload ? {
        sub: idTokenPayload.sub,
        email: idTokenPayload.email,
        email_verified: idTokenPayload.email_verified,
        name: idTokenPayload.name || idTokenPayload.preferred_username,
        given_name: idTokenPayload.given_name,
        family_name: idTokenPayload.family_name,
        preferred_username: idTokenPayload.preferred_username,
        groups: idTokenPayload.groups || [],
      } : null;

      logger.info('Token exchange successful, user extracted from id_token', {
        sub: user?.sub,
        email: user?.email,
        hasGroups: user?.groups?.length > 0,
      });

      return res.json({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
        id_token: tokenData.id_token,
        user, // Include decoded user info directly
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
 * Get user info from OAuth provider (server-side proxy)
 */
router.post('/userinfo', async (req, res) => {
  try {
    const { provider, accessToken } = req.body;
    
    const config = getOAuthProviders()[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // For Authentik, use the userinfo endpoint
    if (provider === 'authentik') {
      const userResponse = await fetch(`${config.userInfoUrl}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        return res.status(400).json({ 
          error: 'Failed to get user info',
          details: await userResponse.text()
        });
      }

      const userData = await userResponse.json();
      return res.json(userData);
    } else {
      // For other providers, use their userinfo endpoints
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        return res.status(400).json({ 
          error: 'Failed to get user info',
          details: await userResponse.text()
        });
      }

      const userData = await userResponse.json();
      return res.json(userData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Refresh OAuth tokens (server-side)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { provider, refreshToken } = TokenRefreshSchema.parse(req.body);
    
    const config = getOAuthProviders()[provider];
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
