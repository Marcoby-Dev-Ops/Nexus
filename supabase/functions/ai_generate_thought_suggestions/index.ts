import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
import { createDatabaseService, authenticateRequest } from '../_shared/database.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req, supabaseUrl, supabaseServiceKey);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create database service
    const dbService = createDatabaseService(supabaseUrl, supabaseServiceKey, userId);

    // Get user's integrations using centralized service
    const { data: integrations, error: integrationsError } = await dbService.getUserIntegrations(
      userId,
      'ai_generate_thought_suggestions'
    );

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    // Generate suggestions based on integrations
    const suggestions = await generateSuggestions(integrations || [], openaiApiKey);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Thought suggestions error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function generateSuggestions(integrations: any[], openaiApiKey: string): Promise<string[]> {
  // Implementation for generating thought suggestions based on integrations
  const integrationNames = integrations.map(i => i.integrations?.name || i.integration_name).filter(Boolean);
  
  if (integrationNames.length === 0) {
    return ['Consider connecting your first integration to get personalized suggestions'];
  }

  const prompt = `Based on the user's connected integrations: ${integrationNames.join(', ')}, suggest 3-5 thought-provoking questions or insights they might want to explore.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate suggestions');
  }

  const data = await response.json();
  const suggestions = data.choices[0].message.content.split('\n').filter((s: string) => s.trim());
  
  return suggestions;
} 