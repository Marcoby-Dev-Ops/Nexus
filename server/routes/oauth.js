const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');

const router = express.Router();
const { logger } = require('../src/utils/logger');
// User profile service used to persist signup/enrollment data to internal DB
const userProfileService = require('../src/services/UserProfileService');
const CompanyService = require('../src/services/CompanyService');
const companyService = new CompanyService();

// Helper function to generate random strings
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64url');
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
          success: false,
          error: 'Failed to get user info',
          details: await userResponse.text()
        });
      }

      const userData = await userResponse.json();
      if (!userData) {
        return res.status(500).json({ success: false, error: 'Empty userinfo response' });
      }

      const userId = userData.sub;
      const isActive = userData.is_active !== false;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userinfo missing sub (user id)' });
      }
      if (!isActive) {
        // Return raw info but note inactive state; skip provisioning
        return res.json({ success: true, inactive: true, userinfo: userData });
      }

      // Derive name parts
      const firstName = userData.given_name || (userData.name ? userData.name.split(' ')[0] : null);
      const lastName = userData.family_name || (userData.name ? userData.name.split(' ').slice(1).join(' ') || null : null);
      const attributes = userData.attributes || {};
      // Derive robust business name
      const emailDomain = (userData.email || '').split('@')[1] || '';
      const domainRoot = emailDomain.split('.').slice(0, -1).join('.') || emailDomain.split('.')[0];
      function titleize(str) { return str ? str.replace(/[-_.]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim() : str; }
      const resolvedBusinessName = (
        attributes.business_name ||
        attributes.company_name ||
        attributes.organization ||
        attributes.org_name ||
        attributes.company ||
        attributes.company_display_name ||
        userData.organization ||
        userData.company ||
        (domainRoot && domainRoot.length > 1 ? titleize(domainRoot) : null)
      ) || 'My Business';

      // Improve name fallbacks for user profile
      let resolvedFirst = firstName || attributes.first_name;
      let resolvedLast = lastName || attributes.last_name;
      if (!resolvedFirst && userData.email) {
        resolvedFirst = userData.email.split('@')[0];
      }
      const displayNameFallback = userData.name || [resolvedFirst, resolvedLast].filter(Boolean).join(' ');

      // User-centric fields (business name retained in company_name for convenience display)
      const additionalData = {
        first_name: resolvedFirst || null,
        last_name: resolvedLast || null,
        email: userData.email || null,
        display_name: displayNameFallback || attributes.display_name || null,
        company_name: resolvedBusinessName,
        phone: attributes.phone || null,
        signup_completed: attributes.signup_completed || false,
        signup_completed_at: attributes.signup_completion_date || null,
        enrollment_flow_completed: attributes.enrollment_flow_completed || false,
        business_profile_completed: attributes.business_profile_completed || false,
        identity_snapshot: userData // raw userinfo JSON
      };

      const businessAttributes = {
        businessName: resolvedBusinessName,
        businessType: attributes.business_type,
        industry: attributes.industry,
        companySize: attributes.company_size,
        description: attributes.company_description,
        website: attributes.website || attributes.company_website,
        domain: attributes.domain || attributes.company_domain,
        fundingStage: attributes.funding_stage,
        revenueRange: attributes.revenue_range
      };
      logger.debug('Resolved business attributes from OIDC', { userId, businessAttributes });

      // Provision/ensure profile synchronously
      const profileResult = await userProfileService.ensureUserProfile(
        userId,
        userData.email || null,
        additionalData
      );

      // Attempt to ensure company if profile exists and not yet associated
      let companyResult = null;
      if (profileResult.success) {
        const profile = profileResult.profile;
        if (!profile?.company_id) {
          // Create new company
          companyResult = await companyService.ensureCompanyForUser(userId, businessAttributes);
          if (companyResult?.success && companyResult.company && (!profile.company_id)) {
            await companyService.associateUserWithCompany(userId, companyResult.company.id, 'owner');
          }
        } else {
          // Existing company: defer patch (will be added by new service method)
          try {
            if (companyService.patchBusinessAttributes) {
              await companyService.patchBusinessAttributes(profile.company_id, businessAttributes);
            }
          } catch (e) {
            logger.warn('Failed to patch existing company with business attributes', { userId, error: e.message });
          }
        }
      }

      logger.info('Auth userinfo provisioning complete', {
        userId,
        profileCreated: profileResult.created,
        companyCreated: companyResult?.created || false
      });

      return res.json({
        success: true,
        userinfo: userData,
        profile: profileResult.success ? profileResult.profile : null,
        company: companyResult?.company || null,
        created: {
          profile: profileResult.created || false,
          company: companyResult?.created || false
        }
      });
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
