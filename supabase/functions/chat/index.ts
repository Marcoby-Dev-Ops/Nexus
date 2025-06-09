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

    // Get the request body with enhanced context
    const { 
      message, 
      conversationId, 
      systemPrompt, 
      contextualPrompt, 
      metadata 
    } = await req.json();
    
    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    
    if (!conversationId || typeof conversationId !== 'string') {
      throw new Error('ConversationId is required and must be a string');
    }
    
    if (message.length > 4000) {
      throw new Error('Message too long. Maximum 4000 characters allowed.');
    }
    
    if (message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (systemPrompt && typeof systemPrompt !== 'string') {
      throw new Error('SystemPrompt must be a string');
    }
    
    if (contextualPrompt && typeof contextualPrompt !== 'string') {
      throw new Error('ContextualPrompt must be a string');
    }

    // Process enhanced chat request

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

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
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
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

    // Prepare OpenAI request with enhanced context
    const openaiRequest = {
      model: 'gpt-4',
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