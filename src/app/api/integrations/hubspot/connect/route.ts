import { NextResponse } from 'next/server';
import { getHubspotConfig } from '@/lib/integrations/hubspot/config'; // We will create this next

export async function GET() {
  const config = await getHubspotConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
  });

  const authorizationUrl = `${config.authUrl}?${params.toString()}`;

  return NextResponse.redirect(authorizationUrl);
} 