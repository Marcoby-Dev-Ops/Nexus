import { supabase } from '@/lib/supabase';
import { sessionUtils, handleSupabaseError, selectOne, updateOne, callRPC } from '@/lib/supabase-compatibility';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
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
  constructor() {
    super();
  }

  /**
   * Get a user by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<AuthUser>> {
    try {
      this.validateIdParam(id);
      
      // Get user from Supabase using sessionUtils
      const { user, error } = await sessionUtils.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to get user', { error });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'get user');
    }
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
    try {
      this.validateIdParam(id);
      
      // Delete user from Supabase
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'delete user');
        return this.createErrorResponse(errorResult.error, { context: errorResult.context });
      }

      this.logSuccess('User deleted successfully', { userId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'delete user');
    }
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
    try {
      this.validateParams(data, ['email', 'password']);
      
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'sign in');
        return this.createErrorResponse('Authentication failed', { error: errorResult.error });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      // Ensure user profile exists using RPC
      try {
        const { error: rpcError } = await callRPC('ensure_user_profile', { user_id: user.id });
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

      this.logSuccess('User signed in successfully', { userId: user.id });
      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'sign in');
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<ServiceResponse<AuthUser>> {
    try {
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
        const errorResult = handleSupabaseError(error, 'sign up');
        return this.createErrorResponse('Registration failed', { error: errorResult.error });
      }

      if (!user) {
        return this.createErrorResponse('User creation failed');
      }

      // Ensure user profile exists using RPC
      try {
        const { error: rpcError } = await callRPC('ensure_user_profile', { user_id: user.id });
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

      this.logSuccess('User registered successfully', { userId: user.id });
      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'sign up');
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'sign out');
        return this.createErrorResponse('Sign out failed', { error: errorResult.error });
      }

      this.logSuccess('User signed out successfully');
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'sign out');
    }
  }

  /**
   * Get the current session using sessionUtils
   */
  async getSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const { session, error } = await sessionUtils.getSession();
      
      if (error) {
        return this.createErrorResponse('Failed to get session', { error });
      }

      if (!session) {
        return this.createSuccessResponse({ user: null, session: null });
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

      return this.createSuccessResponse(authSession);
    } catch (error) {
      return this.handleError(error, 'get session');
    }
  }

  /**
   * Get the current user using sessionUtils
   */
  async getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
    try {
      const { user, error } = await sessionUtils.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to get current user', { error });
      }

      if (!user) {
        return this.createErrorResponse('No authenticated user');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'get current user');
    }
  }

  /**
   * Update user profile using helper functions
   */
  async updateProfile(userId: string, data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      this.validateIdParam(userId);
      
      // Update user metadata in Supabase
      const { data: { user }, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'update profile');
        return this.createErrorResponse('Failed to update profile', { error: errorResult.error });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      };

      this.logSuccess('Profile updated successfully', { userId });
      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'update profile');
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<ServiceResponse<boolean>> {
    try {
      this.validateStringParam(email, 'email');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'reset password');
        return this.createErrorResponse('Failed to send reset email', { error: errorResult.error });
      }

      this.logSuccess('Password reset email sent', { email });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'reset password');
    }
  }

  /**
   * Check if user is authenticated using sessionUtils
   */
  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    try {
      const { user, error } = await sessionUtils.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to check authentication', { error });
      }

      return this.createSuccessResponse(!!user);
    } catch (error) {
      return this.handleError(error, 'check authentication');
    }
  }

  /**
   * Ensure user profile exists in the database
   * This method calls the ensure_user_profile RPC function
   */
  async ensureUserProfile(userId?: string): Promise<ServiceResponse<boolean>> {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).data?.id;
      
      if (!targetUserId) {
        return this.createErrorResponse('No user ID provided and no authenticated user found');
      }

      const { error } = await callRPC('ensure_user_profile', { user_id: targetUserId });
      
      if (error) {
        const errorResult = handleSupabaseError(error, 'ensure user profile');
        return this.createErrorResponse('Failed to ensure user profile', { error: errorResult.error });
      }

      this.logSuccess('User profile ensured successfully', { userId: targetUserId });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'ensure user profile');
    }
  }

  /**
   * Refresh the current session using sessionUtils
   */
  async refreshSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const { session, error } = await sessionUtils.refreshSession();
      
      if (error) {
        return this.createErrorResponse('Failed to refresh session', { error });
      }

      if (!session) {
        return this.createSuccessResponse({ user: null, session: null });
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

      return this.createSuccessResponse(authSession);
    } catch (error) {
      return this.handleError(error, 'refresh session');
    }
  }

  /**
   * Force refresh the session using sessionUtils
   */
  async forceRefreshSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const { session, error } = await sessionUtils.forceRefreshSession();
      
      if (error) {
        return this.createErrorResponse('Failed to force refresh session', { error });
      }

      if (!session) {
        return this.createSuccessResponse({ user: null, session: null });
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

      return this.createSuccessResponse(authSession);
    } catch (error) {
      return this.handleError(error, 'force refresh session');
    }
  }

  /**
   * Ensure session is valid using sessionUtils
   */
  async ensureSession(): Promise<ServiceResponse<boolean>> {
    try {
      const isValid = await sessionUtils.ensureSession();
      return this.createSuccessResponse(isValid);
    } catch (error) {
      return this.handleError(error, 'ensure session');
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 
