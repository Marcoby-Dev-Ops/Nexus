import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { getHubspotConfig } from '../_shared/hubspot-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { method, url } = req;
    
    if (method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the webhook payload
    const body = await req.json();
    const { subscriptionType, portalId, objectId, changeSource, eventId } = body;

    console.log(`🔔 [HubSpot Webhook] Received ${subscriptionType} event for object ${objectId} in portal ${portalId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook event types
    switch (subscriptionType) {
      case 'contact.creation':
      case 'contact.propertyChange':
        await handleContactWebhook(supabase, body);
        break;
        
      case 'company.creation':
      case 'company.propertyChange':
        await handleCompanyWebhook(supabase, body);
        break;
        
      case 'deal.creation':
      case 'deal.propertyChange':
        await handleDealWebhook(supabase, body);
        break;
        
      case 'contact.deletion':
      case 'company.deletion':
      case 'deal.deletion':
        await handleDeletionWebhook(supabase, body);
        break;
        
      default:
        console.log(`⚠️ [HubSpot Webhook] Unhandled subscription type: ${subscriptionType}`);
    }

    // Store webhook event for audit trail
    await supabase
      .from('webhook_events')
      .insert({
        integration_slug: 'hubspot',
        event_type: subscriptionType,
        portal_id: portalId,
        object_id: objectId,
        event_id: eventId,
        change_source: changeSource,
        payload: body,
        processed_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [HubSpot Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Handle contact-related webhooks
 */
async function handleContactWebhook(supabase: any, body: any) {
  const { portalId, objectId, propertyName, propertyValue } = body;
  
  try {
    // Get the contact details from HubSpot
    const hubspotConfig = getHubspotConfig();
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${hubspotConfig.clientSecret}`, // In production, use stored access token
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contact: ${response.statusText}`);
    }

    const contactData = await response.json();
    const properties = contactData.properties;

    // Find the user who owns this HubSpot integration
    const { data: userIntegration } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('integration_slug', 'hubspot')
      .eq('status', 'active')
      .single();

    if (!userIntegration) {
      console.log('No active HubSpot integration found for webhook');
      return;
    }

    // Sync contact data to Nexus
    const contactPayload = {
      name: `${properties.firstname || ''} ${properties.lastname || ''}`.trim() || properties.email || 'Unnamed Contact',
      email: properties.email,
      firstName: properties.firstname,
      lastName: properties.lastname,
      phone: properties.phone,
      company: properties.company,
      hubspotId: objectId,
      userId: userIntegration.user_id,
      updatedAt: new Date().toISOString()
    };

    // Upsert contact in Nexus
    const { error: upsertError } = await supabase
      .from('contacts')
      .upsert(contactPayload, {
        onConflict: 'hubspotId'
      });

    if (upsertError) {
      console.error('Failed to upsert contact:', upsertError);
    } else {
      console.log(`✅ [HubSpot Webhook] Contact ${objectId} synced successfully`);
    }

  } catch (error) {
    console.error('Error handling contact webhook:', error);
  }
}

/**
 * Handle company-related webhooks
 */
async function handleCompanyWebhook(supabase: any, body: any) {
  const { portalId, objectId, propertyName, propertyValue } = body;
  
  try {
    // Get the company details from HubSpot
    const hubspotConfig = getHubspotConfig();
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${hubspotConfig.clientSecret}`, // In production, use stored access token
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch company: ${response.statusText}`);
    }

    const companyData = await response.json();
    const properties = companyData.properties;

    // Find the user who owns this HubSpot integration
    const { data: userIntegration } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('integration_slug', 'hubspot')
      .eq('status', 'active')
      .single();

    if (!userIntegration) {
      console.log('No active HubSpot integration found for webhook');
      return;
    }

    // Sync company data to Nexus
    const companyPayload = {
      name: properties.name || 'Unknown Company',
      domain: properties.domain || `hubspot-id-${objectId}`,
      industry: properties.industry || 'Unknown',
      size: properties.numberofemployees || '1',
      description: properties.description,
      website: properties.website,
      hubspotId: objectId,
      userId: userIntegration.user_id,
      updatedAt: new Date().toISOString()
    };

    // Upsert company in Nexus
    const { error: upsertError } = await supabase
      .from('companies')
      .upsert(companyPayload, {
        onConflict: 'hubspotId'
      });

    if (upsertError) {
      console.error('Failed to upsert company:', upsertError);
    } else {
      console.log(`✅ [HubSpot Webhook] Company ${objectId} synced successfully`);
    }

  } catch (error) {
    console.error('Error handling company webhook:', error);
  }
}

/**
 * Handle deal-related webhooks
 */
async function handleDealWebhook(supabase: any, body: any) {
  const { portalId, objectId, propertyName, propertyValue } = body;
  
  try {
    // Get the deal details from HubSpot
    const hubspotConfig = getHubspotConfig();
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${hubspotConfig.clientSecret}`, // In production, use stored access token
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deal: ${response.statusText}`);
    }

    const dealData = await response.json();
    const properties = dealData.properties;

    // Find the user who owns this HubSpot integration
    const { data: userIntegration } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('integration_slug', 'hubspot')
      .eq('status', 'active')
      .single();

    if (!userIntegration) {
      console.log('No active HubSpot integration found for webhook');
      return;
    }

    // Sync deal data to Nexus
    const dealPayload = {
      name: properties.dealname || 'Unnamed Deal',
      amount: properties.amount ? parseFloat(properties.amount) : 0,
      stage: properties.dealstage || 'Unknown',
      closeDate: properties.closedate ? new Date(properties.closedate) : null,
      hubspotId: objectId,
      userId: userIntegration.user_id,
      updatedAt: new Date().toISOString()
    };

    // Upsert deal in Nexus
    const { error: upsertError } = await supabase
      .from('deals')
      .upsert(dealPayload, {
        onConflict: 'hubspotId'
      });

    if (upsertError) {
      console.error('Failed to upsert deal:', upsertError);
    } else {
      console.log(`✅ [HubSpot Webhook] Deal ${objectId} synced successfully`);
    }

  } catch (error) {
    console.error('Error handling deal webhook:', error);
  }
}

/**
 * Handle deletion webhooks
 */
async function handleDeletionWebhook(supabase: any, body: any) {
  const { portalId, objectId, subscriptionType } = body;
  
  try {
    let tableName = '';
    let idField = '';

    switch (subscriptionType) {
      case 'contact.deletion':
        tableName = 'contacts';
        idField = 'hubspotId';
        break;
      case 'company.deletion':
        tableName = 'companies';
        idField = 'hubspotId';
        break;
      case 'deal.deletion':
        tableName = 'deals';
        idField = 'hubspotId';
        break;
      default:
        console.log(`Unhandled deletion type: ${subscriptionType}`);
        return;
    }

    // Soft delete the record in Nexus
    const { error: deleteError } = await supabase
      .from(tableName)
      .update({ 
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq(idField, objectId);

    if (deleteError) {
      console.error(`Failed to delete ${tableName}:`, deleteError);
    } else {
      console.log(`✅ [HubSpot Webhook] ${tableName} ${objectId} deleted successfully`);
    }

  } catch (error) {
    console.error('Error handling deletion webhook:', error);
  }
} 