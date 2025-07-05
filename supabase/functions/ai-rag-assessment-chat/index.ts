import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

// Initialize OpenAI client from environment variables
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  try {
    // 1. Authenticate user and get company_id
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response('Authentication failed', { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('UserProfile')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.company_id) {
      console.error('Profile fetch error:', profileError);
      return new Response('User profile or company not found', { status: 404 });
    }
    const { company_id } = profile;
    const { query } = await req.json();

    // 2. Fetch all assessment data for the company
    const { data: responses, error: responsesError } = await supabaseClient
      .from('AssessmentResponse')
      .select(`
        value,
        score,
        question:AssessmentQuestion (
          prompt,
          category:AssessmentCategory (
            name
          )
        )
      `)
      .eq('company_id', company_id);

    if (responsesError) throw responsesError;

    // 3. Engineer the context prompt
    let contextText = "--- Company Business Health Assessment Context ---\n";
    const groupedData = responses.reduce((acc, res) => {
      const categoryName = res.question?.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(`- Question: ${res.question.prompt}\n  - Answer: ${res.value} (Score: ${res.score ?? 'N/A'})`);
      return acc;
    }, {});

    for (const category in groupedData) {
      contextText += `\nCategory: ${category}\n`;
      contextText += groupedData[category].join('\n');
    }
    contextText += "\n--- End Context ---";

    // 4. Call OpenAI API with the context and user query, now with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using a faster model for streaming
      messages: [
        {
          role: 'system',
          content: `You are an expert business consultant AI for a company named Marcoby Nexus. Your purpose is to provide helpful, specific advice based *exclusively* on the Business Health Assessment context provided. Do not use any outside knowledge. If the user's query cannot be answered by the context, politely state that you do not have enough information from their assessment to answer.`,
        },
        {
          role: 'user',
          content: `${contextText}\n\nUser Query: "${query}"`,
        },
      ],
      stream: true,
    });
    
    // 5. Pipe the stream from OpenAI to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in RAG function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 