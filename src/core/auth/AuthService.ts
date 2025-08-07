import { supabase } from '@/lib/supabase';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { SupabaseService } from '@/core/services/SupabaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import type { Session } from '@supabase/supabase-js';
import { logger } from './logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AuthUser | null;
  session: Session | null;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Authentication Service
 * Handles user authentication, session management, and user profile operations
 * Extends BaseService for consistent error handling and logging
 */
export class AuthService extends BaseService implements CrudServiceInterface<AuthUser> {
  private supabaseService = SupabaseService.getInstance();

  constructor() {
    super();
  }

  /**
   * Get a user by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<AuthUser>> {
    return this.executeDbOperation(async () => {
      this.validateIdParam(id);
      
      // Get user from Supabase using service
      const { user, error } = await this.supabaseService.sessionUtils.getUser();
      
      if (error) {
        this.logger.error('Failed to get user:', error);
        return { data: null, error: 'Failed to get user' };
      }

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      return { data: authUser, error: null };
    }, 'get user');
  }

  /**
   * Create a new user (implements CrudServiceInterface)
   */
  async create(data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      // This would typically be handled by signUp
      return this.createErrorResponse('Use signUp method for user creation');
    } catch (error) {
      return this.handleError(error, 'create user');
    }
  }

  /**
   * Update a user (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      this.validateIdParam(id);
      return await this.updateProfile(id, data);
    } catch (error) {
      return this.handleError(error, 'update user');
    }
  }

  /**
   * Delete a user (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.validateIdParam(id);
      
      // Delete user from Supabase
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) {
        this.logger.error('Failed to delete user:', error);
        return { data: null, error: 'Failed to delete user' };
      }

      this.logger.info('User deleted successfully', { userId: id });
      return { data: true, error: null };
    }, 'delete user');
  }

  /**
   * List users (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<AuthUser[]>> {
    try {
      // This would typically be an admin operation
      return this.createErrorResponse('User listing not implemented');
    } catch (error) {
      return this.handleError(error, 'list users');
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(data: SignInRequest): Promise<ServiceResponse<AuthUser>> {
    return this.executeDbOperation(async () => {
      this.validateParams(data, ['email', 'password']);
      
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        this.logger.error('Authentication failed:', error);
        return { data: null, error: 'Authentication failed' };
      }

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      // Ensure user profile exists using RPC
      try {
        const { error: rpcError } = await this.supabaseService.callRPC('ensure_user_profile', { user_id: user.id });
        if (rpcError) {
          this.logger.error('Failed to ensure user profile exists', { error: rpcError });
          // Continue anyway - profile creation is not critical for sign in
        }
      } catch (profileError) {
        this.logger.error('Failed to ensure user profile exists', { error: profileError });
        // Continue anyway - profile creation is not critical for sign in
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      this.logger.info('User signed in successfully', { userId: user.id });
      return { data: authUser, error: null };
    }, 'sign in');
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<ServiceResponse<AuthUser>> {
    return this.executeDbOperation(async () => {
      this.validateParams(data, ['email', 'password']);
      
      const { data: { user, session }, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          }
        }
      });
      
      if (error) {
        this.logger.error('Registration failed:', error);
        return { data: null, error: 'Registration failed' };
      }

      if (!user) {
        return { data: null, error: 'User creation failed' };
      }

      // Ensure user profile exists using RPC
      try {
        const { error: rpcError } = await this.supabaseService.callRPC('ensure_user_profile', { user_id: user.id });
        if (rpcError) {
          this.logger.error('Failed to ensure user profile exists', { error: rpcError });
          // Continue anyway - profile creation is not critical for sign up
        }
      } catch (profileError) {
        this.logger.error('Failed to ensure user profile exists', { error: profileError });
        // Continue anyway - profile creation is not critical for sign up
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      this.logger.info('User registered successfully', { userId: user.id });
      return { data: authUser, error: null };
    }, 'sign up');
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.logger.error('Sign out failed:', error);
        return { data: null, error: 'Sign out failed' };
      }

      this.logger.info('User signed out successfully');
      return { data: true, error: null };
    }, 'sign out');
  }

  /**
   * Get the current session using service pattern
   */
  async getSession(): Promise<ServiceResponse<AuthSession>> {
    return this.executeDbOperation(async () => {
      this.logger.info('Attempting to get session');
      
      const { session, error } = await this.supabaseService.sessionUtils.getSession();
      
      if (error) {
        this.logger.error('Failed to get session:', error);
        return { data: null, error: 'Failed to get session' };
      }

      if (!session) {
        this.logger.info('No session found - user not authenticated');
        return { data: { user: null, session: null }, error: null };
      }

      this.logger.info('Session retrieved successfully', { 
        userId: session.user?.id,
        expiresAt: session.expires_at 
      });

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.firstName,
        lastName: session.user.user_metadata?.lastName,
        createdAt: session.user.created_at || new Date().toISOString(),
        updatedAt: session.user.updated_at || new Date().toISOString(),
      };

      const authSession: AuthSession = {
        user: authUser,
        session: session,
      };

      return { data: authSession, error: null };
    }, 'get session');
  }

  /**
   * Get the current user using sessionUtils
   */
  async getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
    return this.executeDbOperation(async () => {
      const { user, error } = await this.supabaseService.sessionUtils.getUser();
      
      if (error) {
        this.logger.error('Failed to get current user:', error);
        return { data: null, error: 'Failed to get current user' };
      }

      if (!user) {
        return { data: null, error: 'No authenticated user' };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      return { data: authUser, error: null };
    }, 'get current user');
  }

  /**
   * Update user profile using service pattern
   */
  async updateProfile(userId: string, data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    return this.executeDbOperation(async () => {
      this.validateIdParam(userId);
      
      // Update user metadata in Supabase
      const { data: { user }, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
      
      if (error) {
        this.logger.error('Failed to update profile:', error);
        return { data: null, error: 'Failed to update profile' };
      }

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      this.logger.info('Profile updated successfully', { userId });
      return { data: authUser, error: null };
    }, 'update profile');
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.validateStringParam(email, 'email');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.logger.error('Failed to send reset email:', error);
        return { data: null, error: 'Failed to send reset email' };
      }

      this.logger.info('Password reset email sent', { email });
      return { data: true, error: null };
    }, 'reset password');
  }

  /**
   * Check if user is authenticated using service pattern
   */
  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { user, error } = await this.supabaseService.sessionUtils.getUser();
      
      if (error) {
        this.logger.error('Failed to check authentication:', error);
        return { data: null, error: 'Failed to check authentication' };
      }

      return { data: !!user, error: null };
    }, 'check authentication');
  }

  /**
   * Ensure user profile exists in the database
   * This method calls the ensure_user_profile RPC function
   */
  async ensureUserProfile(userId?: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const targetUserId = userId || (await this.getCurrentUser()).data?.id;
      
      if (!targetUserId) {
        return { data: null, error: 'No user ID provided and no authenticated user found' };
      }

      const { error } = await this.supabaseService.callRPC('ensure_user_profile', { user_id: targetUserId });
      
      if (error) {
        this.logger.error('Failed to ensure user profile:', error);
        return { data: null, error: 'Failed to ensure user profile' };
      }

      this.logger.info('User profile ensured successfully', { userId: targetUserId });
      return { data: true, error: null };
    }, 'ensure user profile');
  }

  /**
   * Refresh the current session using service pattern
   */
  async refreshSession(): Promise<ServiceResponse<AuthSession>> {
    return this.executeDbOperation(async () => {
      const { session, error } = await this.supabaseService.sessionUtils.refreshSession();
      
      if (error) {
        this.logger.error('Failed to refresh session:', error);
        return { data: null, error: 'Failed to refresh session' };
      }

      if (!session) {
        return { data: { user: null, session: null }, error: null };
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.firstName,
        lastName: session.user.user_metadata?.lastName,
        createdAt: session.user.created_at || new Date().toISOString(),
        updatedAt: session.user.updated_at || new Date().toISOString(),
      };

      const authSession: AuthSession = {
        user: authUser,
        session: session,
      };

      return { data: authSession, error: null };
    }, 'refresh session');
  }

  /**
   * Force refresh the session using service pattern
   */
  async forceRefreshSession(): Promise<ServiceResponse<AuthSession>> {
    return this.executeDbOperation(async () => {
      const { session, error } = await this.supabaseService.sessionUtils.forceRefreshSession();
      
      if (error) {
        this.logger.error('Failed to force refresh session:', error);
        return { data: null, error: 'Failed to force refresh session' };
      }

      if (!session) {
        return { data: { user: null, session: null }, error: null };
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.firstName,
        lastName: session.user.user_metadata?.lastName,
        createdAt: session.user.created_at || new Date().toISOString(),
        updatedAt: session.user.updated_at || new Date().toISOString(),
      };

      const authSession: AuthSession = {
        user: authUser,
        session: session,
      };

      return { data: authSession, error: null };
    }, 'force refresh session');
  }

  /**
   * Ensure session is valid using service pattern
   */
  async ensureSession(): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const isValid = await this.supabaseService.sessionUtils.ensureSession();
      return { data: isValid, error: null };
    }, 'ensure session');
  }
}

// Export singleton instance
export const authService = new AuthService(); 
