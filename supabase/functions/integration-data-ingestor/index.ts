import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createDatabaseService, authenticateRequest } from '../_shared/database.ts'

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// The 'access-control-allow-origin' header is needed for browsers to access the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Main function logic
async function ingestData() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch active API Learning integrations with the 'Monitoring & Alerts' pattern
    const { data: userIntegrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select(`
        id,
        config,
        credentials,
        integration:integrations!inner(metadata)
      `)
      .eq('status', 'active')
      .eq('integrations.metadata->>source', 'api-learning')
      // This filter is crucial: it finds integrations that have the specific pattern we want
      .filter('integration.metadata->analysisResult->patterns', 'cs', '[{"name":"Monitoring & Alerts"}]')

    if (integrationsError) {
      throw new Error(`Failed to fetch user integrations: ${integrationsError.message}`)
    }

    if (!userIntegrations || userIntegrations.length === 0) {
      return { message: 'No active NinjaRMM integrations with monitoring patterns found.' }
    }
    
    let ingestedCount = 0;
    const errors: string[] = [];

    // 2. Loop through each integration
    for (const integration of userIntegrations) {
      try {
        const metadata = integration.integration?.metadata as any;
        const analysisResult = metadata?.analysisResult;
        
        const serverUrl = analysisResult?.serverUrl;
        const monitoringPattern = analysisResult?.patterns.find(p => p.name === 'Monitoring & Alerts');
        const healthEndpoint = monitoringPattern?.endpoints.find(e => e.name === 'Get Device Health');
        
        if (!serverUrl || !healthEndpoint) {
          console.warn(`Skipping integration ${integration.id}: Missing server URL or health endpoint info.`);
          continue;
        }

        // --- MOCK API CALL ---
        // In a real scenario, we'd make a real HTTP request here using the integration's
        // credentials (apiKey, etc.) stored in `integration.credentials`.
        // For now, we simulate a successful API call with fake data.
        const mockApiResponse = {
          devices: [
            { device_id: 'device-123', status: 'online', cpu_usage: 15.5, memory_usage: 45.2, disk_usage_gb: 150.7, last_seen: new Date().toISOString() },
            { device_id: 'device-456', status: 'offline', cpu_usage: 0, memory_usage: 0, disk_usage_gb: 250.1, last_seen: new Date(Date.now() - 86400000).toISOString() },
          ]
        };
        // --- END MOCK API CALL ---

        // 3. Insert fetched data into our new table
        const recordsToInsert = mockApiResponse.devices.map(device => ({
          user_integration_id: integration.id,
          device_id: device.device_id,
          status: device.status,
          cpu_usage: device.cpu_usage,
          memory_usage: device.memory_usage,
          disk_usage_gb: device.disk_usage_gb,
          last_seen: device.last_seen,
          raw_payload: device, // Store the original device object as JSON
        }));

        const { error: insertError } = await supabase
          .from('integration_ninjarmm_device_data')
          .upsert(recordsToInsert, { onConflict: 'user_integration_id,device_id' });

        if (insertError) {
          throw new Error(`Failed to insert data for integration ${integration.id}: ${insertError.message}`);
        }
        
        ingestedCount += recordsToInsert.length;

      } catch (e) {
        errors.push(e.message);
        console.error(`Error processing integration ${integration.id}:`, e);
      }
    }
    
    if (errors.length > 0) {
      return { message: `Ingestion process completed with errors. Ingested ${ingestedCount} records.`, errors };
    }

    return { message: `Successfully ingested ${ingestedCount} device health records.` }
  } catch (error) {
    console.error('Critical error in ingestion function:', error)
    return { error: error.message }
  }
}

// Deno server setup to handle requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the request (optional for this function since it's a background job)
    const { userId, error: authError } = await authenticateRequest(req, supabaseUrl, supabaseServiceKey);
    if (authError) {
      console.warn('Authentication failed for data ingestion:', authError);
      // Continue anyway since this might be called by a cron job
    }

    const result = await ingestData();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 