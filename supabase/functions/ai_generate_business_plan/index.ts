/**
 * ai_generate_business_plan
 * Creates or refines a business plan markdown for the given company using OpenAI.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { corsHeaders } from '../_shared/cors.ts';

interface BusinessPlanRequest {
  companyName: string;
  industry: string;
  businessModel: string;
  targetMarket: string;
  competitiveAdvantage: string;
  financialProjections?: {
    revenue: number;
    expenses: number;
    timeline: number; // months
  };
  userId: string;
  companyId?: string;
}

interface BusinessPlanSection {
  title: string;
  content: string;
  keyPoints: string[];
}

interface BusinessPlanResponse {
  success: boolean;
  planId?: string;
  sections: BusinessPlanSection[];
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

    const requestData = await req.json() as BusinessPlanRequest;

    if (!requestData.companyName || !requestData.industry || !requestData.businessModel) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Generate business plan using AI
    const planSections = await generateBusinessPlanSections(requestData, openaiApiKey);
    
    // Create summary
    const summary = await generatePlanSummary(planSections, openaiApiKey);

    // Store business plan in database
    const { data: planData, error: planError } = await supabase
      .from('business_plans')
      .insert({
        company_name: requestData.companyName,
        industry: requestData.industry,
        business_model: requestData.businessModel,
        target_market: requestData.targetMarket,
        competitive_advantage: requestData.competitiveAdvantage,
        financial_projections: requestData.financialProjections,
        sections: planSections,
        summary,
        user_id: requestData.userId,
        company_id: requestData.companyId,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (planError) {
      console.error('Failed to store business plan:', planError);
      throw new Error('Failed to store business plan');
    }

    const response: BusinessPlanResponse = {
      success: true,
      planId: planData.id,
      sections: planSections,
      summary,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('ai_generate_business_plan error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateBusinessPlanSections(request: BusinessPlanRequest, apiKey: string): Promise<BusinessPlanSection[]> {
  const sections = [
    'Executive Summary',
    'Company Description',
    'Market Analysis',
    'Organization & Management',
    'Service or Product Line',
    'Marketing & Sales Strategy',
    'Funding Requirements',
    'Financial Projections',
    'Risk Analysis',
    'Implementation Timeline'
  ];

  const planSections: BusinessPlanSection[] = [];

  for (const sectionTitle of sections) {
    const prompt = `Generate a comprehensive ${sectionTitle.toLowerCase()} section for a business plan with the following details:

Company: ${request.companyName}
Industry: ${request.industry}
Business Model: ${request.businessModel}
Target Market: ${request.targetMarket}
Competitive Advantage: ${request.competitiveAdvantage}
${request.financialProjections ? `Financial Projections: Revenue $${request.financialProjections.revenue}, Expenses $${request.financialProjections.expenses}, Timeline ${request.financialProjections.timeline} months` : ''}

Please provide:
1. A detailed section content
2. 3-5 key points or takeaways
3. Make it professional and actionable

Format the response as JSON with "content" and "keyPoints" fields.`;

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
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Try to parse JSON response, fallback to plain text
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = { content, keyPoints: [] };
      }

      planSections.push({
        title: sectionTitle,
        content: parsedContent.content || content,
        keyPoints: parsedContent.keyPoints || [],
      });

    } catch (error) {
      console.error(`Error generating ${sectionTitle}:`, error);
      // Add fallback content
      planSections.push({
        title: sectionTitle,
        content: `[${sectionTitle} content generation failed]`,
        keyPoints: [],
      });
    }
  }

  return planSections;
}

async function generatePlanSummary(sections: BusinessPlanSection[], apiKey: string): Promise<string> {
  const sectionsText = sections.map(s => `${s.title}:\n${s.content}`).join('\n\n');

  const prompt = `Create a concise executive summary (2-3 paragraphs) for this business plan:

${sectionsText}

Focus on the most important points and make it compelling for stakeholders.`;

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Executive summary generation failed.';

  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Executive summary generation failed.';
  }
} 