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

// Health check handler
const handleHealthCheck = async (req: Request) => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Test database connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Simple database test
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbError ? 'error' : 'ok',
        edge_function: 'ok'
      },
      version: '1.0.0'
    };
    
    if (dbError) {
      healthStatus.services.database = 'error';
      console.warn('Database health check failed:', dbError);
    }
    
    return createSuccessResponse(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Health check failed',
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
  
  // Allow unauthenticated health checks
  if (req.method === 'GET') {
    return await handleHealthCheck(req);
  }
  
  return createErrorResponse('Method not allowed', 405);
}); 