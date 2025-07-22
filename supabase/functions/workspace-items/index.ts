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

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');
  
  if (!workspaceId) {
    return createErrorResponse('workspaceId query parameter is required', 400);
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('workspace_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Workspace items fetch error:', error);
        return createErrorResponse(`Failed to fetch workspace items: ${error.message}`, 500);
      }

      return createSuccessResponse(data || []);
    } catch (error) {
      console.error('Workspace items error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch workspace items',
        500
      );
    }
  }

  return createErrorResponse('Method not allowed', 405);
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
    console.error('Workspace items error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 