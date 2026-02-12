const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');

const router = express.Router();
const { logger } = require('../utils/logger');
const userProfileService = require('../services/UserProfileService');
const { query } = require('../database/connection');
const { optionalAuth } = require('../middleware/auth');

const PROVIDER_ALIASES = {
  microsoft365: 'microsoft',
  'google-analytics': 'google_analytics',
  google_analytics: 'google_analytics',
  googleworkspace: 'google-workspace',
  google_workspace: 'google-workspace',
};

function normalizeProvider(provider) {
  if (!provider) return provider;
  return PROVIDER_ALIASES[provider] || provider;
}

function getBrokerBaseUrl() {
  return process.env.CONNECT_BROKER_BASE_URL || 'https://identity.marcoby.com';
}

function getMicrosoftBrokerCallbackUrl() {
  return process.env.MICROSOFT_REDIRECT_URI || `${getBrokerBaseUrl()}/connect/microsoft/callback`;
}

function resolveTokenRedirectUri(provider, requestedRedirectUri) {
  if (provider === 'microsoft') {
    return getMicrosoftBrokerCallbackUrl();
  }
  return requestedRedirectUri;
}



// Helper function to generate random strings
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64url');
}

// PKCE challenge generator
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
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
  const provider = normalizeProvider(req.params.provider);
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
 * Start OAuth authorization flow
 */
router.get('/:provider/start', optionalAuth, async (req, res) => {
  try {
    const provider = normalizeProvider(req.params.provider);
    const { userId: requestedUserId, redirectUri } = req.query;
    const config = getOAuthProviders()[provider];

    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (requestedUserId && typeof requestedUserId !== 'string') {
      return res.status(400).json({ error: 'userId must be a string' });
    }

    if (req.user?.id && requestedUserId && req.user.id !== requestedUserId) {
      return res.status(403).json({ error: 'userId does not match authenticated user' });
    }

    const effectiveUserId = req.user?.id || requestedUserId;
    if (!effectiveUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const resolvedRedirectUri = typeof redirectUri === 'string' && redirectUri.length > 0
      ? redirectUri
      : provider === 'authentik'
        ? `${getFrontendUrl()}/auth/callback`
        : `${getFrontendUrl()}/integrations/oauth/callback`;

    const state = generateRandomString(32);
    const usingBroker = provider === 'microsoft';
    const codeVerifier = usingBroker ? null : generateRandomString(64);
    const codeChallenge = codeVerifier ? generateCodeChallenge(codeVerifier) : null;

    oauthStates.set(state, {
      state,
      codeVerifier,
      userId: effectiveUserId,
      integrationSlug: provider,
      redirectUri: resolvedRedirectUri,
      timestamp: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const now = Date.now();
    for (const [key, value] of oauthStates.entries()) {
      if (value.expiresAt < now) oauthStates.delete(key);
    }

    let authUrl;
    if (provider === 'microsoft') {
      // Marcoby connector broker handles tenant-safe redirect routing.
      const brokerBaseUrl = getBrokerBaseUrl();
      authUrl = new URL('/connect/microsoft/start', brokerBaseUrl);
      authUrl.search = new URLSearchParams({
        return_url: resolvedRedirectUri,
        relay_state: state,
      }).toString();
    } else {
      authUrl = new URL(config.authorizationUrl);
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId || '',
        redirect_uri: resolvedRedirectUri,
        scope: config.scope || '',
        state,
      });

      if (codeChallenge && ['authentik', 'microsoft', 'google', 'google_analytics', 'google-workspace'].includes(provider)) {
        params.set('code_challenge', codeChallenge);
        params.set('code_challenge_method', 'S256');
      }

      if (['google', 'google_analytics', 'google-workspace'].includes(provider)) {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
        params.set('include_granted_scopes', 'true');
      }

      authUrl.search = params.toString();
    }

    return res.json({
      authUrl: authUrl.toString(),
      state,
      provider,
      redirectUri: resolvedRedirectUri,
    });
  } catch (error) {
    logger.error('Failed to start OAuth flow', { error: error?.message || String(error) });
    return res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

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
    const provider = normalizeProvider(req.body.provider);
    const { code, redirectUri, state } = req.body;
    let { codeVerifier } = req.body;
    const tokenRedirectUri = resolveTokenRedirectUri(provider, redirectUri);

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
      redirect_uri: tokenRedirectUri,
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
function getAccessTokenFromRequest(req) {
  // Support Authorization: Bearer <token> as well as JSON body
  const auth = req.get('authorization') || req.get('Authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return (req.body && req.body.accessToken) || null;
}

async function handleUserinfo(req, res) {
  try {
    const provider = normalizeProvider((req.body && req.body.provider) || (req.query && req.query.provider) || 'authentik');
    const accessToken = getAccessTokenFromRequest(req);


    const config = getOAuthProviders()[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    logger.info('OAuth userinfo proxy request', {
      provider,
      hasAuthHeader: !!(req.get('authorization') || req.get('Authorization')),
      tokenLength: accessToken ? String(accessToken).length : 0,
      ip: req.ip
    });

    // For Authentik, use the userinfo endpoint
    if (provider === 'authentik') {
      const userResponse = await fetch(`${config.userInfoUrl}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      });

      if (!userResponse.ok) {
        const details = await userResponse.text().catch(() => '');
        logger.warn('Authentik userinfo request failed', {
          status: userResponse.status,
          statusText: userResponse.statusText,
          detailsPreview: details ? details.slice(0, 500) : ''
        });
        return res.status(400).json({
          error: 'Failed to get user info',
          status: userResponse.status,
          details
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
    logger.error('OAuth userinfo proxy error', { error: error?.message || String(error) });
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Support both POST (existing clients) and GET (some clients/proxies)
router.post('/userinfo', handleUserinfo);
router.get('/userinfo', handleUserinfo);

/**
 * Refresh OAuth tokens (server-side)
 */
router.post('/refresh', async (req, res) => {
  try {
    const parsed = TokenRefreshSchema.parse(req.body);
    const provider = normalizeProvider(parsed.provider);
    const { refreshToken } = parsed;

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

/**
 * POST /:provider/callback
 * Handles OAuth callback, exchanges code for token, and syncs user profile
 */
router.post('/:provider/callback', optionalAuth, async (req, res) => {
  try {
    const provider = normalizeProvider(req.params.provider);
    const { code, state, redirectUri } = req.body;

    // 1. Validate State and get userId
    let oauthState;
    let userId;
    let codeVerifier;

    if (state) {
      oauthState = oauthStates.get(state);
      if (!oauthState || oauthState.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired OAuth state' });
      }
      userId = oauthState.userId;
      codeVerifier = oauthState.codeVerifier;
      // Clean up state
      oauthStates.delete(state);
    } else {
      // If no state (unlikely for secure flows), we can't trust the userId from body
      // But for some flows maybe we allow it if authenticated?
      // For now enforce state
      return res.status(400).json({ error: 'State parameter is required' });
    }

    if (req.user?.id && req.user.id !== userId) {
      return res.status(403).json({ error: 'OAuth state does not belong to authenticated user' });
    }

    const config = getOAuthProviders()[provider];
    if (!config) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // 2. Exchange Token
    const tokenRedirectUri = resolveTokenRedirectUri(provider, redirectUri);
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: tokenRedirectUri,
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      logger.error('Token exchange failed', { provider, error: tokenData });
      return res.status(400).json({
        error: 'Token exchange failed',
        details: tokenData.error_description || tokenData.error
      });
    }

    const accessToken = tokenData.access_token;

    // 3. Fetch User Info
    let userInfo = {};
    const userInfoUrl = config.userInfoUrl ||
      (provider === 'github' ? 'https://api.github.com/user' :
        provider === 'google' ? 'https://www.googleapis.com/oauth2/v2/userinfo' :
          provider === 'linkedin' ? 'https://api.linkedin.com/v2/me' : // LinkedIn requires specific projection usually
            null);

    if (userInfoUrl) {
      const uiRes = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          ...(provider === 'github' ? { 'User-Agent': 'Nexus-App' } : {})
        }
      });
      if (uiRes.ok) {
        userInfo = await uiRes.json();
      } else {
        logger.warn('Failed to fetch user info', { provider, status: uiRes.status });
      }
    } else if (provider === 'authentik' && tokenData.id_token) {
      // Authentik puts info in id_token usually
      const idTokenPayload = decodeJwtPayload(tokenData.id_token);
      if (idTokenPayload) userInfo = idTokenPayload;
    }

    // 4. Update Profile
    const updateData = {};

    // Map fields based on provider
    if (provider === 'linkedin') {
      const profileUrl = `https://www.linkedin.com/in/${userInfo.vanityName || userInfo.id}`; // simplified
      updateData.linkedin_url = profileUrl;
    } else if (provider === 'github') {
      updateData.github_url = userInfo.html_url || userInfo.url;
    } else if (provider === 'twitter') {
      updateData.twitter_url = `https://twitter.com/${userInfo.screen_name || userInfo.username}`;
    } else if (provider === 'google' || provider === 'google_workspace') {
      // Google doesn't give a "profile link" usually
    }

    if (userInfo.blog || userInfo.website) {
      updateData.website = userInfo.blog || userInfo.website;
    }

    // Update social_links jsonb
    try {
      const { profile } = await userProfileService.getUserProfile(userId);
      let socialLinks = (profile && profile.social_links) ? profile.social_links : [];
      if (typeof socialLinks === 'string') {
        try { socialLinks = JSON.parse(socialLinks); } catch (e) { socialLinks = []; }
      }

      // Update or add specific provider link
      const existingIdx = socialLinks.findIndex(l => l.provider === provider);
      const newLink = {
        provider,
        username: userInfo.login || userInfo.username || userInfo.email,
        url: updateData[`${provider}_url`] || updateData.website || null
      };

      if (existingIdx >= 0) {
        socialLinks[existingIdx] = { ...socialLinks[existingIdx], ...newLink };
      } else {
        socialLinks.push(newLink);
      }

      updateData.social_links = JSON.stringify(socialLinks);

      // Perform update
      await userProfileService.updateProfileData(userId, updateData);
      logger.info(`Updated user profile with ${provider} data`, { userId });

    } catch (err) {
      logger.error('Failed to update user profile during OAuth callback', { error: err.message });
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + (Number(tokenData.expires_in) * 1000)).toISOString()
      : null;
    const externalAccountId =
      userInfo?.id ||
      userInfo?.sub ||
      userInfo?.user_id ||
      userInfo?.preferred_username ||
      null;
    const tenantId = userInfo?.tid || tokenData?.tenant_id || null;

    const credentials = {
      access_token: tokenData.access_token || null,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      scope: tokenData.scope || null,
    };

    const settings = {
      provider,
      external_account_id: externalAccountId,
      tenant_id: tenantId,
      email: userInfo?.email || null,
    };

    const integrationLookup = await query(
      'SELECT id FROM integrations WHERE slug = $1 LIMIT 1',
      [provider]
    );
    const integrationId = integrationLookup?.data?.[0]?.id || null;

    const integrationUpsert = await query(
      `INSERT INTO user_integrations (
          user_id, integration_name, integration_id, credentials, settings, status, last_sync_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, 'active', NOW())
        ON CONFLICT (user_id, integration_name)
        DO UPDATE SET
          integration_id = EXCLUDED.integration_id,
          credentials = EXCLUDED.credentials,
          settings = EXCLUDED.settings,
          status = 'active',
          updated_at = NOW()
        RETURNING id`,
      [userId, provider, integrationId, JSON.stringify(credentials), JSON.stringify(settings)]
    );

    await query(
      `INSERT INTO oauth_tokens (
          user_id, integration_slug, access_token, refresh_token, token_type, expires_at, scope
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, integration_slug)
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          token_type = EXCLUDED.token_type,
          expires_at = EXCLUDED.expires_at,
          scope = EXCLUDED.scope,
          updated_at = NOW()`,
      [
        userId,
        provider,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.token_type || 'Bearer',
        expiresAt,
        tokenData.scope || null,
      ]
    );

    return res.json({
      success: true,
      message: `Successfully connected ${provider}`,
      integrationId: integrationUpsert?.data?.[0]?.id,
      status: 'connected',
      externalAccountId,
      tenantId,
      data: {
        ...tokenData,
        user: userInfo
      }
    });

  } catch (error) {
    logger.error('OAuth callback error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});




/**
 * GET /integrations/:userId
 * Get user's connected integrations
 */
router.get('/integrations/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.id && req.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view integrations for this user' });
    }

    // In a real app, verify req.user.id === userId or is admin
    const result = await query(
      `SELECT
         ui.*,
         i.name as catalog_integration_name,
         ot.access_token,
         ot.refresh_token,
         ot.expires_at,
         ot.scope
       FROM user_integrations ui
       LEFT JOIN integrations i ON ui.integration_id = i.id
       LEFT JOIN oauth_tokens ot
         ON ot.user_id = ui.user_id
        AND ot.integration_slug = ui.integration_name
       WHERE ui.user_id = $1`,
      [userId]
    );

    const integrations = (result.data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      provider: row.integration_name,
      integrationName: row.catalog_integration_name || row.integration_name,
      integrationType: 'oauth',
      status: row.status === 'active' ? 'connected' : row.status,
      connectedAt: row.created_at,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      accessToken: row.access_token || undefined,
      refreshToken: row.refresh_token || undefined,
      expiresAt: row.expires_at || undefined,
      scopes: row.scope || undefined,
      config: row.settings || {}
    }));

    res.json({ integrations });
  } catch (error) {
    logger.error('Failed to get integrations', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /disconnect/:integrationId
 * Disconnect an integration
 */
router.post('/disconnect/:integrationId', optionalAuth, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { userId } = req.body; // Optional security check

    const existing = await query(
      'SELECT id, user_id, integration_name FROM user_integrations WHERE id = $1 LIMIT 1',
      [integrationId]
    );
    const integration = existing?.data?.[0];
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    if (req.user?.id && integration.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this integration' });
    }
    if (userId && integration.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized for this integration' });
    }

    await query(
      'DELETE FROM oauth_tokens WHERE user_id = $1 AND integration_slug = $2',
      [integration.user_id, integration.integration_name]
    );
    await query('DELETE FROM user_integrations WHERE id = $1', [integrationId]);

    // Also clear from social links if applicable?
    // This is complex because we don't know which social link corresponds to this integration easily
    // unless we query first. For now, just delete the integration record.

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to disconnect integration', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /sync
 * Manual sync trigger
 */
router.post('/sync', async (req, res) => {
  try {
    const { integrationId, userId } = req.body;
    // Logic to trigger sync job would go here
    // For now, update last_sync_at

    let provider = null;
    if (integrationId) {
      const integrationResult = await query(
        'SELECT integration_name FROM user_integrations WHERE id = $1 LIMIT 1',
        [integrationId]
      );
      provider = integrationResult?.data?.[0]?.integration_name || null;
      await query(
        'UPDATE user_integrations SET last_sync_at = NOW() WHERE id = $1',
        [integrationId]
      );
    }

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      integrationId,
      provider,
      result: {
        contacts: { count: 0, data: [] },
        companies: { count: 0, data: [] },
        emails: { count: 0, data: [] },
      },
      message: 'Sync started'
    });
  } catch (error) {
    logger.error('Sync trigger failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /sync/history/:integrationId
 * Simple history endpoint used by integration clients.
 */
router.get('/sync/history/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const result = await query(
      'SELECT id, integration_name, last_sync_at, updated_at FROM user_integrations WHERE id = $1 LIMIT 1',
      [integrationId]
    );

    const record = result?.data?.[0];
    if (!record) {
      return res.json({ history: [] });
    }

    return res.json({
      history: [
        {
          integrationId: record.id,
          provider: record.integration_name,
          syncedAt: record.last_sync_at || record.updated_at,
        },
      ],
    });
  } catch (error) {
    logger.error('Failed to load sync history', { error: error?.message || String(error) });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /:provider/test
 * Validate connectivity with current access token.
 */
router.post('/:provider/test', async (req, res) => {
  try {
    const provider = normalizeProvider(req.params.provider);
    const { accessToken } = req.body || {};
    if (!accessToken) {
      return res.status(400).json({ connected: false, error: 'Access token required' });
    }

    let testResponse;
    if (provider === 'microsoft') {
      testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } else if (provider === 'hubspot') {
      testResponse = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${encodeURIComponent(accessToken)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } else if (provider === 'authentik') {
      const cfg = getOAuthProviders().authentik;
      testResponse = await fetch(cfg.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } else {
      testResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!testResponse.ok) {
      const details = await testResponse.text().catch(() => '');
      return res.status(400).json({
        connected: false,
        error: 'Connection test failed',
        details,
      });
    }

    return res.json({ connected: true });
  } catch (error) {
    logger.error('OAuth connection test failed', { error: error?.message || String(error) });
    return res.status(500).json({ connected: false, error: 'Internal server error' });
  }
});

module.exports = router;
