import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectWithOptions, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { z } from 'zod';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Zod schemas for validation
export const EmailItemSchema = z.object({
  id: z.string().optional(),
  subject: z.string().optional(),
  sender_email: z.string().email().optional(),
  sender_name: z.string().optional(),
  body_preview: z.string().optional(),
  content: z.string().optional(),
  html_content: z.string().optional(),
  item_timestamp: z.string().optional(),
  is_read: z.boolean().default(false),
  is_important: z.boolean().default(false),
  has_attachments: z.boolean().default(false),
  thread_id: z.string().optional(),
  categories: z.array(z.string()).optional(),
  importance: z.enum(['low', 'normal', 'high']).default('normal'),
  provider: z.enum(['microsoft', 'gmail', 'outlook', 'yahoo']).default('microsoft'),
  external_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const EmailFiltersSchema = z.object({
  search: z.string().optional(),
  is_read: z.boolean().optional(),
  is_important: z.boolean().optional(),
  has_attachments: z.boolean().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  category: z.string().optional(),
  provider: z.enum(['microsoft', 'gmail', 'outlook', 'yahoo']).optional(),
});

export type EmailProvider = 'microsoft' | 'gmail' | 'outlook' | 'yahoo';

export interface EmailItem {
  id: string;
  subject?: string;
  sender_email?: string;
  sender_name?: string;
  body_preview?: string;
  content?: string;
  html_content?: string;
  item_timestamp?: string;
  is_read?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
  thread_id?: string;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  provider?: EmailProvider;
  external_id?: string;
  metadata?: Record<string, any>;
}

export interface EmailFilters {
  search?: string;
  is_read?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
  date_from?: string;
  date_to?: string;
  category?: string;
  provider?: EmailProvider;
}

export interface EmailStats {
  total: number;
  unread: number;
  important: number;
  withAttachments: number;
}

/**
 * Simple Email Service
 * Handles all email operations in one clean service
 */
export class EmailService extends BaseService implements CrudServiceInterface<EmailItem> {
  constructor() {
    super('email');
  }

  /**
   * Get an email by ID
   */
  async get(id: string): Promise<ServiceResponse<EmailItem>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get email from integration_data table
      const { data: email, error } = await selectOne('integration_data', {
        id,
        user_id: user.id,
      });

      if (error || !email) {
        return this.createErrorResponse('Email not found');
      }

      return this.createSuccessResponse(this.mapEmailData(email));
    } catch (error) {
      return this.handleError('Failed to get email', error);
    }
  }

  /**
   * Get full email content by ID
   */
  async getFullEmail(id: string): Promise<ServiceResponse<EmailItem>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get from integration_data which has full content
      const { data: email, error } = await selectOne('integration_data', {
        id,
        user_id: user.id,
      });

      if (error || !email) {
        return this.createErrorResponse('Email not found');
      }

      return this.createSuccessResponse(this.mapEmailData(email));
    } catch (error) {
      return this.handleError('Failed to get full email content', error);
    }
  }

  /**
   * Create a new email
   */
  async create(data: Partial<EmailItem>): Promise<ServiceResponse<EmailItem>> {
    try {
      const validatedData = EmailItemSchema.parse(data);
      
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data: email, error } = await insertOne('integration_data', {
          user_id: user.id,
          raw_json: validatedData,
          processed_data: validatedData,
      });

      if (error) {
        return this.createErrorResponse('Failed to create email', error);
      }

      this.logSuccess('Email created successfully', { emailId: email.id });
      return this.createSuccessResponse(this.mapEmailData(email));
    } catch (error) {
      return this.handleError('Failed to create email', error);
    }
  }

  /**
   * Update an email
   */
  async update(id: string, data: Partial<EmailItem>): Promise<ServiceResponse<EmailItem>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data: email, error } = await updateOne('integration_data', {
        id,
        user_id: user.id,
      }, { 
        processed_data: data 
      });

      if (error) {
        return this.createErrorResponse('Failed to update email', error);
      }

      this.logSuccess('Email updated successfully', { emailId: id });
      return this.createSuccessResponse(this.mapEmailData(email));
    } catch (error) {
      return this.handleError('Failed to update email', error);
    }
  }

  /**
   * Delete an email
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await deleteOne('integration_data', {
        id,
        user_id: user.id,
      });

      if (error) {
        return this.createErrorResponse('Failed to delete email', error);
      }

      this.logSuccess('Email deleted successfully', { emailId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to delete email', error);
    }
  }

  /**
   * List emails
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<EmailItem[]>> {
    try {
      const emailFilters: EmailFilters = filters as EmailFilters || {};
      const result = await this.getEmails(emailFilters);
      return this.createSuccessResponse(result.data?.items || []);
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
      const validatedFilters = EmailFiltersSchema.parse(filters);
      
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Build query filters
      const queryFilters: Record<string, any> = {
        user_id: user.id?.toString() || user.id,
      };

      if (validatedFilters.is_read !== undefined) {
        queryFilters.is_read = validatedFilters.is_read;
      }

      if (validatedFilters.is_important !== undefined) {
        queryFilters.is_important = validatedFilters.is_important;
      }

      if (validatedFilters.has_attachments !== undefined) {
        queryFilters.has_attachments = validatedFilters.has_attachments;
      }

      if (validatedFilters.provider) {
        queryFilters.provider = validatedFilters.provider;
      }

      // Get emails from integration_data table
      const { data: emails, error: emailsError } = await selectWithOptions('integration_data', {
        filter: queryFilters,
        orderBy: { column: 'synced_at', ascending: false },
        limit,
      });

      if (emailsError) {
        this.logger.warn('Error fetching emails:', emailsError);
      }

      // Map emails from integration_data
      const allEmails = (emails || []).map(email => this.mapEmailData(email));

      // Apply search filter if provided
      let filteredEmails = allEmails;
      if (validatedFilters.search) {
        const searchTerm = validatedFilters.search.toLowerCase();
        filteredEmails = allEmails.filter(email => 
          email.subject?.toLowerCase().includes(searchTerm) ||
          email.body_preview?.toLowerCase().includes(searchTerm) ||
          email.sender_email?.toLowerCase().includes(searchTerm) ||
          email.sender_name?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply date filters if provided
      if (validatedFilters.date_from || validatedFilters.date_to) {
        filteredEmails = filteredEmails.filter(email => {
          if (!email.item_timestamp) return true;
          const emailDate = new Date(email.item_timestamp);
          
          if (validatedFilters.date_from) {
            const fromDate = new Date(validatedFilters.date_from);
            if (emailDate < fromDate) return false;
          }
          
          if (validatedFilters.date_to) {
            const toDate = new Date(validatedFilters.date_to);
            if (emailDate > toDate) return false;
          }
          
          return true;
        });
      }

      this.logSuccess('Emails fetched successfully', { 
        total: filteredEmails.length
      });

      return this.createSuccessResponse({
        items: filteredEmails,
        total: filteredEmails.length,
      });
    } catch (error) {
      return this.handleError('Failed to fetch emails', error);
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId: string, isRead: boolean): Promise<ServiceResponse<boolean>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update email read status in integration_data table
      const { error: updateError } = await updateOne('integration_data', emailId, { 
        processed_data: { is_read: isRead }
      });

      if (updateError) {
        return this.createErrorResponse('Failed to update email read status', updateError);
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
  async getInboxStats(): Promise<ServiceResponse<EmailStats>> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get stats from integration_data table
      const { data: emails, error: emailsError } = await select('integration_data', {
        user_id: user.id?.toString() || user.id,
      });

      if (emailsError) {
        this.logger.warn('Error fetching email stats:', emailsError);
      }

      const allEmails = (emails || []).map(email => this.mapEmailData(email));

      const stats: EmailStats = {
        total: allEmails.length,
        unread: allEmails.filter(e => !e.is_read).length,
        important: allEmails.filter(e => e.is_important).length,
        withAttachments: allEmails.filter(e => e.has_attachments).length,
      };

      this.logSuccess('Email stats fetched successfully', stats);
      return this.createSuccessResponse(stats);
    } catch (error) {
      return this.handleError('Failed to fetch email stats', error);
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
      
      // Get all user integrations and check for email providers
      try {
        const { data: integrations } = await select('user_integrations', {
          user_id: user.id?.toString() || user.id,
        });
        
        if (integrations) {
          integrations.forEach((integration: any) => {
            if (integration.integration_slug === 'microsoft365') {
              connected.add('microsoft');
            } else if (integration.integration_slug === 'gmail') {
              connected.add('gmail');
            }
          });
        }
      } catch (error) {
        this.logger.info('No integrations found for user');
      }
      
      return Array.from(connected);
    } catch (error) {
      this.logger.error('Error getting supported providers', error);
      return [];
    }
  }

  /**
   * Map database email data to EmailItem interface
   */
  private mapEmailData(email: any): EmailItem {
    // Extract data from integration_data structure
    const rawData = email.raw_json || {};
    const processedData = email.processed_data || {};
    
    return {
      id: email.id,
      subject: rawData.subject || processedData.subject,
      sender_email: rawData.sender_email || processedData.sender_email,
      sender_name: rawData.sender_name || processedData.sender_name,
      body_preview: rawData.body_preview || rawData.preview || processedData.body_preview,
      content: rawData.content || processedData.content,
      html_content: rawData.html_content || processedData.html_content,
      item_timestamp: email.synced_at || rawData.item_timestamp || processedData.item_timestamp,
      is_read: processedData.is_read || false,
      is_important: processedData.is_important || false,
      has_attachments: processedData.has_attachments || false,
      thread_id: rawData.thread_id || processedData.thread_id,
      categories: rawData.categories || processedData.categories || [],
      importance: processedData.importance || 'normal',
      provider: processedData.provider || 'microsoft',
      external_id: email.source_id || rawData.external_id || processedData.external_id,
      metadata: email.raw_json || {},
    };
  }
}

// Export singleton instance
export const emailService = new EmailService(); 
