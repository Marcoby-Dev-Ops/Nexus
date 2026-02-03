/**
 * Authentik OAuth2 Authentication Service
 *
 * This service handles OAuth2 authentication with Authentik (Marcoby IAM)
 * using the Authorization Code flow with PKCE for security.
 */

import { BaseService } from '@/core/services/BaseService';
import { generateCodeVerifier, generateCodeChallenge } from '@/shared/utils/pkce';
import { useAuthStore, persistSessionToStorage, loadSessionFromStorage, clearStoredSession } from './authStore';
import { getRuntimeEnv } from '@/lib/runtimeEnv';
import { getApiBaseUrl } from '@/core/apiBase';

// Auth interfaces
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  session?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  };
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface SignInRequest {
  email: string;
  password: string;
}

class AuthentikAuthService extends BaseService {
  private baseUrl: string;
  private clientId: string;
  private redirectUri: string;

  constructor() {
    super();

    const rawBaseUrl =
      getRuntimeEnv('VITE_AUTHENTIK_URL') ||
      import.meta.env.VITE_AUTHENTIK_URL ||
      'https://identity.marcoby.com';

    this.baseUrl = this.normalizeBaseUrl(rawBaseUrl);
    this.clientId = getRuntimeEnv('VITE_AUTHENTIK_CLIENT_ID') || import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '';
    this.redirectUri = `${window.location.origin}/auth/callback`;

    if (!this.clientId) {
      this.logger.error('VITE_AUTHENTIK_CLIENT_ID is not configured');
    }
  }

  private normalizeBaseUrl(rawUrl: string): string {
    const fallback = 'https://identity.marcoby.com';
    if (!rawUrl) {
      this.logger.warn('VITE_AUTHENTIK_URL missing, falling back to default Marcoby IAM host');
      return fallback;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
      this.logger.warn('VITE_AUTHENTIK_URL empty after trimming, falling back to default Marcoby IAM host');
      return fallback;
    }

    let normalized = trimmed;
    let protocolAdded = false;

    if (normalized.startsWith('//')) {
      normalized = `https:${normalized}`;
      protocolAdded = true;
    } else if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
      protocolAdded = true;
    }

    if (protocolAdded) {
      this.logger.warn('VITE_AUTHENTIK_URL missing protocol, defaulting to https:// prefix', {
        original: rawUrl,
        normalized,
      });
    }

    normalized = normalized.replace(/\/+$/, '');

    if (!/^https?:\/\//i.test(normalized)) {
      this.logger.warn('VITE_AUTHENTIK_URL could not be normalized with a valid protocol, using fallback', {
        original: rawUrl,
      });
      return fallback;
    }

    return normalized || fallback;
  }

  private getInMemorySession(): AuthSession | null {
    return useAuthStore.getState().session;
  }

  private syncSessionFromStorage(): AuthSession | null {
    const session = loadSessionFromStorage();
    if (session) {
      useAuthStore.getState().setAuthState(session);
    }
    return session;
  }

  private ensureSessionInMemory(): AuthSession | null {
    return this.getInMemorySession() ?? this.syncSessionFromStorage();
  }

  private isSessionValid(session: AuthSession, bufferMs = 5 * 60 * 1000): boolean {
    if (!session) return false;

    const accessToken = session.session?.accessToken || session.accessToken;
    if (!accessToken) {
      if (this.authLogsEnabled) this.logger.info('Session invalid: no access token');
      return false;
    }

    const expiresAt = session.session?.expiresAt || session.expiresAt;
    if (!expiresAt) {
      if (this.authLogsEnabled) this.logger.info('Session invalid: no expiration time');
      return false;
    }

    const expiryTime = new Date(expiresAt).getTime();
    const isValid = Number.isFinite(expiryTime) && expiryTime > Date.now() + bufferMs;
    
    if (this.authLogsEnabled) {
      this.logger.info('Session validation', {
        expiryTime: new Date(expiryTime).toISOString(),
        currentTime: new Date().toISOString(),
        bufferMs,
        isValid,
        timeUntilExpiry: expiryTime - Date.now()
      });
    }
    
    return isValid;
  }

  private commitSession(
    session: AuthSession | null,
    options: { keepInitialized?: boolean; persist?: boolean } = {}
  ): void {
    const { keepInitialized = true, persist = true } = options;
    const store = useAuthStore.getState();

    if (session) {
      store.setAuthState(session);
      if (persist) {
        persistSessionToStorage(session);
      }
      return;
    }

    store.clearAuthState(keepInitialized);
    if (persist) {
      clearStoredSession();
    }
  }

  private get authLogsEnabled(): boolean {
    try {
      return ((import.meta as any)?.env?.VITE_ENABLE_AUTH_LOGS === 'true') || import.meta.env.DEV;
    } catch (_e) {
      return import.meta.env.DEV;
    }
  }

  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    try {
      const session = this.ensureSessionInMemory();

      if (!session || !session.user?.id) {
        if (this.authLogsEnabled) this.logger.info('No valid session available in memory');
        this.commitSession(null);
        return { success: true, data: false, error: null };
      }

      if (this.isSessionValid(session)) {
        if (this.authLogsEnabled) {
          this.logger.info('User is authenticated', {
            userId: session.user.id,
            expiresAt: session.session?.expiresAt,
          });
        }
        return { success: true, data: true, error: null };
      }

      if (this.authLogsEnabled) {
        this.logger.info('Session expired or near expiry, attempting refresh');
      }

      const refreshResult = await this.refreshSession();
      if (refreshResult.success && refreshResult.data) {
        return { success: true, data: true, error: null };
      }

      if (this.authLogsEnabled) {
        this.logger.info('Session refresh failed, clearing session');
      }
      this.commitSession(null);
      return { success: true, data: false, error: null };
    } catch (error) {
      this.logger.error('Error checking authentication status', error);
      this.commitSession(null);
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'Failed to check authentication status',
      };
    }
  }

  async getSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const session = this.ensureSessionInMemory();

      if (!session) {
        return { success: false, data: null, error: 'No session found' };
      }

      if (!this.isSessionValid(session, 0)) {
        const refreshResult = await this.refreshSession();
        if (refreshResult.success) {
          return refreshResult;
        }
        return { success: false, data: null, error: 'Session expired' };
      }

      return { success: true, data: session, error: null };
    } catch (error) {
      this.logger.error('Failed to get session', error);
      return { success: false, data: null, error: 'Failed to get session' };
    }
  }

  async setSession(sessionData: AuthSession): Promise<ServiceResponse<void>> {
    try {
      if (!sessionData || !sessionData.user) {
        throw new Error('Invalid session data: missing user information');
      }

      if (!sessionData.session?.accessToken) {
        throw new Error('Invalid session data: missing access token');
      }

      const session: AuthSession = {
        ...sessionData,
        session: {
          accessToken: sessionData.session.accessToken,
          refreshToken: sessionData.session.refreshToken,
          expiresAt: sessionData.session.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      };

      if (this.authLogsEnabled) {
        this.logger.info('Setting session', {
          userId: session.user.id,
          expiresAt: session.session?.expiresAt,
          hasRefreshToken: !!session.session?.refreshToken,
        });
      }

      this.commitSession(session);
      return { success: true, data: null, error: null };
    } catch (error) {
      this.logger.error('Failed to set session', error);
      return { success: false, data: null, error: 'Failed to set session' };
    }
  }

  async refreshSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const session = this.ensureSessionInMemory();
      if (!session) {
        if (this.authLogsEnabled) this.logger.info('No session to refresh');
        return { success: false, data: null, error: 'No session to refresh' };
      }

      const refreshToken = session.session?.refreshToken;
      if (!refreshToken) {
        if (this.authLogsEnabled) this.logger.info('No refresh token available');
        return { success: false, data: null, error: 'No refresh token available' };
      }

      if (this.authLogsEnabled) {
        this.logger.info('Attempting token refresh', {
          userId: session.user.id,
          hasRefreshToken: !!refreshToken,
          refreshTokenLength: refreshToken.length
        });
      }

      const tokenUrl = `${this.baseUrl}/application/o/token/`;
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      params.append('client_id', this.clientId);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (_e) {
          errorData = { error: 'Failed to parse error response' };
        }

        const errorMessage =
          errorData?.error_description || errorData?.error || `HTTP ${response.status} - ${response.statusText}`;

        this.logger.error('Token refresh failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorData,
          refreshTokenLength: refreshToken.length,
          clientId: this.clientId,
          tokenUrl
        });

        if (response.status === 400 || response.status === 401) {
          if (this.authLogsEnabled) {
            this.logger.info('Clearing invalid session due to authentication error');
          }
          this.commitSession(null);
        }

        return { success: false, data: null, error: `Token refresh failed: ${errorMessage}` };
      }

      const tokenData = await response.json();

      if (this.authLogsEnabled) {
        this.logger.info('Token refresh successful', {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          tokenType: tokenData.token_type
        });
      }

      const updatedSession: AuthSession = {
        ...session,
        session: {
          ...session.session,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        },
      };

      await this.setSession(updatedSession);
      return { success: true, data: updatedSession, error: null };
    } catch (error) {
      this.logger.error('Failed to refresh session', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      };
    }
  }

  async getAuthStatus(): Promise<ServiceResponse<{ isAuthenticated: boolean; hasSession: boolean }>> {
    try {
      const session = this.ensureSessionInMemory();
      const hasSession = !!session;

      if (!hasSession) {
        return {
          success: true,
          data: { isAuthenticated: false, hasSession: false },
          error: null,
        };
      }

      const isAuthenticated = await this.isAuthenticated();
      return {
        success: true,
        data: { isAuthenticated: Boolean(isAuthenticated.data), hasSession },
        error: null,
      };
    } catch (error) {
      this.logger.error('Failed to get auth status', error);
      return {
        success: false,
        data: null,
        error: 'Failed to get auth status',
      };
    }
  }

  async handleOAuthCallback(code: string, state: string): Promise<ServiceResponse<AuthSession>> {
    try {
      const storedState = localStorage.getItem('authentik_oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      const codeVerifier = localStorage.getItem('authentik_code_verifier');
      if (!codeVerifier) {
        throw new Error('No code verifier found');
      }

      if (this.authLogsEnabled)
        this.logger.info('OAuth callback parameters', {
          code: code.substring(0, 10) + '...',
          state: state.substring(0, 10) + '...',
          codeVerifier: codeVerifier.substring(0, 10) + '...',
          redirectUri: this.redirectUri,
        });

      const tokenApiUrl = getApiBaseUrl();
      const tokenResponse = await fetch(`${tokenApiUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'authentik',
          code,
          redirectUri: this.redirectUri,
          codeVerifier,
          state,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        this.logger.error('Token exchange failed', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorData,
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      if (this.authLogsEnabled)
        this.logger.info('Token exchange successful', {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          allTokenData: tokenData,
        });

      const userInfoApiUrl = getApiBaseUrl();
      const userResponse = await fetch(`${userInfoApiUrl}/api/oauth/userinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'authentik',
          accessToken: tokenData.access_token,
        }),
      });

      if (!userResponse.ok) {
        const userErrorData = await userResponse.text();
        this.logger.error('Failed to get user info', {
          status: userResponse.status,
          statusText: userResponse.statusText,
          errorData: userErrorData,
        });
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();
      if (this.authLogsEnabled)
        this.logger.info('User info retrieved', {
          externalId: userData.sub,
          email: userData.email,
          name: userData.name,
          allUserData: userData,
        });

      // Use the JWT sub directly as the user ID - this matches what the server expects
      const userId = userData.sub?.toString();
      
      if (this.authLogsEnabled) {
        this.logger.info('Using JWT sub as user ID', { 
          jwtSub: userData.sub,
          email: userData.email,
          name: userData.name 
        });
      }

      const session: AuthSession = {
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          firstName: userData.first_name || userData.given_name || undefined,
          lastName: userData.last_name || userData.family_name || undefined,
        },
        session: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        },
      };

      if (this.authLogsEnabled)
        this.logger.info('Storing session', {
          sessionId: session.user.id,
          sessionEmail: session.user.email,
          hasAccessToken: !!session.session?.accessToken,
          hasRefreshToken: !!session.session?.refreshToken,
          expiresAt: session.session?.expiresAt,
        });
      await this.setSession(session);

      localStorage.removeItem('authentik_oauth_state');
      localStorage.removeItem('authentik_code_verifier');

      return { success: true, data: session, error: null };
    } catch (error) {
      this.logger.error('Failed to handle OAuth callback', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userData: error instanceof Error && 'userData' in error ? (error as any).userData : undefined,
      });
      return { success: false, data: null, error: 'Failed to handle OAuth callback' };
    }
  }

  async updateUser(userData: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      const session = await this.getSession();
      if (!session.success || !session.data) {
        return { success: false, data: null, error: 'No active session' };
      }

      const response = await fetch(`${this.baseUrl}/core/users/${session.data.user.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.data.session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUserData = await response.json();

      const updatedSession: AuthSession = {
        ...session.data,
        user: {
          ...session.data.user,
          ...updatedUserData,
        },
      };

      await this.setSession(updatedSession);
      return { success: true, data: updatedSession.user, error: null };
    } catch (error) {
      this.logger.error('Failed to update user', error);
      return { success: false, data: null, error: 'Failed to update user' };
    }
  }

  async signOut(): Promise<ServiceResponse<void>> {
    try {
      const session = this.ensureSessionInMemory();
      if (session?.session?.accessToken) {
        try {
          await fetch(`${this.baseUrl}/application/o/revoke_token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: session.session.accessToken,
              client_id: this.clientId,
            }),
          });
        } catch (error) {
          this.logger.warn('Failed to revoke token', error);
        }
      }

      this.commitSession(null, { keepInitialized: true });
      localStorage.removeItem('authentik_oauth_state');
      localStorage.removeItem('authentik_code_verifier');

      return { success: true, data: null, error: null };
    } catch (error) {
      this.logger.error('Failed to sign out', error);
      return { success: false, data: null, error: 'Failed to sign out' };
    }
  }

  async initiateOAuthFlow(
    redirectUri?: string,
    additionalParams?: Record<string, string>
  ): Promise<ServiceResponse<string>> {
    try {
      if (!this.clientId) {
        throw new Error('Authentik client ID not configured');
      }

      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const stateApiUrl = getApiBaseUrl();
      const stateResponse = await fetch(`${stateApiUrl}/api/oauth/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'auth',
          integrationSlug: 'authentik',
          redirectUri: redirectUri || this.redirectUri,
        }),
      });

      if (!stateResponse.ok) {
        throw new Error('Failed to generate OAuth state');
      }

      const stateData = await stateResponse.json();
      const { state } = stateData.data;

      localStorage.setItem('authentik_code_verifier', codeVerifier);
      localStorage.setItem('authentik_oauth_state', state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: redirectUri || this.redirectUri,
        scope: 'openid email profile offline_access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...additionalParams,
      });

      const authUrl = `${this.baseUrl}/application/o/authorize/?${params.toString()}`;

      if (this.authLogsEnabled)
        this.logger.info('Initiating OAuth flow', {
          authUrl,
          clientId: this.clientId,
          redirectUri: redirectUri || this.redirectUri,
          state: state.substring(0, 10) + '...',
          codeChallenge: codeChallenge.substring(0, 10) + '...',
          codeVerifier: codeVerifier.substring(0, 10) + '...',
        });

      return { success: true, data: authUrl, error: null };
    } catch (error) {
      this.logger.error('Failed to initiate OAuth flow', error);
      return { success: false, data: null, error: 'Failed to initiate OAuth flow' };
    }
  }
}

export const authentikAuthService = new AuthentikAuthService();
