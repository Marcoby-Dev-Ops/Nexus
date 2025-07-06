/**
 * Unified Authentication Service
 * Bridges Supabase authentication with user context for conversations
 * Ensures all user interactions are properly linked to their account
 */

import { supabase } from '../core/supabase';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface UnifiedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
  // Nexus-specific user data
  role?: 'admin' | 'user' | 'manager';
  department?: string;
  company?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'manager';
  department?: string;
  company?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

export interface AuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
}

class UnifiedAuthService {
  private listeners: Array<(state: AuthState) => void> = [];
  private currentState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    session: null
  };

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication and set up listeners
   */
  private async initializeAuth() {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.updateState({ user: null, isAuthenticated: false, isLoading: false, session: null });
        return;
      }

      // Set initial user state
      await this.handleAuthChange(session);

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email);
        await this.handleAuthChange(session);
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateState({ user: null, isAuthenticated: false, isLoading: false, session: null });
    }
  }

  /**
   * Handle authentication state changes
   */
  private async handleAuthChange(session: Session | null) {
    this.updateState({ ...this.currentState, isLoading: true, session });

    if (session?.user) {
      try {
        // Get or create user profile
        const unifiedUser = await this.getOrCreateUserProfile(session.user);
        this.updateState({
          user: unifiedUser,
          isAuthenticated: true,
          isLoading: false,
          session
        });
      } catch (error) {
        console.error('Error handling auth change:', error);
        this.updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          session: null
        });
      }
    } else {
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        session: null
      });
    }
  }

  /**
   * Get or create user profile in our system
   */
  private async getOrCreateUserProfile(supabaseUser: SupabaseUser): Promise<UnifiedUser> {
    // Check if user profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (existingProfile && !fetchError) {
      return this.mapToUnifiedUser(supabaseUser, existingProfile);
    }

    // Create new user profile
    const newProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      role: 'user' as const,
      department: null,
      company: null,
      preferences: {
        theme: 'system' as const,
        notifications: true,
        language: 'en'
      },
      created_at: new Date().toISOString()
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([newProfile])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user profile:', createError);
      // Fallback to basic user data
      return this.mapToUnifiedUser(supabaseUser, null);
    }

    return this.mapToUnifiedUser(supabaseUser, createdProfile);
  }

  /**
   * Map Supabase user and profile to unified user
   */
  private mapToUnifiedUser(supabaseUser: SupabaseUser, profile: UserProfile | null): UnifiedUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: profile?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: profile?.role || 'user',
      department: profile?.department,
      company: profile?.company,
      preferences: profile?.preferences || {
        theme: 'system',
        notifications: true,
        language: 'en'
      }
    };
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current auth state
   */
  getCurrentState(): AuthState {
    return this.currentState;
  }

  /**
   * Get current user for chat context
   */
  getCurrentUser(): UnifiedUser | null {
    return this.currentState.user;
  }

  /**
   * Check if user is authenticated for API calls
   */
  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated && !!this.currentState.user;
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sign up user
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UnifiedUser>): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', this.currentState.user!.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local state
      this.updateState({
        user: { ...this.currentState.user!, ...updates }
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Reset password for user
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService(); 