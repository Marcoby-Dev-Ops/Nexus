import { supabase } from '@/core/supabase';
import { logger } from '@/shared/utils/logger';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { companyProvisioningService } from '@/core/services/CompanyProvisioningService';

export class DataAccessLayer {
  private queryWrapper = DatabaseQueryWrapper.getInstance();

  async getUserProfile(userId: string): Promise<{ data: any; error: string | null }> {
    logger.debug('DataAccessLayer.getUserProfile called for user:', userId);
    
    try {
      const result = await this.queryWrapper.userQuery(
        async () => {
          logger.debug('Executing user profile query for user:', userId);
          const { data, error } = await supabase
            .from('user_profiles')
            .select(`
              *,
              companies (
                id,
                name,
                industry,
                size
              )
            `)
            .eq('id', userId)
            .single();
          return { data, error };
        },
        userId,
        'get-user-profile-with-companies'
      );
      
      if (result.error) {
        logger.error('User profile query failed:', result.error);
        return { data: null, error: result.error.message || 'Failed to fetch user profile' };
      }
      
      logger.debug('User profile query successful for user:', userId);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Error in getUserProfile:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserBusinessData(userId: string): Promise<{ data: any; error: string | null }> {
    logger.debug('DataAccessLayer.getUserBusinessData called for user:', userId);
    
    try {
      // First get the user's company_id using DatabaseQueryWrapper directly
      const { data: userProfile, error: profileError } = await this.queryWrapper.userQuery(
        async () => {
          const result = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', userId)
            .single();
          return result;
        },
        userId,
        'get-user-company-id'
      );

      if (profileError) {
        logger.error('Error fetching user profile:', profileError);
        return { data: null, error: 'Failed to fetch user profile' };
      }

      if (!userProfile) {
        logger.error('User profile not found for user:', userId);
        return { data: null, error: 'User profile not found' };
      }

      // If user doesn't have a company, try to provision one
      if (!userProfile.company_id) {
        logger.info('User not associated with company, attempting to provision one');
        const { companyId, error: provisioningError } = await companyProvisioningService.getOrCreateCompany(userId);

        if (provisioningError || !companyId) {
          logger.warn('Failed to provision company for user:', provisioningError);
          return { data: null, error: 'Unable to access business data - company setup required' };
        }

        // Update the userProfile with the new company_id
        userProfile.company_id = companyId;
      }

      const companyId = userProfile.company_id as string;

      // Get business profile for the company using DatabaseQueryWrapper directly
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => {
          const result = await supabase
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
            .eq('org_id', companyId)
            .single();
          return result;
        },
        companyId,
        'get-business-profile'
      );

      // If no business profile exists, create a basic one
      if (error && error.code === 'PGRST116') {
        logger.info('No business profile found, creating basic one');
        const { data: newBusinessProfile, error: createError } = await this.queryWrapper.companyQuery(
          async () => {
            const result = await supabase
              .from('business_profiles')
              .insert({
                org_id: companyId,
                company_name: 'My Business',
                industry: 'Technology',
                business_model: 'B2B SaaS',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              .select()
              .single();
            return result;
          },
          companyId,
          'create-business-profile'
        );

        if (createError) {
          logger.error('Error creating business profile:', createError);
          return { data: null, error: 'Failed to create business profile' };
        }

        return { data: newBusinessProfile, error: null };
      }

      return { data, error };
    } catch (error) {
      logger.error('Error in getUserBusinessData:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
} 