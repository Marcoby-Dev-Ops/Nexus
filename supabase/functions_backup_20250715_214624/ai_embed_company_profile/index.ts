/**
 * ai_embed_company_profile
 * Generates embeddings for a company's profile data and stores them in ai_company_profiles.content_embedding.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.5";
import "https://deno.land/std@0.177.0/dotenv/load.ts";

// Grab env vars (the Edge Runtime exposes these)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the profile row
    const { data: profile, error: profileError } = await supabase
      .from("ai_company_profiles")
      .select("id, tagline, motto, mission_statement, vision_statement, about_md")
      .eq("company_id", company_id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const combinedText = [
      profile.tagline,
      profile.motto,
      profile.mission_statement,
      profile.vision_statement,
      profile.about_md,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!combinedText.trim()) {
      return new Response(
        JSON.stringify({ error: "Nothing to embed", profile_id: profile.id }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate embedding
    const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: combinedText,
      }),
    });

    if (!embedRes.ok) {
      const errText = await embedRes.text();
      return new Response(JSON.stringify({ error: "Embedding API error", details: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const embedJson = await embedRes.json();
    const embedding = embedJson.data?.[0]?.embedding;

    if (!embedding) {
      return new Response(JSON.stringify({ error: "Embedding missing from response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Store embedding
    const { error: updateError } = await supabase
      .from("ai_company_profiles")
      .update({ content_embedding: embedding })
      .eq("company_id", company_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, profile_id: profile.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error", err);
    return new Response(JSON.stringify({ error: "Unhandled error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}); 