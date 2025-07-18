import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { getHubspotConfig } from '@/lib/hubspot-config'

Deno.serve(async (_req) => {
  const config = getHubspotConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
  });

  const authorizationUrl = `${config.authUrl}?${params.toString()}`;

  return new Response(null, {
    status: 302, // Found (Redirect)
    headers: {
      Location: authorizationUrl,
    },
  });
}) 