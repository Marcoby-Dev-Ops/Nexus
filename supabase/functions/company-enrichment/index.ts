import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { BraveSearch } from 'https://deno.land/x/brave_search/mod.ts';

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

    const brave = new BraveSearch(Deno.env.get('BRAVE_SEARCH_API_KEY')!);
    const companyInfo: CompanyInfo = {};

    // If we have a Microsoft 365 token, try to get organization info
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

          // If we got organization name from Microsoft, use it
          if (msData.value[0]?.displayName && !companyInfo.name) {
            companyInfo.name = msData.value[0].displayName;
          }
        }
      } catch (error) {
        console.error('Microsoft 365 lookup error:', error);
      }
    }

    // If we have a domain, try to get company info from it
    if (domain) {
      try {
        // Search for company info using domain
        const domainResults = await brave.search({ 
          q: `site:${domain} company information about us` 
        });

        // Get company name from domain if not provided
        if (!companyInfo.name && domainResults.results?.[0]?.title) {
          companyInfo.name = domainResults.results[0].title.split(' - ')[0];
        }

        // Try to get company description
        const descriptionResults = await brave.search({ 
          q: `site:${domain} about us company description` 
        });
        companyInfo.description = descriptionResults.results?.[0]?.description;

        // Set website
        companyInfo.website = `https://${domain}`;

        // Try to find social profiles
        const socialResults = await brave.search({ 
          q: `site:${domain} linkedin twitter facebook instagram` 
        });
        const socialLinks = socialResults.results?.[0]?.description?.match(/(https?:\/\/[^\s]+)/g) || [];
        companyInfo.social_profiles = socialLinks.filter(link => 
          link.includes('linkedin.com') || 
          link.includes('twitter.com') || 
          link.includes('facebook.com') || 
          link.includes('instagram.com')
        );

        // Try to find company size
        const sizeResults = await brave.search({ 
          q: `site:${domain} company size employees team` 
        });
        const sizeMatch = sizeResults.results?.[0]?.description?.match(/(\d+)[\s-]+(?:to|and)?[\s-]*(\d+)?\s*(?:employees|team members|staff)/i);
        if (sizeMatch) {
          const min = parseInt(sizeMatch[1]);
          const max = sizeMatch[2] ? parseInt(sizeMatch[2]) : min;
          companyInfo.employee_count = Math.round((min + max) / 2);
          companyInfo.size = `${min}-${max}`;
        }
      } catch (error) {
        console.error('Domain lookup error:', error);
      }
    }

    // If we still don't have enough info, try company name search
    if (!companyInfo.description && companyName) {
      try {
        // Search for company description
        const descriptionResults = await brave.search({ 
          q: `What is ${companyName}? company description` 
        });
        companyInfo.description = descriptionResults.results?.[0]?.description;

        // Search for industry
        const industryResults = await brave.search({ 
          q: `What industry is ${companyName} in?` 
        });
        companyInfo.industry = industryResults.results?.[0]?.title?.split(' - ')[0];

        // Try to find logo
        const logoResults = await brave.search({ 
          q: `${companyName} logo image` 
        });
        const logoUrl = logoResults.results?.[0]?.url;
        if (logoUrl && logoUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
          companyInfo.logo = logoUrl;
        }

        // Try to find headquarters
        const hqResults = await brave.search({ 
          q: `Where is ${companyName} headquartered?` 
        });
        companyInfo.headquarters = hqResults.results?.[0]?.description?.match(/headquartered in ([^\.]+)/i)?.[1];

        // Try to find founding year
        const foundedResults = await brave.search({ 
          q: `When was ${companyName} founded?` 
        });
        const foundedMatch = foundedResults.results?.[0]?.description?.match(/founded in (\d{4})/i);
        if (foundedMatch) {
          companyInfo.founded = foundedMatch[1];
        }
      } catch (error) {
        console.error('Company name lookup error:', error);
      }
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