import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/security';
import { HUBSPOT_CONFIG } from '@/lib/integrations/hubspot/config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return new NextResponse('Authorization code is required', { status: 400 });
    }

    // Exchange the authorization code for access and refresh tokens
    const tokenResponse = await fetch(HUBSPOT_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CONFIG.clientId,
        client_secret: HUBSPOT_CONFIG.clientSecret,
        redirect_uri: HUBSPOT_CONFIG.redirectUri,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get HubSpot portal information
    const portalResponse = await fetch(`${HUBSPOT_CONFIG.apiBaseUrl}/oauth/v1/access-tokens/${tokens.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!portalResponse.ok) {
      throw new Error('Failed to get HubSpot portal information');
    }

    const portalInfo = await portalResponse.json();

    // Encrypt and store the tokens
    const encryptedTokens = await encrypt(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope,
      user_id: tokens.user_id,
      hub_id: portalInfo.hub_id,
      app_id: portalInfo.app_id,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    }));

    // Store the integration
    const integration = await prisma.integration.create({
      data: {
        type: 'hubspot',
        credentials: encryptedTokens,
        settings: {
          hubId: portalInfo.hub_id,
          portalName: portalInfo.hub_domain,
          scopes: tokens.scope.split(' '),
          connectedAt: new Date().toISOString()
        },
        userId: session.user.id
      }
    });

    // Set up webhooks for real-time updates
    await setupHubSpotWebhooks(tokens.access_token, portalInfo.hub_id);

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations/success?integration=hubspot`);
  } catch (error) {
    console.error('Error in HubSpot OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations/error?integration=hubspot`);
  }
}

async function setupHubSpotWebhooks(accessToken: string, hubId: string) {
  const webhookEvents = [
    'contact.creation',
    'contact.propertyChange',
    'contact.deletion',
    'company.creation',
    'company.propertyChange',
    'company.deletion',
    'deal.creation',
    'deal.propertyChange',
    'deal.deletion'
  ];

  for (const event of webhookEvents) {
    await fetch(`${HUBSPOT_CONFIG.apiBaseUrl}/webhooks/v1/${hubId}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        webhookUrl: HUBSPOT_CONFIG.webhookUrl,
        subscriptionDetails: {
          propertyName: '*',
          subscriptionType: event
        }
      })
    });
  }
} 