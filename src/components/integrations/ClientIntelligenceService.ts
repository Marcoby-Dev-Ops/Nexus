/**
 * Client Intelligence Service
 * Connects UI to the n8n client intelligence workflows and provides data operations
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */

import { supabase } from '../../lib/core/supabase';
import { logger } from '@/lib/security/logger';

export interface UnifiedClientProfile {
  id: string;
  client_id: string;
  user_id: string;
  company_id: string;
  profile_data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    location?: string;
    industry?: string;
    website?: string;
    social_profiles?: {
      linkedin?: string;
      twitter?: string;
    };
    demographics?: {
      company_size?: string;
      revenue_range?: string;
      role?: string;
    };
  };
  source_integrations: string[];
  primary_source: string;
  completeness_score: number;
  engagement_score: number;
  estimated_value: number;
  last_interaction: string;
  last_enrichment_at: string;
  insights: any[];
  created_at: string;
  updated_at: string;
}

export interface ClientInteraction {
  id: string;
  client_profile_id: string;
  interaction_type: 'email' | 'call' | 'meeting' | 'transaction' | 'support' | 'website_visit';
  channel: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  value: number;
  metadata: any;
  occurred_at: string;
}

export interface ClientIntelligenceAlert {
  id: string;
  client_profile_id: string;
  alert_type: 'opportunity' | 'risk' | 'milestone' | 'anomaly';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

class ClientIntelligenceService {
  private readonly n8nWebhookBase = 'https://automate.marcoby.net/webhook';

  /**
   * Fetch unified client profiles with filtering and sorting
   */
  async getClientProfiles(
    userId: string,
    options: {
      filter?: 'all' | 'high_value' | 'recent' | 'at_risk';
      sortBy?: 'engagement' | 'value' | 'recent' | 'completeness';
      search?: string;
      limit?: number;
    } = {}
  ): Promise<UnifiedClientProfile[]> {
    try {
      const { filter = 'all', sortBy = 'engagement', search, limit = 50 } = options;

      let query = supabase
        .from('ai_unified_client_profiles')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      switch (filter) {
        case 'high_value':
          query = query.gte('estimated_value', 10000);
          break;
        case 'recent':
          query = query.gte('last_interaction', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          break;
        case 'at_risk':
          query = query.lt('engagement_score', 30);
          break;
      }

      // Apply search
      if (search) {
        query = query.or(`profile_data->>name.ilike.%${search}%,profile_data->>email.ilike.%${search}%,profile_data->>company.ilike.%${search}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'engagement':
          query = query.order('engagement_score', { ascending: false });
          break;
        case 'value':
          query = query.order('estimated_value', { ascending: false });
          break;
        case 'recent':
          query = query.order('last_interaction', { ascending: false });
          break;
        case 'completeness':
          query = query.order('completeness_score', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        logger.error({ error }, 'Error fetching client profiles');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get client profiles');
      throw error;
    }
  }

  /**
   * Get client interactions for a specific profile or all profiles
   */
  async getClientInteractions(
    userId: string,
    clientProfileId?: string,
    limit: number = 100
  ): Promise<ClientInteraction[]> {
    try {
      let query = supabase
        .from('ai_client_interactions')
        .select(`
          *,
          ai_unified_client_profiles!inner(user_id)
        `)
        .eq('ai_unified_client_profiles.user_id', userId)
        .order('occurred_at', { ascending: false });

      if (clientProfileId) {
        query = query.eq('client_profile_id', clientProfileId);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        logger.error({ error }, 'Error fetching client interactions');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get client interactions');
      throw error;
    }
  }

  /**
   * Get active intelligence alerts
   */
  async getIntelligenceAlerts(
    userId: string,
    clientProfileId?: string,
    resolved: boolean = false
  ): Promise<ClientIntelligenceAlert[]> {
    try {
      let query = supabase
        .from('ai_client_intelligence_alerts')
        .select(`
          *,
          ai_unified_client_profiles!inner(user_id)
        `)
        .eq('ai_unified_client_profiles.user_id', userId)
        .eq('is_resolved', resolved)
        .order('created_at', { ascending: false });

      if (clientProfileId) {
        query = query.eq('client_profile_id', clientProfileId);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        logger.error({ error }, 'Error fetching intelligence alerts');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get intelligence alerts');
      throw error;
    }
  }

  /**
   * Trigger client data unification workflow
   */
  async triggerClientUnification(
    clientId: string,
    userId: string,
    companyId: string,
    type: 'full_profile' | 'profile_refresh' | 'interaction_update' = 'profile_refresh'
  ): Promise<{ success: boolean; workflowId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.n8nWebhookBase}/client-data-unification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          user_id: userId,
          company_id: companyId,
          type,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status}`);
      }

      const result = await response.json();
      
      logger.info({ clientId, userId, type }, 'Client unification workflow triggered');
      
      return {
        success: true,
        workflowId: result.workflowId
      };
    } catch (error) {
      logger.error({ error, clientId, userId }, 'Failed to trigger client unification');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Trigger real-time client intelligence monitoring
   */
  async triggerIntelligenceMonitoring(
    userId: string,
    companyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.n8nWebhookBase}/client-intelligence-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          trigger_type: 'manual',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status}`);
      }

      logger.info({ userId }, 'Intelligence monitoring triggered');
      
      return { success: true };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to trigger intelligence monitoring');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create or update a client profile manually
   */
  async upsertClientProfile(
    profile: Partial<UnifiedClientProfile>
  ): Promise<{ success: boolean; data?: UnifiedClientProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ai_unified_client_profiles')
        .upsert(profile, { 
          onConflict: 'client_id,user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        logger.error({ error }, 'Error upserting client profile');
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error }, 'Failed to upsert client profile');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record a client interaction
   */
  async recordInteraction(
    interaction: Omit<ClientInteraction, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: ClientInteraction; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ai_client_interactions')
        .insert(interaction)
        .select()
        .single();

      if (error) {
        logger.error({ error }, 'Error recording client interaction');
        throw error;
      }

      // Trigger intelligence monitoring after new interaction
      if (data) {
        const profile = await supabase
          .from('ai_unified_client_profiles')
          .select('user_id, company_id')
          .eq('id', interaction.client_profile_id)
          .single();

        if (profile.data) {
          await this.triggerIntelligenceMonitoring(
            profile.data.user_id,
            profile.data.company_id
          );
        }
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error }, 'Failed to record interaction');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve an intelligence alert
   */
  async resolveAlert(
    alertId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_client_intelligence_alerts')
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId);

      if (error) {
        logger.error({ error }, 'Error resolving alert');
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error({ error, alertId }, 'Failed to resolve alert');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get client intelligence analytics
   */
  async getAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    totalClients: number;
    totalValue: number;
    averageEngagement: number;
    activeAlerts: number;
    topSources: Array<{ source: string; count: number }>;
    engagementTrend: Array<{ date: string; score: number }>;
    valueTrend: Array<{ date: string; value: number }>;
  }> {
    try {
      const timeframeMap = {
        week: 7,
        month: 30,
        quarter: 90
      };

      const daysBack = timeframeMap[timeframe];
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Get basic stats
      const { data: profiles } = await supabase
        .from('ai_unified_client_profiles')
        .select('*')
        .eq('user_id', userId);

      const { data: alerts } = await supabase
        .from('ai_client_intelligence_alerts')
        .select('id')
        .eq('is_resolved', false);

      const totalClients = profiles?.length || 0;
      const totalValue = profiles?.reduce((sum, p) => sum + (p.estimated_value || 0), 0) || 0;
      const averageEngagement = profiles?.length 
        ? Math.round(profiles.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / profiles.length)
        : 0;

      // Get source distribution
      const sourceCount: Record<string, number> = {};
      profiles?.forEach(p => {
        p.source_integrations?.forEach((source: string) => {
          sourceCount[source] = (sourceCount[source] || 0) + 1;
        });
      });

      const topSources = Object.entries(sourceCount)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Mock trend data (in real implementation, this would come from time-series data)
      const engagementTrend = Array.from({ length: daysBack }, (_, i) => ({
        date: new Date(Date.now() - (daysBack - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: Math.round(averageEngagement + Math.random() * 20 - 10)
      }));

      const valueTrend = Array.from({ length: daysBack }, (_, i) => ({
        date: new Date(Date.now() - (daysBack - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.round(totalValue * (0.8 + Math.random() * 0.4))
      }));

      return {
        totalClients,
        totalValue,
        averageEngagement,
        activeAlerts: alerts?.length || 0,
        topSources,
        engagementTrend,
        valueTrend
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get client intelligence analytics');
      throw error;
    }
  }
}

export const clientIntelligenceService = new ClientIntelligenceService(); 