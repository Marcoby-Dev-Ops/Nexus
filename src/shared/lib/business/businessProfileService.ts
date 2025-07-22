import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface BusinessProfile {
  id?: string;
  org_id: string;
  company_name: string;
  industry: string;
  business_model: string;
  company_size: 'solopreneur' | 'startup' | 'small' | 'medium' | 'enterprise';
  mission_statement: string;
  primary_services: string[];
  unique_value_proposition: string;
  competitive_advantages: string[];
  target_markets: string[];
  ideal_client_profile: string[];
  service_delivery_methods: string[];
  current_clients: string[];
  revenue_model: string;
  pricing_strategy: string;
  financial_goals: string[];
  strategic_objectives: string[];
  created_at?: string;
  updated_at?: string;
}

class BusinessProfileService {
  /**
   * Get business profile for an organization
   */
  async getBusinessProfile(orgId: string): Promise<BusinessProfile | null> {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('org_id', orgId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        logger.error({ orgId, error }, 'Failed to fetch business profile');
        return null;
      }

      return data;
    } catch (error) {
      logger.error({ orgId, error }, 'Failed to get business profile');
      return null;
    }
  }

  /**
   * Save business profile
   */
  async saveBusinessProfile(orgId: string, profile: Partial<BusinessProfile>): Promise<boolean> {
    try {
      const profileData = {
        ...profile,
        org_id: orgId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('business_profiles')
        .upsert(profileData, { onConflict: 'org_id' });

      if (error) {
        logger.error({ orgId, error }, 'Failed to save business profile');
        return false;
      }

      logger.info({ orgId }, 'Successfully saved business profile');
      return true;
    } catch (error) {
      logger.error({ orgId, error }, 'Failed to save business profile');
      return false;
    }
  }

  /**
   * Delete business profile
   */
  async deleteBusinessProfile(orgId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .delete()
        .eq('org_id', orgId);

      if (error) {
        logger.error({ orgId, error }, 'Failed to delete business profile');
        return false;
      }

      logger.info({ orgId }, 'Successfully deleted business profile');
      return true;
    } catch (error) {
      logger.error({ orgId, error }, 'Failed to delete business profile');
      return false;
    }
  }

  /**
   * Get business profile template
   */
  getProfileTemplate(): Partial<BusinessProfile> {
    return {
      company_name: '',
      industry: '',
      business_model: '',
      company_size: 'startup',
      mission_statement: '',
      primary_services: [],
      unique_value_proposition: '',
      competitive_advantages: [],
      target_markets: [],
      ideal_client_profile: [],
      service_delivery_methods: [],
      current_clients: [],
      revenue_model: '',
      pricing_strategy: '',
      financial_goals: [],
      strategic_objectives: []
    };
  }
}

export const businessProfileService = new BusinessProfileService(); 