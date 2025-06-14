/**
 * Production quota and rate limiting service
 */

import { supabase } from '../supabase';
import { LICENSE_TIERS, RATE_LIMITS, type ChatQuotas, type UsageTracking, type RateLimitConfig } from '../types/licensing';

export class QuotaService {
  private static instance: QuotaService;
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  static getInstance(): QuotaService {
    if (!QuotaService.instance) {
      QuotaService.instance = new QuotaService();
    }
    return QuotaService.instance;
  }

  /**
   * Check if user can send a message based on their quotas
   */
  async canSendMessage(userId: string, orgId?: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    quotas?: ChatQuotas;
  }> {
    try {
      // Get user's license and quotas
      const quotas = await this.getUserQuotas(userId, orgId);
      
      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(userId, 'messages', RATE_LIMITS.messages);
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          reason: rateLimitCheck.message,
          retryAfter: rateLimitCheck.retryAfter,
          quotas,
        };
      }

      // Check daily message quota
      const today = new Date().toISOString().split('T')[0];
      const usage = await this.getUsageForDate(userId, today, orgId);
      
      if ((usage.message_count || 0) >= quotas.max_messages_per_day) {
        return {
          allowed: false,
          reason: `Daily message limit of ${quotas.max_messages_per_day} reached. Upgrade your plan for more messages.`,
          quotas,
        };
      }

      // Check hourly message quota
      const hourlyUsage = await this.getHourlyUsage(userId, 'messages');
      if (hourlyUsage >= quotas.max_messages_per_hour) {
        return {
          allowed: false,
          reason: `Hourly message limit of ${quotas.max_messages_per_hour} reached. Please wait and try again.`,
          retryAfter: 60 * 60 * 1000, // 1 hour
          quotas,
        };
      }

      return { allowed: true, quotas };
    } catch (error) {
      console.error('Quota check error:', error);
      // Fail open for now, but log the error
      return { allowed: true };
    }
  }

  /**
   * Check if user can make AI request
   */
  async canMakeAIRequest(userId: string, tokensNeeded: number = 1000, orgId?: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    quotas?: ChatQuotas;
  }> {
    try {
      const quotas = await this.getUserQuotas(userId, orgId);
      
      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(userId, 'ai_requests', RATE_LIMITS.ai_requests);
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          reason: rateLimitCheck.message,
          retryAfter: rateLimitCheck.retryAfter,
          quotas,
        };
      }

      // Check hourly AI request quota
      const hourlyUsage = await this.getHourlyUsage(userId, 'ai_requests');
      if (hourlyUsage >= quotas.max_ai_requests_per_hour) {
        return {
          allowed: false,
          reason: `AI request limit of ${quotas.max_ai_requests_per_hour} per hour reached.`,
          retryAfter: 60 * 60 * 1000,
          quotas,
        };
      }

      // Check token quota
      if (tokensNeeded > quotas.max_context_tokens) {
        return {
          allowed: false,
          reason: `Request too large. Maximum ${quotas.max_context_tokens} tokens allowed.`,
          quotas,
        };
      }

      return { allowed: true, quotas };
    } catch (error) {
      console.error('AI request quota check error:', error);
      return { allowed: true };
    }
  }

  /**
   * Record usage for billing and analytics
   */
  async recordUsage(userId: string, type: 'message' | 'ai_request' | 'file_upload', metadata?: {
    tokens?: number;
    cost?: number;
    orgId?: string;
  }): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const orgId = metadata?.orgId;

      // Update or insert usage record
      const { data: existing } = await supabase
        .from('chat_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('org_id', orgId || '')
        .single();

      const updates: Partial<UsageTracking> = {
        user_id: userId,
        org_id: orgId,
        date: today,
        updated_at: new Date().toISOString(),
      };

      if (type === 'message') {
        updates.message_count = (existing?.message_count || 0) + 1;
      } else if (type === 'ai_request') {
        updates.ai_requests_made = (existing?.ai_requests_made || 0) + 1;
        updates.tokens_used = (existing?.tokens_used || 0) + (metadata?.tokens || 0);
        updates.estimated_cost_usd = (existing?.estimated_cost_usd || 0) + (metadata?.cost || 0);
      } else if (type === 'file_upload') {
        updates.files_uploaded = (existing?.files_uploaded || 0) + 1;
      }

      if (existing) {
        await supabase
          .from('chat_usage_tracking')
          .update(updates)
          .eq('user_id', userId)
          .eq('date', today);
      } else {
        await supabase
          .from('chat_usage_tracking')
          .insert({
            ...updates,
            message_count: type === 'message' ? 1 : 0,
            ai_requests_made: type === 'ai_request' ? 1 : 0,
            files_uploaded: type === 'file_upload' ? 1 : 0,
            tokens_used: metadata?.tokens || 0,
            estimated_cost_usd: metadata?.cost || 0,
            created_at: new Date().toISOString(),
          });
      }

      // Update rate limit cache
      this.updateRateLimitCache(userId, type);
    } catch (error) {
      console.error('Usage recording error:', error);
      // Don't throw - we don't want to block the user experience
    }
  }

  /**
   * Get user's current quotas based on their license
   */
  private async getUserQuotas(userId: string, orgId?: string): Promise<ChatQuotas> {
    try {
      // Try to get user license from database
      const { data: license } = await supabase
        .from('user_licenses')
        .select('tier, status, expires_at')
        .eq('user_id', userId)
        .eq('org_id', orgId || '')
        .single();

      if (!license || license.status !== 'active' || 
          (license.expires_at && new Date(license.expires_at) < new Date())) {
        // Default to free tier
        return LICENSE_TIERS.free.quotas;
      }

      return LICENSE_TIERS[license.tier]?.quotas || LICENSE_TIERS.free.quotas;
    } catch (error) {
      console.error('Error getting user quotas:', error);
      // Default to free tier on error
      return LICENSE_TIERS.free.quotas;
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(userId: string, type: string, config: RateLimitConfig): {
    allowed: boolean;
    message?: string;
    retryAfter?: number;
  } {
    const key = `${userId}:${type}`;
    const now = Date.now();
    const cached = this.rateLimitCache.get(key);

    if (!cached || now > cached.resetTime) {
      // Reset or initialize counter
      this.rateLimitCache.set(key, {
        count: 1,
        resetTime: now + config.window_ms,
      });
      return { allowed: true };
    }

    if (cached.count >= config.max_requests) {
      return {
        allowed: false,
        message: config.message,
        retryAfter: config.retry_after_ms || (cached.resetTime - now),
      };
    }

    // Increment counter
    cached.count++;
    return { allowed: true };
  }

  private updateRateLimitCache(userId: string, type: string): void {
    const key = `${userId}:${type}`;
    const cached = this.rateLimitCache.get(key);
    if (cached) {
      cached.count++;
    }
  }

  private async getUsageForDate(userId: string, date: string, orgId?: string): Promise<UsageTracking> {
    const { data } = await supabase
      .from('chat_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('org_id', orgId || '')
      .single();

    return data || {
      user_id: userId,
      org_id: orgId,
      date,
      messages_sent: 0,
      ai_requests_made: 0,
      files_uploaded: 0,
      tokens_used: 0,
      estimated_cost_usd: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private async getHourlyUsage(userId: string, type: 'messages' | 'ai_requests'): Promise<number> {
    // This would typically query a more granular usage table
    // For now, we'll use the rate limit cache as a simple implementation
    const key = `${userId}:${type}`;
    const cached = this.rateLimitCache.get(key);
    return cached?.count || 0;
  }

  /**
   * Get user's current usage statistics
   */
  async getUserUsageStats(userId: string, days: number = 7, orgId?: string): Promise<{
    currentQuotas: ChatQuotas;
    todayUsage: UsageTracking;
    weeklyUsage: UsageTracking[];
    costProjection: number;
  }> {
    try {
      const quotas = await this.getUserQuotas(userId, orgId);
      const today = new Date().toISOString().split('T')[0];
      const todayUsage = await this.getUsageForDate(userId, today, orgId);

      // Get weekly usage
      const dates = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      const { data: weeklyData } = await supabase
        .from('chat_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId || '')
        .in('date', dates);

      const weeklyUsage = weeklyData || [];
      const totalCost = weeklyUsage.reduce((sum, day) => sum + (day.estimated_cost_usd || 0), 0);
      const costProjection = (totalCost / days) * 30; // Monthly projection

      return {
        currentQuotas: quotas,
        todayUsage,
        weeklyUsage,
        costProjection,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }
}

export const quotaService = QuotaService.getInstance(); 