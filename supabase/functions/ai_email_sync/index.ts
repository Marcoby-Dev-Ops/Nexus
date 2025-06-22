/**
 * AI Email Sync Edge Function
 * Pillar: 2 - Minimum Lovable Feature Set
 * Handles email synchronization from various providers (Gmail, Outlook, IMAP/SMTP)
 * Features: OAuth integration, AI processing, real-time sync
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface EmailSyncRequest {
  account_id: string;
  job_type: 'full_sync' | 'incremental_sync' | 'send_email';
  sync_from?: string;
  sync_to?: string;
  folder_filter?: string[];
}

interface EmailAccount {
  id: string;
  email_address: string;
  provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
  access_token?: string;
  refresh_token?: string;
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
  use_ssl: boolean;
}

interface EmailMessage {
  message_id: string;
  thread_id?: string;
  subject?: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  body_text?: string;
  body_html?: string;
  snippet?: string;
  sent_at: string;
  has_attachments: boolean;
  attachment_count: number;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    const { account_id, job_type, sync_from, sync_to, folder_filter }: EmailSyncRequest = await req.json();

    if (!account_id || !job_type) {
      throw new Error('Missing required parameters: account_id, job_type');
    }

    // Get email account details
    const { data: account, error: accountError } = await supabaseClient
      .from('ai_email_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found or access denied');
    }

    // Create sync job record
    const { data: syncJob, error: jobError } = await supabaseClient
      .from('ai_email_sync_jobs')
      .insert({
        account_id,
        job_type,
        status: 'running',
        sync_from,
        sync_to,
        folder_filter,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create sync job: ${jobError.message}`);
    }

    // Process emails based on provider
    let syncResult;
    try {
      switch (account.provider) {
        case 'gmail':
          syncResult = await syncGmailAccount(account, syncJob, supabaseClient);
          break;
        case 'outlook':
          syncResult = await syncOutlookAccount(account, syncJob, supabaseClient);
          break;
        case 'imap':
          syncResult = await syncImapAccount(account, syncJob, supabaseClient);
          break;
        default:
          throw new Error(`Unsupported email provider: ${account.provider}`);
      }

      // Update sync job with success
      await supabaseClient
        .from('ai_email_sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_messages: syncResult.total_messages,
          processed_messages: syncResult.processed_messages,
          error_count: syncResult.error_count
        })
        .eq('id', syncJob.id);

      // Update account sync status
      await supabaseClient
        .from('ai_email_accounts')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
          sync_error: null
        })
        .eq('id', account_id);

      return new Response(JSON.stringify({
        success: true,
        job_id: syncJob.id,
        ...syncResult
      }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      // Update sync job with failure
      await supabaseClient
        .from('ai_email_sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message
        })
        .eq('id', syncJob.id);

      // Update account sync status
      await supabaseClient
        .from('ai_email_accounts')
        .update({
          sync_status: 'error',
          sync_error: syncError.message
        })
        .eq('id', account_id);

      throw syncError;
    }

  } catch (error) {
    console.error('Email sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Sync Gmail account using Gmail API
 */
async function syncGmailAccount(account: EmailAccount, syncJob: any, supabaseClient: any) {
  // TODO: Implement Gmail API integration
  // This would use the Gmail API with OAuth tokens to fetch emails
  
  // Mock implementation for now
  console.log('Syncing Gmail account:', account.email_address);
  
  const mockEmails: EmailMessage[] = [
    {
      message_id: 'gmail_msg_1',
      thread_id: 'gmail_thread_1',
      subject: 'Welcome to our service',
      from_email: 'welcome@example.com',
      from_name: 'Example Service',
      to_emails: [account.email_address],
      cc_emails: [],
      bcc_emails: [],
      body_text: 'Welcome to our service! We\'re excited to have you on board.',
      body_html: '<p>Welcome to our service! We\'re excited to have you on board.</p>',
      snippet: 'Welcome to our service! We\'re excited to have you...',
      sent_at: new Date().toISOString(),
      has_attachments: false,
      attachment_count: 0
    }
  ];

  return await processEmails(mockEmails, account, supabaseClient);
}

/**
 * Sync Outlook account using Microsoft Graph API
 */
async function syncOutlookAccount(account: EmailAccount, syncJob: any, supabaseClient: any) {
  console.log('Syncing Outlook account:', account.email_address);
  
  // Get stored Microsoft Graph access token
  const { data: tokenData, error: tokenError } = await supabaseClient
    .from('ai_integrations_oauth')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', account.user_id)
    .eq('provider', 'microsoft_graph')
    .single();
  
  if (tokenError || !tokenData) {
    throw new Error('No Microsoft Graph access token found. User needs to authenticate with Microsoft 365.');
  }
  
  let accessToken = tokenData.access_token;
  
  // Check if token is expired and refresh if needed
  if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
    console.log('Access token expired, attempting to refresh...');
    
    if (!tokenData.refresh_token) {
      throw new Error('Access token expired and no refresh token available. User needs to re-authenticate.');
    }
    
    try {
      accessToken = await refreshMicrosoftGraphToken(tokenData.refresh_token, account.user_id, supabaseClient);
    } catch (refreshError) {
      throw new Error(`Failed to refresh Microsoft Graph token: ${refreshError.message}. User needs to re-authenticate.`);
    }
  }
  
  try {
    // Fetch emails from Microsoft Graph API
    const emails = await fetchOutlookEmails(accessToken, syncJob.sync_from);
    
    // Process and store emails
    return await processEmails(emails, account, supabaseClient);
    
  } catch (error) {
    console.error('Microsoft Graph API error:', error);
    
    // If token is expired, we need user to re-authenticate
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new Error('Microsoft Graph access token expired. User needs to re-authenticate.');
    }
    
    throw error;
  }
}

/**
 * Fetch emails from Microsoft Graph Mail API
 */
async function fetchOutlookEmails(accessToken: string, syncFrom?: string): Promise<EmailMessage[]> {
  const baseUrl = 'https://graph.microsoft.com/v1.0/me/messages';
  
  // Build query parameters
  const params = new URLSearchParams({
    '$select': 'id,conversationId,subject,sender,toRecipients,ccRecipients,bccRecipients,replyTo,body,bodyPreview,sentDateTime,receivedDateTime,isRead,importance,hasAttachments',
    '$orderby': 'receivedDateTime desc',
    '$top': '50' // Fetch 50 emails per batch
  });
  
  // Add date filter if syncFrom is provided
  if (syncFrom) {
    params.append('$filter', `receivedDateTime ge ${syncFrom}`);
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Microsoft Graph API error: ${response.status} - ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const messages = data.value || [];
  
  // Convert Microsoft Graph message format to our EmailMessage format
  return messages.map((msg: any): EmailMessage => ({
    message_id: msg.id,
    thread_id: msg.conversationId,
    subject: msg.subject || '',
    from_email: msg.sender?.emailAddress?.address || '',
    from_name: msg.sender?.emailAddress?.name || '',
    to_emails: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    cc_emails: (msg.ccRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    bcc_emails: (msg.bccRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    body_text: msg.body?.contentType === 'text' ? msg.body?.content : '',
    body_html: msg.body?.contentType === 'html' ? msg.body?.content : '',
    snippet: msg.bodyPreview || '',
    sent_at: msg.sentDateTime,
    has_attachments: msg.hasAttachments || false,
    attachment_count: msg.hasAttachments ? 1 : 0 // Graph API doesn't provide exact count in this call
  }));
}

/**
 * Sync IMAP account using IMAP protocol
 */
async function syncImapAccount(account: EmailAccount, syncJob: any, supabaseClient: any) {
  // TODO: Implement IMAP integration
  console.log('Syncing IMAP account:', account.email_address);
  
  // Mock implementation
  const mockEmails: EmailMessage[] = [];
  return await processEmails(mockEmails, account, supabaseClient);
}

/**
 * Process and store emails in database
 */
async function processEmails(emails: EmailMessage[], account: EmailAccount, supabaseClient: any) {
  let processed_messages = 0;
  let error_count = 0;

  for (const email of emails) {
    try {
      // Check if email already exists
      const { data: existing } = await supabaseClient
        .from('ai_email_messages')
        .select('id')
        .eq('account_id', account.id)
        .eq('message_id', email.message_id)
        .single();

      if (existing) {
        continue; // Skip if already exists
      }

      // Generate AI insights for the email
      const aiInsights = await generateEmailInsights(email);

      // Insert email message
      const { error: insertError } = await supabaseClient
        .from('ai_email_messages')
        .insert({
          account_id: account.id,
          user_id: account.user_id,
          company_id: account.company_id,
          message_id: email.message_id,
          thread_id: email.thread_id,
          subject: email.subject,
          from_email: email.from_email,
          from_name: email.from_name,
          to_emails: email.to_emails,
          cc_emails: email.cc_emails,
          bcc_emails: email.bcc_emails,
          body_text: email.body_text,
          body_html: email.body_html,
          snippet: email.snippet,
          sent_at: email.sent_at,
          has_attachments: email.has_attachments,
          attachment_count: email.attachment_count,
          ai_summary: aiInsights.summary,
          ai_priority_score: aiInsights.priority_score,
          ai_category: aiInsights.category,
          ai_sentiment: aiInsights.sentiment,
          ai_action_required: aiInsights.action_required,
          ai_processed_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to insert email:', insertError);
        error_count++;
      } else {
        processed_messages++;
      }

    } catch (error) {
      console.error('Error processing email:', error);
      error_count++;
    }
  }

  return {
    total_messages: emails.length,
    processed_messages,
    error_count
  };
}

/**
 * Refresh Microsoft Graph access token using refresh token
 */
async function refreshMicrosoftGraphToken(refreshToken: string, userId: string, supabaseClient: any): Promise<string> {
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  
  const body = new URLSearchParams({
    client_id: Deno.env.get('AZURE_CLIENT_ID') || '',
    client_secret: Deno.env.get('AZURE_CLIENT_SECRET') || '',
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read'
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${response.status} - ${error.error_description || response.statusText}`);
  }
  
  const tokenData = await response.json();
  
  // Update stored tokens
  await supabaseClient
    .from('ai_integrations_oauth')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // Keep old refresh token if new one not provided
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('provider', 'microsoft_graph');
  
  return tokenData.access_token;
}

/**
 * Generate AI insights for an email using OpenAI
 */
async function generateEmailInsights(email: EmailMessage) {
  // TODO: Implement OpenAI integration for email analysis
  // This would analyze the email content and generate insights
  
  // Mock implementation for now
  const content = email.body_text || email.snippet || email.subject || '';
  
  // Simple heuristics for demo purposes
  const priority_score = content.toLowerCase().includes('urgent') ? 9 :
                        content.toLowerCase().includes('important') ? 7 :
                        content.toLowerCase().includes('meeting') ? 6 : 5;
  
  const category = content.toLowerCase().includes('invoice') ? 'finance' :
                  content.toLowerCase().includes('meeting') ? 'calendar' :
                  content.toLowerCase().includes('support') ? 'support' :
                  content.toLowerCase().includes('marketing') ? 'marketing' : 'general';
  
  const sentiment = content.toLowerCase().includes('thank') ? 'positive' :
                   content.toLowerCase().includes('problem') ? 'negative' : 'neutral';
  
  const action_required = content.toLowerCase().includes('action') ||
                         content.toLowerCase().includes('respond') ||
                         content.toLowerCase().includes('reply');

  return {
    summary: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
    priority_score,
    category,
    sentiment: sentiment as 'positive' | 'neutral' | 'negative',
    action_required
  };
} 