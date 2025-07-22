import { supabase } from "@/core/supabase";
import { type DepartmentState } from '@/shared/lib/types';

interface AdvisorParams {
  prompt: string;
  snapshot: DepartmentState;
  orgId?: string | null;
}

/**
 * callNexusAdvisor (v2)
 * --------------------
 * Implements a lightweight RAG loop entirely on the client:
 *   1. Embed the user prompt
 *   2. Retrieve top-k matching runbook chunks via `match_ops_docs` RPC
 *   3. Send context + KPI snapshot to the `ai_chat` edge function for the final answer
 *
 * Falls back to mocked output during `npm run dev` to avoid burning tokens.
 */
export async function callNexusAdvisor({ prompt, snapshot, orgId }: AdvisorParams): Promise<string> {
  if (import.meta.env.DEV) {
    return Promise.resolve('Automate deployment rollbacks to cut MTTR by 30 %.');
  }

  // 1. Embed the prompt using OpenAI (browser-safe fetch)
  let vector: number[];
  try {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: prompt,
        dimensions: 1536,
      }),
    });
    const json = await resp.json();
    vector = json.data?.[0]?.embedding;
  } catch (err) {
    console.error('Embedding failed', err);
    return 'Could not generate advice at this time.';
  }

  // 2. Retrieve context chunks
  const { data: matches, error: matchErr } = await (supabase as any).rpc('match_ops_docs', {
    query_embedding: vector,
    match_threshold: 0.8,
    match_count: 8,
    p_org: orgId ?? null,
  });
  if (matchErr) {
    console.error('match_ops_docs error', matchErr);
  }

  const context = (matches ?? []).map((m: any) => m.chunk).join('\n\n');

  // 3. Call edge function for final completion
  const { data, error } = await supabase.functions.invoke('ai_chat', {
    body: {
      messages: [
        {
          role: 'system',
          content: `You are the Nexus Operations Advisor. Use the following runbook snippets and KPI snapshot to propose ONE actionable recommendation (≤2 sentences) to improve the Ops score.\n\nRunbook context:\n${context}`,
        },
        {
          role: 'user',
          content: `Latest KPIs:\n${JSON.stringify(snapshot, null, 2)}\n\n${prompt}`,
        },
      ],
    },
  });

  if (error) {
    console.error('ai_chat error', error);
    return 'N/A';
  }

  return data.choices?.[0]?.message?.content?.trim() ?? 'N/A';
} 