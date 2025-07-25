import { supabase } from '@/lib/supabase';

export interface DatabaseProfile {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  work_phone?: string | null;
  personal_email?: string | null;
  role?: string | null;
  department?: string | null;
  job_title?: string | null;
  employee_id?: string | null;
  hire_date?: string | null;
  manager_id?: string | null;
  direct_reports?: string[] | null;
  timezone?: string | null;
  location?: string | null;
  work_location?: string | null;
  address?: Record<string, unknown> | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  skills?: string[] | null;
  certifications?: string[] | null;
  languages?: Record<string, unknown> | null;
  emergency_contact?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  status?: string | null;
  last_login?: string | null;
  onboarding_completed?: boolean | null;
  profile_completion_percentage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DatabaseService {
  async getUserProfile(userId: string): Promise<ServiceResponse<DatabaseProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user profile',
      };
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<DatabaseProfile>): Promise<ServiceResponse<DatabaseProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user profile',
      };
    }
  }

  async createUserProfile(profileData: Partial<DatabaseProfile>): Promise<ServiceResponse<DatabaseProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user profile',
      };
    }
  }

  async deleteUserProfile(userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete user profile',
      };
    }
  }

  async searchProfiles(query: string, companyId?: string): Promise<ServiceResponse<DatabaseProfile[]>> {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,display_name.ilike.%${query}%`);

      if (companyId) {
        queryBuilder = queryBuilder.eq('company_id', companyId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search profiles',
      };
    }
  }
}

export const databaseService = new DatabaseService(); 