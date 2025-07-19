import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

    // Microsoft 365 enrichment (only if token provided)
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

    // Public domain lookup (works without API keys)
    if (domain && !enriched) {
      try {
        // Try to fetch basic website info
        const websiteUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NexusBot/1.0)'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Extract title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && !companyInfo.name) {
            companyInfo.name = titleMatch[1].trim();
          }
          
          // Extract description
          const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
          if (descMatch) {
            companyInfo.description = descMatch[1].trim();
          }
          
          // Extract logo (common patterns)
          const logoMatch = html.match(/<link[^>]*rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]*href="([^"]+)"/i);
          if (logoMatch) {
            const logoUrl = logoMatch[1];
            companyInfo.logo = logoUrl.startsWith('http') ? logoUrl : `${websiteUrl}${logoUrl}`;
          }
          
          enriched = true;
        }
      } catch (error) {
        console.error('Website lookup error:', error);
      }
    }

    // Google Knowledge Graph enrichment (try with and without API key)
    if (!enriched && (companyName || domain)) {
      try {
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        const query = encodeURIComponent(companyName || domain);
        
        if (apiKey) {
          // Use API key if available
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
        } else {
          // Try public Google search as fallback
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyName || domain)}`;
          const searchRes = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; NexusBot/1.0)'
            }
          });
          
          if (searchRes.ok) {
            const searchHtml = await searchRes.text();
            
            // Extract basic info from search results
            const titleMatch = searchHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
            if (titleMatch && !companyInfo.name) {
              companyInfo.name = titleMatch[1].trim();
            }
            
            const snippetMatch = searchHtml.match(/<div[^>]*class="[^"]*snippet[^"]*"[^>]*>([^<]+)<\/div>/i);
            if (snippetMatch) {
              companyInfo.description = snippetMatch[1].trim();
            }
            
            enriched = true;
          }
        }
      } catch (error) {
        console.error('Google lookup error:', error);
      }
    }

    // Industry classification based on company name/domain
    if (!companyInfo.industry && companyName) {
      const industryKeywords = {
        'tech': ['software', 'tech', 'ai', 'machine learning', 'data', 'cloud', 'saas', 'platform'],
        'healthcare': ['health', 'medical', 'pharma', 'hospital', 'clinic', 'care'],
        'finance': ['bank', 'financial', 'insurance', 'credit', 'lending', 'investment'],
        'retail': ['shop', 'store', 'ecommerce', 'retail', 'marketplace'],
        'manufacturing': ['manufacturing', 'factory', 'industrial', 'production'],
        'education': ['school', 'university', 'education', 'learning', 'academy'],
        'consulting': ['consulting', 'advisory', 'strategy', 'management']
      };
      
      const lowerName = companyName.toLowerCase();
      for (const [industry, keywords] of Object.entries(industryKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
          companyInfo.industry = industry;
          break;
        }
      }
    }

    // LinkedIn enrichment would go here (not implemented)
    // ...

    // If nothing was enriched, return a helpful message
    if (!enriched) {
      companyInfo.enrichment_message = 'Limited public data found. Connect Microsoft 365 or LinkedIn during setup for more detailed company information.';
    } else {
      companyInfo.enrichment_message = 'Successfully enriched with publicly available data. Connect integrations for more detailed information.';
    }

    return new Response(JSON.stringify(companyInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 