import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

export interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  size?: string | null;
}

export interface UserService {
  getUser: (userId: string) => Promise<{ data: UserProfile | null; error: string | null }>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
  getUserBusinessData: (userId: string) => Promise<{ data: any; error: string | null }>;
  getUserCompany: (companyId: string) => Promise<{ data: Company | null; error: string | null }>;
}

export const userService: UserService = {
  getUser: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        logger.error({ userId, error }, 'Failed to get user');
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error({ userId, error }, 'Unexpected error getting user');
      return { data: null, error: 'Failed to get user' };
    }
  },

  updateUser: async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        logger.error({ userId, updates, error }, 'Failed to update user');
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error({ userId, updates, error }, 'Unexpected error updating user');
      return { data: null, error: 'Failed to update user' };
    }
  },

  getUserCompany: async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, industry, size')
        .eq('id', companyId)
        .single();
      
      if (error) {
        logger.error({ companyId, error }, 'Failed to get user company');
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error({ companyId, error }, 'Unexpected error getting user company');
      return { data: null, error: 'Failed to get user company' };
    }
  },

  getUserBusinessData: async (userId: string) => {
    try {
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        logger.error({ userId, error: profileError }, 'Failed to get user profile for business data');
        return { data: null, error: profileError.message };
      }
      
      if (!userProfile?.company_id) {
        return { data: null, error: 'User not associated with a company' };
      }
      
      // Get business profile
      const { data, error } = await supabase
        .from('business_profiles')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            size
          )
        `)
        .eq('org_id', userProfile.company_id)
        .single();
      
      if (error) {
        logger.error({ userId, companyId: userProfile.company_id, error }, 'Failed to get business data');
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error({ userId, error }, 'Unexpected error getting user business data');
      return { data: null, error: 'Failed to get user business data' };
    }
  },
}; 