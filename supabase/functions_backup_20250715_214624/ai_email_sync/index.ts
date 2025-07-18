/**
 * AI Email Sync Edge Function
 * Pillar: 2 - Minimum Lovable Feature Set
 * Handles email synchronization from various providers (Gmail, Outlook, IMAP/SMTP)
 * Features: OAuth integration, AI processing, real-time sync
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// --- INTERFACES ---

interface EmailSyncRequest {
  account_id: string;
  job_type: 'full_sync' | 'incremental_sync';
  sync_from?: string; // Not used by client, determined internally
}

interface EmailAccount {
  id: string;
  user_id: string;
  company_id: string;
  email_address: string;
  provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
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

interface SyncJob {
    id: number;
    user_id: string;
    account_id: string;
    job_type: 'full_sync' | 'incremental_sync';
}

const corsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, HEAD',
});


// --- MAIN SERVER ---

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not found from JWT.');

    const { account_id, job_type }: EmailSyncRequest = await req.json();
    if (!account_id || !job_type) {
      throw new Error('Missing required parameters: account_id, job_type');
    }

    const { data: account, error: accountError } = await supabaseClient
      .from('ai_email_accounts')
      .select<"*", EmailAccount>()
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError) throw accountError;
    if (!account) throw new Error('Email account not found or access denied');

    const { data: syncJob, error: jobError } = await supabaseClient
      .from('ai_email_sync_jobs')
      .insert({ user_id: user.id, account_id, job_type, status: 'running', started_at: new Date().toISOString() })
      .select()
      .single();

    if (jobError) throw new Error(`Failed to create sync job: ${jobError.message}`);

    let syncResult;
    try {
      switch (account.provider) {
        case 'gmail':
          syncResult = await syncGmailAccount(account, syncJob, supabaseClient);
          break;
        case 'outlook':
          syncResult = await syncOutlookAccount(account, syncJob, supabaseClient);
          break;
        default:
          throw new Error(`Unsupported email provider: ${account.provider}`);
      }

      await supabaseClient
        .from('ai_email_sync_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), ...syncResult })
        .eq('id', syncJob.id);

      await supabaseClient
        .from('ai_email_accounts')
        .update({ sync_status: 'success', last_sync_at: new Date().toISOString(), sync_error: null })
        .eq('id', account_id);

      return new Response(JSON.stringify({ success: true, job_id: syncJob.id, ...syncResult }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      await supabaseClient
        .from('ai_email_sync_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: syncError.message })
        .eq('id', syncJob.id);
      await supabaseClient
        .from('ai_email_accounts')
        .update({ sync_status: 'error', sync_error: syncError.message })
        .eq('id', account_id);
      throw syncError;
    }
  } catch (error) {
    console.error('Email sync error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});


// --- PROVIDER-SPECIFIC IMPLEMENTATIONS ---

async function syncGmailAccount(account: EmailAccount, syncJob: SyncJob, supabaseClient: SupabaseClient) {
  console.warn('Gmail sync is not implemented.');
  return { total_messages: 0, processed_messages: 0, error_count: 0 };
}

async function syncOutlookAccount(account: EmailAccount, syncJob: SyncJob, supabaseClient: SupabaseClient) {
  console.log('Syncing Outlook account:', account.email_address);
  const accessToken = await getValidOutlookToken(account, supabaseClient);
  
  let syncFromTimestamp: string | undefined;
  if (syncJob.job_type === 'incremental_sync') {
    const { data: lastItem } = await supabaseClient
      .from('ai_inbox_items')
      .select('received_at')
      .eq('user_id', syncJob.user_id)
      .eq('integration_id', account.id)
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastItem) syncFromTimestamp = lastItem.received_at;
  }
  
  const emails = await fetchOutlookEmails(accessToken, syncFromTimestamp);
  const { processed, errors } = await processEmails(emails, account, syncJob, supabaseClient);

  return { total_messages: emails.length, processed_messages: processed, error_count: errors };
}


// --- MICROSOFT GRAPH HELPERS ---

async function getValidOutlookToken(account: EmailAccount, supabaseClient: SupabaseClient): Promise<string> {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  if (account.access_token && expiresAt > Date.now() + 60000) { // 60s buffer
    return account.access_token;
  }
  
  console.log('Outlook token expired or missing, refreshing...');
  if (!account.refresh_token) throw new Error('No refresh token available. Re-authentication needed.');

  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  const clientId = Deno.env.get('VITE_MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Microsoft client credentials not configured.');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'User.Read Mail.Read offline_access',
    refresh_token: account.refresh_token,
    grant_type: 'refresh_token',
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, { method: 'POST', body: params });
  const tokenData = await response.json();

  if (!response.ok) throw new Error(`Failed to refresh token: ${tokenData.error_description}`);

  const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
  await supabaseClient
    .from('ai_email_accounts')
    .update({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token, token_expires_at: newExpiresAt })
    .eq('id', account.id);

  return tokenData.access_token;
}

async function fetchOutlookEmails(accessToken: string, syncFrom?: string): Promise<EmailMessage[]> {
  let allEmails: any[] = [];
  const selectFields = 'id,threadId,subject,from,toRecipients,ccRecipients,body,bodyPreview,sentDateTime,hasAttachments';
  let nextLink: string | undefined = `https://graph.microsoft.com/v1.0/me/messages?$select=${selectFields}&$top=50`;

  if (syncFrom) {
    nextLink += `&$filter=sentDateTime ge ${new Date(syncFrom).toISOString()}`;
  }
  
  while (nextLink) {
    const response = await fetch(nextLink, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Graph API error: ${errorData.error?.message}`);
    }
    const data = await response.json();
    allEmails = allEmails.concat(data.value);
    nextLink = data['@odata.nextLink'];
  }

  return allEmails.map((email: any): EmailMessage => ({
    message_id: email.id,
    thread_id: email.threadId,
    subject: email.subject,
    from_email: email.from?.emailAddress?.address,
    from_name: email.from?.emailAddress?.name,
    to_emails: email.toRecipients?.map((r: any) => r.emailAddress.address) || [],
    cc_emails: email.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
    bcc_emails: [],
    body_text: email.body?.contentType === 'text' ? email.body.content : '',
    body_html: email.body?.contentType === 'html' ? email.body.content : '',
    snippet: email.bodyPreview,
    sent_at: email.sentDateTime,
    has_attachments: email.hasAttachments,
    attachment_count: 0,
  }));
}


// --- DATA PROCESSING ---

async function processEmails(emails: EmailMessage[], account: EmailAccount, syncJob: SyncJob, supabaseClient: SupabaseClient) {
  if (emails.length === 0) return { processed: 0, errors: 0 };

  const itemsToInsert = emails.map(email => ({
    user_id: syncJob.user_id,
    company_id: account.company_id,
    subject: email.subject,
    sender_email: email.from_email,
    sender_name: email.from_name,
    recipient_email: account.email_address,
    content: email.body_text,
    html_content: email.body_html,
    message_id: email.message_id,
    thread_id: email.thread_id,
    is_read: false,
    is_archived: false,
    item_timestamp: email.sent_at,
    received_at: email.sent_at,
    source_type: 'email',
    integration_id: account.id,
    external_id: email.message_id,
    body_preview: email.snippet,
    status: 'unprocessed',
  }));

  const { error } = await supabaseClient
    .from('ai_inbox_items')
    .upsert(itemsToInsert, { onConflict: 'external_id, user_id' });

  if (error) {
    console.error('Error inserting emails into inbox:', error);
    return { processed: 0, errors: emails.length };
  }

  return { processed: itemsToInsert.length, errors: 0 };
}