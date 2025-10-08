/**
 * Authentik OAuth Client Configuration
 * 
 * This file configures the OAuth2 client for Authentik authentication.
 * Replaces the Supabase auth client for the migration to Authentik.
 */

import { API_ENDPOINTS } from '@/lib/api-url';

// OAuth2 Configuration
export const AUTHENTIK_CONFIG = {
  // Authentik instance URL
  baseUrl: import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com',
  
  // OAuth2 endpoints
  authorizationUrl: `${import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/application/o/authorize/`,
  tokenUrl: `${import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/application/o/token/`,
  userInfoUrl: `${import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/application/o/userinfo/`,
  jwksUrl: `${import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/application/o/jwks/`,
  
  // Client configuration (will be updated with actual values)
  clientId: import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'your-client-id',
  clientSecret: '', // Server-side only - not exposed to client
  
  // Redirect URIs
  redirectUri: import.meta.env.DEV 
    ? 'http://localhost:5173/auth/callback'
    : `${import.meta.env.VITE_APP_URL || 'https://nexus.marcoby.com'}/auth/callback`,
  
  // Scopes
  scopes: ['openid', 'profile', 'email', 'groups', 'offline_access'],
  
  // Token configuration
  tokenExpiry: import.meta.env.DEV 
    ? 24 * 60 * 60 * 1000  // 24 hours in development
    : 30 * 60 * 1000,      // 30 minutes in production
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};

// Debug logging removed for security

// JWT Configuration for token validation
export const JWT_CONFIG = {
  issuer: import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com',
  audience: AUTHENTIK_CONFIG.clientId,
  algorithms: ['RS256'] as const,
};

// OAuth2 Flow Types
export type OAuthFlowType = 'authorization_code' | 'implicit' | 'client_credentials';

// Token Response Interface
export interface AuthentikTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

// User Info Interface
export interface AuthentikUserInfo {
  sub: string; // User ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  groups?: string[];
  is_superuser?: boolean;
}

// Session Interface
export interface AuthentikSession {
  user: AuthentikUserInfo;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  refreshTokenCreatedAt?: number; // Track when refresh token was created
}

// OAuth2 State Management
export interface OAuthState {
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  timestamp: number;
}

/**
 * Generate a random state parameter for OAuth2 security
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateOAuthState();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
}

/**
 * Build OAuth2 authorization URL
 */
export function buildAuthorizationUrl(
  state: string,
  codeChallenge?: string,
  additionalParams: Record<string, string> = {}
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTHENTIK_CONFIG.clientId,
    redirect_uri: AUTHENTIK_CONFIG.redirectUri,
    scope: AUTHENTIK_CONFIG.scopes.join(' '),
    state,
    ...additionalParams,
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `${AUTHENTIK_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier?: string
): Promise<AuthentikTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: AUTHENTIK_CONFIG.clientId,
    client_secret: AUTHENTIK_CONFIG.clientSecret,
    code,
    redirect_uri: AUTHENTIK_CONFIG.redirectUri,
  });

  if (codeVerifier) {
    body.set('code_verifier', codeVerifier);
  }

  const response = await fetch(AUTHENTIK_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get user information from Authentik
 */
export async function getUserInfo(accessToken: string): Promise<AuthentikUserInfo> {
  try {
    const response = await fetch(AUTHENTIK_CONFIG.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
    }

    const userInfo = await response.json();
    
    // Validate required fields
    if (!userInfo.sub) {
      throw new Error('User info missing required field: sub (user ID)');
    }
    
    if (!userInfo.email) {
      throw new Error('User info missing required field: email');
    }

    return userInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to get user info: ${error}`);
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthentikTokenResponse> {
  const response = await fetch(API_ENDPOINTS.OAUTH_REFRESH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'authentik',
      refreshToken,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.details || payload?.error_description || payload?.error || 'Unknown error';
    throw new Error(`Token refresh failed: ${errorMessage}`);
  }

  if (!payload) {
    throw new Error('Token refresh failed: empty response from server');
  }

  return payload as AuthentikTokenResponse;
}

/**
 * Validate JWT token
 */
export async function validateJWT(token: string): Promise<boolean> {
  try {
    // Get JWKS from Authentik
    const jwksResponse = await fetch(AUTHENTIK_CONFIG.jwksUrl);
    if (!jwksResponse.ok) {
      throw new Error('Failed to fetch JWKS');
    }

    const jwks = await jwksResponse.json();
    
    // For now, we'll do basic validation
    // In production, you should use a proper JWT library like jose
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }

    // Check issuer
    if (payload.iss !== JWT_CONFIG.issuer) {
      return false;
    }

    // Check audience
    if (payload.aud !== JWT_CONFIG.audience) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('JWT validation failed:', error);
    return false;
  }
}

/**
 * Create Authentik session from token response
 */
export function createSession(
  tokenResponse: AuthentikTokenResponse,
  userInfo: AuthentikUserInfo
): AuthentikSession {
  return {
    user: userInfo,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
    tokenType: tokenResponse.token_type,
    refreshTokenCreatedAt: tokenResponse.refresh_token ? Date.now() : undefined,
  };
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: AuthentikSession): boolean {
  return Date.now() >= session.expiresAt;
}

/**
 * Check if session needs refresh (within 5 minutes of expiry)
 */
export function needsRefresh(session: AuthentikSession): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (session.expiresAt - fiveMinutes);
}
