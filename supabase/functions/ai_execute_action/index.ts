import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { corsHeaders } from '../_shared/cors.ts';

interface ExecuteActionRequest {
  actionType: string;
  actionData: Record<string, any>;
  userId: string;
  companyId?: string;
  metadata?: {
    source?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

interface ActionResult {
  success: boolean;
  actionId?: string;
  result?: any;
  error?: string;
  executionTime?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { actionType, actionData, userId, companyId, metadata } = await req.json() as ExecuteActionRequest;

    if (!actionType || !actionData) {
      return new Response(JSON.stringify({ error: 'Missing actionType or actionData' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const startTime = Date.now();

    // Log action execution
    const { data: actionLog, error: logError } = await supabase
      .from('ai_action_logs')
      .insert({
        user_id: userId,
        company_id: companyId,
        action_type: actionType,
        action_data: actionData,
        metadata,
        status: 'executing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log action:', logError);
    }

    let result: any = null;
    let error: string | null = null;

    try {
      // Execute action based on type
      switch (actionType) {
        case 'create_contact':
          result = await executeCreateContact(supabase, actionData, userId, companyId);
          break;
        
        case 'create_deal':
          result = await executeCreateDeal(supabase, actionData, userId, companyId);
          break;
        
        case 'send_email':
          result = await executeSendEmail(supabase, actionData, userId, companyId);
          break;
        
        case 'schedule_meeting':
          result = await executeScheduleMeeting(supabase, actionData, userId, companyId);
          break;
        
        case 'update_crm':
          result = await executeUpdateCRM(supabase, actionData, userId, companyId);
          break;
        
        case 'generate_report':
          result = await executeGenerateReport(supabase, actionData, userId, companyId);
          break;
        
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

    } catch (execError) {
      error = execError instanceof Error ? execError.message : 'Unknown execution error';
      console.error('Action execution error:', execError);
    }

    const executionTime = Date.now() - startTime;

    // Update action log with result
    if (actionLog?.id) {
      await supabase
        .from('ai_action_logs')
        .update({
          status: error ? 'failed' : 'completed',
          result,
          error,
          execution_time_ms: executionTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', actionLog.id);
    }

    const response: ActionResult = {
      success: !error,
      actionId: actionLog?.id,
      result,
      error,
      executionTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error ? 500 : 200,
    });

  } catch (error) {
    console.error('ai_execute_action error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Action execution functions
async function executeCreateContact(supabase: any, data: any, userId: string, companyId?: string) {
  const { name, email, phone, company, notes } = data;
  
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      name,
      email,
      phone,
      company,
      notes,
      user_id: userId,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) throw error;
  return contact;
}

async function executeCreateDeal(supabase: any, data: any, userId: string, companyId?: string) {
  const { title, value, stage, contact_id, notes } = data;
  
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      title,
      value,
      stage,
      contact_id,
      notes,
      user_id: userId,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) throw error;
  return deal;
}

async function executeSendEmail(supabase: any, data: any, userId: string, companyId?: string) {
  // This would integrate with your email service
  const { to, subject, body, template } = data;
  
  // For now, just log the email action
  const { data: emailLog, error } = await supabase
    .from('ai_action_logs')
    .insert({
      user_id: userId,
      company_id: companyId,
      action_type: 'email_sent',
      action_data: { to, subject, template },
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw error;
  return { message: 'Email queued for sending', logId: emailLog.id };
}

async function executeScheduleMeeting(supabase: any, data: any, userId: string, companyId?: string) {
  const { title, attendees, start_time, duration, notes } = data;
  
  // This would integrate with your calendar service
  const { data: meetingLog, error } = await supabase
    .from('ai_action_logs')
    .insert({
      user_id: userId,
      company_id: companyId,
      action_type: 'meeting_scheduled',
      action_data: { title, attendees, start_time, duration },
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw error;
  return { message: 'Meeting scheduled', logId: meetingLog.id };
}

async function executeUpdateCRM(supabase: any, data: any, userId: string, companyId?: string) {
  const { table, record_id, updates } = data;
  
  const { data: result, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', record_id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

async function executeGenerateReport(supabase: any, data: any, userId: string, companyId?: string) {
  const { report_type, parameters, format } = data;
  
  // This would generate a report based on the type
  const { data: reportLog, error } = await supabase
    .from('ai_action_logs')
    .insert({
      user_id: userId,
      company_id: companyId,
      action_type: 'report_generated',
      action_data: { report_type, parameters, format },
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw error;
  return { message: 'Report generated', logId: reportLog.id };
} 