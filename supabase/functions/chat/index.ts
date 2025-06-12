import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting configuration
const RATE_LIMITS = {
  FREE: { maxMessagesPerHour: 20, maxMessagesPerDay: 100 },
  PRO: { maxMessagesPerHour: 200, maxMessagesPerDay: 2000 },
  ENTERPRISE: { maxMessagesPerHour: 1000, maxMessagesPerDay: 10000 },
};

interface ChatContextMetadata {
  agent_id: string;
  agent_type: 'executive' | 'departmental' | 'specialist';
  department?: string;
  session_id: string;
  conversation_stage: 'initial' | 'ongoing' | 'handoff' | 'resolution';
  interaction_type: 'question' | 'command' | 'clarification' | 'feedback';
  topic_tags?: string[];
  escalation_level?: 'low' | 'medium' | 'high';
  user_location?: {
    page: string;
    referrer?: string;
  };
  device_info?: {
    user_agent: string;
    screen_resolution?: string;
    timezone?: string;
  };
}

async function checkRateLimit(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    // Get user's billing tier and current usage
    const { data: quotaStatus } = await supabaseClient
      .rpc('get_user_quota_status', { p_user_id: userId });

    if (!quotaStatus || quotaStatus.length === 0) {
      // Default to free tier limits if no data found
      return true; // Allow for now, but track usage
    }

    const userQuota = quotaStatus[0];
    const tierLimits = RATE_LIMITS[userQuota.tier?.toUpperCase() as keyof typeof RATE_LIMITS] || RATE_LIMITS.FREE;

    // Check hourly limit
    if (userQuota.messages_this_hour >= tierLimits.maxMessagesPerHour) {
      throw new Error(`Hourly message limit reached (${tierLimits.maxMessagesPerHour}). Please upgrade your plan or try again later.`);
    }

    // Check daily limit
    if (userQuota.messages_today >= tierLimits.maxMessagesPerDay) {
      throw new Error(`Daily message limit reached (${tierLimits.maxMessagesPerDay}). Please upgrade your plan or try again tomorrow.`);
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('limit reached')) {
      throw error;
    }
    // If rate limit check fails, allow the request but log the error
    return true;
  }
}

async function trackUsage(supabaseClient: any, userId: string, tokensUsed: number = 0): Promise<void> {
  try {
    await supabaseClient.rpc('track_daily_usage', {
      p_user_id: userId,
      p_message_count: 1,
      p_ai_requests: 1,
      p_tokens_used: tokensUsed,
      p_estimated_cost: Math.round(tokensUsed * 0.00002 * 100) / 100, // Rough estimate
    });
  } catch (error) {
    // Usage tracking failure shouldn't block the request
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Session tracking: upsert chat_sessions record if session_id present
    if (metadata?.session_id && metadata.user_id) {
      await supabaseClient.from('chat_sessions').upsert(
        { session_id: metadata.session_id, user_id: metadata.user_id },
        { onConflict: 'session_id' }
      );
    }

    // === RAG: Retrieve related knowledge documents ===
    // 1. Generate embedding for the incoming message via OpenAI
    // ----- Embedding Cache ---------------------------------------------------
    // Compute SHA-256 checksum of the input text (lower-cased, trimmed)
    const encoder = new TextEncoder();
    const data = encoder.encode(message.trim().toLowerCase());
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(digest));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Try to reuse cached embedding first
    let embedding: number[] | null = null;
    const { data: cachedRow, error: cacheErr } = await supabaseClient
      .from('ai_embedding_cache')
      .select('embedding')
      .eq('checksum', checksum)
      .single();

    if (!cacheErr && cachedRow?.embedding) {
      embedding = cachedRow.embedding as unknown as number[];
    }

    // Cache miss → call OpenAI and store result
    if (!embedding) {
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
      });
      if (!embedRes.ok) throw new Error(`Embedding API error: ${embedRes.status}`);
      const embedJson = await embedRes.json();
      embedding = embedJson.data?.[0]?.embedding;
      if (!embedding) throw new Error('Failed to generate embedding');

      // Persist to cache (ignore errors)
      await supabaseClient
        .from('ai_embedding_cache')
        .insert({ checksum, content: message, embedding })
        .select('id');
    }

    // 2. Query Supabase to find the top 5 similar documents (requires a 'match_documents' RPC in Postgres)
    const { data: docs, error: docsError } = await supabaseClient.rpc('match_documents', {
      query_embedding: embedding,
      match_count: 5,
    });
    if (docsError) throw docsError;
    const ragContext = (docs || []).map((d: any) => d.content).join('\n\n');

    // 3. Augment the system prompt with retrieved context
    const augmentedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nContext from knowledge base:\n${ragContext}`
      : `Context from knowledge base:\n${ragContext}`;

    // Get conversation history with context
    const { data: history, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Limit for performance

    if (historyError) {
      throw new Error(`Database error: ${historyError.message}`);
    }

    // Build enhanced message context
    const messages = [];

    // Add system prompt if provided
    if (augmentedSystemPrompt) {
      messages.push({ role: 'system', content: augmentedSystemPrompt });
    }

    // Add conversation history
    (history || []).forEach((msg: any) => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add contextual information if provided
    if (contextualPrompt) {
      messages.push({ 
        role: 'system', 
        content: contextualPrompt 
      });
    }

    // Add the new user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI with enhanced context

    // Default to cost-efficient model; upgrade to `o3` only for final responses
    const isFinalResponse = metadata?.conversation_stage === 'resolution';
    const openaiRequest = {
      model: isFinalResponse ? 'o3' : 'o3-mini-high',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.6,
      frequency_penalty: 0.1,
    };

    // Add additional parameters based on context
    if (metadata?.escalation_level === 'high') {
      openaiRequest.temperature = 0.3; // More focused for urgent requests
      openaiRequest.max_tokens = 1500; // Allow longer responses for complex issues
    }

    // Get completion from OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const completion = await openaiResponse.json();
    const response = completion.choices?.[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Get the user from the JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Check rate limits before processing
    await checkRateLimit(supabaseClient, user.id);

    // Track usage for billing and rate limiting
    const tokensUsed = completion.usage?.total_tokens || 0;
    await trackUsage(supabaseClient, user.id, tokensUsed);

    const timestamp = new Date().toISOString();
    const enhancedMetadata = {
      ...metadata,
      ai_model: completion.model,
      ai_usage: completion.usage,
      response_time_ms: Date.now(),
      timestamp
    };

    // Update session analytics if session_id provided
    if (metadata?.session_id) {
      const { error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .upsert({
          session_id: metadata.session_id,
          user_id: user.id,
          total_messages: (await supabaseClient
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('metadata->>session_id', metadata.session_id)
          ).count || 1,
          primary_department: metadata.department,
          updated_at: new Date().toISOString(),
          metadata: {
            last_agent_id: metadata.agent_id,
            last_interaction_type: metadata.interaction_type,
            escalation_level: metadata.escalation_level,
          }
        }, {
          onConflict: 'session_id'
        });

      if (sessionError) {
        // Don't fail the request for analytics errors
      }
    }

    return new Response(
      JSON.stringify({ 
        message: response,
        success: true,
        conversationId: conversationId,
        sessionId: metadata?.session_id,
        context: {
          agent_id: metadata?.agent_id,
          department: metadata?.department,
          escalation_level: metadata?.escalation_level,
        },
        ai_metadata: {
          model: completion.model,
          usage: completion.usage,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 