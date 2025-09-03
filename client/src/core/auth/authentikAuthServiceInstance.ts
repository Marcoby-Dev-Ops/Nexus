/**
 * Authentik OAuth2 Authentication Service
 * 
 * This service handles OAuth2 authentication with Authentik (Marcoby IAM)
 * using the Authorization Code flow with PKCE for security.
 */

import { BaseService } from '@/core/services/BaseService';
import { generateCodeVerifier, generateCodeChallenge } from '@/shared/utils/pkce';

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
    
    this.baseUrl = import.meta.env.VITE_AUTHENTIK_URL || 'https://identity.marcoby.com';
    this.clientId = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '';
    this.redirectUri = `${window.location.origin}/auth/callback`;
    
    if (!this.clientId) {
      this.logger.error('VITE_AUTHENTIK_CLIENT_ID is not configured');
    }
  }

  private get authLogsEnabled(): boolean {
    try {
      return ((import.meta as any)?.env?.VITE_ENABLE_AUTH_LOGS === 'true');
    } catch (_e) {
      return false;
    }
  }

  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) {
        if (this.authLogsEnabled) this.logger.info('No session data found in localStorage');
        return { success: true, data: false, error: null };
      }

      let session: AuthSession;
      try {
        session = JSON.parse(sessionData);
      } catch (e) {
        this.logger.error('Failed to parse session data', e);
        localStorage.removeItem('authentik_session');
        return { success: true, data: false, error: null };
      }
      
      // Check if session has valid user data
      if (!session?.user?.id) {
        if (this.authLogsEnabled) this.logger.info('Session found but no valid user data');
        localStorage.removeItem('authentik_session');
        return { success: true, data: false, error: null };
      }

      // Check if we have a valid access token
      if (!session.session?.accessToken) {
        if (this.authLogsEnabled) this.logger.info('No access token in session');
        localStorage.removeItem('authentik_session');
        return { success: true, data: false, error: null };
      }

      // Check if access token is expired or about to expire (within 5 minutes)
      if (session.session?.expiresAt) {
        const expiresAt = new Date(session.session.expiresAt);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        if (expiresAt <= fiveMinutesFromNow) {
          if (this.authLogsEnabled) this.logger.info('Session expired or about to expire, attempting refresh');
          
          try {
            const refreshResult = await this.refreshSession();
            if (!refreshResult.success) {
              if (this.authLogsEnabled) this.logger.info('Session refresh failed, clearing session');
              localStorage.removeItem('authentik_session');
              return { success: true, data: false, error: null };
            }
            // If refresh was successful, return authenticated
            return { success: true, data: true, error: null };
          } catch (error) {
            this.logger.error('Error during session refresh', error);
            localStorage.removeItem('authentik_session');
            return { success: true, data: false, error: null };
          }
        }
      } else {
        // No expiration time, treat as expired for security
        if (this.authLogsEnabled) this.logger.info('No expiration time in session, treating as expired');
        localStorage.removeItem('authentik_session');
        return { success: true, data: false, error: null };
      }

      if (this.authLogsEnabled) this.logger.info('User is authenticated', { 
        userId: session.user.id,
        expiresAt: session.session?.expiresAt
      });
      
      return { success: true, data: true, error: null };
    } catch (error) {
      this.logger.error('Error checking authentication status', error);
      // On error, clear the session to be safe
      localStorage.removeItem('authentik_session');
      return { 
        success: false, 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to check authentication status' 
      };
    }
  }

  async getSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) {
        return { success: false, data: null, error: 'No session found' };
      }

      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.session?.expiresAt) {
        const expiresAt = new Date(session.session.expiresAt);
        if (expiresAt <= new Date()) {
          // Token expired, try to refresh
          const refreshResult = await this.refreshSession();
          if (refreshResult.success) {
            return refreshResult;
          } else {
            // Refresh failed, clear session
            localStorage.removeItem('authentik_session');
            return { success: false, data: null, error: 'Session expired' };
          }
        }
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

      // Ensure we have all required session data
      if (!sessionData.session?.accessToken) {
        throw new Error('Invalid session data: missing access token');
      }

      const session: AuthSession = {
        ...sessionData,
        session: {
          accessToken: sessionData.session.accessToken, // Required field
          refreshToken: sessionData.session.refreshToken,
          // Set default expiration if not provided (1 hour from now)
          expiresAt: sessionData.session.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      };

      if (this.authLogsEnabled) {
        this.logger.info('Setting session', {
          userId: session.user.id,
          expiresAt: session.session?.expiresAt,
          hasRefreshToken: !!session.session?.refreshToken
        });
      }

      // Store the session data in localStorage
      localStorage.setItem('authentik_session', JSON.stringify(session));
      return { success: true, data: null, error: null };
    } catch (error) {
      this.logger.error('Failed to set session', error);
      return { success: false, data: null, error: 'Failed to set session' };
    }
  }

  async refreshSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) {
        return { success: false, data: null, error: 'No session to refresh' };
      }

      const session = JSON.parse(sessionData);
      const refreshToken = session.session?.refreshToken;

      if (!refreshToken) {
        return { success: false, data: null, error: 'No refresh token available' };
      }

      // Use Authentik's token endpoint directly
      const tokenUrl = `${this.baseUrl}/application/o/token/`;
      const clientId = this.clientId;
      
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      params.append('client_id', clientId);

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
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        
        const errorMessage = errorData?.error_description || 
                           errorData?.error || 
                           `HTTP ${response.status} - ${response.statusText}`;
        
        this.logger.error('Token refresh failed', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorMessage,
          errorData
        });
        
        // Clear invalid session if refresh token is invalid/expired
        if (response.status === 400 || response.status === 401) {
          if (this.authLogsEnabled) {
            this.logger.info('Clearing invalid session due to authentication error');
          }
          localStorage.removeItem('authentik_session');
        }
        
        throw new Error(`Token refresh failed: ${errorMessage}`);
      }

      const tokenData = await response.json();
      
      // Update session with new tokens
      const updatedSession: AuthSession = {
        ...session,
        session: {
          ...session.session,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
          expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        },
      };

      await this.setSession(updatedSession);
      return { success: true, data: updatedSession, error: null };
    } catch (error) {
      this.logger.error('Failed to refresh session', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to refresh session' 
      };
    }
  }

  async getAuthStatus(): Promise<ServiceResponse<{ isAuthenticated: boolean; hasSession: boolean }>> {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      const hasSession = !!sessionData;
      
      if (!hasSession) {
        return { 
          success: true, 
          data: { isAuthenticated: false, hasSession: false }, 
          error: null 
        };
      }

      const isAuthenticated = await this.isAuthenticated();
      return { 
        success: true, 
        data: { isAuthenticated: isAuthenticated.data || false, hasSession }, 
        error: null 
      };
    } catch (error) {
      this.logger.error('Failed to get auth status', error);
      return { 
        success: false, 
        data: null, 
        error: 'Failed to get auth status' 
      };
    }
  }

  async handleOAuthCallback(code: string, state: string): Promise<ServiceResponse<AuthSession>> {
    try {
      // Verify state parameter (should match what we sent)
      const storedState = localStorage.getItem('authentik_oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = localStorage.getItem('authentik_code_verifier');
      if (!codeVerifier) {
        throw new Error('No code verifier found');
      }

      if (this.authLogsEnabled) this.logger.info('OAuth callback parameters', {
        code: code.substring(0, 10) + '...',
        state: state.substring(0, 10) + '...',
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        redirectUri: this.redirectUri
      });

      // Use server-side token exchange endpoint
      const tokenApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
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
          errorData
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      if (this.authLogsEnabled) this.logger.info('Token exchange successful', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        allTokenData: tokenData // Log all token data for debugging
      });

      // Get user info through server-side proxy
      const userInfoApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
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
          errorData: userErrorData
        });
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();
      if (this.authLogsEnabled) this.logger.info('User info retrieved', {
        externalId: userData.sub, // The 'sub' claim is the unique external ID
        email: userData.email,
        name: userData.name,
        allUserData: userData
      });

      // Get the database user ID by external ID
      let databaseUserId = userData.sub?.toString();
      
      try {
        const dbUserResponse = await fetch(`${userInfoApiUrl}/api/auth/get-db-user-id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            externalId: databaseUserId,
          }),
        });

        if (dbUserResponse.ok) {
          const dbUserData = await dbUserResponse.json();
          if (dbUserData.success && dbUserData.userId) {
            databaseUserId = dbUserData.userId;
            if (this.authLogsEnabled) this.logger.info('Database user ID found', { externalId: databaseUserId });
          } else if (dbUserData.code === 'PROFILE_NOT_CREATED') {
            if (this.authLogsEnabled) this.logger.info('User profile not yet created in DB, will be created on first app use.');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get database user ID, using external ID as fallback', { 
          externalId: databaseUserId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }

      // Create session
      const session: AuthSession = {
        user: {
          id: databaseUserId,
          email: userData.email,
          name: userData.name,
          firstName: userData.first_name || userData.given_name || undefined,
          lastName: userData.last_name || userData.family_name || undefined,
        },
        session: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        },
      };

      // Store session
      if (this.authLogsEnabled) this.logger.info('Storing session', {
        sessionId: session.user.id,
        sessionEmail: session.user.email,
        hasAccessToken: !!session.session?.accessToken,
        hasRefreshToken: !!session.session?.refreshToken,
        expiresAt: session.session?.expiresAt
      });
      await this.setSession(session);

      // Clean up OAuth state
      localStorage.removeItem('authentik_oauth_state');
      localStorage.removeItem('authentik_code_verifier');

      return { success: true, data: session, error: null };
    } catch (error) {
      this.logger.error('Failed to handle OAuth callback', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userData: error instanceof Error && 'userData' in error ? (error as any).userData : undefined
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

      // Update user info in Authentik
      const response = await fetch(`${this.baseUrl}/core/users/${session.data.user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.data.session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUserData = await response.json();
      
      // Update local session
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
      const session = await this.getSession();
      if (session.success && session.data?.session?.accessToken) {
        // Revoke token in Authentik
        try {
          await fetch(`${this.baseUrl}/application/o/revoke_token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: session.data.session.accessToken,
              client_id: this.clientId,
            }),
          });
        } catch (error) {
          // Log but don't fail - token might already be expired
          this.logger.warn('Failed to revoke token', error);
        }
      }

      // Clear local session
      localStorage.removeItem('authentik_session');
      localStorage.removeItem('authentik_oauth_state');
      localStorage.removeItem('authentik_code_verifier');

      return { success: true, data: null, error: null };
    } catch (error) {
      this.logger.error('Failed to sign out', error);
      return { success: false, data: null, error: 'Failed to sign out' };
    }
  }

  async initiateOAuthFlow(redirectUri?: string, additionalParams?: Record<string, string>): Promise<ServiceResponse<string>> {
    try {
      if (!this.clientId) {
        throw new Error('Authentik client ID not configured');
      }

      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Get OAuth state from server
      const stateApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const stateResponse = await fetch(`${stateApiUrl}/api/oauth/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'auth', // For authentication flow
          integrationSlug: 'authentik',
          redirectUri: redirectUri || this.redirectUri,
        }),
      });

      if (!stateResponse.ok) {
        throw new Error('Failed to generate OAuth state');
      }

      const stateData = await stateResponse.json();
      const { state } = stateData.data;

      // Store PKCE parameters locally
      localStorage.setItem('authentik_code_verifier', codeVerifier);
      localStorage.setItem('authentik_oauth_state', state);

      // Build OAuth URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: redirectUri || this.redirectUri,
        scope: 'openid email profile',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...additionalParams,
      });

      const authUrl = `${this.baseUrl}/application/o/authorize/?${params.toString()}`;
      
      if (this.authLogsEnabled) this.logger.info('Initiating OAuth flow', { 
        authUrl,
        clientId: this.clientId,
        redirectUri: redirectUri || this.redirectUri,
        state: state.substring(0, 10) + '...',
        codeChallenge: codeChallenge.substring(0, 10) + '...',
        codeVerifier: codeVerifier.substring(0, 10) + '...'
      });
      
      return { success: true, data: authUrl, error: null };
    } catch (error) {
      this.logger.error('Failed to initiate OAuth flow', error);
      return { success: false, data: null, error: 'Failed to initiate OAuth flow' };
    }
  }
}

// Export singleton instance
export const authentikAuthService = new AuthentikAuthService();
