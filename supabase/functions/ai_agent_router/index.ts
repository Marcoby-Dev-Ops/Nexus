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

interface RouterResponse {
  content: unknown;
  confidence: number;
  agent_type?: string;
  department?: string;
}

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return createErrorResponse('Invalid or missing "message" parameter', 400);
    }

    console.log(`🔀 [Agent Router] Processing message for user ${user.id}:`, message.substring(0, 100));

    // Enhanced intent classification
    const lower = message.toLowerCase();
    let res: RouterResponse;

    // KPI/Metrics intent
    if (lower.includes('kpi') || lower.includes('metric') || lower.includes('performance')) {
      try {
        const { data, error } = await supabase
          .from('department_metrics_view')
          .select('*')
          .eq('department', 'operations')
          .maybeSingle();

        if (error) {
          console.error('Metrics fetch error:', error);
          return createErrorResponse(`Failed to fetch metrics: ${error.message}`, 500);
        }

        res = {
          content: data ?? { note: 'No metrics available' },
          confidence: 0.9,
          agent_type: 'metrics',
          department: 'operations'
        };
      } catch (error) {
        console.error('Metrics processing error:', error);
        return createErrorResponse('Failed to process metrics request', 500);
      }
    }
    // Sales intent
    else if (lower.includes('sales') || lower.includes('revenue') || lower.includes('deal')) {
      res = {
        content: 'Routing to sales agent...',
        confidence: 0.8,
        agent_type: 'sales',
        department: 'sales'
      };
    }
    // Finance intent
    else if (lower.includes('finance') || lower.includes('budget') || lower.includes('cost')) {
      res = {
        content: 'Routing to finance agent...',
        confidence: 0.8,
        agent_type: 'finance',
        department: 'finance'
      };
    }
    // HR intent
    else if (lower.includes('hr') || lower.includes('employee') || lower.includes('hiring')) {
      res = {
        content: 'Routing to HR agent...',
        confidence: 0.8,
        agent_type: 'hr',
        department: 'hr'
      };
    }
    // Default fallback
    else {
      res = {
        content: `I understand you're asking about: "${message}". Let me route you to the appropriate agent.`,
        confidence: 0.2,
        agent_type: 'general',
        department: 'general'
      };
    }

    // Log routing decision
    console.log(`🎯 [Agent Router] Routed to ${res.agent_type} agent with confidence ${res.confidence}`);

    return createSuccessResponse(res);
    
  } catch (error) {
    console.error('Agent router processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process agent routing',
      500
    );
  }
};

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
    console.error('Agent router error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 