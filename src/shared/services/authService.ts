import { logger } from '@/core/auth/logger';
import { useAuthStore } from '@/shared/stores/authStore';
import { performSignOut } from '@/shared/utils/signOut';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';

// Global initialization guard to prevent multiple initializations in React StrictMode
let globalAuthServiceGuard = false;

// Extract the correct types from the Database type
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserIntegrationRow = Database['public']['Tables']['user_integrations']['Row'];

const logAuth = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  logger[level](`[AuthService:${timestamp}] ${message}`, data);
};

/**
 * Comprehensive Authentication Service
 * 
 * Provides a clean interface for all authentication operations with:
 * - Automatic session management
 * - Error handling and retry logic
 * - Session health monitoring
 * - Data persistence
 */
export class AuthService {
  private static instance: AuthService;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize the authentication service
   */
  async initialize(): Promise<void> {
    // Global guard to prevent multiple initializations
    if (globalAuthServiceGuard) {
      logAuth('info', 'Auth service already initialized globally');
      return;
    }
    
    if (this.isInitialized) {
      logAuth('info', 'Auth service already initialized');
      return;
    }

    try {
      logAuth('info', 'Initializing authentication service');
      
      // Set global guard
      globalAuthServiceGuard = true;
      
      // Initialize the Zustand store
      const { initializeAuth } = await import('@/shared/stores/authStore');
      initializeAuth();
      
      // Set up session monitoring
      this.startSessionMonitoring();
      
      this.isInitialized = true;
      logAuth('info', 'Authentication service initialized successfully');
    } catch (error) {
      logAuth('error', 'Failed to initialize authentication service', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      logAuth('info', 'Signing in user', { email });
      
      const store = useAuthStore.getState();
      const result = await store.signIn(email, password);
      
      if (result.success) {
        logAuth('info', 'Sign in successful');
      } else {
        logAuth('error', 'Sign in failed', { error: result.error });
      }
      
      return result;
    } catch (error) {
      logAuth('error', 'Sign in exception', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      logAuth('info', 'Signing up user', { email });
      
      const store = useAuthStore.getState();
      const result = await store.signUp(email, password);
      
      if (result.success) {
        logAuth('info', 'Sign up successful');
      } else {
        logAuth('error', 'Sign up failed', { error: result.error });
      }
      
      return result;
    } catch (error) {
      logAuth('error', 'Sign up exception', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Sign out the current user with comprehensive cleanup
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      logAuth('info', 'Signing out user with comprehensive cleanup');
      
      // Stop session monitoring
      this.stopSessionMonitoring();
      
      // Use the comprehensive sign out utility
      await performSignOut();
      
      logAuth('info', 'Sign out completed successfully');
      return { success: true };
    } catch (error) {
      logAuth('error', 'Sign out exception', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      logAuth('info', 'Resetting password', { email });
      
      const store = useAuthStore.getState();
      const result = await store.resetPassword(email);
      
      if (result.success) {
        logAuth('info', 'Password reset email sent');
      } else {
        logAuth('error', 'Password reset failed', { error: result.error });
      }
      
      return result;
    } catch (error) {
      logAuth('error', 'Password reset exception', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    const store = useAuthStore.getState();
    return {
      session: store.session,
      user: store.user,
      profile: store.profile,
      company: store.company,
      integrations: store.integrations,
      loading: store.loading,
      error: store.error,
      initialized: store.initialized,
      status: store.status,
      isAuthenticated: store.isAuthenticated,
      isSessionValid: store.isSessionValid,
      isSessionExpiring: store.isSessionExpiring,
      lastActivity: store.lastActivity,
      sessionExpiry: store.sessionExpiry,
      refreshAttempts: store.refreshAttempts
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const store = useAuthStore.getState();
    return store.isAuthenticated;
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const store = useAuthStore.getState();
    return store.isSessionValid;
  }

  /**
   * Check if session is expiring soon
   */
  isSessionExpiring(): boolean {
    const store = useAuthStore.getState();
    return store.isSessionExpiring;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const store = useAuthStore.getState();
    return store.user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    const store = useAuthStore.getState();
    return store.session;
  }

  /**
   * Get user profile
   */
  getUserProfile(): UserProfileRow | null {
    const store = useAuthStore.getState();
    return store.profile;
  }

  /**
   * Get user company
   */
  getUserCompany(): CompanyRow | null {
    const store = useAuthStore.getState();
    return store.company;
  }

  /**
   * Get user integrations
   */
  getUserIntegrations(): UserIntegrationRow[] {
    const store = useAuthStore.getState();
    return store.integrations;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfileRow>): Promise<void> {
    try {
      logAuth('info', 'Updating user profile', { updates });
      
      const store = useAuthStore.getState();
      await store.updateProfile(updates);
      
      logAuth('info', 'Profile updated successfully');
    } catch (error) {
      logAuth('error', 'Profile update failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update user company
   */
  async updateCompany(updates: Partial<CompanyRow>): Promise<void> {
    try {
      logAuth('info', 'Updating user company', { updates });
      
      const store = useAuthStore.getState();
      await store.updateCompany(updates);
      
      logAuth('info', 'Company updated successfully');
    } catch (error) {
      logAuth('error', 'Company update failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Refresh user data (profile, integrations, company)
   */
  async refreshUserData(): Promise<void> {
    try {
      const store = useAuthStore.getState();
      const user = store.user;
      
      if (!user?.id) {
        logAuth('warn', 'No user ID available for data refresh');
        return;
      }
      
      logAuth('info', 'Refreshing user data', { userId: user.id });
      
      // Fetch all user data in parallel
      await Promise.all([
        store.fetchProfile(user.id),
        store.fetchIntegrations(user.id)
      ]);
      
      // Fetch company if user has one
      const profile = store.profile;
      if (profile?.company_id) {
        await store.fetchCompany(profile.company_id);
      }
      
      logAuth('info', 'User data refreshed successfully');
    } catch (error) {
      logAuth('error', 'Failed to refresh user data', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<void> {
    try {
      logAuth('info', 'Refreshing session');
      
      const store = useAuthStore.getState();
      await store.refreshSession();
      
      logAuth('info', 'Session refreshed successfully');
    } catch (error) {
      logAuth('error', 'Session refresh failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      const store = useAuthStore.getState();
      const isValid = await store.validateSession();
      
      logAuth('info', 'Session validation result', { isValid });
      return isValid;
    } catch (error) {
      logAuth('error', 'Session validation failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Check session health
   */
  async checkSessionHealth(): Promise<{
    isValid: boolean;
    isExpiring: boolean;
    timeUntilExpiry: number;
    needsRefresh: boolean;
  }> {
    try {
      const store = useAuthStore.getState();
      const health = await store.checkSessionHealth();
      
      logAuth('info', 'Session health check', health);
      return health;
    } catch (error) {
      logAuth('error', 'Session health check failed', { error: (error as Error).message });
      return {
        isValid: false,
        isExpiring: false,
        timeUntilExpiry: 0,
        needsRefresh: false
      };
    }
  }

  /**
   * Retry session fetch
   */
  async retrySessionFetch(): Promise<void> {
    try {
      logAuth('info', 'Retrying session fetch');
      
      const store = useAuthStore.getState();
      await store.retrySessionFetch();
      
      logAuth('info', 'Session fetch retry completed');
    } catch (error) {
      logAuth('error', 'Session fetch retry failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    // Clear any existing interval
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check session health every 10 minutes (reduced from 5 minutes)
    this.sessionCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkSessionHealth();
        
        if (health.needsRefresh) {
          logAuth('info', 'Session needs refresh, attempting refresh');
          await this.refreshSession();
        }
      } catch (error) {
        logAuth('error', 'Session monitoring error', { error: (error as Error).message });
      }
    }, 10 * 60 * 1000); // 10 minutes (reduced from 5 minutes)
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
      logAuth('info', 'Session monitoring stopped');
    }
  }

  /**
   * Clear authentication state
   */
  clearAuth(): void {
    const store = useAuthStore.getState();
    store.clearAuth();
    logAuth('info', 'Authentication state cleared');
  }

  /**
   * Get session expiry information
   */
  getSessionExpiryInfo(): { expiresAt: Date | null; timeUntilExpiry: number | null } {
    const store = useAuthStore.getState();
    const session = store.session;
    
    if (!session?.expires_at) {
      return { expiresAt: null, timeUntilExpiry: null };
    }
    
    const expiresAt = new Date(session.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    
    return {
      expiresAt,
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : null
    };
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.stopSessionMonitoring();
    this.isInitialized = false;
    logAuth('info', 'Authentication service destroyed');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export convenience functions
export const initializeAuth = () => authService.initialize();
export const signIn = (email: string, password: string) => authService.signIn(email, password);
export const signUp = (email: string, password: string) => authService.signUp(email, password);
export const signOut = () => authService.signOut();
export const resetPassword = (email: string) => authService.resetPassword(email);
export const getAuthState = () => authService.getAuthState();
export const isAuthenticated = () => authService.isAuthenticated();
export const isSessionValid = () => authService.isSessionValid();
export const isSessionExpiring = () => authService.isSessionExpiring();
export const getCurrentUser = () => authService.getCurrentUser();
export const getCurrentSession = () => authService.getCurrentSession();
export const getUserProfile = () => authService.getUserProfile();
export const getUserCompany = () => authService.getUserCompany();
export const getUserIntegrations = () => authService.getUserIntegrations();
export const updateProfile = (updates: Partial<UserProfileRow>) => authService.updateProfile(updates);
export const updateCompany = (updates: Partial<CompanyRow>) => authService.updateCompany(updates);
export const refreshUserData = () => authService.refreshUserData();
export const refreshSession = () => authService.refreshSession();
export const validateSession = () => authService.validateSession();
export const checkSessionHealth = () => authService.checkSessionHealth();
export const retrySessionFetch = () => authService.retrySessionFetch();
export const clearAuth = () => authService.clearAuth();
export const getSessionExpiryInfo = () => authService.getSessionExpiryInfo();
export const destroyAuth = () => authService.destroy(); 