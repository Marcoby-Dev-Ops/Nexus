/**
 * Quota Service
 * Handles user quota management and limits
 */

import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface QuotaLimit {
  id: string;
  user_id: string;
  quota_type: string;
  current_usage: number;
  max_limit: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface QuotaUsage {
  quota_type: string;
  current_usage: number;
  max_limit: number;
  percentage_used: number;
  reset_date: string;
  is_exceeded: boolean;
}

export interface QuotaConfig {
  quota_type: string;
  default_limit: number;
  description: string;
  reset_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_enabled: boolean;
}

// ============================================================================
// QUOTA SERVICE CLASS
// ============================================================================

export class QuotaService extends BaseService {
  constructor() {
    super('QuotaService');
  }

  /**
   * Get user quota usage
   */
  async getUserQuotaUsage(userId: string): Promise<ServiceResponse<QuotaUsage[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserQuotaUsage', { userId });

      try {
        const { data, error } = await selectData('user_quotas', '*', { user_id: userId });

        if (error) {
          this.logFailure('getUserQuotaUsage', error.message);
          return { data: null, error };
        }

        const quotaUsage: QuotaUsage[] = (data || []).map(quota => ({
          quota_type: quota.quota_type,
          current_usage: quota.current_usage || 0,
          max_limit: quota.max_limit || 0,
          percentage_used: quota.max_limit > 0 ? (quota.current_usage / quota.max_limit) * 100 : 0,
          reset_date: quota.reset_date,
          is_exceeded: (quota.current_usage || 0) > (quota.max_limit || 0)
        }));

        this.logSuccess('getUserQuotaUsage', `Retrieved ${quotaUsage.length} quota types for user ${userId}`);
        return { data: quotaUsage, error: null };
      } catch (error) {
        this.logFailure('getUserQuotaUsage', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get specific quota usage
   */
  async getQuotaUsage(userId: string, quotaType: string): Promise<ServiceResponse<QuotaUsage | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getQuotaUsage', { userId, quotaType });

      try {
        const { data, error } = await selectOne('user_quotas', undefined, {
          filters: { user_id: userId, quota_type: quotaType }
        });

        if (error) {
          this.logFailure('getQuotaUsage', error.message);
          return { data: null, error };
        }

        if (!data) {
          this.logSuccess('getQuotaUsage', `No quota found for type ${quotaType}`);
          return { data: null, error: null };
        }

        const quotaUsage: QuotaUsage = {
          quota_type: data.quota_type,
          current_usage: data.current_usage || 0,
          max_limit: data.max_limit || 0,
          percentage_used: data.max_limit > 0 ? (data.current_usage / data.max_limit) * 100 : 0,
          reset_date: data.reset_date,
          is_exceeded: (data.current_usage || 0) > (data.max_limit || 0)
        };

        this.logSuccess('getQuotaUsage', `Retrieved quota ${quotaType} for user ${userId}`);
        return { data: quotaUsage, error: null };
      } catch (error) {
        this.logFailure('getQuotaUsage', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Check if user has exceeded quota
   */
  async isQuotaExceeded(userId: string, quotaType: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('isQuotaExceeded', { userId, quotaType });

      try {
        const quotaResult = await this.getQuotaUsage(userId, quotaType);
        
        if (!quotaResult.success) {
          return { data: null, error: quotaResult.error };
        }

        const isExceeded = quotaResult.data?.is_exceeded || false;
        this.logSuccess('isQuotaExceeded', `Quota ${quotaType} exceeded: ${isExceeded}`);
        return { data: isExceeded, error: null };
      } catch (error) {
        this.logFailure('isQuotaExceeded', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Increment quota usage
   */
  async incrementQuotaUsage(
    userId: string, 
    quotaType: string, 
    amount: number = 1
  ): Promise<ServiceResponse<{ success: boolean; newUsage: number; isExceeded: boolean }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('incrementQuotaUsage', { userId, quotaType, amount });

      try {
        // Get current quota
        const { data: currentQuota, error: fetchError } = await selectOne('user_quotas', undefined, {
          filters: { user_id: userId, quota_type: quotaType }
        });

        if (fetchError && fetchError.code !== 'PGRST116') {
          this.logFailure('incrementQuotaUsage', fetchError.message);
          return { data: null, error: fetchError };
        }

        let newUsage: number;
        let isExceeded: boolean;

        if (currentQuota) {
          // Update existing quota
          newUsage = (currentQuota.current_usage || 0) + amount;
          isExceeded = newUsage > (currentQuota.max_limit || 0);

          const { error: updateError } = await updateOne('user_quotas', currentQuota.id, { 
            current_usage: newUsage,
            updated_at: new Date().toISOString()
          });

          if (updateError) {
            this.logFailure('incrementQuotaUsage', updateError.message);
            return { data: null, error: updateError };
          }
        } else {
          // Create new quota entry
          const defaultLimit = await this.getDefaultQuotaLimit(quotaType);
          newUsage = amount;
          isExceeded = newUsage > defaultLimit;

          const { error: insertError } = await this.supabase
            .from('user_quotas')
            .insert({
              user_id: userId,
              quota_type: quotaType,
              current_usage: newUsage,
              max_limit: defaultLimit,
              reset_date: this.calculateNextResetDate(quotaType),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            this.logFailure('incrementQuotaUsage', insertError.message);
            return { data: null, error: insertError };
          }
        }

        this.logSuccess('incrementQuotaUsage', `Incremented quota ${quotaType} by ${amount} for user ${userId}`);
        return { 
          data: { 
            success: true, 
            newUsage, 
            isExceeded 
          }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('incrementQuotaUsage', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Reset quota usage
   */
  async resetQuotaUsage(userId: string, quotaType: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('resetQuotaUsage', { userId, quotaType });

      try {
        const { error } = await this.supabase
          .from('user_quotas')
          .update({ 
            current_usage: 0,
            reset_date: this.calculateNextResetDate(quotaType),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('quota_type', quotaType);

        if (error) {
          this.logFailure('resetQuotaUsage', error.message);
          return { data: null, error };
        }

        this.logSuccess('resetQuotaUsage', `Reset quota ${quotaType} for user ${userId}`);
        return { data: true, error: null };
      } catch (error) {
        this.logFailure('resetQuotaUsage', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Set quota limit
   */
  async setQuotaLimit(
    userId: string, 
    quotaType: string, 
    maxLimit: number
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('setQuotaLimit', { userId, quotaType, maxLimit });

      try {
        const { data: existingQuota, error: fetchError } = await this.supabase
          .from('user_quotas')
          .select('*')
          .eq('user_id', userId)
          .eq('quota_type', quotaType)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          this.logFailure('setQuotaLimit', fetchError.message);
          return { data: null, error: fetchError };
        }

        if (existingQuota) {
          // Update existing quota
          const { error: updateError } = await this.supabase
            .from('user_quotas')
            .update({ 
              max_limit: maxLimit,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('quota_type', quotaType);

          if (updateError) {
            this.logFailure('setQuotaLimit', updateError.message);
            return { data: null, error: updateError };
          }
        } else {
          // Create new quota entry
          const { error: insertError } = await this.supabase
            .from('user_quotas')
            .insert({
              user_id: userId,
              quota_type: quotaType,
              current_usage: 0,
              max_limit: maxLimit,
              reset_date: this.calculateNextResetDate(quotaType),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            this.logFailure('setQuotaLimit', insertError.message);
            return { data: null, error: insertError };
          }
        }

        this.logSuccess('setQuotaLimit', `Set quota ${quotaType} limit to ${maxLimit} for user ${userId}`);
        return { data: true, error: null };
      } catch (error) {
        this.logFailure('setQuotaLimit', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get quota statistics
   */
  async getQuotaStats(): Promise<ServiceResponse<{
    totalUsers: number;
    totalQuotas: number;
    exceededQuotas: number;
    byType: Record<string, { total: number; exceeded: number }>;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getQuotaStats', {});

      try {
        const { data: quotas, error } = await this.supabase
          .from('user_quotas')
          .select('*');

        if (error) {
          this.logFailure('getQuotaStats', error.message);
          return { data: null, error };
        }

        const stats = {
          totalUsers: new Set(quotas?.map(q => q.user_id) || []).size,
          totalQuotas: quotas?.length || 0,
          exceededQuotas: quotas?.filter(q => (q.current_usage || 0) > (q.max_limit || 0)).length || 0,
          byType: {} as Record<string, { total: number; exceeded: number }>
        };

        // Group by quota type
        quotas?.forEach(quota => {
          const type = quota.quota_type;
          if (!stats.byType[type]) {
            stats.byType[type] = { total: 0, exceeded: 0 };
          }
          stats.byType[type].total++;
          if ((quota.current_usage || 0) > (quota.max_limit || 0)) {
            stats.byType[type].exceeded++;
          }
        });

        this.logSuccess('getQuotaStats', `Retrieved stats: ${stats.totalQuotas} total quotas, ${stats.exceededQuotas} exceeded`);
        return { data: stats, error: null };
      } catch (error) {
        this.logFailure('getQuotaStats', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get default quota limit for a type
   */
  private async getDefaultQuotaLimit(quotaType: string): Promise<number> {
    const defaultLimits: Record<string, number> = {
      'api_calls': 1000,
      'storage_mb': 100,
      'messages_per_day': 100,
      'integrations': 5,
      'ai_requests': 50,
      'export_requests': 10
    };

    return defaultLimits[quotaType] || 100;
  }

  /**
   * Calculate next reset date based on quota type
   */
  private calculateNextResetDate(quotaType: string): string {
    const now = new Date();
    const resetFrequencies: Record<string, 'daily' | 'weekly' | 'monthly'> = {
      'api_calls': 'daily',
      'storage_mb': 'monthly',
      'messages_per_day': 'daily',
      'integrations': 'monthly',
      'ai_requests': 'daily',
      'export_requests': 'monthly'
    };

    const frequency = resetFrequencies[quotaType] || 'monthly';
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Check if quota reset is needed
   */
  async checkQuotaReset(userId: string, quotaType: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('checkQuotaReset', { userId, quotaType });

      try {
        const { data: quota, error } = await this.supabase
          .from('user_quotas')
          .select('reset_date')
          .eq('user_id', userId)
          .eq('quota_type', quotaType)
          .single();

        if (error) {
          this.logFailure('checkQuotaReset', error.message);
          return { data: null, error };
        }

        if (!quota) {
          this.logSuccess('checkQuotaReset', `No quota found for type ${quotaType}`);
          return { data: false, error: null };
        }

        const resetDate = new Date(quota.reset_date);
        const now = new Date();
        const needsReset = now > resetDate;

        this.logSuccess('checkQuotaReset', `Quota ${quotaType} reset needed: ${needsReset}`);
        return { data: needsReset, error: null };
      } catch (error) {
        this.logFailure('checkQuotaReset', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Auto-reset expired quotas
   */
  async autoResetExpiredQuotas(): Promise<ServiceResponse<{ resetCount: number; errors: string[] }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('autoResetExpiredQuotas', {});

      try {
        const now = new Date().toISOString();
        
        const { data: expiredQuotas, error } = await this.supabase
          .from('user_quotas')
          .select('*')
          .lt('reset_date', now);

        if (error) {
          this.logFailure('autoResetExpiredQuotas', error.message);
          return { data: null, error };
        }

        let resetCount = 0;
        const errors: string[] = [];

        for (const quota of expiredQuotas || []) {
          try {
            const result = await this.resetQuotaUsage(quota.user_id, quota.quota_type);
            if (result.success) {
              resetCount++;
            } else {
              errors.push(`Failed to reset quota ${quota.quota_type} for user ${quota.user_id}`);
            }
          } catch (error) {
            errors.push(`Error resetting quota ${quota.quota_type} for user ${quota.user_id}: ${error}`);
          }
        }

        this.logSuccess('autoResetExpiredQuotas', `Reset ${resetCount} expired quotas, ${errors.length} errors`);
        return { 
          data: { 
            resetCount, 
            errors 
          }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('autoResetExpiredQuotas', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }
}

// Export singleton instance
export const quotaService = new QuotaService(); 
