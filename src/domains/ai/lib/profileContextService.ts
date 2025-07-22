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
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        businessName: data.business_name,
        industry: data.industry,
        department: data.department,
        role: data.role,
        businessSize: data.business_size,
        goals: data.goals || [],
        challenges: data.challenges || [],
        integrations: data.integrations || [],
        preferences: data.preferences || {},
        lastUpdated: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching user RAG context:', error);
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
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error updating user context:', error);
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