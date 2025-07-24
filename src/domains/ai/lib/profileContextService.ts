/**
 * Profile Context Service
 * Manages user profile context for RAG (Retrieval-Augmented Generation)
 */

import { supabase } from '@/core/supabase';

export interface RAGProfileContext {
  userId: string;
  businessName?: string;
  industry?: string;
  department?: string;
  role?: string;
  businessSize?: string;
  goals?: string[];
  challenges?: string[];
  integrations?: string[];
  preferences?: Record<string, any>;
  lastUpdated: string;
}

export interface MissingContextFields {
  critical: string[];
  important: string[];
  optional: string[];
}

export class ProfileContextService {
  
  /**
   * Get user RAG context for AI personalization
   */
  async getUserRAGContext(userId: string): Promise<RAGProfileContext | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.id,
        businessName: undefined, // Not available in user_profiles
        industry: undefined, // Not available in user_profiles
        department: data.department || undefined,
        role: data.role || undefined,
        businessSize: undefined, // Not available in user_profiles
        goals: [], // Not available in user_profiles
        challenges: [], // Not available in user_profiles
        integrations: [], // Not available in user_profiles
        preferences: data.preferences as Record<string, any> || {},
        lastUpdated: data.updated_at || new Date().toISOString()
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching user RAG context: ', error);
      return null;
    }
  }

  /**
   * Get missing context fields for user
   */
  async getMissingContextFields(userId: string): Promise<MissingContextFields> {
    const context = await this.getUserRAGContext(userId);
    
    const critical = [];
    const important = [];
    const optional = [];

    if (!context?.businessName) critical.push('business_name');
    if (!context?.industry) important.push('industry');
    if (!context?.department) important.push('department');
    if (!context?.role) important.push('role');
    if (!context?.businessSize) optional.push('business_size');
    if (!context?.goals?.length) important.push('goals');
    if (!context?.challenges?.length) optional.push('challenges');

    return { critical, important, optional };
  }

  /**
   * Update user profile context
   */
  async updateUserContext(userId: string, updates: Partial<RAGProfileContext>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating user context: ', error);
      return false;
    }
  }

  /**
   * Get context completion suggestions
   */
  async getContextSuggestions(userId: string): Promise<string[]> {
    const missing = await this.getMissingContextFields(userId);
    return [...missing.critical, ...missing.important, ...missing.optional];
  }
}

export const profileContextService = new ProfileContextService(); 