import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { z } from 'zod';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
   * Get full email content by ID (including HTML and plain text)
   */
  async getFullEmail(id: string): Promise<ServiceResponse<{
    id: string;
    subject?: string;
    sender_email?: string;
    sender_name?: string;
    content?: string; // Plain text content
    html_content?: string; // HTML content
    body_preview?: string;
    item_timestamp?: string;
    is_read?: boolean;
    is_important?: boolean;
    has_attachments?: boolean;
    thread_id?: string;
    provider?: EmailProvider;
  }>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // For Microsoft Graph IDs, they often contain special characters that need encoding
      // Let's try to fetch from Microsoft Graph API directly first, as these IDs are from there
      if (id.includes('=') || id.includes('/') || id.includes('+')) {
        // This looks like a Microsoft Graph ID, try fetching directly
        return await this.fetchEmailFromMicrosoftGraph(id, user.id);
      }

      // First try to get the email from ai_inbox_items table
      const { data: email, error } = await supabase
        .from('ai_inbox_items')
        .select('id, subject, sender_email, sender_name, content, html_content, preview, item_timestamp, is_read, is_important, has_attachments, thread_id, source_type, external_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If not found in ai_inbox_items, try to get from the emails table
        const { data: emailFromEmails, error: emailError } = await supabase
          .from('emails')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (emailError || !emailFromEmails) {
          // If not found in either table, try to fetch from Microsoft Graph API
          return await this.fetchEmailFromMicrosoftGraph(id, user.id);
        }

        // Return the email from the emails table (this will have limited content)
        const fullEmail = {
          id: emailFromEmails.id,
          subject: emailFromEmails.subject,
          sender_email: emailFromEmails.sender_email,
          sender_name: emailFromEmails.sender_name,
          content: emailFromEmails.body_preview, // Use preview as content
          html_content: undefined, // No HTML content available
          body_preview: emailFromEmails.body_preview,
          item_timestamp: emailFromEmails.item_timestamp,
          is_read: emailFromEmails.is_read,
          is_important: emailFromEmails.is_important,
          has_attachments: emailFromEmails.has_attachments,
          thread_id: emailFromEmails.thread_id,
          provider: emailFromEmails.provider as EmailProvider
        };

        return this.createSuccessResponse(fullEmail);
      }

      if (!email) {
        return this.createErrorResponse('Email not found');
      }

      // Map the database fields to our interface
      const fullEmail = {
        id: email.id,
        subject: email.subject,
        sender_email: email.sender_email,
        sender_name: email.sender_name,
        content: email.content, // Plain text content
        html_content: email.html_content, // HTML content
        body_preview: email.preview,
        item_timestamp: email.item_timestamp,
        is_read: email.is_read,
        is_important: email.is_important,
        has_attachments: email.has_attachments,
        thread_id: email.thread_id,
        provider: email.source_type === 'email' ? 'microsoft' as EmailProvider : undefined
      };

      return this.createSuccessResponse(fullEmail);
    } catch (error) {
      return this.handleError('Failed to get full email content', error);
    }
  }

  /**
   * Fetch email content directly from Microsoft Graph API
   */
  private async fetchEmailFromMicrosoftGraph(emailId: string, userId: string): Promise<ServiceResponse<{
    id: string;
    subject?: string;
    sender_email?: string;
    sender_name?: string;
    content?: string;
    html_content?: string;
    body_preview?: string;
    item_timestamp?: string;
    is_read?: boolean;
    is_important?: boolean;
    has_attachments?: boolean;
    thread_id?: string;
    provider?: EmailProvider;
  }>> {
    try {
      // Get the user's session token
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      
      if (!session?.access_token) {
        return this.createErrorResponse('User not authenticated');
      }

      // Call the Edge Function to get the full email content
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/ai_email_sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getEmail',
            emailId: emailId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if the error is due to missing email account setup
        if (errorData.error && errorData.error.includes('No email account found for user')) {
          return this.createErrorResponse(
            'Email integration not set up',
            'Please connect your Microsoft 365 account in the Integrations section to view emails. Go to Integrations → Microsoft 365 to get started.'
          );
        }
        
        return this.createErrorResponse(
          'Failed to fetch email from Microsoft Graph',
          errorData.error || `HTTP ${response.status}`
        );
      }

      const emailData = await response.json();
      
      if (!emailData.success || !emailData.data) {
        return this.createErrorResponse(
          'Failed to fetch email content',
          emailData.error || 'No email data returned'
        );
      }

      // Map the Microsoft Graph response to our interface
      const fullEmail = {
        id: emailId,
        subject: emailData.data.subject,
        sender_email: emailData.data.from?.emailAddress?.address,
        sender_name: emailData.data.from?.emailAddress?.name,
        content: emailData.data.body?.contentType === 'text' ? emailData.data.body.content : '',
        html_content: emailData.data.body?.contentType === 'html' ? emailData.data.body.content : '',
        body_preview: emailData.data.bodyPreview,
        item_timestamp: emailData.data.sentDateTime,
        is_read: emailData.data.isRead,
        is_important: emailData.data.importance === 'high',
        has_attachments: emailData.data.hasAttachments,
        thread_id: emailData.data.threadId,
        provider: 'microsoft' as EmailProvider
      };

      return this.createSuccessResponse(fullEmail);
    } catch (error) {
      return this.handleError('Failed to fetch email from Microsoft Graph', error);
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
    offset = 0,
    folder: 'inbox' | 'sent' | 'trash' | 'archive' | 'starred' = 'inbox'
  ): Promise<ServiceResponse<{ items: EmailItem[]; total: number }>> {
    try {
      // Validate filters
      const validatedFilters = EmailFiltersSchema.parse(filters);
      
      // Get current user
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // If provider is Microsoft, use the Edge Function
      if (validatedFilters.provider === 'microsoft' || !validatedFilters.provider) {
        return await this.getMicrosoftEmails(user.id, validatedFilters, limit, offset, folder);
      }

      // For other providers, use the database
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
        total: emailItems.length
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
   * Get Microsoft emails via Edge Function
   */
  private async getMicrosoftEmails(
    userId: string,
    filters: EmailFilters,
    limit: number,
    offset: number,
    folder: 'inbox' | 'sent' | 'trash' | 'archive' | 'starred' = 'inbox'
  ): Promise<ServiceResponse<{ items: EmailItem[]; total: number }>> {
    try {
      // Get the user's session token
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      
      // Debug logging
      console.log('🔍 [EmailService] Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        sessionError: sessionResult.error?.message,
        userId: session?.user?.id
      });
      
      if (!session?.access_token) {
        return this.createErrorResponse('User not authenticated');
      }

      // Build query parameters for the Edge Function
      const params = new URLSearchParams({
        userId: userId,
        top: limit.toString(),
        folder: folder,
      });

      // Add search filter if provided
      if (filters.search) {
        params.append('search', filters.search);
      }

      // Debug logging for the request
      console.log('🔍 [EmailService] Making Edge Function request:', {
        url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft_emails_list?${params.toString()}`,
        hasAuthHeader: !!session.access_token,
        tokenLength: session.access_token?.length,
        params: params.toString()
      });

      // Call the Microsoft Edge Function with user's JWT token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft_emails_list?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Debug logging for the response
      console.log('🔍 [EmailService] Edge Function response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EmailService] Edge Function error response:', errorText);
        return this.createErrorResponse(`Microsoft API failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Failed to fetch Microsoft emails');
      }

      // Transform Microsoft Graph API response to EmailItem format
      const emailItems: EmailItem[] = (result.data.items || []).map((item: any) => ({
        id: item.id,
        subject: item.subject,
        sender_email: item.from?.email,
        sender_name: item.from?.name,
        body_preview: item.preview,
        item_timestamp: item.receivedAt,
        is_read: false, // Microsoft Graph doesn't provide read status in this endpoint
        is_important: false, // Would need separate API call
        has_attachments: item.hasAttachments,
        provider: 'microsoft' as EmailProvider,
        // Enrich with AI analysis
        risk_score: this.calculateRiskScore(item),
        compliance_flags: this.analyzeCompliance(item),
        sentiment_score: this.analyzeSentiment(item),
        urgency_score: this.calculateUrgencyScore(item),
        ai_insights: this.generateAIInsights(item),
      }));

      this.logSuccess('Microsoft emails fetched successfully', { 
        total: emailItems.length
      });

      return this.createSuccessResponse({
        items: emailItems,
        total: result.data.count || emailItems.length,
      });
    } catch (error) {
      return this.handleError('Failed to fetch Microsoft emails', error);
    }
  }

  /**
   * Get Microsoft emails with automatic token refresh
   */

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId: string, isRead: boolean, provider: EmailProvider = 'microsoft'): Promise<ServiceResponse<boolean>> {
    try {
      this.validateIdParam(emailId);
      
      // Get current user
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // For Microsoft emails, we'll need to implement a separate Edge Function
      // For now, we'll just return success since Microsoft Graph API doesn't provide
      // read status in the current endpoint
      if (provider === 'microsoft') {
        this.logSuccess('Microsoft email read status would be updated', { emailId, isRead });
        return this.createSuccessResponse(true);
      }

      // For other providers, update in database
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
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
  async getSupportedProviders(): Promise<EmailProvider[]> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) return [];
      
      const connected: Set<EmailProvider> = new Set();
      
      // Check for Microsoft 365 integration in user_integrations table
      try {
        const { data: microsoftIntegration, error: microsoftError } = await supabase
          .from('user_integrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('integration_name', 'Microsoft 365')
          .maybeSingle();
        
        if (microsoftError) {
          this.logger.warn('Error checking Microsoft integration:', microsoftError);
        } else if (microsoftIntegration) {
          connected.add('microsoft');
        }
      } catch (error) {
        // Microsoft integration not found - this is expected if not connected
        this.logger.info('Microsoft integration not found for user');
      }
      
      // Check for Gmail integration in user_integrations table
      try {
        const { data: gmailIntegration, error: gmailError } = await supabase
          .from('user_integrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('integration_name', 'Gmail')
          .maybeSingle();
        
        if (gmailError) {
          this.logger.warn('Error checking Gmail integration:', gmailError);
        } else if (gmailIntegration) {
          connected.add('gmail');
        }
      } catch (error) {
        // Gmail integration not found - this is expected if not connected
        this.logger.info('Gmail integration not found for user');
      }
      
      return Array.from(connected);
    } catch (error) {
      this.logger.error('Error getting supported providers', error);
      return [];
    }
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
   * TODO: Replace with AI-powered risk assessment
   * - Use machine learning models for threat detection
   * - Analyze sender reputation and email patterns
   * - Integrate with security intelligence feeds
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
   * TODO: Replace with AI-powered compliance analysis
   * - Use NLP models for content classification
   * - Integrate with compliance frameworks (GDPR, HIPAA, etc.)
   * - Detect sensitive data patterns and PII
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
   * TODO: Replace with AI-powered sentiment analysis
   * - Use transformer models (BERT, GPT) for accurate sentiment
   * - Analyze context and tone beyond simple keywords
   * - Provide confidence scores and emotion detection
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
   * TODO: Replace with AI-powered urgency assessment
   * - Use ML models to understand business context
   * - Analyze sender importance and relationship patterns
   * - Consider time sensitivity and business impact
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
   * TODO: Replace with comprehensive AI-powered business intelligence
   * - Implement "See-Think-Act" framework for email analysis
   * - Extract business opportunities and actionable insights
   * - Build institutional knowledge from email patterns
   * - Generate predictive analytics and recommendations
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
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // For Microsoft and other providers, token management is handled by Edge Functions
      // and the user_integrations table. We don't need to manually revoke tokens here.
      this.logSuccess('Token revocation would be handled by integration management', { provider });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to revoke OAuth token', error);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(); 
