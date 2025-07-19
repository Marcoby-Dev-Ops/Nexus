import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface PersistentAuthConfig {
  sessionCheckInterval: number; // How often to check session validity (ms)
  tokenRefreshThreshold: number; // Refresh token when this much time is left (ms)
  maxRetries: number;
  retryDelay: number;
}

export interface SessionInfo {
  isValid: boolean;
  expiresAt: number | null;
  timeUntilExpiry: number | null;
  needsRefresh: boolean;
  user: any;
}

/**
 * Persistent Authentication Service
 * 
 * Ensures users stay logged in across browser sessions with:
 * - Automatic token refresh
 * - Session validation
 * - Persistent storage
 * - Offline support
 */
export class PersistentAuthService {
  private static instance: PersistentAuthService;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private config: PersistentAuthConfig;
  private isInitialized = false;

  constructor(config: Partial<PersistentAuthConfig> = {}) {
    this.config = {
      sessionCheckInterval: 5 * 60 * 1000, // Check every 5 minutes
      tokenRefreshThreshold: 10 * 60 * 1000, // Refresh when 10 minutes left
      maxRetries: 3,
      retryDelay: 2000,
      ...config
    };
  }

  static getInstance(config?: Partial<PersistentAuthConfig>): PersistentAuthService {
    if (!PersistentAuthService.instance) {
      PersistentAuthService.instance = new PersistentAuthService(config);
    }
    return PersistentAuthService.instance;
  }

  /**
   * Initialize the persistent authentication service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Persistent authentication service already initialized, skipping');
      return;
    }

    // Check if we're on a public page - don't initialize on public pages
    const currentPath = window.location.pathname;
    const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
    const isPublicPage = publicRoutes.some(route => currentPath.startsWith(route));
    
    if (isPublicPage) {
      logger.debug('Skipping persistent auth initialization on public page');
      return;
    }

    // Add a small delay to prevent rapid re-initialization in StrictMode
    await new Promise(resolve => setTimeout(resolve, 10));

    // Double-check after delay in case another initialization completed
    if (this.isInitialized) {
      logger.debug('Persistent authentication service initialized during delay, skipping');
      return;
    }

    try {
      logger.info('Initializing persistent authentication service');
      
      // Set up session persistence
      await this.setupSessionPersistence();
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      // Validate current session
      await this.validateCurrentSession();
      
      this.isInitialized = true;
      logger.info('Persistent authentication service initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize persistent authentication service');
      throw error;
    }
  }

  /**
   * Set up session persistence with enhanced storage
   */
  private async setupSessionPersistence(): Promise<void> {
    try {
      // Configure Supabase to use persistent storage
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error({ error }, 'Failed to get initial session');
        return;
      }

      if (session) {
        logger.info('Found existing session, setting up persistence');
        await this.storeSessionLocally(session);
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        logger.info({ event, userId: session?.user?.id }, 'Auth state changed');
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session) {
              await this.storeSessionLocally(session);
              await this.validateAndRefreshSession();
            }
            break;
            
          case 'SIGNED_OUT':
            await this.clearStoredSession();
            break;
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to setup session persistence');
    }
  }

  /**
   * Store session information locally for persistence
   */
  private async storeSessionLocally(session: any): Promise<void> {
    try {
      const sessionData = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
        userId: session.user?.id,
        email: session.user?.email,
        timestamp: Date.now()
      };

      // Store in localStorage for persistence
      localStorage.setItem('nexus_auth_session', JSON.stringify(sessionData));
      
      // Also store in sessionStorage for current session
      sessionStorage.setItem('nexus_current_session', JSON.stringify(sessionData));
      
      logger.debug('Session stored locally');
    } catch (error) {
      logger.error({ error }, 'Failed to store session locally');
    }
  }

  /**
   * Clear stored session data
   */
  private async clearStoredSession(): Promise<void> {
    try {
      localStorage.removeItem('nexus_auth_session');
      sessionStorage.removeItem('nexus_current_session');
      logger.debug('Stored session cleared');
    } catch (error) {
      logger.error({ error }, 'Failed to clear stored session');
    }
  }

  /**
   * Start monitoring session validity
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      try {
        await this.validateAndRefreshSession();
      } catch (error) {
        logger.error({ error }, 'Session monitoring error');
      }
    }, this.config.sessionCheckInterval);

    logger.info('Session monitoring started');
  }

  /**
   * Validate and refresh session if needed
   */
  async validateAndRefreshSession(): Promise<SessionInfo> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error({ error }, 'Failed to get session for validation');
        return {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          needsRefresh: false,
          user: null
        };
      }

      if (!session) {
        logger.debug('No session found');
        return {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          needsRefresh: false,
          user: null
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt ? (expiresAt - now) * 1000 : null;
      const needsRefresh = timeUntilExpiry !== null && timeUntilExpiry < this.config.tokenRefreshThreshold;

      if (needsRefresh) {
        logger.info('Token needs refresh, attempting to refresh');
        await this.refreshSession();
      }

      return {
        isValid: true,
        expiresAt: expiresAt ? expiresAt * 1000 : null,
        timeUntilExpiry,
        needsRefresh: false,
        user: session.user
      };
    } catch (error) {
      logger.error({ error }, 'Session validation failed');
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        needsRefresh: false,
        user: null
      };
    }
  }

  /**
   * Refresh the current session
   */
  private async refreshSession(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error({ error }, 'Failed to refresh session');
        throw error;
      }

      if (session) {
        await this.storeSessionLocally(session);
        logger.info('Session refreshed successfully');
      }
    } catch (error) {
      logger.error({ error }, 'Session refresh failed');
      throw error;
    }
  }

  /**
   * Validate current session and restore if needed
   */
  private async validateCurrentSession(): Promise<void> {
    try {
      const sessionInfo = await this.validateAndRefreshSession();
      
      if (!sessionInfo.isValid) {
        // Try to restore from localStorage
        await this.restoreSessionFromStorage();
      }
    } catch (error) {
      logger.error({ error }, 'Failed to validate current session');
    }
  }

  /**
   * Restore session from local storage
   */
  private async restoreSessionFromStorage(): Promise<void> {
    try {
      const storedSession = localStorage.getItem('nexus_auth_session');
      
      if (!storedSession) {
        logger.debug('No stored session found');
        return;
      }

      const sessionData = JSON.parse(storedSession);
      const now = Date.now();
      
      // Check if stored session is still valid
      if (sessionData.expiresAt && sessionData.expiresAt < now) {
        logger.debug('Stored session is expired, clearing');
        await this.clearStoredSession();
        return;
      }

      // Try to set the session
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: sessionData.accessToken,
        refresh_token: sessionData.refreshToken
      });

      if (error) {
        logger.error({ error }, 'Failed to restore session from storage');
        await this.clearStoredSession();
        return;
      }

      if (session) {
        logger.info('Session restored from storage');
        await this.storeSessionLocally(session);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to restore session from storage');
      await this.clearStoredSession();
    }
  }

  /**
   * Check if user is authenticated with persistent session
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const sessionInfo = await this.validateAndRefreshSession();
      return sessionInfo.isValid;
    } catch (error) {
      logger.error({ error }, 'Failed to check authentication status');
      return false;
    }
  }

  /**
   * Get current session information
   */
  async getCurrentSession(): Promise<SessionInfo> {
    return await this.validateAndRefreshSession();
  }

  /**
   * Sign out and clear all persistent data
   */
  async signOut(): Promise<void> {
    try {
      await this.clearStoredSession();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error({ error }, 'Sign out error');
      }
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to sign out');
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    this.isInitialized = false;
    logger.info('Persistent authentication service destroyed');
  }

  /**
   * Get session expiry information
   */
  getSessionExpiryInfo(): { expiresAt: Date | null; timeUntilExpiry: number | null } {
    try {
      const storedSession = localStorage.getItem('nexus_auth_session');
      
      if (!storedSession) {
        return { expiresAt: null, timeUntilExpiry: null };
      }

      const sessionData = JSON.parse(storedSession);
      const now = Date.now();
      const expiresAt = sessionData.expiresAt ? new Date(sessionData.expiresAt) : null;
      const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now : null;

      return { expiresAt, timeUntilExpiry };
    } catch (error) {
      logger.error({ error }, 'Failed to get session expiry info');
      return { expiresAt: null, timeUntilExpiry: null };
    }
  }
}

// Export singleton instance
export const persistentAuthService = PersistentAuthService.getInstance();

// Export convenience functions
export const initializePersistentAuth = () => persistentAuthService.initialize();
export const checkPersistentAuth = () => persistentAuthService.isAuthenticated();
export const getPersistentSession = () => persistentAuthService.getCurrentSession();
export const signOutPersistent = () => persistentAuthService.signOut();
export const getSessionExpiry = () => persistentAuthService.getSessionExpiryInfo(); 