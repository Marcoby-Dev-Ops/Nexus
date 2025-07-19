import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { corsHeaders } from '../_shared/cors.ts';

interface SuggestionRequest {
  type: 'marketing' | 'sales' | 'product' | 'operations' | 'finance' | 'strategy';
  context: string;
  companyInfo?: {
    industry: string;
    size: string;
    stage: string;
  };
  userId: string;
  companyId?: string;
  constraints?: {
    budget?: number;
    timeline?: string;
    resources?: string[];
  };
}

interface Suggestion {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  cost: string;
  priority: number;
  tags: string[];
}

interface SuggestionResponse {
  success: boolean;
  suggestions: Suggestion[];
  summary: string;
  generatedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const requestData = await req.json() as SuggestionRequest;

    if (!requestData.type || !requestData.context) {
      return new Response(JSON.stringify({ error: 'Missing type or context' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Generate suggestions using AI
    const suggestions = await generateSuggestions(requestData, openaiApiKey);
    
    // Create summary
    const summary = await generateSuggestionSummary(suggestions, requestData.type, openaiApiKey);

    // Store suggestions in database
    const { data: suggestionData, error: suggestionError } = await supabase
      .from('ai_suggestions')
      .insert({
        type: requestData.type,
        context: requestData.context,
        company_info: requestData.companyInfo,
        constraints: requestData.constraints,
        suggestions,
        summary,
        user_id: requestData.userId,
        company_id: requestData.companyId,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (suggestionError) {
      console.error('Failed to store suggestions:', suggestionError);
    }

    const response: SuggestionResponse = {
      success: true,
      suggestions,
      summary,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('ai_generate_suggestions error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateSuggestions(request: SuggestionRequest, apiKey: string): Promise<Suggestion[]> {
  const typePrompts = {
    marketing: 'Generate marketing strategy suggestions including digital marketing, content marketing, social media, and traditional marketing approaches.',
    sales: 'Generate sales strategy suggestions including lead generation, pipeline management, customer acquisition, and sales process optimization.',
    product: 'Generate product development suggestions including feature prioritization, user experience improvements, and product-market fit strategies.',
    operations: 'Generate operational efficiency suggestions including process optimization, automation opportunities, and resource allocation improvements.',
    finance: 'Generate financial management suggestions including cost optimization, revenue growth strategies, and financial planning improvements.',
    strategy: 'Generate strategic business suggestions including market expansion, competitive positioning, and long-term growth strategies.'
  };

  const prompt = `Generate 5 actionable business suggestions for a ${request.type} focus area.

Context: ${request.context}
${request.companyInfo ? `Company: ${request.companyInfo.industry} industry, ${request.companyInfo.size} size, ${request.companyInfo.stage} stage` : ''}
${request.constraints ? `Constraints: Budget $${request.constraints.budget || 'flexible'}, Timeline: ${request.constraints.timeline || 'flexible'}, Resources: ${request.constraints.resources?.join(', ') || 'standard'}` : ''}

${typePrompts[request.type]}

For each suggestion, provide:
- Title (clear and actionable)
- Description (detailed explanation)
- Impact (high/medium/low)
- Effort (low/medium/high)
- Timeline (e.g., "1-2 weeks", "1-3 months")
- Cost (e.g., "$0-500", "$1K-5K", "$5K+")
- Priority (1-5, where 1 is highest)
- Tags (relevant categories)

Format as JSON array with these fields.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Try to parse JSON response, fallback to structured suggestions
    try {
      const parsedSuggestions = JSON.parse(content);
      return Array.isArray(parsedSuggestions) ? parsedSuggestions : [];
    } catch {
      // Fallback: generate structured suggestions
      return generateFallbackSuggestions(request.type);
    }

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return generateFallbackSuggestions(request.type);
  }
}

function generateFallbackSuggestions(type: string): Suggestion[] {
  const fallbackSuggestions = {
    marketing: [
      {
        title: 'Implement Content Marketing Strategy',
        description: 'Create valuable, relevant content to attract and engage your target audience.',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeline: '2-4 weeks',
        cost: '$1K-3K',
        priority: 1,
        tags: ['content', 'seo', 'branding']
      },
      {
        title: 'Launch Social Media Campaign',
        description: 'Develop a comprehensive social media presence across relevant platforms.',
        impact: 'medium' as const,
        effort: 'low' as const,
        timeline: '1-2 weeks',
        cost: '$500-1K',
        priority: 2,
        tags: ['social', 'engagement', 'awareness']
      }
    ],
    sales: [
      {
        title: 'Implement CRM System',
        description: 'Deploy a customer relationship management system to track leads and opportunities.',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeline: '1-2 months',
        cost: '$2K-5K',
        priority: 1,
        tags: ['automation', 'tracking', 'efficiency']
      },
      {
        title: 'Develop Sales Training Program',
        description: 'Create comprehensive training materials for your sales team.',
        impact: 'medium' as const,
        effort: 'high' as const,
        timeline: '2-4 weeks',
        cost: '$1K-3K',
        priority: 2,
        tags: ['training', 'skills', 'performance']
      }
    ],
    product: [
      {
        title: 'Conduct User Research',
        description: 'Gather feedback from current users to identify improvement opportunities.',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeline: '2-4 weeks',
        cost: '$1K-3K',
        priority: 1,
        tags: ['research', 'feedback', 'improvement']
      },
      {
        title: 'Prioritize Feature Development',
        description: 'Create a roadmap based on user needs and business impact.',
        impact: 'medium' as const,
        effort: 'low' as const,
        timeline: '1-2 weeks',
        cost: '$0-500',
        priority: 2,
        tags: ['roadmap', 'planning', 'prioritization']
      }
    ],
    operations: [
      {
        title: 'Process Automation Audit',
        description: 'Identify manual processes that can be automated for efficiency gains.',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeline: '1-2 months',
        cost: '$2K-5K',
        priority: 1,
        tags: ['automation', 'efficiency', 'productivity']
      },
      {
        title: 'Implement Project Management Tools',
        description: 'Deploy tools to improve team collaboration and project tracking.',
        impact: 'medium' as const,
        effort: 'low' as const,
        timeline: '1-2 weeks',
        cost: '$500-1K',
        priority: 2,
        tags: ['collaboration', 'tracking', 'organization']
      }
    ],
    finance: [
      {
        title: 'Financial Health Assessment',
        description: 'Conduct a comprehensive review of current financial position and projections.',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeline: '2-4 weeks',
        cost: '$1K-3K',
        priority: 1,
        tags: ['analysis', 'planning', 'strategy']
      },
      {
        title: 'Cost Optimization Review',
        description: 'Identify areas where costs can be reduced without impacting quality.',
        impact: 'medium' as const,
        effort: 'low' as const,
        timeline: '1-2 weeks',
        cost: '$0-500',
        priority: 2,
        tags: ['optimization', 'efficiency', 'savings']
      }
    ],
    strategy: [
      {
        title: 'Market Analysis Update',
        description: 'Conduct a comprehensive analysis of market trends and competitive landscape.',
        impact: 'high' as const,
        effort: 'high' as const,
        timeline: '1-2 months',
        cost: '$3K-8K',
        priority: 1,
        tags: ['research', 'analysis', 'strategy']
      },
      {
        title: 'Strategic Planning Workshop',
        description: 'Facilitate a workshop to align team on strategic priorities and goals.',
        impact: 'medium' as const,
        effort: 'medium' as const,
        timeline: '1-2 weeks',
        cost: '$1K-3K',
        priority: 2,
        tags: ['planning', 'alignment', 'goals']
      }
    ]
  };

  return fallbackSuggestions[type] || fallbackSuggestions.strategy;
}

async function generateSuggestionSummary(suggestions: Suggestion[], type: string, apiKey: string): Promise<string> {
  const suggestionsText = suggestions.map((s, i) => 
    `${i + 1}. ${s.title} (Impact: ${s.impact}, Effort: ${s.effort}, Cost: ${s.cost})`
  ).join('\n');

  const prompt = `Create a concise summary (2-3 sentences) of these ${type} suggestions:

${suggestionsText}

Focus on the overall strategy and key benefits.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Summary generation failed.';

  } catch (error) {
    console.error('Error generating summary:', error);
    return `Generated ${suggestions.length} ${type} suggestions with varying impact and effort levels.`;
  }
}
