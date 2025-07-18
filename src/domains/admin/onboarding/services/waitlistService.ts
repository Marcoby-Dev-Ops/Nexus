/**
 * @file waitlistService.ts
 * @description Service for managing waitlist signups and operations
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
// Import HubSpot service for CRM integration
import { hubspotService } from '@/domains/integrations/lib/hubspot/service';

export interface WaitlistMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface WaitlistSignup {
  id?: string;
  email: string;
  first_name: string;
  company_name?: string;
  referral_code?: string;
  referred_by_code?: string;
  position: number;
  tier: 'early-bird' | 'vip' | 'founder';
  referral_count: number;
  metadata?: WaitlistMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface WaitlistStats {
  total_signups: number;
  founder_spots_taken: number;
  vip_spots_taken: number;
  early_bird_signups: number;
  last_signup_at: string | null;
}

export interface SignupResult {
  success: boolean;
  data?: WaitlistSignup;
  error?: string;
}

export interface StatsResult {
  success: boolean;
  data?: WaitlistStats;
  error?: string;
}

class WaitlistService {
  /**
   * Submit a new waitlist signup
   */
  async submitSignup(signupData: {
    email: string;
    firstName: string;
    company?: string;
    referredByCode?: string;
  }): Promise<SignupResult> {
    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .insert([
          {
            email: signupData.email.toLowerCase().trim(),
            first_name: signupData.firstName.trim(),
            company_name: signupData.company?.trim() || null,
            referred_by_code: signupData.referredByCode?.toUpperCase() || null,
          }
        ])
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, 'Waitlist signup error');
        
        // Handle specific error cases
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            error: 'This email is already on the waitlist. Check your inbox for your position!'
          };
        }
        
        return {
          success: false,
          error: 'Failed to join waitlist. Please try again.'
        };
      }

      const waitlistData = {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        company_name: data.company_name,
        referral_code: data.referral_code,
        referred_by_code: data.referred_by_code,
        position: data.position,
        tier: data.tier as 'early-bird' | 'vip' | 'founder',
        referral_count: data.referral_count,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Sync to HubSpot CRM for lead management
      try {
        const hubspotResult = await hubspotService.syncWaitlistSignup({
          email: waitlistData.email,
          firstName: waitlistData.first_name,
          company: waitlistData.company_name,
          tier: waitlistData.tier,
          referralCode: waitlistData.referral_code
        });
        if (!hubspotResult.success) {
          logger.warn({ error: hubspotResult.error }, 'HubSpot sync failed');
          // Don't fail the signup if HubSpot sync fails, just log it
        } else {
          logger.info({ contactId: hubspotResult.contactId }, 'Successfully synced to HubSpot');
        }
      } catch (hubspotError) {
        logger.warn({ err: hubspotError }, 'HubSpot sync error');
        // Continue with successful signup even if HubSpot sync fails
      }

      return {
        success: true,
        data: waitlistData
      };
    } catch (error) {
      logger.error({ err: error }, 'Waitlist service error');
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  /**
   * Get waitlist statistics (total signups, spots taken, etc.)
   */
  async getStats(): Promise<StatsResult> {
    try {
      const { data, error } = await supabase
        .from('waitlist_stats')
        .select('*')
        .single();

      if (error) {
        logger.error({ err: error }, 'Failed to fetch waitlist stats');
        return {
          success: false,
          error: 'Failed to load waitlist statistics'
        };
      }

      return {
        success: true,
        data: {
          total_signups: data.total_signups || 0,
          founder_spots_taken: data.founder_spots_taken || 0,
          vip_spots_taken: data.vip_spots_taken || 0,
          early_bird_signups: data.early_bird_signups || 0,
          last_signup_at: data.last_signup_at
        }
      };
    } catch (error) {
      logger.error({ err: error }, 'Stats service error');
      return {
        success: false,
        error: 'Failed to load statistics'
      };
    }
  }

  /**
   * Get signup by referral code
   */
  async getSignupByReferralCode(referralCode: string): Promise<SignupResult> {
    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .select('*')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Referral code not found'
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          company_name: data.company_name,
          referral_code: data.referral_code,
          referred_by_code: data.referred_by_code,
          position: data.position,
          tier: data.tier as 'early-bird' | 'vip' | 'founder',
          referral_count: data.referral_count,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Get signup by referral code error');
      return {
        success: false,
        error: 'Failed to fetch signup data'
      };
    }
  }

  /**
   * Check if email is already signed up
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; signup?: WaitlistSignup }> {
    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error({ err: error }, 'Check email exists error');
        return { exists: false };
      }

      if (data) {
        return {
          exists: true,
          signup: {
            id: data.id,
            email: data.email,
            first_name: data.first_name,
            company_name: data.company_name,
            referral_code: data.referral_code,
            referred_by_code: data.referred_by_code,
            position: data.position,
            tier: data.tier as 'early-bird' | 'vip' | 'founder',
            referral_count: data.referral_count,
            metadata: data.metadata,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }
        };
      }

      return { exists: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Check email exists service error');
      return { exists: false };
    }
  }

  /**
   * Update signup metadata (for tracking engagement, preferences, etc.)
   */
  async updateSignupMetadata(email: string, metadata: WaitlistMetadata): Promise<SignupResult> {
    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .update({ 
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim())
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, 'Update metadata error');
        return {
          success: false,
          error: 'Failed to update signup data'
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          company_name: data.company_name,
          referral_code: data.referral_code,
          referred_by_code: data.referred_by_code,
          position: data.position,
          tier: data.tier as 'early-bird' | 'vip' | 'founder',
          referral_count: data.referral_count,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Update metadata service error');
      return {
        success: false,
        error: 'Failed to update signup data'
      };
    }
  }

  /**
   * Get tier information based on position
   */
  getTierInfo(position: number) {
    if (position <= 100) {
      return { 
        tier: 'founder' as const, 
        name: 'Founder', 
        color: 'bg-gradient-to-r from-warning to-destructive', 
        perks: [
          '75% lifetime discount', 
          'White-label rights', 
          'Priority support', 
          'Custom onboarding'
        ] 
      };
    }
    if (position <= 500) {
      return { 
        tier: 'vip' as const, 
        name: 'VIP Early Access', 
        color: 'bg-gradient-to-r from-secondary to-accent', 
        perks: [
          '50% first year discount', 
          'Beta access', 
          'Implementation support', 
          'Advanced features'
        ] 
      };
    }
    return { 
      tier: 'early-bird' as const, 
      name: 'Early Bird', 
      color: 'bg-gradient-to-r from-primary to-secondary', 
      perks: [
        '25% first year discount', 
        'Early access', 
        'Priority onboarding', 
        'Community access'
      ] 
    };
  }
}

// Export singleton instance
export const waitlistService = new WaitlistService();
export default waitlistService; 