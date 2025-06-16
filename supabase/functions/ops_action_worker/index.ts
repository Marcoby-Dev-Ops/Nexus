import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Load environment variables (works in Supabase Edge Runtime)
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const N8N_URL = Deno.env.get("N8N_OPS_WEBHOOK");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !N8N_URL) {
  throw new Error("Missing required environment variables for ops_action_worker function");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  const { data: jobs, error } = await supabase
    .from("ops_action_queue")
    .select("*")
    .eq("status", "queued")
    .limit(10);

  if (error) throw error;

  for (const job of jobs) {
    const { id, action_slug, org_id, kpi_key } = job;

    // Mark as running
    await supabase
      .from("ops_action_queue")
      .update({ status: "running" })
      .eq("id", id);

    try {
      const res = await fetch(`${N8N_URL}/${action_slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id, kpi_key }),
      });

      const output = await res.json();

      await supabase
        .from("ops_action_queue")
        .update({ status: "done", output })
        .eq("id", id);
    } catch (err) {
      await supabase
        .from("ops_action_queue")
        .update({ status: "error", output: { message: String(err) } })
        .eq("id", id);
    }
  }

  return new Response("ok");
}); 