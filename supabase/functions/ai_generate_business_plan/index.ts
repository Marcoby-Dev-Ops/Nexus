/**
 * ai_generate_business_plan
 * Creates or refines a business plan markdown for the given company using OpenAI.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.5";
import "https://deno.land/std@0.177.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { company_id, focus_area } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), { status: 400 });
    }

    // Fetch company and profile
    const { data: company } = await supabase.from("companies").select("name, industry, size").eq("id", company_id).single();
    const { data: profile } = await supabase
      .from("ai_company_profiles")
      .select("tagline, motto, mission_statement, vision_statement, about_md")
      .eq("company_id", company_id)
      .single();

    // Compose prompt
    const basePrompt = `Act as a seasoned startup advisor. Create a concise but comprehensive business plan (markdown) for the company described below. Include Executive Summary, Mission, Vision, Value Proposition, Target Market, Competitive Advantage, Goals & Metrics, and Tagline suggestions. Incorporate existing details where available. If focus_area is provided, only generate that section.\n\nCompany details:\nName: ${company?.name}\nIndustry: ${company?.industry}\nSize: ${company?.size}\nTagline: ${profile?.tagline || 'N/A'}\nMotto: ${profile?.motto || 'N/A'}\nMission: ${profile?.mission_statement || 'N/A'}\nVision: ${profile?.vision_statement || 'N/A'}\nAbout: ${profile?.about_md?.slice(0, 500) || 'N/A'}\nFocus area: ${focus_area || 'full plan'}\n`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: basePrompt }],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: "OpenAI error", details: errText }), { status: 500 });
    }

    const completion = await aiRes.json();
    const planMd = completion.choices?.[0]?.message?.content as string;

    // Store in profile (about_md) and return
    await supabase
      .from("ai_company_profiles")
      .update({ about_md: planMd })
      .eq("company_id", company_id);

    return new Response(JSON.stringify({ success: true, business_plan_md: planMd }), { status: 200 });
  } catch (err) {
    console.error("bp error", err);
    return new Response(JSON.stringify({ error: "Unhandled" }), { status: 500 });
  }
}); 