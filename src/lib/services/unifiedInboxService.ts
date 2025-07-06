/**
 * Unified Inbox Service
 * Pillar: 2 - Minimum Lovable Feature Set
 * Handles emails, notifications, tasks, and system messages in one unified interface
 * Features: AI-powered prioritization, smart filtering, real-time updates
 */

// // import { Office365SyncProvider } from '../sync/office365';
// import { EmailProcessor } from './emailProcessor';
import { supabase } from '@/lib/core/supabase';
import { logger } from '@/lib/security/logger';

export interface EmailAccount {
  id: string;
  user_id: string;
  company_id: string;
  email_address: string;
  display_name?: string;
  provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
  sync_enabled: boolean;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  last_sync_at?: string;
  sync_error?: string;
  sync_frequency?: string;
  ai_priority_enabled?: boolean;
  ai_summary_enabled?: boolean;
  ai_suggestions_enabled?: boolean;
  ai_auto_categorize_enabled?: boolean;
  created_at: string;
}

export interface EmailMessage {
  id: string;
  account_id: string;
  message_id: string;
  thread_id?: string;
  subject?: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  body_text?: string;
  body_html?: string;
  snippet?: string;
  sent_at: string;
  is_read: boolean;
  is_important: boolean;
  has_attachments: boolean;
  attachment_count: number;
  ai_summary?: string;
  ai_priority_score?: number;
  ai_category?: string;
  ai_sentiment?: 'positive' | 'neutral' | 'negative';
  ai_action_required: boolean;
}

export interface InboxItem {
  id: string;
  user_id: string;
  company_id?: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  recipient_email: string;
  content?: string;
  html_content?: string;
  message_id?: string;
  thread_id?: string;
  in_reply_to?: string;
  email_references?: string[];
  ai_priority_score?: number;
  ai_category?: string;
  ai_sentiment?: string;
  ai_summary?: string;
  ai_action_items?: string[];
  ai_processed_at?: string;
  status?: string;
  is_important?: boolean;
  is_flagged?: boolean;
  snooze_until?: string;
  integration_id?: string;
  source_type?: string;
  external_id?: string;
  received_at: string;
  created_at?: string;
  updated_at?: string;
  
  // Computed fields for compatibility
  item_type?: 'email' | 'notification' | 'system' | 'task' | 'calendar';
  title?: string;
  preview?: string;
  sender?: string;
  is_read?: boolean;
  is_archived?: boolean;
  priority_score?: number;
  item_timestamp?: string;
  ai_action_suggestion?: string;
  ai_urgency?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Expanded fields when joined with source data
  email_data?: EmailMessage;
  body_preview?: string;
}

export interface InboxSummary {
  total_items: number;
  unread_count: number;
  important_count: number;
  urgent_count: number;
  categories: string[];
  last_updated: string;
}

export interface InboxFilters {
  is_read?: boolean;
  is_important?: boolean;
  item_type?: string[];
  ai_urgency?: string[];
  ai_category?: string[];
  sender?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface EmailSyncJob {
  id: string;
  account_id: string;
  job_type: 'full_sync' | 'incremental_sync' | 'send_email';
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_messages: number;
  processed_messages: number;
  error_count: number;
  created_at: string;
}

class UnifiedInboxService {
  /**
   * Get inbox items with filtering and pagination
   */
  async getInboxItems(
    filters: InboxFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ items: InboxItem[]; total: number }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      let query = supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_archived', false)
        .order('item_timestamp', { ascending: false });

      // Apply filters
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      
      if (filters.is_important !== undefined) {
        query = query.eq('is_important', filters.is_important);
      }
      
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,preview.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,snippet.ilike.%${filters.search}%`
        );
      }

      const { count } = await supabase
        .from('ai_inbox_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('is_archived', false);

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        logger.error({ error }, 'Failed to fetch inbox items');
        throw error;
      }

      // Transform data to include computed fields for UI compatibility
      const transformedItems = (data || []).map(item => {
        // Title fallback: new column `title` or legacy `subject`
        const computedTitle =
          (item as any).title ||
          (item as any).subject ||
          '(No subject)';

        // Preview fallback: new `preview`, AI suggestion, legacy `snippet`, or start of `content`
        const computedPreview =
          (item as any).preview ||
          (item as any).ai_action_suggestion ||
          (item as any).snippet ||
          ((item as any).content ? ((item as any).content as string).slice(0, 120) : '');

        // Sender fallback: new `sender`, or legacy sender_name/email
        const computedSender =
          (item as any).sender ||
          (item as any).sender_name ||
          (item as any).sender_email ||
          '';

        // Priority score fallback: new `priority_score` or legacy `ai_priority_score`
        const computedPriority =
          (item as any).priority_score ?? (item as any).ai_priority_score ?? 5;

        // Timestamp fallback
        const computedTimestamp =
          (item as any).item_timestamp ||
          (item as any).received_at ||
          (item as any).created_at;

        const urgency = computedPriority >= 8 ? 'urgent' :
                        computedPriority >= 6 ? 'high' :
                        computedPriority >= 4 ? 'medium' : 'low';

        return {
          ...item,
          // Computed fields for UI compatibility
          item_type: (item as any).item_type || 'email',
          title: computedTitle,
          preview: computedPreview,
          sender: computedSender,
          is_read: (item as any).is_read,
          is_archived: (item as any).is_archived,
          priority_score: computedPriority,
          item_timestamp: computedTimestamp,
          ai_urgency: urgency as 'low' | 'medium' | 'high' | 'urgent',
        };
      });

      return {
        items: transformedItems,
        total: count || 0
      };
    } catch (error) {
      logger.error({ error }, 'Error in getInboxItems');
      throw error;
    }
  }

  /**
   * Get inbox summary statistics
   */
  async getInboxSummary(): Promise<InboxSummary> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_inbox_summary', { p_user_id: user.user.id });

      if (error) {
        logger.error({ error }, 'Failed to get inbox summary');
        throw error;
      }

      return data || {
        total_items: 0,
        unread_count: 0,
        important_count: 0,
        urgent_count: 0,
        categories: [],
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Error in getInboxSummary');
      throw error;
    }
  }

  /**
   * Mark an item as read or unread
   */
  async markAsRead(itemId: string, isRead = true): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ is_read: isRead })
      .eq('id', itemId)
      .eq('user_id', user.id);
    if (error) {
      logger.error({ error, itemId }, 'Failed to mark item as read');
      throw error;
    }
  }

  /**
   * Mark multiple items as read or unread
   */
  async markMultipleAsRead(itemIds: string[], isRead = true): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ is_read: isRead })
      .in('id', itemIds)
      .eq('user_id', user.id);
    if (error) {
      logger.error({ error, itemIds }, 'Failed to mark multiple items as read');
      throw error;
    }
  }

  /**
   * Archive an item
   */
  async archiveItem(itemId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ is_archived: true })
      .eq('id', itemId)
      .eq('user_id', user.id);
    if (error) {
      logger.error({ error, itemId }, 'Failed to archive item');
      throw error;
    }
  }
  
  /**
   * Archive multiple items
   */
  async archiveMultiple(itemIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ is_archived: true })
      .in('id', itemIds)
      .eq('user_id', user.id);
    if (error) {
      logger.error({ error, itemIds }, 'Failed to archive multiple items');
      throw error;
    }
  }

  /**
   * Toggle an item's important status
   */
  async toggleImportant(itemId: string): Promise<void> {
    try {
      // Get current status
      const { data: item } = await supabase
        .from('ai_inbox_items')
        .select('is_important')
        .eq('id', itemId)
        .single();

      if (!item) throw new Error('Item not found');

      const { error } = await supabase
        .from('ai_inbox_items')
        .update({ 
          is_important: !item.is_important, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', itemId);

      if (error) {
        logger.error({ error, itemId }, 'Failed to toggle important status');
        throw error;
      }
    } catch (error) {
      logger.error({ error }, 'Error in toggleImportant');
      throw error;
    }
  }

  /**
   * Get email accounts for the current user
   */
  async getEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const { data, error } = await supabase
        .from('ai_email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error({ error }, 'Failed to fetch email accounts');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error }, 'Error in getEmailAccounts');
      throw error;
    }
  }

  /**
   * Add email account
   */
  async addEmailAccount(accountData: {
    email_address: string;
    display_name?: string;
    provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
    access_token?: string;
    refresh_token?: string;
    imap_host?: string;
    imap_port?: number;
    smtp_host?: string;
    smtp_port?: number;
    sync_frequency?: string;
    ai_priority_enabled?: boolean;
    ai_summary_enabled?: boolean;
    ai_suggestions_enabled?: boolean;
    ai_auto_categorize_enabled?: boolean;
  }): Promise<EmailAccount> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get user's company
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.company_id) throw new Error('User company not found');

      const { data, error } = await supabase
        .from('ai_email_accounts')
        .upsert(
          {
            user_id: user.user.id,
            company_id: profile.company_id,
            ...accountData,
          },
          {
            onConflict: 'user_id,email_address',
            ignoreDuplicates: false,
          },
        )
        .select()
        .single();

      if (error) {
        logger.error({ error }, 'Failed to add email account');
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ error }, 'Error in addEmailAccount');
      throw error;
    }
  }

  /**
   * Remove email account
   */
  async removeEmailAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_email_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        logger.error({ error, accountId }, 'Failed to remove email account');
        throw error;
      }
    } catch (error) {
      logger.error({ error }, 'Error in removeEmailAccount');
      throw error;
    }
  }

  /**
   * Get sync jobs for monitoring
   */
  async getSyncJobs(accountId?: string): Promise<EmailSyncJob[]> {
    try {
      let query = supabase
        .from('ai_email_sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ error }, 'Failed to fetch sync jobs');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error }, 'Error in getSyncJobs');
      throw error;
    }
  }

  /**
   * Get available categories for filtering
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_inbox_items')
        .select('ai_category')
        .not('ai_category', 'is', null)
        .eq('is_archived', false);

      if (error) {
        logger.error({ error }, 'Failed to fetch categories');
        throw error;
      }

      const categories = [...new Set(data.map(item => item.ai_category).filter(Boolean))];
      return categories.sort();
    } catch (error) {
      logger.error({ error }, 'Error in getCategories');
      throw error;
    }
  }

  /**
   * Get AI-powered inbox insights
   */
  async getInboxInsights(): Promise<{
    top_senders: Array<{ sender: string; count: number; avg_priority: number }>;
    category_breakdown: Array<{ category: string; count: number; unread_count: number }>;
    urgency_distribution: Array<{ urgency: string; count: number }>;
    response_suggestions: Array<{ item_id: string; suggestion: string }>;
  }> {
    try {
      // Top senders analysis
      const { data: senderData } = await supabase
        .from('ai_inbox_items')
        .select('sender, priority_score')
        .eq('is_archived', false);

      const senderMap = new Map<string, { count: number; total_priority: number }>();
      senderData?.forEach(item => {
        const senderKey = item.sender;
        if (senderKey) {
          const existing = senderMap.get(senderKey) || { count: 0, total_priority: 0 };
          senderMap.set(senderKey, {
            count: existing.count + 1,
            total_priority: existing.total_priority + (item.priority_score || 5)
          });
        }
      });

      const top_senders = Array.from(senderMap.entries())
        .map(([sender, stats]) => ({
          sender,
          count: stats.count,
          avg_priority: Math.round(stats.total_priority / stats.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Category breakdown
      const { data: categoryData } = await supabase
        .from('ai_inbox_items')
        .select('ai_category, is_read')
        .not('ai_category', 'is', null)
        .eq('is_archived', false);

      const categoryMap = new Map<string, { count: number; unread_count: number }>();
      categoryData?.forEach(item => {
        if (item.ai_category) {
          const existing = categoryMap.get(item.ai_category) || { count: 0, unread_count: 0 };
          categoryMap.set(item.ai_category, {
            count: existing.count + 1,
            unread_count: existing.unread_count + (item.is_read ? 0 : 1)
          });
        }
      });

      const category_breakdown = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.count - a.count);

      // Urgency distribution (computed from priority_score)
      const { data: urgencyData } = await supabase
        .from('ai_inbox_items')
        .select('priority_score')
        .not('priority_score', 'is', null)
        .eq('is_archived', false);

      const urgencyMap = new Map<string, number>();
      urgencyData?.forEach(item => {
        if (item.priority_score !== null) {
          const urgency = item.priority_score >= 8 ? 'urgent' :
                         item.priority_score >= 6 ? 'high' :
                         item.priority_score >= 4 ? 'medium' : 'low';
          urgencyMap.set(urgency, (urgencyMap.get(urgency) || 0) + 1);
        }
      });

      const urgency_distribution = Array.from(urgencyMap.entries())
        .map(([urgency, count]) => ({ urgency, count }))
        .sort((a, b) => {
          const order = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (order[b.urgency as keyof typeof order] || 0) - (order[a.urgency as keyof typeof order] || 0);
        });

      // Response suggestions (using ai_action_suggestion instead of ai_summary)
      const { data: actionItems } = await supabase
        .from('ai_inbox_items')
        .select('id, ai_action_suggestion')
        .not('ai_action_suggestion', 'is', null)
        .eq('is_read', false)
        .eq('is_archived', false)
        .limit(5);

      const response_suggestions = (actionItems || []).map(item => ({
        item_id: item.id,
        suggestion: item.ai_action_suggestion
      }));

      return {
        top_senders,
        category_breakdown,
        urgency_distribution,
        response_suggestions
      };
    } catch (error) {
      logger.error({ error }, 'Error in getInboxInsights');
      throw error;
    }
  }

  /**
   * Subscribe to real-time inbox updates
   */
  subscribeToInboxUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('unified-inbox-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_inbox_items' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  /**
   * Start a new email sync job
   */
  async startEmailSync(
    accountId: string,
    jobType: 'full_sync' | 'incremental_sync' = 'incremental_sync'
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai_email_sync', {
      body: {
        account_id: accountId,
        job_type: jobType,
      },
    });

    if (error) {
      logger.error({ error, accountId, jobType }, 'Failed to invoke email sync function');
      throw error;
    }
    return data;
  }

  /**
   * Migrate existing Office 365 integrations to ai_email_accounts for the current user/org.
   * Upserts an account for each active 365 integration not already present in ai_email_accounts.
   * Triggers a sync job for each new account.
   */
  async migrateOffice365IntegrationsToEmailAccounts(): Promise<{ created: number, skipped: number, errors: string[] }> {
    console.log('Starting Office 365 migration...');
    const results = { created: 0, skipped: 0, errors: [] };
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const error = 'User not authenticated';
        console.error(error);
        results.errors.push(error);
        return results;
      }
      console.log('User authenticated:', user.id);
      
      // Get user's company
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) {
        const error = 'User company not found';
        console.error(error);
        results.errors.push(error);
        return results;
      }
      console.log('Company found:', profile.company_id);

      // Get Office 365 integration id
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'office-365')
        .single();
        
      if (!integration) {
        const error = 'Office 365 integration not found';
        console.error(error);
        results.errors.push(error);
        return results;
      }
      console.log('Integration found:', integration.id);

      // Get all active user_integrations for this user/org/integration
      const { data: userIntegrations, error: userIntError } = await supabase
        .from('user_integrations')
        .select('id, credentials, status, updated_at')
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id)
        .eq('integration_id', integration.id)
        .eq('status', 'active');
        
      if (userIntError) {
        console.error('Error fetching user integrations:', userIntError);
        results.errors.push(`Error fetching integrations: ${userIntError.message}`);
        return results;
      }
      
      if (!userIntegrations || userIntegrations.length === 0) {
        console.log('No active Office 365 integrations found');
        return results;
      }
      
      console.log(`Found ${userIntegrations.length} integration(s) to process`);

      for (const integ of userIntegrations) {
        console.log(`Processing integration ${integ.id}...`);
        
        // Try to get email from credentials
        let email: string | undefined = undefined;
        let displayName: string | undefined = undefined;
        
        if (integ.credentials) {
          // Try different possible locations in credentials
          email = integ.credentials.username || 
                 integ.credentials.email ||
                 (typeof integ.credentials === 'string' ? integ.credentials : undefined);
          
          console.log('Email from credentials:', email || 'Not found');
        }
        
        // If no email from credentials, try Microsoft Graph
        if (!email) {
          email = user.email;
          console.log('Using user email as fallback:', email || 'Not available');
        }
        
        if (!email) {
          console.error('Could not determine email for integration:', integ.id);
          results.errors.push(`Could not determine email for integration: ${integ.id}`);
          continue;
        }

        // Check if already in ai_email_accounts
        const { data: existing } = await supabase
          .from('ai_email_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('company_id', profile.company_id)
          .eq('email_address', email)
          .eq('provider', 'outlook')
          .maybeSingle();
          
        if (existing) {
          console.log(`Account already exists for ${email}, skipping`);
          results.skipped++;
          continue;
        }

        // Upsert new account
        try {
          console.log(`Creating account for ${email}...`);
          const { data: created, error: insertError } = await supabase
            .from('ai_email_accounts')
            .insert({
              user_id: user.id,
              company_id: profile.company_id,
              email_address: email,
              display_name: displayName || email,
              provider: 'outlook',
              sync_enabled: true,
              sync_status: 'pending',
              ai_priority_enabled: true,
              ai_summary_enabled: true,
              ai_suggestions_enabled: true,
              ai_auto_categorize_enabled: false,
              sync_frequency: '15min',
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Failed to insert account:', insertError);
            results.errors.push(`Failed to insert account for ${email}: ${insertError.message}`);
            continue;
          }
          
          console.log(`Account created with ID ${created.id}`);
          results.created++;

          // Start sync job
          try {
            console.log(`Starting sync job for account ${created.id}...`);
            await this.startEmailSync(created.id, 'full_sync');
            console.log('Sync job started successfully');
          } catch (err) {
            console.warn('Failed to start sync job:', err);
            // Not fatal
          }
        } catch (err) {
          console.error('Error creating account:', err);
          results.errors.push(`Error creating account for ${email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      console.error('Migration failed:', err);
      results.errors.push(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    console.log('Migration complete:', results);
    return results;
  }

  /**
   * Discover integrations that can be activated as mailboxes (no ai_email_accounts row yet).
   */
  async discoverActivatableIntegrations(): Promise<Array<{integrationId: string, provider: string, email: string, displayName?: string}>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!profile?.company_id) return [];

    // Get all active user_integrations for this user/org
    const { data: userIntegrations } = await supabase
      .from('user_integrations')
      .select('id, integration_id, credentials, status, integration:integration_id(slug, provider, name)')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id)
      .eq('status', 'active');
    if (!userIntegrations) return [];

    // For each, check if an ai_email_accounts row exists
    const activatable: Array<{integrationId: string, provider: string, email: string, displayName?: string}> = [];
    for (const integ of userIntegrations) {
      // Only consider office-365 for now (can add more later)
      if (integ.integration?.slug !== 'office-365') continue;
      const email = integ.credentials?.username || integ.credentials?.email || undefined;
      const displayName = integ.credentials?.displayName || undefined;
      // If no email, skip
      if (!email) continue;
      // Check if already in ai_email_accounts
      const { data: existing } = await supabase
        .from('ai_email_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id)
        .eq('email_address', email)
        .eq('provider', 'outlook')
        .maybeSingle();
      if (existing) continue;
      activatable.push({
        integrationId: integ.id,
        provider: 'outlook',
        email,
        displayName
      });
    }
    return activatable;
  }

  /**
   * Activate a user_integration as a mailbox (create ai_email_accounts row and trigger sync).
   */
  async activateIntegrationAsMailbox(integrationId: string): Promise<EmailAccount> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!profile?.company_id) throw new Error('User company not found');
    // Get the integration
    const { data: integ } = await supabase
      .from('user_integrations')
      .select('id, credentials, integration:integration_id(slug, provider, name)')
      .eq('id', integrationId)
      .single();
    if (!integ) throw new Error('Integration not found');
    if (integ.integration?.slug !== 'office-365') throw new Error('Only office-365 supported for activation');
    const email = integ.credentials?.username || integ.credentials?.email || undefined;
    const displayName = integ.credentials?.displayName || email;
    if (!email) throw new Error('No email found in integration credentials');
    // Upsert ai_email_accounts
    const { data: created, error: insertError } = await supabase
      .from('ai_email_accounts')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        email_address: email,
        display_name: displayName || email,
        provider: 'outlook',
        sync_enabled: true,
        sync_status: 'pending',
        ai_priority_enabled: true,
        ai_summary_enabled: true,
        ai_suggestions_enabled: true,
        ai_auto_categorize_enabled: false,
        sync_frequency: '15min',
      })
      .select()
      .single();
    if (insertError) throw insertError;
    // Start sync job
    try {
      await this.startEmailSync(created.id, 'full_sync');
    } catch (err) {
      // Not fatal
    }
    return created;
  }
}

export const unifiedInboxService = new UnifiedInboxService(); 