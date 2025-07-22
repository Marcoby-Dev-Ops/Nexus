import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
// Note: Database types would need to be copied to edge functions or imported differently
// For now, we'll use any for the database type
import { corsHeaders } from './cors.ts';

// Environment validation
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Authentication helper
interface AuthResult {
  user: any;
  supabase: any;
  error?: string;
}

const authenticateRequest = async (req: Request): Promise<AuthResult> => {
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

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Success response helper
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Template for edge functions
export const createEdgeFunction = (
  handler: (req: Request, auth: AuthResult) => Promise<Response>
) => {
  return serve(async (req: Request) => {
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
      return await handler(req, auth);
      
    } catch (error) {
      console.error('Edge function error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  });
};

// Example usage:
/*
export const myFunction = createEdgeFunction(async (req, auth) => {
  const { user, supabase } = auth;
  
  // Your function logic here
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) {
    return createErrorResponse(error.message);
  }
  
  return createSuccessResponse(data);
});
*/ 