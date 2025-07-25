import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import type { EmailProvider } from '@/shared/types/email';
import { OAuthTokenService } from '@/services/integrations/oauthTokenService';

export type { EmailProvider } from '@/shared/types/email';

export interface OWAEmailItem {
  id: string;
  subject?: string;
  sender_email?: string;
  sender_name?: string;
  body_preview?: string;
  item_timestamp?: string;
  is_read?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
  thread_id?: string;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  provider?: EmailProvider;
  // Enrichment fields (computed, not stored)
  risk_score?: number;
  compliance_flags?: string[];
  sentiment_score?: number;
  urgency_score?: number;
  ai_insights?: string[];
}

export interface OWAInboxFilters {
  search?: string;
  is_read?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
  date_from?: string;
  date_to?: string;
  category?: string;
  risk_level?: 'low' | 'medium' | 'high';
  compliance_flagged?: boolean;
  urgency_level?: 'low' | 'medium' | 'high';
  provider?: EmailProvider;
}

export interface ComplianceAnalysis {
  riskscore: number;
  complianceflags: string[];
  sentimentscore: number;
  urgencyscore: number;
  aiinsights: string[];
  dataclassification: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionguidance: string;
}

export interface EmailProviderConfig {
  name: string;
  apiEndpoint: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  requiredScopes: string[];
  supportsAttachments: boolean;
  supportsCategories: boolean;
  supportsImportance: boolean;
}

class OWAInboxService {
  private providerConfigs: Record<EmailProvider, EmailProviderConfig> = {
    microsoft: {
      name: 'Microsoft 365',
      apiEndpoint: 'https://graph.microsoft.com/v1.0',
      authType: 'oauth2',
      requiredScopes: ['Mail.Read', 'Mail.ReadWrite'],
      supportsAttachments: true,
      supportsCategories: true,
      supportsImportance: true,
    },
    gmail: {
      name: 'Gmail',
      apiEndpoint: 'https://gmail.googleapis.com/gmail/v1',
      authType: 'oauth2',
      requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      supportsAttachments: true,
      supportsCategories: false,
      supportsImportance: false,
    },
    outlook: {
      name: 'Outlook.com',
      apiEndpoint: 'https://graph.microsoft.com/v1.0',
      authType: 'oauth2',
      requiredScopes: ['Mail.Read', 'Mail.ReadWrite'],
      supportsAttachments: true,
      supportsCategories: true,
      supportsImportance: true,
    },
    yahoo: {
      name: 'Yahoo Mail',
      apiEndpoint: 'https://api.mail.yahoo.com/ws/v3',
      authType: 'oauth2',
      requiredScopes: ['mail-r'],
      supportsAttachments: true,
      supportsCategories: false,
      supportsImportance: false,
    },
    custom: {
      name: 'Custom Provider',
      apiEndpoint: '',
      authType: 'oauth2',
      requiredScopes: [],
      supportsAttachments: false,
      supportsCategories: false,
      supportsImportance: false,
    },
  };

  /**
   * Test method to verify authentication status
   */
  async testAuthentication(): Promise<{ isAuthenticated: boolean; userId?: string; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return { isAuthenticated: false, error: `Session error: ${sessionError.message}` };
      }
      
      if (!session) {
        return { isAuthenticated: false, error: 'No session found' };
      }
      
      return { 
        isAuthenticated: true, 
        userId: session.user.id 
      };
    } catch (error) {
      return { 
        isAuthenticated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Test method to verify OAuth tokens access
   */
  async testOAuthTokensAccess(): Promise<{ canAccess: boolean; tokenCount?: number; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { canAccess: false, error: 'No valid session' };
      }
      
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('user_id', session.user.id);
      
      if (tokenError) {
        return { canAccess: false, error: `Token access error: ${tokenError.message}` };
      }
      
      return { 
        canAccess: true, 
        tokenCount: tokens?.length || 0 
      };
    } catch (error) {
      return { 
        canAccess: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Test direct access to oauth_tokens table
   */
  async testDirectTableAccess(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      logger.info('Starting direct table access test...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        logger.error('No valid session for direct table access test');
        return { success: false, error: 'No valid session' };
      }
      
      logger.info('Session found, testing table access...');
      
      // Test simple select without filters
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('id')
        .limit(1);
      
      logger.info('Direct table access query completed');
      
      if (error) {
        logger.error({ error }, 'Table access error');
        return { success: false, error: `Table access error: ${error.message}` };
      }
      
      logger.info({ data }, 'Direct table access test successful');
      return { 
        success: true, 
        data: data 
      };
    } catch (error) {
      logger.error({ error }, 'Direct table access test error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Debug current user session and JWT token
   */
  async debugUserSession(): Promise<{ 
    hasSession: boolean; 
    userId?: string; 
    userRole?: string; 
    jwtRole?: string; 
    error?: string 
  }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return { hasSession: false, error: `Session error: ${sessionError.message}` };
      }
      
      if (!session) {
        return { hasSession: false, error: 'No session found' };
      }
      
      // Try to decode JWT to get role information
      let jwtRole = 'unknown';
      let userRole = 'unknown';
      
      try {
        const jwt = session.access_token;
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        jwtRole = payload.role || 'no-role';
        userRole = payload.user_role || 'no-user-role';
      } catch (jwtError) {
        logger.warn({ jwtError }, 'Could not decode JWT token');
      }
      
      return {
        hasSession: true,
        userId: session.user.id,
        userRole,
        jwtRole
      };
    } catch (error) {
      return { 
        hasSession: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if OAuth tokens exist for a specific provider
   */
  async hasOAuthTokens(provider: EmailProvider): Promise<boolean> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return false;
      }
      
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('integration_slug', provider)
        .limit(1);
      
      if (tokenError || !tokens || tokens.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ error, provider }, 'Error checking OAuth tokens');
      return false;
    }
  }

  /**
   * Remove OAuth tokens for a specific provider
   */
  async removeOAuthTokens(provider: EmailProvider): Promise<boolean> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }
      
      // Delete tokens directly instead of using RPC function
      const { error: deleteError } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('integration_slug', provider);
      
      if (deleteError) {
        logger.error({ error: deleteError, provider }, 'Error removing OAuth tokens');
        throw new Error(`Failed to remove tokens: ${deleteError.message}`);
      }
      
      // Also remove from user_integrations
      const { error: integrationError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', session.user.id)
        .eq('integration_name', 'Microsoft 365');
      
      if (integrationError) {
        logger.warn({ error: integrationError, provider }, 'Error removing user integration');
      }
      
      logger.info({ userId: session.user.id, provider }, 'Successfully removed OAuth tokens');
      return true;
    } catch (error) {
      logger.error({ error, provider }, 'Error removing OAuth tokens');
      throw error;
    }
  }

  /**
   * Get list of connected providers for the current user
   */
  async getConnectedProviders(): Promise<EmailProvider[]> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return [];
      }
      
      // Check oauth_tokens for connected providers
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('integration_slug')
        .eq('user_id', session.user.id);
      
      if (tokenError || !tokens) {
        return [];
      }
      
      // Map integration slugs to EmailProvider types
      const connectedProviders: EmailProvider[] = [];
      tokens.forEach(token => {
        const slug = token.integration_slug;
        if (slug === 'microsoft' || slug === 'outlook') {
          connectedProviders.push('microsoft');
        } else if (slug === 'gmail') {
          connectedProviders.push('gmail');
        } else if (slug === 'yahoo') {
          connectedProviders.push('yahoo');
        } else if (slug === 'custom') {
          connectedProviders.push('custom');
        }
      });
      
      // Remove duplicates
      return [...new Set(connectedProviders)];
    } catch (error) {
      logger.error({ error }, 'Error getting connected providers');
      return [];
    }
  }

  /**
   * Test Microsoft Graph API connectivity
   */
  async testMicrosoftGraphAPI(): Promise<{ success: boolean; error?: string; userInfo?: any; mailInfo?: any }> {
    try {
      logger.info('Testing Microsoft Graph API connectivity');
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Microsoft Graph API test timeout after 15 seconds')), 15000)
      );
      
      const tokenData = await Promise.race([
        this.getProviderTokens('microsoft'),
        timeoutPromise
      ]);
      
      // Test basic user info first
      const userResponse = await fetch('https: //graph.microsoft.com/v1.0/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        logger.error({ 
          status: userResponse.status, 
          statusText: userResponse.statusText,
          errorText 
        }, 'Microsoft Graph user info error');
        return { 
          success: false, 
          error: `User info error: ${userResponse.status} ${userResponse.statusText}` 
        };
      }

      const userInfo = await userResponse.json();
      logger.info({ userInfo }, 'Successfully retrieved user info');

      // Test mail permissions
      const mailResponse = await fetch('https: //graph.microsoft.com/v1.0/me/messages?$top=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mailResponse.ok) {
        const errorText = await mailResponse.text();
        logger.error({ 
          status: mailResponse.status, 
          statusText: mailResponse.statusText,
          errorText 
        }, 'Microsoft Graph mail access error');
        return { 
          success: false, 
          error: `Mail access error: ${mailResponse.status} ${mailResponse.statusText}`,
          userInfo 
        };
      }

      const mailInfo = await mailResponse.json();
      logger.info({ 
        mailCount: mailInfo.value?.length || 0 
      }, 'Successfully tested mail access');

      return { 
        success: true, 
        userInfo,
        mailInfo 
      };
    } catch (error) {
      logger.error({ error }, 'Error testing Microsoft Graph API');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get supported email providers
   */
  getSupportedProviders(): EmailProvider[] {
    return Object.keys(this.providerConfigs) as EmailProvider[];
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: EmailProvider): EmailProviderConfig {
    return this.providerConfigs[provider];
  }

  /**
   * Enrich email data with compliance and risk analysis (no storage)
   */
  private enrichEmailData(email: any, provider: EmailProvider = 'microsoft'): OWAEmailItem {
    const enriched = {
      id: email.id,
      subject: email.subject,
      senderemail: email.from?.emailAddress?.address || email.from?.address,
      sendername: email.from?.emailAddress?.name || email.from?.name,
      bodypreview: email.bodyPreview || email.snippet,
      itemtimestamp: email.receivedDateTime || email.internalDate,
      isread: email.isRead !== undefined ? email.isRead : !email.labelIds?.includes('UNREAD'),
      isimportant: email.importance === 'high' || email.labelIds?.includes('IMPORTANT'),
      hasattachments: email.hasAttachments || email.payload?.parts?.some((part: any) => part.filename),
      threadid: email.conversationId || email.threadId,
      categories: email.categories || [],
      importance: email.importance || 'normal',
      provider,
    };

    // Add real-time enrichment (computed, not stored)
    const analysis = this.analyzeComplianceAndRisk(enriched);
    
    return {
      ...enriched,
      riskscore: analysis.risk_score,
      complianceflags: analysis.compliance_flags,
      sentimentscore: analysis.sentiment_score,
      urgencyscore: analysis.urgency_score,
      aiinsights: analysis.ai_insights,
    };
  }

  /**
   * Analyze email for compliance and risk (real-time, no storage)
   */
  private analyzeComplianceAndRisk(email: OWAEmailItem): ComplianceAnalysis {
    const flags: string[] = [];
    let riskScore = 0;
    let sentimentScore = 0;
    let urgencyScore = 0;
    const insights: string[] = [];

    // Risk Analysis
    if (email.sender_email?.includes('external') || email.sender_email?.includes('unknown')) {
      riskScore += 20;
      flags.push('external_sender');
    }

    if (email.subject?.toLowerCase().includes('urgent') || email.subject?.toLowerCase().includes('asap')) {
      urgencyScore += 30;
      flags.push('urgent_language');
    }

    if (email.has_attachments) {
      riskScore += 10;
      flags.push('has_attachments');
    }

    // Compliance Checks
    const sensitiveKeywords = ['password', 'credit card', 'ssn', 'social security', 'confidential'];
    const content = `${email.subject} ${email.body_preview}`.toLowerCase();
    
    sensitiveKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        riskScore += 25;
        flags.push(`sensitive_keyword: ${keyword}`);
      }
    });

    // Sentiment Analysis (simplified)
    const positiveWords = ['thank', 'great', 'good', 'excellent', 'approved'];
    const negativeWords = ['urgent', 'problem', 'issue', 'error', 'failed'];
    
    positiveWords.forEach(word => {
      if (content.includes(word)) sentimentScore += 10;
    });
    
    negativeWords.forEach(word => {
      if (content.includes(word)) sentimentScore -= 10;
    });

    // Data Classification
    let dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' = 'internal';
    if (riskScore > 50) dataClassification = 'confidential';
    if (riskScore > 80) dataClassification = 'restricted';

    // AI Insights
    if (urgencyScore > 20) insights.push('High urgency detected');
    if (riskScore > 30) insights.push('Elevated risk profile');
    if (flags.includes('external_sender')) insights.push('External communication');
    if (email.is_important) insights.push('Marked as important by sender');

    return {
      riskscore: Math.min(riskScore, 100),
      complianceflags: flags,
      sentimentscore: Math.max(-100, Math.min(sentimentScore, 100)),
      urgencyscore: Math.min(urgencyScore, 100),
      aiinsights: insights,
      dataclassification: dataClassification,
             retentionguidance: this.getRetentionGuidance(dataClassification, riskScore),
    };
  }

  /**
   * Get retention guidance based on classification
   */
  private getRetentionGuidance(classification: string, riskScore: number): string {
    switch (classification) {
      case 'restricted':
        return 'Retain for 7 years, review monthly';
      case 'confidential':
        return 'Retain for 3 years, review quarterly';
      case 'internal':
        return 'Retain for 1 year, review annually';
      default: return 'Standard retention applies';
    }
  }

  /**
   * Get OAuth tokens for a specific provider
   */
  private async getProviderTokens(provider: EmailProvider): Promise<any> {
    try {
      // Use the new TokenManager for client-side token refresh
      logger.info({ provider }, 'Getting valid tokens using TokenManager');
      
      const tokens = await tokenManager.getValidTokens(provider);
      
      logger.info({ 
        provider,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expires_at
      }, 'Successfully retrieved OAuth tokens');

      return tokens;
    } catch (error) {
      logger.error({ error, provider }, `Error getting ${provider} tokens`);
      
      // If token refresh failed, remove expired tokens and throw re-auth error
      if (error instanceof Error && error.message.includes('expired')) {
        await tokenManager.removeTokens(provider);
        throw new Error('Your email connection has expired. Please reconnect your account.');
      }
      
      throw error;
    }
  }

  /**
   * Ensure user_integrations record exists for a provider
   */
  private async ensureUserIntegration(userId: string, provider: EmailProvider): Promise<void> {
    try {
      // Check if user_integrations record exists by looking for Microsoft 365 integration
      const { data: existingIntegration, error: checkError } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', userId)
        .eq('integration_name', 'Microsoft 365')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error({ error: checkError, userId, provider }, 'Error checking user integration');
        return;
      }

      // If integration exists, we're good
      if (existingIntegration) {
        logger.info({ userId, provider }, 'User integration record already exists');
        return;
      }

      // If no integration record exists, create one
      const providerConfig = this.getProviderConfig(provider);
              const { error: insertError } = await supabase
          .from('user_integrations')
          .insert({
            userid: userId,
            integrationid: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            integrationtype: 'oauth', // Use 'oauth' for OAuth-based integrations
            integrationname: providerConfig.name,
            status: 'connected',
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          });

      if (insertError) {
        logger.error({ error: insertError, userId, provider }, 'Error creating user integration');
      } else {
        logger.info({ userId, provider }, 'Created user integration record');
      }
    } catch (error) {
      logger.error({ error, userId, provider }, 'Error ensuring user integration');
    }
  }

  /**
   * Fetch emails from Microsoft Graph API
   */
  private async fetchMicrosoftEmails(filters: OWAInboxFilters, limit: number, offset: number): Promise<OWAEmailItem[]> {
    try {
      logger.info({ filters, limit, offset }, 'Starting Microsoft email fetch');
      
      const tokenData = await this.getProviderTokens('microsoft');
      logger.info({ hasAccessToken: !!tokenData.access_token }, 'Retrieved Microsoft tokens');
      
      const queryParams = new URLSearchParams();
      queryParams.set('$top', limit.toString());
      queryParams.set('$skip', offset.toString());
      queryParams.set('$select', 'id,subject,from,receivedDateTime,bodyPreview,isRead,importance,hasAttachments,conversationId,categories');
      queryParams.set('$orderby', 'receivedDateTime desc');

      // Apply filters
      const filterConditions = [];
      
      if (filters.is_read !== undefined) {
        filterConditions.push(`isRead eq ${filters.is_read}`);
      }
      
      if (filters.is_important !== undefined) {
        const importanceValue = filters.is_important ? 'high' : 'normal';
        filterConditions.push(`importance eq '${importanceValue}'`);
      }
      
      if (filters.has_attachments !== undefined) {
        filterConditions.push(`hasAttachments eq ${filters.has_attachments}`);
      }
      
      if (filters.date_from) {
        filterConditions.push(`receivedDateTime ge ${filters.date_from}`);
      }
      
      if (filters.date_to) {
        filterConditions.push(`receivedDateTime le ${filters.date_to}`);
      }

      if (filterConditions.length > 0) {
        queryParams.set('$filter', filterConditions.join(' and '));
      }

      const apiUrl = `https: //graph.microsoft.com/v1.0/me/messages?${queryParams.toString()}`;
      logger.info({ apiUrl }, 'Making Microsoft Graph API request');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info({ 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }, 'Microsoft Graph API response received');

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        }, 'Microsoft Graph API error');
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const emails = await response.json();
      logger.info({ 
        emailCount: emails.value?.length || 0,
        hasValue: !!emails.value 
      }, 'Successfully parsed Microsoft emails');

      return (emails.value || []).map((email: any) => this.enrichEmailData(email, 'microsoft'));
    } catch (error) {
      logger.error({ error, filters, limit, offset }, 'Error fetching Microsoft emails');
      throw error;
    }
  }

  /**
   * Fetch emails from Gmail API
   */
  private async fetchGmailEmails(filters: OWAInboxFilters, limit: number, offset: number): Promise<OWAEmailItem[]> {
    const tokenData = await this.getProviderTokens('gmail');
    
    const queryParams = new URLSearchParams();
    queryParams.set('maxResults', limit.toString());
    queryParams.set('q', this.buildGmailQuery(filters));

    const response = await fetch(
      `https: //gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Gmail API error');
    }

    const messages = await response.json();
    const emails = await Promise.all(
      (messages.messages || []).map(async (__msg: any) => {
        const detailResponse = await fetch(
          `https: //gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          }
        );
        return detailResponse.json();
      })
    );

    return emails.map((email: any) => this.enrichEmailData(email, 'gmail'));
  }

  /**
   * Build Gmail query string
   */
  private buildGmailQuery(filters: OWAInboxFilters): string {
    const queries = [];
    
    if (filters.is_read !== undefined) {
      queries.push(filters.is_read ? 'is: read' : 'is:unread');
    }
    
    if (filters.has_attachments) {
      queries.push('has: attachment');
    }
    
    if (filters.is_important) {
      queries.push('is: important');
    }
    
    if (filters.date_from) {
      queries.push(`after: ${filters.date_from}`);
    }
    
    if (filters.date_to) {
      queries.push(`before: ${filters.date_to}`);
    }
    
    return queries.join(' ');
  }

  /**
   * Get emails from any supported provider
   */
  async getEmails(
    filters: OWAInboxFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ items: OWAEmailItem[]; total: number }> {
    try {
      const provider = filters.provider || 'microsoft';
      
      let emails: OWAEmailItem[] = [];
      
      switch (provider) {
        case 'microsoft':
        case 'outlook': {
          emails = await this.fetchMicrosoftEmails(filters, limit, offset);
          break;
        }
        case 'gmail': {
          emails = await this.fetchGmailEmails(filters, limit, offset);
          break;
        }
        case 'yahoo': {
          // TODO: Implement Yahoo Mail API
          throw new Error('Yahoo Mail support coming soon');
        }
        case 'custom': {
          // TODO: Implement custom provider
          throw new Error('Custom provider support coming soon');
        }
        default: {
          throw new Error(`Unsupported provider: ${provider}`);
        }
      }

      // Apply client-side filtering for compliance features
      let filteredItems = emails;
      
      if (filters.risk_level) {
        const riskThreshold = filters.risk_level === 'high' ? 50: filters.risk_level === 'medium' ? 25 : 0;
        filteredItems = filteredItems.filter(item => (item.risk_score || 0) >= riskThreshold);
      }
      
      if (filters.compliance_flagged) {
        filteredItems = filteredItems.filter(item => (item.compliance_flags || []).length > 0);
      }
      
      if (filters.urgency_level) {
        const urgencyThreshold = filters.urgency_level === 'high' ? 50: filters.urgency_level === 'medium' ? 25 : 0;
        filteredItems = filteredItems.filter(item => (item.urgency_score || 0) >= urgencyThreshold);
      }

      // Apply client-side search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.subject?.toLowerCase().includes(searchTerm) ||
          item.sender_name?.toLowerCase().includes(searchTerm) ||
          item.sender_email?.toLowerCase().includes(searchTerm) ||
          item.body_preview?.toLowerCase().includes(searchTerm) ||
          item.ai_insights?.some(insight => insight.toLowerCase().includes(searchTerm))
        );
      }

      logger.info({ 
        count: filteredItems.length, 
        totalFetched: emails.length,
        provider,
        filters: Object.keys(filters),
        complianceAnalysis: {
          highRisk: filteredItems.filter(item => (item.risk_score || 0) > 50).length,
          flaggedItems: filteredItems.filter(item => (item.compliance_flags || []).length > 0).length,
        }
      }, `Successfully fetched and enriched emails from ${provider}`);

      return {
        items: filteredItems,
        total: filteredItems.length
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching emails');
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No microsoft tokens found')) {
          throw new Error('No Microsoft 365 account connected. Please connect your email account first.');
        }
        if (error.message.includes('User not authenticated')) {
          throw new Error('Please log in to access your inbox.');
        }
        if (error.message.includes('token is expired')) {
          throw new Error('Your email connection has expired. Please reconnect your account.');
        }
      }
      
      throw new Error('Failed to load emails. Please try again or check your connection.');
    }
  }

  /**
   * Get email details from any provider
   */
  async getEmailDetails(emailId: string, provider: EmailProvider = 'microsoft'): Promise<OWAEmailItem | null> {
    try {
      const tokenData = await this.getProviderTokens(provider);
      
      let email: any;
      
      switch (provider) {
        case 'microsoft':
        case 'outlook': {
          const response = await fetch(
            `https: //graph.microsoft.com/v1.0/me/messages/${emailId}?$select=id,subject,from,receivedDateTime,body,bodyPreview,isRead,importance,hasAttachments,conversationId,categories`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (!response.ok) return null;
          email = await response.json();
          break;
        }
          
        case 'gmail': {
          const gmailResponse = await fetch(
            `https: //gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
            {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
              },
            }
          );
          
          if (!gmailResponse.ok) return null;
          email = await gmailResponse.json();
          break;
        }
          
        default: {
          throw new Error(`Unsupported provider: ${provider}`);
        }
      }
      
      return this.enrichEmailData(email, provider);

    } catch (error) {
      logger.error({ error, emailId, provider }, 'Error fetching email details');
      return null;
    }
  }

  /**
   * Mark email as read/unread for any provider
   */
  async markAsRead(emailId: string, isRead: boolean, provider: EmailProvider = 'microsoft'): Promise<boolean> {
    try {
      const tokenData = await this.getProviderTokens(provider);
      
      switch (provider) {
        case 'microsoft':
        case 'outlook': {
          const response = await fetch(
            `https: //graph.microsoft.com/v1.0/me/messages/${emailId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                isRead: isRead
              }),
            }
          );
          return response.ok;
        }
          
        case 'gmail': {
          const gmailResponse = await fetch(
            `https: //gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                removeLabelIds: isRead ? ['UNREAD'] : [],
                addLabelIds: isRead ? [] : ['UNREAD']
              }),
            }
          );
          return gmailResponse.ok;
        }
          
        default: {
          return false;
        }
      }

    } catch (error) {
      logger.error({ error, emailId, isRead, provider }, 'Error marking email as read');
      return false;
    }
  }

  /**
   * Get categories for any provider
   */
  async getCategories(provider: EmailProvider = 'microsoft'): Promise<string[]> {
    try {
      const tokenData = await this.getProviderTokens(provider);
      
      switch (provider) {
        case 'microsoft':
        case 'outlook': {
          const response = await fetch(
            'https: //graph.microsoft.com/v1.0/me/outlook/masterCategories',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) return [];
          const categories = await response.json();
          return (categories.value || []).map((cat: any) => cat.displayName);
        }
          
        case 'gmail': {
          const gmailResponse = await fetch(
            'https: //gmail.googleapis.com/gmail/v1/users/me/labels',
            {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
              },
            }
          );

          if (!gmailResponse.ok) return [];
          const labels = await gmailResponse.json();
          return (labels.labels || []).map((label: any) => label.name);
        }
          
        default: {
          return [];
        }
      }

    } catch (error) {
      logger.error({ error, provider }, 'Error fetching categories');
      return [];
    }
  }

  /**
   * Get inbox statistics for any provider
   */
  async getInboxStats(provider: EmailProvider = 'microsoft'): Promise<{
    total: number;
    unread: number;
    important: number;
    withAttachments: number;
    highRisk: number;
    complianceFlagged: number;
    urgent: number;
  }> {
    try {
      const { items } = await this.getEmails({ provider }, 100, 0);
      
      const stats = {
        total: items.length,
        unread: items.filter(item => !item.is_read).length,
        important: items.filter(item => item.is_important).length,
        withAttachments: items.filter(item => item.has_attachments).length,
        highRisk: items.filter(item => (item.risk_score || 0) > 50).length,
        complianceFlagged: items.filter(item => (item.compliance_flags || []).length > 0).length,
        urgent: items.filter(item => (item.urgency_score || 0) > 30).length,
      };

      return stats;

    } catch (error) {
      logger.error({ error, provider }, 'Error getting inbox stats');
      return {
        total: 0,
        unread: 0,
        important: 0,
        withAttachments: 0,
        highRisk: 0,
        complianceFlagged: 0,
        urgent: 0,
      };
    }
  }

  /**
   * Get compliance dashboard data for any provider
   */
  async getComplianceDashboard(provider: EmailProvider = 'microsoft'): Promise<{
    riskDistribution: { low: number; medium: number; high: number };
    topComplianceFlags: { flag: string; count: number }[];
    dataClassification: { classification: string; count: number }[];
    retentionSummary: { guidance: string; count: number }[];
  }> {
    try {
      const { items } = await this.getEmails({ provider }, 200, 0);
      
      // Risk distribution
      const riskDistribution = {
        low: items.filter(item => (item.risk_score || 0) < 25).length,
        medium: items.filter(item => (item.risk_score || 0) >= 25 && (item.risk_score || 0) < 50).length,
        high: items.filter(item => (item.risk_score || 0) >= 50).length,
      };

      // Top compliance flags
      const flagCounts: Record<string, number> = {};
      items.forEach(item => {
        item.compliance_flags?.forEach(flag => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1;
        });
      });

      const topComplianceFlags = Object.entries(flagCounts)
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Data classification
      const classificationCounts: Record<string, number> = {};
      items.forEach(item => {
        const analysis = this.analyzeComplianceAndRisk(item);
        classificationCounts[analysis.data_classification] = (classificationCounts[analysis.data_classification] || 0) + 1;
      });

      const dataClassification = Object.entries(classificationCounts)
        .map(([classification, count]) => ({ classification, count }));

      // Retention summary
      const retentionCounts: Record<string, number> = {};
      items.forEach(item => {
        const analysis = this.analyzeComplianceAndRisk(item);
        retentionCounts[analysis.retention_guidance] = (retentionCounts[analysis.retention_guidance] || 0) + 1;
      });

      const retentionSummary = Object.entries(retentionCounts)
        .map(([guidance, count]) => ({ guidance, count }));

      return {
        riskDistribution,
        topComplianceFlags,
        dataClassification,
        retentionSummary,
      };

    } catch (error) {
      logger.error({ error, provider }, 'Error getting compliance dashboard');
      return {
        riskDistribution: { low: 0, medium: 0, high: 0 },
        topComplianceFlags: [],
        dataClassification: [],
        retentionSummary: [],
      };
    }
  }

  /**
   * Simple test to check if basic database access is working
   */
  async testBasicAccess(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      logger.info('Testing basic database access');
      
      // Test if Supabase client is working at all
      logger.info('Testing Supabase client connection...');
      
      // Try a simple health check first
      const { error: healthError } = await supabase
        .from('oauth_tokens')
        .select('id')
        .limit(1);
      
      logger.info('Health check completed');
      
      if (healthError) {
        logger.error({ healthError }, 'Health check failed');
        return { success: false, error: `Health check failed: ${healthError.message}` };
      }
      
      logger.info('Health check successful, testing count query...');
      
      // Test with a simple count query
      const { count, error } = await supabase
        .from('oauth_tokens')
        .select('*', { count: 'exact', head: true });
      
      logger.info('Count query completed');
      
      if (error) {
        logger.error({ error }, 'Basic access test failed');
        return { success: false, error: error.message };
      }
      
      logger.info({ count }, 'Basic access test successful');
      return { success: true, data: { count } };
    } catch (error) {
      logger.error({ error }, 'Basic access test error');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const owaInboxService = new OWAInboxService(); 