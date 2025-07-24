/**
 * contextualRAG.ts
 * 
 * Enhanced Retrieval Augmented Generation system for Nexus AI assistants.
 * Provides deeply contextual business data and user intelligence to create
 * the "Nexus gets me" experience across all AI interactions.
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface EnhancedUserContext {
  profile: any;
  activity: any[];
  company: any;
  preferences: any;
  integrations: any[];
  recentConversations: any[];
  businessMetrics: any;
}

export interface RAGContext {
  userContext: EnhancedUserContext;
  businessContext: any;
  conversationHistory: any[];
  currentQuery: string;
  timestamp: string;
}

export class ContextualRAG {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Fetch comprehensive user context from multiple data sources
   */
  private async fetchUserContext(userId: string): Promise<EnhancedUserContext> {
    try {
      // Fetch user profile with proper authentication
      const { data: profile, error: profileError } = await this.queryWrapper.getUserProfile(userId);

      if (profileError) {
        logger.error('Error fetching user profile:', profileError);
      } else if (profile) {
        logger.info('User profile data:', { 
          id: profile.id, 
          displayname: profile.display_name, 
          firstname: profile.first_name, 
          lastname: profile.last_name,
          email: profile.email 
        });
      }

      // Fetch user activity with proper authentication
      const { data: activity, error: activityError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', userId)
          .limit(100),
        userId,
        'fetch-user-activity'
      );

      if (activityError) {
        logger.error('Error fetching user activity:', activityError);
      }

      // Fetch company context with proper authentication
      let company = null;
      if (profile?.company_id && this.isValidUUID(profile.company_id)) {
        const { data: companyData, error: companyError } = await this.queryWrapper.companyQuery(
          async () => supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single(),
          profile.company_id,
          'fetch-company-context'
        );
        
        if (companyError) {
          logger.error('Error fetching company context:', companyError);
        } else {
          company = companyData;
        }
      }

      // Fetch user integrations with proper authentication
      const { data: integrations, error: integrationsError } = await this.queryWrapper.getUserIntegrations(userId);
      
      if (integrationsError) {
        logger.error('Error fetching user integrations:', integrationsError);
      }

      // Fetch recent conversations with proper authentication
      const { data: conversations, error: conversationsError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        userId,
        'fetch-recent-conversations'
      );

      if (conversationsError) {
        logger.error('Error fetching recent conversations:', conversationsError);
      }

      // Fetch business metrics with proper authentication
      let businessMetrics = null;
      if (company) {
        const { data: metrics, error: metricsError } = await this.queryWrapper.companyQuery(
          async () => supabase
            .rpc('get_business_metrics', { company_id: company.id }),
          company.id,
          'fetch-business-metrics'
        );
        
        if (metricsError) {
          logger.error('Error fetching business metrics:', metricsError);
        } else {
          businessMetrics = metrics;
        }
      }

      return {
        profile: profile || {},
        activity: activity || [],
        company: company || {},
        preferences: profile?.preferences || {},
        integrations: integrations || [],
        recentConversations: conversations || [],
        businessMetrics: businessMetrics || {}
      };
    } catch (error) {
      logger.error('Error in fetchUserContext:', error);
      return {
        profile: {},
        activity: [],
        company: {},
        preferences: {},
        integrations: [],
        recentConversations: [],
        businessMetrics: {}
      };
    }
  }

  /**
   * Fetch business context for analysis
   */
  private async fetchBusinessContext(userId: string): Promise<any> {
    try {
      const { data: profile, error: profileError } = await this.queryWrapper.getUserProfile(userId);
      
      if (profileError || !profile) {
        logger.error('Error fetching user profile for business context:', profileError);
        return {};
      }

      if (!profile.company_id) {
        return {};
      }

      const { data: company, error: companyError } = await this.queryWrapper.companyQuery(
        async () => supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single(),
        profile.company_id,
        'fetch-business-context'
      );

      if (companyError) {
        logger.error('Error fetching business context:', companyError);
        return {};
      }

      return company || {};
    } catch (error) {
      logger.error('Error in fetchBusinessContext:', error);
      return {};
    }
  }

  /**
   * Build comprehensive RAG context
   */
  async buildContext(userId: string, currentQuery: string): Promise<RAGContext> {
    try {
      logger.info('Building RAG context for user:', userId);

      const [userContext, businessContext] = await Promise.all([
        this.fetchUserContext(userId),
        this.fetchBusinessContext(userId)
      ]);

      // Fetch conversation history with proper authentication
      const { data: history, error: historyError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        userId,
        'fetch-conversation-history'
      );

      if (historyError) {
        logger.error('Error fetching conversation history:', historyError);
      }

      const context: RAGContext = {
        userContext,
        businessContext,
        conversationHistory: history || [],
        currentQuery,
        timestamp: new Date().toISOString()
      };

      logger.info('RAG context built successfully');
      return context;
    } catch (error) {
      logger.error('Error building RAG context:', error);
      throw error;
    }
  }

  /**
   * Store conversation with proper authentication
   */
  async storeConversation(userId: string, message: string, response: string, metadata?: any): Promise<void> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_messages')
          .insert({
            user_id: userId,
            message,
            response,
            metadata: metadata || {},
            created_at: new Date().toISOString()
          }),
        userId,
        'store-conversation'
      );

      if (error) {
        logger.error('Error storing conversation:', error);
      } else {
        logger.info('Conversation stored successfully');
      }
    } catch (error) {
      logger.error('Error in storeConversation:', error);
    }
  }

  /**
   * Update user activity with proper authentication
   */
  async updateUserActivity(userId: string, activityType: string, details?: any): Promise<void> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_activity')
          .insert({
            user_id: userId,
            activity_type: activityType,
            details: details || {},
            created_at: new Date().toISOString()
          }),
        userId,
        'update-user-activity'
      );

      if (error) {
        logger.error('Error updating user activity:', error);
      } else {
        logger.info('User activity updated successfully');
      }
    } catch (error) {
      logger.error('Error in updateUserActivity:', error);
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
} 