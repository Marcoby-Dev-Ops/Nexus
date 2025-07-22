import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { encrypt, decrypt } from './crypto.ts';
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
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, supabase: supabaseAdmin, error: 'No authorization header' };
  }
  
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
  
  if (error || !user) {
    return { user: null, supabase: supabaseAdmin, error: 'Invalid token' };
  }
  
  return { user, supabase: supabaseAdmin };
};

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
  const url = new URL(req.url);
  const integrationName = url.pathname.split('/').pop();
  
  if (!integrationName) {
    return createErrorResponse('Integration name is required', 400);
  }

  switch (req.method) {
    case 'POST':
      return await handlePost(req, user, integrationName, supabase);
    case 'GET':
      return await handleGet(req, user, integrationName, supabase);
    case 'DELETE':
      return await handleDelete(req, user, integrationName, supabase);
    default:
      return createErrorResponse('Method not allowed', 405);
  }
};

async function handlePost(req: Request, user: any, integrationName: string, supabase: any) {
  try {
    const { token, organization_id } = await req.json();
    
    if (!token) {
      return createErrorResponse('Token is required', 400);
    }

    const { ciphertext, iv, authTag } = await encrypt(JSON.stringify(token));

    const { error } = await supabase.from('encrypted_credentials').upsert({
      user_id: user.id,
      organization_id,
      integration_name: integrationName,
      encrypted_token: ciphertext,
      iv,
      auth_tag: authTag,
    }, { onConflict: organization_id ? 'organization_id,integration_name' : 'user_id,integration_name' });

    if (error) {
      console.error('Credential save error:', error);
      return createErrorResponse(`Failed to save credential: ${error.message}`, 500);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Credential save error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to save credential',
      500
    );
  }
}

async function handleGet(req: Request, user: any, integrationName: string, supabase: any) {
  try {
    const { data, error } = await supabase
      .from('encrypted_credentials')
      .select('encrypted_token, iv, auth_tag')
      .eq('user_id', user.id)
      .eq('integration_name', integrationName)
      .single();

    if (error || !data) {
      return createErrorResponse('Credential not found', 404);
    }

    const decryptedToken = await decrypt(data.encrypted_token, data.iv, data.auth_tag);

    return createSuccessResponse({ token: decryptedToken });
  } catch (error) {
    console.error('Credential retrieval error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve credential',
      500
    );
  }
}

async function handleDelete(req: Request, user: any, integrationName: string, supabase: any) {
  try {
    const { error } = await supabase
      .from('encrypted_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_name', integrationName);

    if (error) {
      console.error('Credential deletion error:', error);
      return createErrorResponse(`Failed to delete credential: ${error.message}`, 500);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Credential deletion error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete credential',
      500
    );
  }
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
    console.error('Credential manager error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 