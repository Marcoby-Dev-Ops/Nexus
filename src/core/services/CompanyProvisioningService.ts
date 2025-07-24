/**
 * Company Provisioning Service
 * 
 * Handles company creation and association for users who don't have a company.
 * Provides graceful fallbacks instead of throwing errors.
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface CompanyProvisioningOptions {
  createDefaultCompany?: boolean;
  redirectToOnboarding?: boolean;
  silentMode?: boolean;
}

export interface ProvisioningResult {
  success: boolean;
  companyId?: string;
  action: 'created' | 'found' | 'redirected' | 'failed';
  message: string;
  error?: string;
}

export class CompanyProvisioningService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Ensure user has a company association
   */
  async ensureCompanyAssociation(
    userId: string, 
    options: CompanyProvisioningOptions = {}
  ): Promise<ProvisioningResult> {
    try {
      // Check if user already has a company
      const { data: profile, error: profileError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_profiles')
          .select('company_id, role, first_name, last_name, email')
          .eq('id', userId)
          .single(),
        userId,
        'check-company-association'
      );

      if (profileError) {
        logger.error('Error checking user profile:', profileError);
        return {
          success: false,
          action: 'failed',
          message: 'Failed to check user profile',
          error: profileError.message
        };
      }

      // If user already has a company, return success
      if (profile?.company_id) {
        return {
          success: true,
          companyId: profile.company_id,
          action: 'found',
          message: 'User already associated with company'
        };
      }

      // User doesn't have a company - handle based on options
      if (options.createDefaultCompany) {
        return await this.createDefaultCompany(userId, profile);
      }

      if (options.redirectToOnboarding) {
        return {
          success: false,
          action: 'redirected',
          message: 'User needs to complete company setup'
        };
      }

      // Default: create a personal company
      return await this.createPersonalCompany(userId, profile);

    } catch (error) {
      logger.error('Error in ensureCompanyAssociation:', error);
      return {
        success: false,
        action: 'failed',
        message: 'Failed to ensure company association',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a default company for the user
   */
  private async createDefaultCompany(userId: string, profile: any): Promise<ProvisioningResult> {
    try {
      const companyName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}'s Company`
        : profile?.email
        ? `${profile.email.split('@')[0]}'s Company`
        : 'My Company';

      const { data: company, error: companyError } = await this.queryWrapper.query(
        async () => supabase
          .from('companies')
          .insert({
            name: companyName,
            industry: 'Technology',
            size: '1-10',
            description: 'Personal company created automatically',
            owner_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        { context: 'create-default-company' }
      );

      if (companyError) {
        logger.error('Error creating default company:', companyError);
        return {
          success: false,
          action: 'failed',
          message: 'Failed to create default company',
          error: companyError.message
        };
      }

      // Update user profile with company association
      const { error: profileError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_profiles')
          .update({ 
            company_id: company.id,
            role: 'owner',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId),
        userId,
        'update-profile-with-company'
      );

      if (profileError) {
        logger.error('Error updating user profile with company:', profileError);
        return {
          success: false,
          action: 'failed',
          message: 'Company created but failed to associate with user',
          error: profileError.message
        };
      }

      logger.info(`Created default company "${companyName}" for user ${userId}`);
      return {
        success: true,
        companyId: company.id,
        action: 'created',
        message: `Created default company "${companyName}"`
      };

    } catch (error) {
      logger.error('Error creating default company:', error);
      return {
        success: false,
        action: 'failed',
        message: 'Failed to create default company',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a personal company (minimal setup)
   */
  private async createPersonalCompany(userId: string, profile: any): Promise<ProvisioningResult> {
    try {
      const companyName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}'s Workspace`
        : profile?.email
        ? `${profile.email.split('@')[0]}'s Workspace`
        : 'Personal Workspace';

      const { data: company, error: companyError } = await this.queryWrapper.query(
        async () => supabase
          .from('companies')
          .insert({
            name: companyName,
            industry: 'Personal',
            size: '1',
            description: 'Personal workspace',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        { context: 'create-personal-company' }
      );

      if (companyError) {
        logger.error('Error creating personal company:', companyError);
        return {
          success: false,
          action: 'failed',
          message: 'Failed to create personal workspace',
          error: companyError.message
        };
      }

      // Update user profile
      const { error: profileError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_profiles')
          .update({ 
            company_id: company.id,
            role: 'owner',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId),
        userId,
        'update-profile-with-personal-company'
      );

      if (profileError) {
        logger.error('Error updating user profile with personal company:', profileError);
        return {
          success: false,
          action: 'failed',
          message: 'Personal workspace created but failed to associate with user',
          error: profileError.message
        };
      }

      logger.info(`Created personal workspace "${companyName}" for user ${userId}`);
      return {
        success: true,
        companyId: company.id,
        action: 'created',
        message: `Created personal workspace "${companyName}"`
      };

    } catch (error) {
      logger.error('Error creating personal company:', error);
      return {
        success: false,
        action: 'failed',
        message: 'Failed to create personal workspace',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get or create company for user (graceful fallback)
   */
  async getOrCreateCompany(userId: string): Promise<{ companyId: string | null; error: string | null }> {
    const result = await this.ensureCompanyAssociation(userId, { createDefaultCompany: true });
    
    if (result.success && result.companyId) {
      return { companyId: result.companyId, error: null };
    }
    
    return { companyId: null, error: result.error || 'Failed to get or create company' };
  }
}

export const companyProvisioningService = new CompanyProvisioningService(); 