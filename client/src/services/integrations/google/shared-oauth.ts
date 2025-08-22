/**
 * Shared Google OAuth Utilities
 * Used by all Google integrations (Analytics, Workspace, etc.)
 */

interface GoogleAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates Google OAuth authorization URL
 * Standardized for all Google integrations
 */
export function createGoogleAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: GoogleAuthUrlParams): string {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const scopes = requiredScopes.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validates Google OAuth callback parameters
 * Standardized for all Google integrations
 */
export function validateGoogleCallback(params: URLSearchParams): {
  success: boolean;
  code?: string;
  state?: string;
  error?: string;
} {
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  
  if (error) {
    return {
      success: false,
      error: errorDescription || error
    };
  }

  const code = params.get('code');
  const state = params.get('state');

  if (!code) {
    return {
      success: false,
      error: 'Authorization code not found in callback'
    };
  }

  return {
    success: true,
    code,
    state
  };
}

/**
 * Google OAuth endpoints
 */
export const GOOGLE_OAUTH_ENDPOINTS = {
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

/**
 * Common Google scopes
 */
export const GOOGLE_COMMON_SCOPES = {
  USER_INFO_EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  USER_INFO_PROFILE: 'https://www.googleapis.com/auth/userinfo.profile'
};

/**
 * Google OAuth token refresh
 */
export async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Token refresh failed');
  }

  return response.json();
}
