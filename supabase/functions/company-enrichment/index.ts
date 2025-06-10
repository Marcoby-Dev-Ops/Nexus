import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { BraveSearch } from 'https://deno.land/x/brave_search/mod.ts';

interface CompanyInfo {
  description?: string;
  industry?: string;
  logo?: string;
  error?: string;
}

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();
    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Missing companyName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const brave = new BraveSearch(Deno.env.get('BRAVE_SEARCH_API_KEY')!);

    // Perform a search to get company details
    const searchResults = await brave.search({ q: `What is ${companyName}?` });

    let description = searchResults.results?.[0]?.description || 'Could not find a description.';

    // Another search for industry
    const industryResults = await brave.search({ q: `What industry is ${companyName} in?` });
    let industry = industryResults.results?.[0]?.title?.split(' - ')[0] || 'Could not determine industry.';
    
    const companyInfo: CompanyInfo = {
      description,
      industry,
    };
    
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