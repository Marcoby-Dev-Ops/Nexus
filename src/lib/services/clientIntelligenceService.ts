/**
 * Client Intelligence Service
 * Connects UI to the n8n client intelligence workflows and provides data operations
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/core/supabase';
import { logger } from '@/lib/security/logger';
import { n8nWorkflowService } from './n8nWorkflowService';

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
}

export const clientIntelligenceService = new ClientIntelligenceService(); 