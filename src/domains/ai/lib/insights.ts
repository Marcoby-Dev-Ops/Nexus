import type { Integration } from '@/shared/types/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IntegrationInsight {
  id: string;
  integrationId: string;
  content: string;
  type: 'note' | 'action' | 'insight';
  importance: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface InsightGenerationContext {
  integration: Integration;
  recentInsight?: IntegrationInsight;
  historicalInsights?: IntegrationInsight[];
}

// Model configurations for different tasks
const MODEL_CONFIGS = {
  // Simpler models for basic tasks
  simple: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7
  },
  // Mid-tier models for pattern recognition
  pattern: {
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.5
  },
  // Premium models for complex decision making
  complex: {
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.3
  }
};

export async function generateInsights(
  integration: Integration,
  recentInsight?: IntegrationInsight
): Promise<IntegrationInsight[]> {
  try {
    const context: InsightGenerationContext = {
      integration,
      recentInsight,
      historicalInsights: await getHistoricalInsights(integration.id)
    };

    // Generate different types of insights using appropriate models
    const [basicInsights, patternInsights, complexInsights] = await Promise.all([
      generateBasicInsights(context),
      generatePatternInsights(context),
      generateComplexInsights(context)
    ]);

    // Combine and deduplicate insights
    const allInsights = [...basicInsights, ...patternInsights, ...complexInsights];
    return deduplicateInsights(allInsights);
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}

async function generateBasicInsights(context: InsightGenerationContext): Promise<any[]> {
  const prompt = generateBasicPrompt(context);
  const response = await openai.chat.completions.create({
    model: MODEL_CONFIGS.simple.model,
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that helps users organize their integration data.
        Focus on simple, clear insights that help users understand their data better.
        Keep responses concise and straightforward.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: MODEL_CONFIGS.simple.maxTokens,
    temperature: MODEL_CONFIGS.simple.temperature
  });

  const content = response.choices[0].message.content;
  return content ? parseAIResponse(content, 'note') : [];
}

async function generatePatternInsights(context: InsightGenerationContext): Promise<IntegrationInsight[]> {
  const prompt = generatePatternPrompt(context);
  const response = await openai.chat.completions.create({
    model: MODEL_CONFIGS.pattern.model,
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that identifies patterns and connections in integration data.
        Focus on:
        1. Identifying recurring patterns
        2. Finding relationships between different data points
        3. Suggesting organizational improvements
        4. Highlighting potential optimizations`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: MODEL_CONFIGS.pattern.maxTokens,
    temperature: MODEL_CONFIGS.pattern.temperature
  });

  const content = response.choices[0].message.content;
  return content ? parseAIResponse(content, 'insight') : [];
}

async function generateComplexInsights(context: InsightGenerationContext): Promise<IntegrationInsight[]> {
  const prompt = generateComplexPrompt(context);
  const response = await openai.chat.completions.create({
    model: MODEL_CONFIGS.complex.model,
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that provides deep analysis and strategic recommendations.
        Focus on:
        1. Complex pattern recognition
        2. Strategic recommendations
        3. Long-term implications
        4. Cross-integration insights
        5. Actionable next steps`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: MODEL_CONFIGS.complex.maxTokens,
    temperature: MODEL_CONFIGS.complex.temperature
  });
  
  const content = response.choices[0].message.content;
  return content ? parseAIResponse(content, 'action') : [];
}

async function getHistoricalInsights(integrationId: string): Promise<IntegrationInsight[]> {
  // Fetch recent insights from the database
  // This would be implemented using Prisma
  return [];
}

function generateBasicPrompt(context: InsightGenerationContext): string {
  const { integration, recentInsight } = context;
  return `
    Provide simple, clear insights about this integration:
    
    Integration ID: ${integration.id}
    Type: ${integration.type}
    Status: ${integration.status}
    
    ${recentInsight ? `Recent Insight: ${recentInsight.content}` : ''}
    
    Focus on:
    1. Basic organization
    2. Simple patterns
    3. Clear recommendations
    
    Format each insight as a separate item with importance (high/medium/low).
  `;
}

function generatePatternPrompt(context: InsightGenerationContext): string {
  const { integration, historicalInsights } = context;
  return `
    Analyze patterns in this integration:
    
    Integration ID: ${integration.id}
    Type: ${integration.type}
    Status: ${integration.status}
    
    ${historicalInsights?.length ? `Historical Insights: ${historicalInsights.map(i => i.content).join('\n')}` : ''}
    
    Focus on:
    1. Recurring patterns
    2. Data relationships
    3. Organizational improvements
    4. Optimization opportunities
    
    Format each insight as a separate item with importance (high/medium/low).
  `;
}

function generateComplexPrompt(context: InsightGenerationContext): string {
  const { integration, recentInsight, historicalInsights } = context;
  return `
    Provide deep analysis and strategic recommendations:
    
    Integration ID: ${integration.id}
    Type: ${integration.type}
    Status: ${integration.status}
    
    ${recentInsight ? `Recent Insight: ${recentInsight.content}` : ''}
    
    ${historicalInsights?.length ? `Historical Insights: ${historicalInsights.map(i => i.content).join('\n')}` : ''}
    
    Focus on:
    1. Complex pattern recognition
    2. Strategic implications
    3. Long-term recommendations
    4. Cross-integration insights
    5. Actionable next steps
    
    Format each insight as a separate item with importance (high/medium/low).
  `;
}

function parseAIResponse(response: string, defaultType: 'note' | 'action' | 'insight'): IntegrationInsight[] {
  // This is a placeholder implementation
  return response.split('\n').map((line, index) => ({
    id: `insight-${Date.now()}-${index}`,
    integrationId: 'unknown',
    content: line,
    type: defaultType,
    importance: 'medium',
    createdAt: new Date(),
  }));
}

function deduplicateInsights(insights: IntegrationInsight[]): IntegrationInsight[] {
  const seen = new Set<string>();
  return insights.filter(insight => {
    const key = `${insight.type}-${insight.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
} 