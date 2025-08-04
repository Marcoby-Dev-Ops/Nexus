import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Zod schemas for validation
export const EmailItemSchema = z.object({
  id: z.string().optional(),
  subject: z.string().optional(),
  sender_email: z.string().email().optional(),
  sender_name: z.string().optional(),
  body_preview: z.string().optional(),
  item_timestamp: z.string().optional(),
  is_read: z.boolean().default(false),
  is_important: z.boolean().default(false),
  has_attachments: z.boolean().default(false),
  thread_id: z.string().optional(),
  categories: z.array(z.string()).optional(),
  importance: z.enum(['low', 'normal', 'high']).default('normal'),
  provider: z.enum(['microsoft', 'gmail', 'outlook', 'yahoo']).default('microsoft'),
  risk_score: z.number().optional(),
  compliance_flags: z.array(z.string()).optional(),
  sentiment_score: z.number().optional(),
  urgency_score: z.number().optional(),
  ai_insights: z.array(z.string()).optional(),
});

export const EmailFiltersSchema = z.object({
  search: z.string().optional(),
  is_read: z.boolean().optional(),
  is_important: z.boolean().optional(),
  has_attachments: z.boolean().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  category: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  compliance_flagged: z.boolean().optional(),
  urgency_level: z.enum(['low', 'medium', 'high']).optional(),
  provider: z.enum(['microsoft', 'gmail', 'outlook', 'yahoo']).optional(),
});

export type EmailProvider = 'microsoft' | 'gmail' | 'outlook' | 'yahoo';

export interface EmailItem {
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

export interface EmailFilters {
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

export interface EmailStats {
  total: number;
  unread: number;
  important: number;
  withAttachments: number;
  highRisk: number;
  complianceFlagged: number;
  urgent: number;
}

export interface ComplianceDashboard {
  riskDistribution: { low: number; medium: number; high: number };
  topComplianceFlags: { flag: string; count: number }[];
  dataClassification: { classification: string; count: number }[];
  retentionSummary: { guidance: string; count: number }[];
}

/**
 * Email Service
 * Handles email operations, multi-provider integration, and compliance analysis
 * Extends BaseService for consistent error handling and logging
 */
export class EmailService extends BaseService implements CrudServiceInterface<EmailItem> {
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
  };

  constructor() {
    super('email');
  }

  /**
   * Get an email by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<EmailItem>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get email from database
      const { data: email, error } = await supabase
        .from('emails')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return this.createErrorResponse('Failed to get email', error.message);
      }

      if (!email) {
        return this.createErrorResponse('Email not found');
      }

      return this.createSuccessResponse(email as EmailItem);
    } catch (error) {
      return this.handleError('Failed to get email', error);
    }
  }

  /**
   * Create a new email (implements CrudServiceInterface)
   */
  async create(data: Partial<EmailItem>): Promise<ServiceResponse<EmailItem>> {
    try {
      // Validate email data
      const validatedData = EmailItemSchema.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Create email in database
      const { data: email, error } = await supabase
        .from('emails')
        .insert({
          ...validatedData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to create email', error.message);
      }

      this.logSuccess('Email created successfully', { emailId: email.id });
      return this.createSuccessResponse(email as EmailItem);
    } catch (error) {
      return this.handleError('Failed to create email', error);
    }
  }

  /**
   * Update an email (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<EmailItem>): Promise<ServiceResponse<EmailItem>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update email in database
      const { data: email, error } = await supabase
        .from('emails')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to update email', error.message);
      }

      this.logSuccess('Email updated successfully', { emailId: id });
      return this.createSuccessResponse(email as EmailItem);
    } catch (error) {
      return this.handleError('Failed to update email', error);
    }
  }

  /**
   * Delete an email (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Delete email from database
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return this.createErrorResponse('Failed to delete email', error.message);
      }

      this.logSuccess('Email deleted successfully', { emailId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to delete email', error);
    }
  }

  /**
   * List emails (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<EmailItem[]>> {
    try {
      const emailFilters: EmailFilters = filters as EmailFilters || {};
      return await this.getEmails(emailFilters);
    } catch (error) {
      return this.handleError('Failed to list emails', error);
    }
  }

  /**
   * Get emails with filters
   */
  async getEmails(
    filters: EmailFilters = {},
    limit = 50,
    offset = 0
  ): Promise<ServiceResponse<{ items: EmailItem[]; total: number }>> {
    try {
      // Validate filters
      const validatedFilters = EmailFiltersSchema.parse(filters);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Build query
      let query = supabase
        .from('emails')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (validatedFilters.is_read !== undefined) {
        query = query.eq('is_read', validatedFilters.is_read);
      }

      if (validatedFilters.is_important !== undefined) {
        query = query.eq('is_important', validatedFilters.is_important);
      }

      if (validatedFilters.has_attachments !== undefined) {
        query = query.eq('has_attachments', validatedFilters.has_attachments);
      }

      if (validatedFilters.provider) {
        query = query.eq('provider', validatedFilters.provider);
      }

      if (validatedFilters.search) {
        query = query.or(`subject.ilike.%${validatedFilters.search}%,body_preview.ilike.%${validatedFilters.search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data: emails, error, count } = await query;

      if (error) {
        return this.createErrorResponse('Failed to fetch emails', error.message);
      }

      const emailItems = (emails || []).map(email => this.enrichEmailData(email, email.provider as EmailProvider));

      this.logSuccess('Emails fetched successfully', { 
        total: emailItems.length,
        filters: validatedFilters
      });

      return this.createSuccessResponse({
        items: emailItems,
        total: count || 0,
      });
    } catch (error) {
      return this.handleError('Failed to fetch emails', error);
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId: string, isRead: boolean, provider: EmailProvider = 'microsoft'): Promise<ServiceResponse<boolean>> {
    try {
      this.validateIdParam(emailId);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update email read status
      const { error } = await supabase
        .from('emails')
        .update({ is_read: isRead })
        .eq('id', emailId)
        .eq('user_id', user.id);

      if (error) {
        return this.createErrorResponse('Failed to update email read status', error.message);
      }

      this.logSuccess('Email read status updated', { emailId, isRead });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to update email read status', error);
    }
  }

  /**
   * Get email statistics
   */
  async getInboxStats(provider: EmailProvider = 'microsoft'): Promise<ServiceResponse<EmailStats>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get email stats from database
      const { data: emails, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        return this.createErrorResponse('Failed to fetch email stats', error.message);
      }

      const stats: EmailStats = {
        total: emails?.length || 0,
        unread: emails?.filter(e => !e.is_read).length || 0,
        important: emails?.filter(e => e.is_important).length || 0,
        withAttachments: emails?.filter(e => e.has_attachments).length || 0,
        highRisk: emails?.filter(e => (e.risk_score || 0) > 7).length || 0,
        complianceFlagged: emails?.filter(e => (e.compliance_flags?.length || 0) > 0).length || 0,
        urgent: emails?.filter(e => (e.urgency_score || 0) > 7).length || 0,
      };

      this.logSuccess('Email stats fetched successfully', stats);
      return this.createSuccessResponse(stats);
    } catch (error) {
      return this.handleError('Failed to fetch email stats', error);
    }
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(provider: EmailProvider = 'microsoft'): Promise<ServiceResponse<ComplianceDashboard>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get emails for compliance analysis
      const { data: emails, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        return this.createErrorResponse('Failed to fetch compliance data', error.message);
      }

      // Calculate compliance metrics
      const riskDistribution = { low: 0, medium: 0, high: 0 };
      const complianceFlags: Record<string, number> = {};
      const dataClassification: Record<string, number> = {};
      const retentionSummary: Record<string, number> = {};

      emails?.forEach(email => {
        const riskScore = email.risk_score || 0;
        if (riskScore <= 3) riskDistribution.low++;
        else if (riskScore <= 7) riskDistribution.medium++;
        else riskDistribution.high++;

        email.compliance_flags?.forEach(flag => {
          complianceFlags[flag] = (complianceFlags[flag] || 0) + 1;
        });
      });

      const dashboard: ComplianceDashboard = {
        riskDistribution,
        topComplianceFlags: Object.entries(complianceFlags)
          .map(([flag, count]) => ({ flag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        dataClassification: Object.entries(dataClassification)
          .map(([classification, count]) => ({ classification, count })),
        retentionSummary: Object.entries(retentionSummary)
          .map(([guidance, count]) => ({ guidance, count })),
      };

      this.logSuccess('Compliance dashboard fetched successfully', dashboard);
      return this.createSuccessResponse(dashboard);
    } catch (error) {
      return this.handleError('Failed to fetch compliance dashboard', error);
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
   * Enrich email data with computed fields
   */
  private enrichEmailData(email: any, provider: EmailProvider = 'microsoft'): EmailItem {
    const enrichedEmail = { ...email };

    // Add computed fields if not present
    if (!enrichedEmail.risk_score) {
      enrichedEmail.risk_score = this.calculateRiskScore(email);
    }

    if (!enrichedEmail.compliance_flags) {
      enrichedEmail.compliance_flags = this.analyzeCompliance(email);
    }

    if (!enrichedEmail.sentiment_score) {
      enrichedEmail.sentiment_score = this.analyzeSentiment(email);
    }

    if (!enrichedEmail.urgency_score) {
      enrichedEmail.urgency_score = this.calculateUrgencyScore(email);
    }

    if (!enrichedEmail.ai_insights) {
      enrichedEmail.ai_insights = this.generateAIInsights(email);
    }

    return enrichedEmail;
  }

  /**
   * Calculate risk score for an email
   */
  private calculateRiskScore(email: any): number {
    let score = 0;
    
    // Check for suspicious patterns
    if (email.subject?.toLowerCase().includes('urgent')) score += 2;
    if (email.subject?.toLowerCase().includes('account')) score += 3;
    if (email.subject?.toLowerCase().includes('password')) score += 4;
    if (email.sender_email?.includes('noreply')) score += 1;
    
    return Math.min(score, 10);
  }

  /**
   * Analyze compliance flags
   */
  private analyzeCompliance(email: any): string[] {
    const flags: string[] = [];
    
    if (email.subject?.toLowerCase().includes('confidential')) {
      flags.push('confidential_content');
    }
    
    if (email.sender_email?.includes('external')) {
      flags.push('external_sender');
    }
    
    return flags;
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(email: any): number {
    // Simple sentiment analysis
    const text = `${email.subject} ${email.body_preview}`.toLowerCase();
    let score = 0;
    
    if (text.includes('urgent') || text.includes('immediate')) score += 2;
    if (text.includes('important')) score += 1;
    if (text.includes('thank')) score -= 1;
    
    return Math.max(-5, Math.min(5, score));
  }

  /**
   * Calculate urgency score
   */
  private calculateUrgencyScore(email: any): number {
    let score = 0;
    
    if (email.is_important) score += 3;
    if (email.subject?.toLowerCase().includes('urgent')) score += 4;
    if (email.subject?.toLowerCase().includes('asap')) score += 3;
    
    return Math.min(score, 10);
  }

  /**
   * Generate AI insights
   */
  private generateAIInsights(email: any): string[] {
    const insights: string[] = [];
    
    if (email.risk_score && email.risk_score > 7) {
      insights.push('High risk email detected');
    }
    
    if (email.compliance_flags?.length) {
      insights.push('Compliance flags present');
    }
    
    if (email.urgency_score && email.urgency_score > 7) {
      insights.push('High urgency email');
    }
    
    return insights;
  }

  /**
   * Revoke OAuth token for email provider
   */
  async revokeToken(provider: EmailProvider): Promise<ServiceResponse<boolean>> {
    try {
      this.validateStringParam(provider, 'provider');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update token status to revoked
      const { error } = await supabase
        .from('oauth_tokens')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        return this.createErrorResponse('Failed to revoke OAuth token', error.message);
      }

      this.logSuccess('OAuth token revoked successfully', { provider });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to revoke OAuth token', error);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(); 
