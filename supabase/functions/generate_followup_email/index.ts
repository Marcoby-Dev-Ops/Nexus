import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { opportunity } = await req.json();

    const mockEmail = `
      Subject: Following up from our conversation

      Hi ${opportunity.rep.name},

      I hope this email finds you well. I'm writing to follow up on our recent conversation about ${opportunity.company}. We're very excited about the possibility of working with you.

      I've attached some more information about our services for your review. Please let me know if you have any questions.

      Best regards,
      The Nexus Team
    `;

    return new Response(JSON.stringify({ email: mockEmail }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 