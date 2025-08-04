import { supabase } from '@/lib/supabase';
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
      
      // Get user from Supabase
      const { data: { user }, error } = await supabase.auth.admin.getUserById(id);
      
      if (error) {
        return this.createErrorResponse('Failed to get user', { error: error.message });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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
        return this.createErrorResponse('Failed to delete user', { error: error.message });
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
        return this.createErrorResponse('Authentication failed', { error: error.message });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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
        return this.createErrorResponse('Registration failed', { error: error.message });
      }

      if (!user) {
        return this.createErrorResponse('User creation failed');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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
        return this.createErrorResponse('Sign out failed', { error: error.message });
      }

      this.logSuccess('User signed out successfully');
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'sign out');
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return this.createErrorResponse('Failed to get session', { error: error.message });
      }

      if (!session) {
        return this.createSuccessResponse({ user: null, session: null });
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.firstName,
        lastName: session.user.user_metadata?.lastName,
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at,
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
   * Get the current user
   */
  async getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to get current user', { error: error.message });
      }

      if (!user) {
        return this.createErrorResponse('No authenticated user');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return this.createSuccessResponse(authUser);
    } catch (error) {
      return this.handleError(error, 'get current user');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      this.validateIdParam(userId);
      
      const { data: { user }, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
      
      if (error) {
        return this.createErrorResponse('Failed to update profile', { error: error.message });
      }

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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
        return this.createErrorResponse('Failed to send reset email', { error: error.message });
      }

      this.logSuccess('Password reset email sent', { email });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'reset password');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to check authentication', { error: error.message });
      }

      return this.createSuccessResponse(!!user);
    } catch (error) {
      return this.handleError(error, 'check authentication');
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 
