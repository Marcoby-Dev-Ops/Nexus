import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailWebhookPayload {
  provider: 'microsoft' | 'gmail' | 'outlook' | 'other';
  event: 'email.received' | 'email.read' | 'email.replied' | 'email.deleted';
  email: {
    id: string;
    subject: string;
    body: string;
    sender: string;
    senderName?: string;
    recipient: string;
    receivedAt: string;
    messageId: string;
    threadId?: string;
    hasAttachments: boolean;
    metadata?: Record<string, unknown>;
  };
  userId: string;
  companyId?: string;
}

interface ProcessedEmail {
  id: string;
  user_id: string;
  company_id?: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  recipient_email: string;
  content: string;
  message_id: string;
  thread_id?: string;
  has_attachments: boolean;
  provider: string;
  item_timestamp: string;
  received_at: string;
  source_type: string;
  is_read: boolean;
  is_important: boolean;
  is_flagged: boolean;
  status: string;
  external_id: string;
  integration_id?: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook signature (implement based on provider)
    const signature = req.headers.get('x-webhook-signature');
    if (!await verifyWebhookSignature(req, signature)) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook payload
    const payload: EmailWebhookPayload = await req.json();
    
    // Validate payload
    if (!payload.provider || !payload.event || !payload.email || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process email based on event type
    switch (payload.event) {
      case 'email.received':
        await handleEmailReceived(payload);
        break;
      case 'email.read':
        await handleEmailRead(payload);
        break;
      case 'email.replied':
        await handleEmailReplied(payload);
        break;
      case 'email.deleted':
        await handleEmailDeleted(payload);
        break;
      default:
        console.warn(`Unknown webhook event: ${payload.event} from provider: ${payload.provider}`);
        return new Response(
          JSON.stringify({ error: `Unsupported event type: ${payload.event}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle new email received event
 */
async function handleEmailReceived(payload: EmailWebhookPayload): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store email in unified inbox
    const processedEmail: ProcessedEmail = {
      id: crypto.randomUUID(),
      user_id: payload.userId,
      company_id: payload.companyId,
      subject: payload.email.subject,
      sender_email: payload.email.sender,
      sender_name: payload.email.senderName,
      recipient_email: payload.email.recipient,
      content: payload.email.body,
      message_id: payload.email.messageId,
      thread_id: payload.email.threadId,
      has_attachments: payload.email.hasAttachments,
      provider: payload.provider,
      item_timestamp: payload.email.receivedAt,
      received_at: payload.email.receivedAt,
      source_type: 'email',
      is_read: false,
      is_important: false,
      is_flagged: false,
      status: 'unread',
      external_id: payload.email.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert email into database
    const { error: insertError } = await supabase
      .from('ai_inbox_items')
      .insert(processedEmail);

    if (insertError) {
      console.error('Error inserting email:', insertError);
      throw new Error(`Failed to insert email: ${insertError.message}`);
    }

    // Trigger real-time AI analysis
    await triggerEmailAnalysis(processedEmail);

    // Send real-time notification to user
    await sendRealTimeNotification(payload.userId, processedEmail);

    console.log('Email processed successfully:', processedEmail.id);

  } catch (error) {
    console.error('Error handling email received:', error);
    throw error;
  }
}

/**
 * Handle email read event
 */
async function handleEmailRead(payload: EmailWebhookPayload): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update email read status
    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', payload.email.id)
      .eq('user_id', payload.userId);

    if (error) {
      console.error('Error updating email read status:', error);
    }

  } catch (error) {
    console.error('Error handling email read:', error);
  }
}

/**
 * Handle email replied event
 */
async function handleEmailReplied(payload: EmailWebhookPayload): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update email status to replied
    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ 
        status: 'replied',
        updated_at: new Date().toISOString()
      })
      .eq('external_id', payload.email.id)
      .eq('user_id', payload.userId);

    if (error) {
      console.error('Error updating email replied status:', error);
    }

  } catch (error) {
    console.error('Error handling email replied:', error);
  }
}

/**
 * Handle email deleted event
 */
async function handleEmailDeleted(payload: EmailWebhookPayload): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Soft delete email
    const { error } = await supabase
      .from('ai_inbox_items')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('external_id', payload.email.id)
      .eq('user_id', payload.userId);

    if (error) {
      console.error('Error updating email deleted status:', error);
    }

  } catch (error) {
    console.error('Error handling email deleted:', error);
  }
}

/**
 * Trigger real-time AI analysis for email
 */
async function triggerEmailAnalysis(email: ProcessedEmail): Promise<void> {
  try {
    // Call the email intelligence service
    const analysisPayload = {
      emailId: email.id,
      userId: email.user_id,
      emailContent: {
        subject: email.subject,
        body: email.content,
        sender: email.sender_email,
        senderName: email.sender_name,
        receivedAt: email.received_at
      }
    };

    // Make internal API call to trigger analysis
    const analysisResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisPayload)
    });

    if (!analysisResponse.ok) {
      console.error('Error triggering email analysis:', analysisResponse.statusText);
    }

  } catch (error) {
    console.error('Error triggering email analysis:', error);
  }
}

/**
 * Send real-time notification to user
 */
async function sendRealTimeNotification(userId: string, email: ProcessedEmail): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create notification record
    const notification = {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'email_received',
      title: 'New Email Received',
      message: `New email from ${email.sender_name || email.sender_email}: ${email.subject}`,
      data: {
        emailId: email.id,
        sender: email.sender_email,
        subject: email.subject
      },
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Insert notification
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) {
      console.error('Error creating notification:', error);
      // Don't throw here as notification failure shouldn't break email processing
      // TODO: Implement retry mechanism for failed notifications
    } else {
      console.log(`Notification created for user ${userId} for email ${email.id}`);
    }

  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
}

/**
 * Verify webhook signature (implement based on provider)
 */
async function verifyWebhookSignature(req: Request, signature: string | null): Promise<boolean> {
  // Implementation would vary by provider
  // For Microsoft Graph: HMAC SHA256
  // For Gmail: JWT verification
  // For Outlook: OAuth 2.0 verification
  
  // TODO: Implement proper signature verification for each provider
  // For development, we'll allow requests without signature
  // In production, this should be properly implemented
  
  if (!signature) {
    console.warn('No webhook signature provided - allowing in development mode');
    return true; // Allow in development
  }
  
  // TODO: Add proper signature verification logic here
  // const isValid = await verifySignatureForProvider(provider, signature, payload);
  // return isValid;
  
  return true; // Placeholder for production implementation
} 