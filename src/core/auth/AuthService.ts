import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from './interfaces';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { z } from 'zod';

// Zod schemas for validation
export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const AuthSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    created_at: z.string(),
    updated_at: z.string(),
  }).optional(),
  session: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number(),
  }).optional(),
});

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
    super('auth');
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
        return this.createErrorResponse('Failed to get user', error.message);
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
      return this.handleError('Failed to get user', error);
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
      return this.handleError('Failed to create user', error);
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
      return this.handleError('Failed to update user', error);
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
        return this.createErrorResponse('Failed to delete user', error.message);
      }

      this.logSuccess('User deleted successfully', { userId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to delete user', error);
    }
  }

  /**
   * List users (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<AuthUser[]>> {
    try {
      // This would typically require admin privileges
      return this.createErrorResponse('User listing requires admin privileges');
    } catch (error) {
      return this.handleError('Failed to list users', error);
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(data: SignInRequest): Promise<ServiceResponse<AuthUser>> {
    try {
      // Validate input
      const validatedData = SignInSchema.parse(data);
      
      // Attempt sign in
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        return this.createErrorResponse('Authentication failed', error.message);
      }

      if (!authData.user) {
        return this.createErrorResponse('No user data returned');
      }

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        firstName: authData.user.user_metadata?.firstName,
        lastName: authData.user.user_metadata?.lastName,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at,
      };

      this.logSuccess('User signed in successfully', { userId: user.id });
      return this.createSuccessResponse(user);
    } catch (error) {
      return this.handleError('Sign in failed', error);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<ServiceResponse<AuthUser>> {
    try {
      // Validate input
      const validatedData = SignUpSchema.parse(data);
      
      // Attempt sign up
      const { data: authData, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
          },
        },
      });

      if (error) {
        return this.createErrorResponse('Registration failed', error.message);
      }

      if (!authData.user) {
        return this.createErrorResponse('No user data returned');
      }

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email || '',
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at,
      };

      this.logSuccess('User registered successfully', { userId: user.id });
      return this.createSuccessResponse(user);
    } catch (error) {
      return this.handleError('Sign up failed', error);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return this.createErrorResponse('Sign out failed', error.message);
      }

      this.logSuccess('User signed out successfully');
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Sign out failed', error);
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<ServiceResponse<AuthSession>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return this.createErrorResponse('Failed to get session', error.message);
      }

      const authSession: AuthSession = {
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.firstName,
          lastName: session.user.user_metadata?.lastName,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at,
        } : null,
        session: session,
      };

      return this.createSuccessResponse(authSession);
    } catch (error) {
      return this.handleError('Failed to get session', error);
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to get current user', error.message);
      }

      if (!user) {
        return this.createErrorResponse('No authenticated user found');
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
      return this.handleError('Failed to get current user', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<AuthUser>): Promise<ServiceResponse<AuthUser>> {
    try {
      this.validateIdParam(userId);

      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      if (error) {
        return this.createErrorResponse('Failed to update profile', error.message);
      }

      if (!user) {
        return this.createErrorResponse('No user data returned');
      }

      const updatedUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: data.firstName || user.user_metadata?.firstName,
        lastName: data.lastName || user.user_metadata?.lastName,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      this.logSuccess('Profile updated successfully', { userId });
      return this.createSuccessResponse(updatedUser);
    } catch (error) {
      return this.handleError('Failed to update profile', error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ServiceResponse<boolean>> {
    try {
      this.validateStringParam(email, 'email');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return this.createErrorResponse('Failed to send reset email', error.message);
      }

      this.logSuccess('Password reset email sent', { email });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to send reset email', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return this.createErrorResponse('Failed to check authentication', error.message);
      }

      return this.createSuccessResponse(!!user);
    } catch (error) {
      return this.handleError('Failed to check authentication', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 
