/**
 * Profile Context Service
 * Manages user profile context for RAG and AI interactions
 */

import { supabase } from '@/core/supabase';

export interface RAGProfileContext {
  userId: string;
  companyId?: string;
  role: string;
  department: string;
  expertise: string[];
  preferences: {
    communicationStyle: 'direct' | 'detailed' | 'visual';
    technicalLevel: 'beginner' | 'intermediate' | 'advanced';
    responseLength: 'brief' | 'standard' | 'comprehensive';
  };
  businessContext: {
    industry: string;
    companySize: string;
    teamSize: number;
    responsibilities: string[];
  };
  lastUpdated: Date;
}

export interface ProfileContextUpdate {
  userId: string;
  updates: Partial<RAGProfileContext>;
}

class ProfileContextService {
  /**
   * Get user's RAG profile context
   */
  async getUserRAGContext(userId: string): Promise<RAGProfileContext | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, department, company_id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.id,
        companyId: data.company_id || undefined,
        role: data.role || 'Team Member',
        department: data.department || 'General',
        expertise: [],
        preferences: {
          communicationStyle: 'detailed',
          technicalLevel: 'intermediate',
          responseLength: 'standard'
        },
        businessContext: {
          industry: 'Technology',
          companySize: 'Small',
          teamSize: 10,
          responsibilities: []
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get user RAG context:', error);
      return null;
    }
  }

  /**
   * Get missing context fields for a user
   */
  async getMissingContextFields(userId: string): Promise<string[]> {
    try {
      const context = await this.getUserRAGContext(userId);
      if (!context) {
        return ['profile', 'role', 'department', 'preferences', 'business_context'];
      }

      const missing: string[] = [];
      
      if (!context.role || context.role === 'Team Member') {
        missing.push('role');
      }
      
      if (!context.department || context.department === 'General') {
        missing.push('department');
      }
      
      if (!context.expertise || context.expertise.length === 0) {
        missing.push('expertise');
      }
      
      if (!context.businessContext.industry || context.businessContext.industry === 'Technology') {
        missing.push('industry');
      }
      
      if (!context.businessContext.responsibilities || context.businessContext.responsibilities.length === 0) {
        missing.push('responsibilities');
      }

      return missing;
    } catch (error) {
      console.error('Failed to get missing context fields:', error);
      return ['profile'];
    }
  }

  /**
   * Update user's RAG context
   */
  async updateRAGContext(userId: string, updates: Partial<RAGProfileContext>): Promise<void> {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.role) updateData.role = updates.role;
      if (updates.department) updateData.department = updates.department;
      if (updates.expertise) updateData.preferences = { ...updateData.preferences, expertise: updates.expertise };
      if (updates.preferences) updateData.preferences = { ...updateData.preferences, ...updates.preferences };
      if (updates.businessContext) updateData.business_context = { ...updateData.business_context, ...updates.businessContext };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update RAG context: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to update RAG context:', error);
      throw error;
    }
  }
}

export const profileContextService = new ProfileContextService(); 