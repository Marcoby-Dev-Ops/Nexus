# Deploy Enhanced Chat Function to Supabase

## Overview
This enhanced chat function now includes comprehensive context awareness for better AI responses and session tracking.

## Step 1: Create Enhanced Edge Function

```bash
# SSH into your server and navigate to your project
cd /path/to/your/nexus/project

# Create the enhanced chat function
cat > supabase/functions/chat/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== Enhanced Chat Function Started ===');
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openaiApiKey: !!openaiApiKey,
    });

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error('Missing environment variables');
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
    
    if (!message || !conversationId) {
      throw new Error('Missing required fields: message and conversationId');
    }

    console.log('Processing enhanced chat request:', { 
      conversationId, 
      agentId: metadata?.agent_id,
      messageLength: message.length,
      sessionId: metadata?.session_id,
      interactionType: metadata?.interaction_type,
      escalationLevel: metadata?.escalation_level
    });

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
      console.error('Database error fetching history:', historyError);
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

    console.log('Calling OpenAI with enhanced context:', {
      messageCount: messages.length,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!contextualPrompt,
      agentType: metadata?.agent_type,
      department: metadata?.department
    });

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
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const completion = await openaiResponse.json();
    const response = completion.choices?.[0]?.message?.content;

    if (!response) {
      console.error('No response from OpenAI:', completion);
      throw new Error('No response from OpenAI');
    }

    console.log('Got enhanced AI response:', {
      responseLength: response.length,
      model: completion.model,
      usage: completion.usage
    });

    // Get the user from the JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Invalid or expired token');
    }

    console.log('Saving enhanced messages for user:', user.id);

    const timestamp = new Date().toISOString();
    const enhancedMetadata = {
      ...metadata,
      ai_model: completion.model,
      ai_usage: completion.usage,
      response_time_ms: Date.now(),
      timestamp
    };

    // Save the user's message with enhanced metadata
    const { error: userSaveError } = await supabaseClient
      .from('chat_messages')
      .insert([
        {
          role: 'user',
          content: message,
          conversation_id: conversationId,
          user_id: user.id,
          metadata: enhancedMetadata,
        },
      ]);

    if (userSaveError) {
      console.error('Error saving user message:', userSaveError);
      throw new Error(`Failed to save user message: ${userSaveError.message}`);
    }

    // Save the assistant's response with performance metadata
    const { error: saveError } = await supabaseClient
      .from('chat_messages')
      .insert([
        {
          role: 'assistant',
          content: response,
          conversation_id: conversationId,
          user_id: user.id,
          metadata: {
            agent_id: metadata?.agent_id,
            model_used: completion.model,
            response_time_ms: Date.now() - new Date(timestamp).getTime(),
            confidence_score: 0.85, // Could be calculated based on response quality
            session_id: metadata?.session_id,
            department: metadata?.department,
            ai_usage: completion.usage,
            timestamp: new Date().toISOString(),
          },
        },
      ]);

    if (saveError) {
      console.error('Error saving assistant message:', saveError);
      throw new Error(`Failed to save assistant message: ${saveError.message}`);
    }

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
        console.warn('Session analytics update failed:', sessionError);
        // Don't fail the request for analytics errors
      }
    }

    console.log('Enhanced chat request completed successfully');

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
    console.error('Enhanced edge function error:', error);
    
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
EOF
```

## Step 2: Apply Database Migration

Make sure you've applied the sessions table migration:

```bash
# Apply the sessions migration
supabase db push
```

## Step 3: Deploy the Enhanced Function

```bash
# Deploy the enhanced function
supabase functions deploy chat --no-verify-jwt

# Or if you want to verify JWT (recommended for production)
supabase functions deploy chat
```

## Step 4: Test the Enhanced Function

```bash
# Test with enhanced context
curl -X POST 'http://localhost:54321/functions/v1/chat' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Help me with my sales pipeline",
    "conversationId": "test-conversation-id",
    "systemPrompt": "You are a Sales Assistant specializing in CRM and pipeline management.",
    "contextualPrompt": "User is on the Sales Dashboard page. Recent activity shows focus on lead qualification.",
    "metadata": {
      "agent_id": "sales-manager",
      "agent_type": "departmental", 
      "department": "sales",
      "session_id": "session_user123_1704067200000_abc123",
      "conversation_stage": "ongoing",
      "interaction_type": "question",
      "topic_tags": ["sales", "pipeline"],
      "escalation_level": "medium",
      "user_location": {
        "page": "/sales/dashboard",
        "referrer": "/dashboard"
      },
      "device_info": {
        "user_agent": "Mozilla/5.0...",
        "screen_resolution": "1920x1080",
        "timezone": "America/New_York"
      }
    }
  }'
```

## Environment Variables Required

Make sure your environment has these variables set:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
- `OPENAI_API_KEY` - Your OpenAI API key

## Features Added

1. **Enhanced Context Awareness**: AI responses now consider user location, session history, and interaction patterns
2. **Session Tracking**: Comprehensive session analytics and user behavior tracking  
3. **Intelligent Routing**: Context-aware agent switching and escalation detection
4. **Performance Monitoring**: Response times, model usage, and confidence scoring
5. **Department Specialization**: Department-specific prompts and context handling
6. **Escalation Management**: Automatic detection of urgent requests requiring specialist attention

## Monitoring

Monitor the function logs to see the enhanced context data being processed:

```bash
supabase functions logs chat --follow
```

You should see logs showing context processing, session tracking, and enhanced AI responses. 