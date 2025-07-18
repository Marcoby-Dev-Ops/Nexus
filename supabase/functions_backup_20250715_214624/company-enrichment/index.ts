import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface CompanyInfo {
  name?: string;
  description?: string;
  industry?: string;
  logo?: string;
  website?: string;
  social_profiles?: string[];
  size?: string;
  founded?: string;
  headquarters?: string;
  specialties?: string[];
  employee_count?: number;
  followers_count?: number;
  microsoft_365?: {
    tenant_id?: string;
    organization_name?: string;
    verified_domain?: boolean;
    subscription_type?: string;
    user_count?: number;
  };
  error?: string;
  enrichment_message?: string;
}

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, domain, microsoftToken } = await req.json();
    if (!companyName && !domain) {
      return new Response(JSON.stringify({ error: 'Missing companyName or domain' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Start with only the provided name
    const companyInfo: CompanyInfo = { name: companyName };
    let enriched = false;

    // Microsoft 365 enrichment
    if (microsoftToken) {
      try {
        const msResponse = await fetch('https://graph.microsoft.com/v1.0/organization', {
          headers: {
            'Authorization': `Bearer ${microsoftToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (msResponse.ok) {
          const msData = await msResponse.json();
          companyInfo.microsoft_365 = {
            tenant_id: msData.value[0]?.id,
            organization_name: msData.value[0]?.displayName,
            verified_domain: msData.value[0]?.verifiedDomains?.some((d: any) => d.name === domain),
            subscription_type: msData.value[0]?.subscriptionType,
            user_count: msData.value[0]?.userCount
          };
          // Only set name if not provided
          if (!companyInfo.name && msData.value[0]?.displayName) {
            companyInfo.name = msData.value[0].displayName;
          }
          enriched = true;
        }
      } catch (error) {
        console.error('Microsoft 365 lookup error:', error);
      }
    }

    // Google Knowledge Graph enrichment
    if (!enriched && (companyName || domain)) {
      try {
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        if (apiKey) {
          const query = encodeURIComponent(companyName || domain);
          const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${query}&key=${apiKey}&limit=1&types=Organization`;
          const kgRes = await fetch(kgUrl);
          if (kgRes.ok) {
            const kgData = await kgRes.json();
            const org = kgData.itemListElement?.[0]?.result;
            if (org) {
              companyInfo.name = companyInfo.name || org.name;
              companyInfo.description = org.description || companyInfo.description;
              companyInfo.website = org.url || companyInfo.website;
              companyInfo.logo = org.image?.contentUrl || companyInfo.logo;
              enriched = true;
            }
          }
        }
      } catch (error) {
        console.error('Google KG lookup error:', error);
      }
    }

    // LinkedIn enrichment would go here (not implemented)
    // ...

    // If nothing was enriched, return a message
    if (!enriched) {
      companyInfo.enrichment_message = 'No additional company data could be enriched. Connect Microsoft 365 or LinkedIn for more.';
    }

    return new Response(JSON.stringify(companyInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 