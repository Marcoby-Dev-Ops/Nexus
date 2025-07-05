/**
 * business_health
 * Returns calculated business health for authenticated user's company
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.5";
import { corsHeadersWithOrigin as corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

/*
 * NOTE: This function now applies dynamic CORS headers so that
 * local dev origins like http://127.0.0.1:5173 are allowed and
 * browsers can successfully complete the pre-flight OPTIONS request.
 */

serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin), status: 200 });
  }

  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    const { user, error: authErr } = await sb.auth.getUser(jwt);
    if (authErr || !user) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    // Get company id
    const { data: profile } = await sb
      .from("user_profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const { data, error } = await sb.rpc("get_business_health", { p_company_id: profile.company_id });
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}); 