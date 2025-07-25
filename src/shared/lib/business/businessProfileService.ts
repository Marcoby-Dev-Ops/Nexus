import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

export interface BusinessProfile {
  id?: string;
  org_id: string;
  company_name: string;
  industry: string | null;
  business_model: string | null;
  company_size: string | null;
  mission_statement: string | null;
  primary_services: string[] | null;
  unique_value_proposition: string | null;
  competitive_advantages: string[] | null;
  target_markets: string[] | null;
  ideal_client_profile: string[] | null;
  service_delivery_methods: string[] | null;
  current_clients: string[] | null;
  revenue_model: string | null;
  pricing_strategy: string | null;
  financial_goals: string[] | null;
  strategic_objectives: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
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
        company_name: profile.company_name || 'My Business',
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