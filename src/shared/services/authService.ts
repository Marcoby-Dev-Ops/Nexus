import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface AuthRedirectOptions {
  redirectTo?: string;
  replace?: boolean;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: any;
  session: any;
  error?: string;
}

/**
 * Authentication Service
 * 
 * Provides utility functions for authentication management,
 * session handling, and redirect logic.
 */
export class AuthService {
  /**
   * Check if user is currently authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logger.error({ error }, 'Failed to check authentication status');
        return false;
      }
      return !!session;
    } catch (error) {
      logger.error({ error }, 'Error checking authentication status');
      return false;
    }
  }

  /**
   * Get current user and session
   */
  static async getCurrentAuth(): Promise<AuthCheckResult> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (error) {
        logger.error({ error }, 'Failed to get current user');
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          error: error.message
        };
      }

      return {
        isAuthenticated: !!(user && session),
        user,
        session
      };
    } catch (error) {
      logger.error({ error }, 'Error getting current auth');
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sign out user and redirect
   */
  static async signOut(redirectTo: string = '/login'): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error({ error }, 'Sign out error');
      }
      
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      
      // Redirect to login
      window.location.href = redirectTo;
    } catch (error) {
      logger.error({ error }, 'Unexpected sign out error');
      // Force redirect even on error
      window.location.href = redirectTo;
    }
  }

  /**
   * Redirect to login with return URL
   */
  static redirectToLogin(currentPath: string, options: AuthRedirectOptions = {}): void {
    const { redirectTo = '/login', replace = true } = options;
    
    const searchParams = new URLSearchParams();
    searchParams.set('redirect', currentPath);
    
    const loginUrl = `${redirectTo}?${searchParams.toString()}`;
    
    if (replace) {
      window.location.replace(loginUrl);
    } else {
      window.location.href = loginUrl;
    }
  }

  /**
   * Redirect to home or specified URL after login
   */
  static redirectAfterLogin(redirectTo: string = '/home'): void {
    window.location.replace(redirectTo);
  }

  /**
   * Check if current route requires authentication
   */
  static isProtectedRoute(pathname: string): boolean {
    const protectedPrefixes = [
      '/dashboard', '/workspace', '/ai-hub', '/chat', '/ai-performance', 
      '/business-setup', '/business-chat', '/analytics', '/data-warehouse', 
      '/assessment', '/company-status', '/think', '/see', '/act', '/sales', 
      '/finance', '/marketing', '/operations', '/support', '/hr', '/it', 
      '/product', '/customer-success', '/legal', '/maturity', '/sales-performance', 
      '/financial-operations', '/integrations', '/settings', '/profile', 
      '/onboarding/company-profile', '/documents', '/admin', '/component/',
      '/home', '/knowledge'
    ];

    return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  }

  /**
   * Check if current route is public (no auth required)
   */
  static isPublicRoute(pathname: string): boolean {
    const publicRoutes = [
      '/', '/login', '/signup', '/reset-password', '/waitlist', 
      '/marketing', '/pricing', '/help', '/auth/callback'
    ];

    return publicRoutes.some(route => pathname.startsWith(route));
  }

  /**
   * Get the appropriate redirect URL based on authentication status
   */
  static getRedirectUrl(isAuthenticated: boolean, currentPath: string): string {
    if (isAuthenticated) {
      // If user is authenticated and trying to access public routes, redirect to home
      if (this.isPublicRoute(currentPath) && currentPath !== '/') {
        return '/home';
      }
      return currentPath;
    } else {
      // If user is not authenticated and trying to access protected routes, redirect to login
      if (this.isProtectedRoute(currentPath)) {
        return '/login';
      }
      return currentPath;
    }
  }

  /**
   * Validate session and refresh if needed
   */
  static async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error({ error }, 'Session validation failed');
        return false;
      }

      if (!session) {
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        logger.warn('Session expired, attempting refresh');
        
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !newSession) {
          logger.error({ refreshError }, 'Session refresh failed');
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error validating session');
      return false;
    }
  }

  /**
   * Get user permissions and roles
   */
  static async getUserPermissions(userId: string): Promise<{
    roles: string[];
    permissions: string[];
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, department')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error({ error }, 'Failed to get user permissions');
        return { roles: [], permissions: [] };
      }

      return {
        roles: profile.role ? [profile.role] : [],
        permissions: [] // permissions column doesn't exist in current schema
      };
    } catch (error) {
      logger.error({ error }, 'Error getting user permissions');
      return { roles: [], permissions: [] };
    }
  }

  /**
   * Check if user has required permissions
   */
  static async hasPermission(
    userId: string, 
    requiredPermissions: string[] = [], 
    requiredRoles: string[] = []
  ): Promise<boolean> {
    try {
      const { roles, permissions } = await this.getUserPermissions(userId);

      // Check roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.some(permission => 
          permissions.includes(permission)
        );
        if (!hasRequiredPermission) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error checking user permissions');
      return false;
    }
  }
}

// Export convenience functions
export const isAuthenticated = AuthService.isAuthenticated;
export const getCurrentAuth = AuthService.getCurrentAuth;
export const signOut = AuthService.signOut;
export const redirectToLogin = AuthService.redirectToLogin;
export const redirectAfterLogin = AuthService.redirectAfterLogin;
export const isProtectedRoute = AuthService.isProtectedRoute;
export const isPublicRoute = AuthService.isPublicRoute;
export const getRedirectUrl = AuthService.getRedirectUrl;
export const validateSession = AuthService.validateSession;
export const hasPermission = AuthService.hasPermission; 