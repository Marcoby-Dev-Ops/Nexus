import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

// Enhanced Model Manager for Edge Functions
interface ModelConfig {
  model: string;
  provider: 'openai' | 'openrouter';
  maxTokens: number;
  temperature: number;
  costPer1KTokens: number;
  fallbackModels: string[];
  supportsTools: boolean;
  supportsAssistants: boolean;
  bestForTasks: string[];
  securityLevel: 'low' | 'medium' | 'high';
}

// Tiered model configurations for scalability and security
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Tier 1: High Security & Complex Tasks (OpenAI)
  mission_critical: {
    model: 'gpt-4o',
    provider: 'openai',
    maxTokens: 2000,
    temperature: 0.3,
    costPer1KTokens: 0.0025,
    fallbackModels: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    supportsTools: true,
    supportsAssistants: true,
    bestForTasks: ['financial_analysis', 'strategic_planning', 'complex_reasoning', 'tool_usage'],
    securityLevel: 'high'
  },
  
  // Tier 2: Balanced Performance (OpenRouter Premium)
  balanced: {
    model: 'anthropic/claude-3-sonnet',
    provider: 'openrouter',
    maxTokens: 1500,
    temperature: 0.5,
    costPer1KTokens: 0.0015,
    fallbackModels: ['gpt-4o-mini', 'anthropic/claude-3-haiku'],
    supportsTools: true,
    supportsAssistants: false,
    bestForTasks: ['content_generation', 'analysis', 'reasoning'],
    securityLevel: 'medium'
  },
  
  // Tier 3: Cost-Efficient (OpenRouter Free/Cheap)
  cost_efficient: {
    model: 'mistralai/mistral-7b-instruct:free',
    provider: 'openrouter',
    maxTokens: 1000,
    temperature: 0.7,
    costPer1KTokens: 0.0000,
    fallbackModels: ['gpt-3.5-turbo', 'anthropic/claude-3-haiku'],
    supportsTools: false,
    supportsAssistants: false,
    bestForTasks: ['simple_qa', 'basic_analysis', 'content_generation'],
    securityLevel: 'low'
  }
};

// Initialize AI clients
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Enhanced Agent Registry with model tier requirements
const AGENT_REGISTRY = {
  executive: {
    id: 'executive',
    name: 'Executive Assistant',
    description: 'Your senior C-suite strategic advisor',
    specialties: ['strategic planning', 'cross-department coordination', 'executive reporting'],
    tools: ['business_intelligence', 'strategic_planning', 'performance_dashboard', 'board_reporting'],
    expertise: ['Strategic Planning', 'Business Transformation', 'Executive Leadership', 'Cross-functional Coordination'],
    systemPrompt: `You are a senior C-suite strategic advisor with 25+ years of executive experience. Think like a CEO: strategic, big-picture focused. Provide actionable frameworks and methodologies. Reference specific business cases and market examples. Balance short-term tactics with long-term strategy.`,
    requiredModelTier: 'mission_critical', // High-security, complex reasoning
    securityLevel: 'high'
  },
  sales: {
    id: 'sales',
    name: 'Sales Director',
    description: 'Sales strategy and performance specialist',
    specialties: ['sales strategy', 'pipeline management', 'revenue optimization'],
    tools: ['crm_integration', 'pipeline_analysis', 'lead_scoring', 'sales_forecasting'],
    expertise: ['Pipeline Management', 'Revenue Optimization', 'Sales Strategy', 'Lead Qualification'],
    systemPrompt: `You are a seasoned Sales Director with deep expertise in B2B sales, pipeline management, and revenue optimization. Focus on actionable sales strategies, lead qualification, and conversion optimization.`,
    requiredModelTier: 'balanced', // Tools required but not mission-critical
    securityLevel: 'medium'
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Director',
    description: 'Marketing strategy and campaign specialist',
    specialties: ['marketing strategy', 'campaign management', 'brand development'],
    tools: ['campaign_analysis', 'content_strategy', 'brand_analysis', 'market_research'],
    expertise: ['Campaign Management', 'Brand Strategy', 'Content Marketing', 'Market Analysis'],
    systemPrompt: `You are an experienced Marketing Director with expertise in digital marketing, brand strategy, and campaign optimization. Focus on data-driven marketing strategies and creative solutions.`,
    requiredModelTier: 'balanced',
    securityLevel: 'medium'
  },
  finance: {
    id: 'finance',
    name: 'Finance Director',
    description: 'Financial planning and analysis specialist',
    specialties: ['financial planning', 'budget analysis', 'risk management'],
    tools: ['financial_analysis', 'budget_planning', 'risk_assessment', 'forecasting'],
    expertise: ['Financial Planning', 'Budget Analysis', 'Risk Management', 'Financial Forecasting'],
    systemPrompt: `You are a certified Finance Director with expertise in financial planning, analysis, and risk management. Provide accurate financial insights and strategic recommendations.`,
    requiredModelTier: 'mission_critical', // Financial data requires high security
    securityLevel: 'high'
  },
  operations: {
    id: 'operations',
    name: 'Operations Director',
    description: 'Operations and process optimization specialist',
    specialties: ['process optimization', 'operational efficiency', 'automation'],
    tools: ['process_analysis', 'efficiency_assessment', 'automation_planning', 'workflow_optimization'],
    expertise: ['Process Optimization', 'Operational Efficiency', 'Automation', 'Workflow Management'],
    systemPrompt: `You are an Operations Director with expertise in process optimization, efficiency improvement, and automation. Focus on actionable operational strategies and process improvements.`,
    requiredModelTier: 'balanced',
    securityLevel: 'medium'
  },
  support: {
    id: 'support',
    name: 'Support Specialist',
    description: 'Customer support and service specialist',
    specialties: ['customer support', 'issue resolution', 'service optimization'],
    tools: ['support_analysis', 'issue_tracking', 'satisfaction_analysis', 'service_optimization'],
    expertise: ['Customer Support', 'Issue Resolution', 'Service Quality', 'Customer Satisfaction'],
    systemPrompt: `You are a Customer Support Specialist with expertise in issue resolution, customer service, and satisfaction optimization. Focus on helpful, empathetic, and solution-oriented responses.`,
    requiredModelTier: 'cost_efficient', // Simple support queries
    securityLevel: 'low'
  }
};

// Intelligent model selection based on agent requirements and query complexity
function selectOptimalModel(agent: any, query: string, hasTools: boolean): ModelConfig {
  const baseModelTier = agent.requiredModelTier || 'balanced';
  
  // Upgrade model tier based on query complexity
  const isComplexQuery = query.length > 500 || 
    /\b(analyze|strategy|complex|financial|budget|forecast|plan|optimize)\b/i.test(query);
  
  const isFinancialQuery = /\b(financial|budget|revenue|cost|profit|forecast|analysis)\b/i.test(query);
  
  const requiresTools = hasTools || 
    /\b(calculate|analyze|generate|create|update|search|find)\b/i.test(query);
  
  // Security-first model selection
  if (isFinancialQuery || agent.securityLevel === 'high') {
    return MODEL_CONFIGS.mission_critical;
  }
  
  if (requiresTools && MODEL_CONFIGS[baseModelTier].supportsTools) {
    return MODEL_CONFIGS[baseModelTier];
  }
  
  if (requiresTools && !MODEL_CONFIGS[baseModelTier].supportsTools) {
    return MODEL_CONFIGS.balanced; // Upgrade to tool-capable model
  }
  
  if (isComplexQuery && baseModelTier === 'cost_efficient') {
    return MODEL_CONFIGS.balanced; // Upgrade for complex queries
  }
  
  return MODEL_CONFIGS[baseModelTier];
}

// Enhanced AI request handler with fallback and monitoring
async function makeAIRequest(
  config: ModelConfig,
  messages: any[],
  tools?: any[],
  retryCount = 0
): Promise<any> {
  const maxRetries = 2;
  
  try {
    if (config.provider === 'openai') {
      const requestParams: any = {
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      };
      
      if (tools && config.supportsTools) {
        requestParams.tools = tools;
        requestParams.tool_choice = 'auto';
      }
      
      return await openai.chat.completions.create(requestParams);
    } else {
      // OpenRouter request
      const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!openrouterApiKey) {
        throw new Error('OpenRouter API key not configured');
      }
      
      const requestParams: any = {
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      };
      
      if (tools && config.supportsTools) {
        requestParams.tools = tools;
        requestParams.tool_choice = 'auto';
      }
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nexus.marcoby.com',
          'X-Title': 'Nexus AI Assistant'
        },
        body: JSON.stringify(requestParams)
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      
      return response;
    }
  } catch (error) {
    console.error(`AI request failed (attempt ${retryCount + 1}):`, error);
    
    // Implement fallback strategy
    if (retryCount < maxRetries && config.fallbackModels.length > 0) {
      const fallbackModel = config.fallbackModels[retryCount];
      const fallbackConfig = Object.values(MODEL_CONFIGS).find(c => c.model === fallbackModel);
      
      if (fallbackConfig) {
        console.log(`Falling back to model: ${fallbackModel}`);
        return await makeAIRequest(fallbackConfig, messages, tools, retryCount + 1);
      }
    }
    
    throw error;
  }
}

// Enhanced domain insights with live business data
async function getDomainInsights(supabase: any, agentId: string) {
  try {
    const insights: any = {};
    
    // Get recent KPIs for the agent's department
    const { data: kpis } = await supabase
      .from('kpis')
      .select('*')
      .eq('department', agentId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (kpis && kpis.length > 0) {
      insights.recentKPIs = kpis.map(kpi => ({
        metric: kpi.metric_name,
        value: kpi.value,
        change: kpi.change_percentage,
        trend: kpi.trend
      }));
    }
    
    // Get business health score
    const { data: healthScore } = await supabase
      .rpc('get_business_health_score')
      .single();
    
    if (healthScore) {
      insights.businessHealth = {
        overall: healthScore.overall_score,
        categories: healthScore.category_scores
      };
    }
    
    return insights;
  } catch (error) {
    console.error('Error fetching domain insights:', error);
    return {};
  }
}

// Main request handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    const { query, agent: agentId, routing } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }
    
    // Get agent configuration
    const agent = AGENT_REGISTRY[agentId] || AGENT_REGISTRY.executive;
    
    // Get domain insights
    const domainInsights = await getDomainInsights(supabase, agentId);
    
    // Intelligent model selection
    const selectedModel = selectOptimalModel(agent, query, agent.tools?.length > 0);
    
    console.log(`Selected model: ${selectedModel.model} (${selectedModel.provider}) for agent: ${agent.name}`);
    
    // Get business context
    const { data: responses, error: responsesError } = await supabase
      .from('assessment_responses')
      .select(`
        value,
        score,
        question:questions (
          prompt,
          category:categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (responsesError) throw responsesError;

    // Build context
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

    // Enhanced system prompt with security and model awareness
    let systemPrompt = `${agent.systemPrompt}

You are an expert business consultant AI for Nexus (by Marcoby). Your purpose is to provide helpful, specific advice based *exclusively* on the Business Health Assessment context provided.

SECURITY LEVEL: ${selectedModel.securityLevel.toUpperCase()}
MODEL: ${selectedModel.model} (${selectedModel.provider})

SPECIALTIES: ${agent.specialties.join(', ')}
AVAILABLE TOOLS: ${agent.tools?.join(', ') || 'None'}

IMPORTANT: Only use information from the provided context. If the query cannot be answered from the context, state that clearly.`;

    if (routing) {
      systemPrompt += `\n\nROUTING INFO: This query was automatically routed to you because: ${routing.reasoning} (Confidence: ${Math.round(routing.confidence * 100)}%)`;
    }

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `${contextText}\n\nUser Query: "${query}"`,
      },
    ];

    // Make AI request with selected model
    const stream = await makeAIRequest(selectedModel, messages, agent.tools);
    
    // Create response stream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            content: routing ? `*[Routed to ${agent.name}]*\n\n` : '',
            routing: routing || null,
            agent: agent.id,
            modelInfo: {
              model: selectedModel.model,
              provider: selectedModel.provider,
              securityLevel: selectedModel.securityLevel,
              tier: agent.requiredModelTier
            },
            domainCapabilities: {
              tools: agent.tools || [],
              expertise: agent.expertise || [],
              insights: domainInsights
            }
          };
          
          controller.enqueue(`data: ${JSON.stringify(metadata)}\n\n`);
          
          // Stream AI response
          if (selectedModel.provider === 'openai') {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
          } else {
            // Handle OpenRouter streaming
            const reader = stream.body?.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                      controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

  } catch (error) {
    console.error('Error in hybrid AI function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500,
    });
  }
}); 