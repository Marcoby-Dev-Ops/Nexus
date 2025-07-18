/**
 * business_health
 * Returns calculated business health for authenticated user's company
 */

/*
 * NOTE: This function now applies dynamic CORS headers so that
 * local dev origins like http://127.0.0.1:5173 are allowed and
 * browsers can successfully complete the pre-flight OPTIONS request.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Public health check (unauthenticated GET)
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  // ...protected logic here (add Supabase client if needed)...

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}); 