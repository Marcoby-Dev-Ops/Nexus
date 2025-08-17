/**
 * Company Provisioning Service
 * 
 * Handles company creation and association for users who don't have a company.
 * Provides graceful fallbacks instead of throwing errors.
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';
import type { Database } from '@/core/types/supabase';

// Company Provisioning Schema
export const CompanyProvisioningOptionsSchema = z.object({
  createDefaultCompany: z.boolean().optional(),
  redirectToOnboarding: z.boolean().optional(),
  silentMode: z.boolean().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

export const ProvisioningResultSchema = z.object({
  success: z.boolean(),
  companyId: z.string().optional(),
  action: z.enum(['created', 'found', 'redirected', 'failed']),
  message: z.string(),
  error: z.string().optional(),
});

export type CompanyProvisioningOptions = z.infer<typeof CompanyProvisioningOptionsSchema>;
export type ProvisioningResult = z.infer<typeof ProvisioningResultSchema>;

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Company Provisioning Service
 * Handles company creation and association for users who don't have a company.
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class CompanyProvisioningService extends BaseService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Ensure user has a company association
   */
  async ensureCompanyAssociation(
    userId: string, 
    options: CompanyProvisioningOptions = {}
  ): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
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
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to check user profile',
          error: profileError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // If user already has a company, return success
      if (profile?.company_id) {
        const result: ProvisioningResult = {
          success: true,
          companyId: profile.company_id,
          action: 'found',
          message: 'User already associated with company'
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // User doesn't have a company - handle based on options
      if (options.createDefaultCompany) {
        return await this.createDefaultCompany(userId, profile, options);
      }

      if (options.redirectToOnboarding) {
        const result: ProvisioningResult = {
          success: false,
          action: 'redirected',
          message: 'User needs to complete company setup'
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Default: create a personal company
      return await this.createPersonalCompany(userId, profile);
    }, `ensure company association for user ${userId}`);
  }

  /**
   * Create a default company for the user
   */
  private async createDefaultCompany(userId: string, profile: UserProfile, options: CompanyProvisioningOptions): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      const companyName = options.companyName || (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}'s Company`
        : profile?.email
        ? `${profile.email.split('@')[0]}'s Company`
        : 'My Company');

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          industry: options.industry || 'Technology',
          size: options.size || '1-10',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        logger.error('Error creating default company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create default company',
          error: companyError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Update user profile with company association
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString(),
          ...(options.jobTitle && { job_title: options.jobTitle })
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile with company:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to associate user with company',
          error: updateError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: company.id,
        action: 'created',
        message: 'Default company created and associated with user'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null };
    }, `create default company for user ${userId}`);
  }

  /**
   * Create a personal company for the user
   */
  private async createPersonalCompany(userId: string, profile: UserProfile): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      const companyName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}'s Personal Business`
        : profile?.email
        ? `${profile.email.split('@')[0]}'s Business`
        : 'My Business';

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          industry: 'Personal',
          size: '1',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        logger.error('Error creating personal company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create personal company',
          error: companyError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Update user profile with company association
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile with company:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to associate user with company',
          error: updateError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: company.id,
        action: 'created',
        message: 'Personal company created and associated with user'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null };
    }, `create personal company for user ${userId}`);
  }

  /**
   * Get or create company for user
   */
  async getOrCreateCompany(userId: string): Promise<ServiceResponse<{ companyId: string | null; error: string | null }>> {
    return this.executeDbOperation(async () => {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { data: { companyId: null, error: profileError.message }, error: null };
      }

      if (profile?.company_id) {
        return { data: { companyId: profile.company_id, error: null }, error: null };
      }

      // Create a personal company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'My Business',
          industry: 'Personal',
          size: '1',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        return { data: { companyId: null, error: companyError.message }, error: null };
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return { data: { companyId: null, error: updateError.message }, error: null };
      }

      return { data: { companyId: company.id, error: null }, error: null };
    }, `get or create company for user ${userId}`);
  }
}

// Create and export service instance
export const companyProvisioningService = new CompanyProvisioningService();
