import { serve } from "std/http/server";
import { createClient } from "@supabase/supabase-js";

interface Payload {
  workflow: string; // The name/slug of the workflow to trigger
  parameters: Record<string, any>; // The data to pass to the workflow
}

serve(async (req) => {
  try {
    // 1. Authenticate the user making the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Authentication failed');
    
    const { workflow, parameters } = await req.json() as Payload;
    if (!workflow) throw new Error('`workflow` name is required.');

    // 2. Fetch the user's company_id from their profile
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('User profile error:', profileError);
      throw new Error('Could not find user profile or company assignment.');
    }

    // 3. Fetch the n8n configuration for the user's company and workflow
    const { data: n8nConfig, error: configError } = await serviceClient
      .from('n8n_workflow_configs')
      .select('webhook_url')
      .eq('company_id', profile.company_id)
      .eq('workflow_name', workflow)
      .single();

    if (configError || !n8nConfig || !n8nConfig.webhook_url) {
      console.error('n8n config error:', configError);
      throw new Error(`Configuration for workflow "${workflow}" not found or is invalid.`);
    }

    // 4. Trigger the n8n webhook with the provided parameters
    const n8nResponse = await fetch(n8nConfig.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters),
    });

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      throw new Error(`n8n workflow execution failed: ${errorBody}`);
    }

    // 5. Return a success response to the AI agent
    // n8n can run asynchronously, so we just confirm it was triggered.
    const responseData = await n8nResponse.json();
    return new Response(JSON.stringify({ success: true, message: 'Workflow triggered.', response: responseData }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in trigger-n8n-workflow function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 