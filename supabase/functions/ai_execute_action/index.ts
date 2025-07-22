import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeaders } from '../_shared/cors.ts';

// Environment validation
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Success response helper
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify({ 
    data, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Authentication helper
const authenticateRequest = async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, supabase, error: 'No authorization header' };
  }
  
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  
  if (error || !user) {
    return { user: null, supabase, error: 'Invalid token' };
  }
  
  return { user, supabase };
};

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

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
  try {
    const { actionType, actionData, userId, companyId, metadata } = await req.json() as ExecuteActionRequest;

    if (!actionType || !actionData) {
      return createErrorResponse('Missing actionType or actionData', 400);
    }

    console.log(`⚡ [Action Execute] Processing ${actionType} action for user ${user.id}`);

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

    if (error) {
      return createErrorResponse(`Action execution failed: ${error}`, 500);
    }

    console.log(`✅ [Action Execute] Successfully executed ${actionType} in ${executionTime}ms`);
    return createSuccessResponse(response);

  } catch (error) {
    console.error('Action execution processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process action execution',
      500
    );
  }
};

// Action execution functions
async function executeCreateContact(supabase: any, data: any, userId: string, companyId?: string) {
  const { name, email, phone, company, notes } = data;
  
  if (!name || !email) {
    throw new Error('Contact name and email are required');
  }

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
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Contact creation error:', error);
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  return contact;
}

async function executeCreateDeal(supabase: any, data: any, userId: string, companyId?: string) {
  const { title, value, stage, contact_id, notes } = data;
  
  if (!title || !value) {
    throw new Error('Deal title and value are required');
  }

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
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Deal creation error:', error);
    throw new Error(`Failed to create deal: ${error.message}`);
  }

  return deal;
}

async function executeSendEmail(supabase: any, data: any, userId: string, companyId?: string) {
  const { to, subject, body, template_id } = data;
  
  if (!to || !subject || !body) {
    throw new Error('Email to, subject, and body are required');
  }

  // Log email for now (implement actual email sending later)
  const { data: emailLog, error } = await supabase
    .from('email_logs')
    .insert({
      to,
      subject,
      body,
      template_id,
      user_id: userId,
      company_id: companyId,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Email logging error:', error);
    throw new Error(`Failed to log email: ${error.message}`);
  }

  return emailLog;
}

async function executeScheduleMeeting(supabase: any, data: any, userId: string, companyId?: string) {
  const { title, start_time, end_time, attendees, notes } = data;
  
  if (!title || !start_time || !end_time) {
    throw new Error('Meeting title, start time, and end time are required');
  }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      title,
      start_time,
      end_time,
      attendees,
      notes,
      user_id: userId,
      company_id: companyId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Meeting creation error:', error);
    throw new Error(`Failed to create meeting: ${error.message}`);
  }

  return meeting;
}

async function executeUpdateCRM(supabase: any, data: any, userId: string, companyId?: string) {
  const { record_type, record_id, updates } = data;
  
  if (!record_type || !record_id || !updates) {
    throw new Error('Record type, ID, and updates are required');
  }

  const { data: updatedRecord, error } = await supabase
    .from(record_type)
    .update(updates)
    .eq('id', record_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('CRM update error:', error);
    throw new Error(`Failed to update CRM record: ${error.message}`);
  }

  return updatedRecord;
}

async function executeGenerateReport(supabase: any, data: any, userId: string, companyId?: string) {
  const { report_type, parameters, format } = data;
  
  if (!report_type) {
    throw new Error('Report type is required');
  }

  // Log report generation for now (implement actual report generation later)
  const { data: reportLog, error } = await supabase
    .from('report_logs')
    .insert({
      report_type,
      parameters,
      format,
      user_id: userId,
      company_id: companyId,
      status: 'generated',
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Report logging error:', error);
    throw new Error(`Failed to log report: ${error.message}`);
  }

  return reportLog;
}

// Main serve function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Authenticate request
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return createErrorResponse(auth.error, 401);
    }
    
    // Call handler
    return await handleRequest(req, auth);
    
  } catch (error) {
    console.error('Action execute error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 