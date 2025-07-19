import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { corsHeaders } from '../_shared/cors.ts';

interface DailyMetricsRequest {
  date?: string; // ISO date string, defaults to today
  userId?: string;
  companyId?: string;
  includeAnalysis?: boolean;
}

interface DailyMetrics {
  date: string;
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  userSatisfaction: number;
  costPerInteraction: number;
  topUsedFeatures: string[];
  errorRate: number;
  activeUsers: number;
}

interface MetricsAnalysis {
  trends: {
    interactions: 'increasing' | 'decreasing' | 'stable';
    satisfaction: 'increasing' | 'decreasing' | 'stable';
    cost: 'increasing' | 'decreasing' | 'stable';
  };
  insights: string[];
  recommendations: string[];
}

interface MetricsResponse {
  success: boolean;
  metrics: DailyMetrics;
  analysis?: MetricsAnalysis;
  generatedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
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

    const requestData = await req.json() as DailyMetricsRequest;
    const targetDate = requestData.date || new Date().toISOString().split('T')[0];

    // Collect daily metrics
    const metrics = await collectDailyMetrics(supabase, targetDate, user.id, requestData.companyId);
    
    // Store metrics in database
    const { data: storedMetrics, error: storeError } = await supabase
      .from('ai_metrics_daily')
      .upsert({
        date: targetDate,
        user_id: user.id,
        company_id: requestData.companyId,
        metrics,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (storeError) {
      console.error('Failed to store metrics:', storeError);
    }

    let analysis: MetricsAnalysis | undefined;
    
    if (requestData.includeAnalysis) {
      analysis = await generateMetricsAnalysis(supabase, targetDate, user.id, requestData.companyId);
    }

    const response: MetricsResponse = {
      success: true,
      metrics,
      analysis,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('ai_metrics_daily error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function collectDailyMetrics(supabase: any, date: string, userId: string, companyId?: string): Promise<DailyMetrics> {
  const startOfDay = new Date(date + 'T00:00:00Z').toISOString();
  const endOfDay = new Date(date + 'T23:59:59Z').toISOString();

  // Get AI interactions for the day
  const { data: interactions, error: interactionsError } = await supabase
    .from('ai_interactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (interactionsError) {
    console.error('Error fetching interactions:', interactionsError);
  }

  const interactionsList = interactions || [];

  // Get AI messages for the day
  const { data: messages, error: messagesError } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  }

  const messagesList = messages || [];

  // Get user feedback for the day
  const { data: feedback, error: feedbackError } = await supabase
    .from('ai_user_feedback')
    .select('rating')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (feedbackError) {
    console.error('Error fetching feedback:', feedbackError);
  }

  const feedbackList = feedback || [];

  // Calculate metrics
  const totalInteractions = interactionsList.length;
  const successfulInteractions = interactionsList.filter(i => i.status === 'completed').length;
  const averageResponseTime = interactionsList.length > 0 
    ? interactionsList.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / interactionsList.length 
    : 0;
  
  const userSatisfaction = feedbackList.length > 0
    ? feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.length
    : 0;

  // Estimate cost (assuming $0.002 per 1K tokens for GPT-4o-mini)
  const estimatedTokens = messagesList.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const costPerInteraction = totalInteractions > 0 ? (estimatedTokens * 0.002 / 1000) / totalInteractions : 0;

  // Get top used features
  const featureCounts = interactionsList.reduce((acc, i) => {
    const feature = i.agent_id || 'general';
    acc[feature] = (acc[feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUsedFeatures = Object.entries(featureCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([feature]) => feature);

  const errorRate = totalInteractions > 0 
    ? (totalInteractions - successfulInteractions) / totalInteractions 
    : 0;

  // Get unique active users (for company-wide metrics)
  const { data: activeUsersData, error: activeUsersError } = await supabase
    .from('ai_interactions')
    .select('user_id')
    .eq('company_id', companyId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (activeUsersError) {
    console.error('Error fetching active users:', activeUsersError);
  }

  const activeUsers = new Set(activeUsersData?.map(u => u.user_id) || []).size;

  return {
    date,
    totalInteractions,
    successfulInteractions,
    averageResponseTime,
    userSatisfaction,
    costPerInteraction,
    topUsedFeatures,
    errorRate,
    activeUsers,
  };
}

async function generateMetricsAnalysis(supabase: any, date: string, userId: string, companyId?: string): Promise<MetricsAnalysis> {
  // Get metrics for the last 7 days for trend analysis
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data: historicalMetrics, error: historicalError } = await supabase
    .from('ai_metrics_daily')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', date)
    .order('date', { ascending: true });

  if (historicalError) {
    console.error('Error fetching historical metrics:', historicalError);
  }

  const metrics = historicalMetrics || [];
  
  if (metrics.length < 2) {
    return {
      trends: {
        interactions: 'stable',
        satisfaction: 'stable',
        cost: 'stable',
      },
      insights: ['Insufficient data for trend analysis'],
      recommendations: ['Continue using the system to gather more metrics'],
    };
  }

  // Calculate trends
  const recentMetrics = metrics.slice(-3);
  const olderMetrics = metrics.slice(-6, -3);

  const recentAvgInteractions = recentMetrics.reduce((sum, m) => sum + (m.metrics?.totalInteractions || 0), 0) / recentMetrics.length;
  const olderAvgInteractions = olderMetrics.reduce((sum, m) => sum + (m.metrics?.totalInteractions || 0), 0) / olderMetrics.length;

  const recentAvgSatisfaction = recentMetrics.reduce((sum, m) => sum + (m.metrics?.userSatisfaction || 0), 0) / recentMetrics.length;
  const olderAvgSatisfaction = olderMetrics.reduce((sum, m) => sum + (m.metrics?.userSatisfaction || 0), 0) / olderMetrics.length;

  const recentAvgCost = recentMetrics.reduce((sum, m) => sum + (m.metrics?.costPerInteraction || 0), 0) / recentMetrics.length;
  const olderAvgCost = olderMetrics.reduce((sum, m) => sum + (m.metrics?.costPerInteraction || 0), 0) / olderMetrics.length;

  const trends = {
    interactions: recentAvgInteractions > olderAvgInteractions * 1.1 ? 'increasing' 
      : recentAvgInteractions < olderAvgInteractions * 0.9 ? 'decreasing' : 'stable',
    satisfaction: recentAvgSatisfaction > olderAvgSatisfaction * 1.05 ? 'increasing'
      : recentAvgSatisfaction < olderAvgSatisfaction * 0.95 ? 'decreasing' : 'stable',
    cost: recentAvgCost > olderAvgCost * 1.1 ? 'increasing'
      : recentAvgCost < olderAvgCost * 0.9 ? 'decreasing' : 'stable',
  };

  // Generate insights
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (trends.interactions === 'increasing') {
    insights.push('User engagement with AI features is growing');
    recommendations.push('Consider expanding AI capabilities to capitalize on growing usage');
  } else if (trends.interactions === 'decreasing') {
    insights.push('User engagement with AI features is declining');
    recommendations.push('Investigate potential issues and gather user feedback');
  }

  if (trends.satisfaction === 'increasing') {
    insights.push('User satisfaction with AI responses is improving');
    recommendations.push('Continue current AI model and prompt optimization');
  } else if (trends.satisfaction === 'decreasing') {
    insights.push('User satisfaction with AI responses is declining');
    recommendations.push('Review and improve AI response quality and relevance');
  }

  if (trends.cost === 'increasing') {
    insights.push('Cost per interaction is rising');
    recommendations.push('Optimize prompts and consider cost-effective model alternatives');
  } else if (trends.cost === 'decreasing') {
    insights.push('Cost per interaction is decreasing');
    recommendations.push('Maintain current cost optimization strategies');
  }

  // Add general insights
  const latestMetrics = metrics[metrics.length - 1]?.metrics;
  if (latestMetrics) {
    if (latestMetrics.errorRate > 0.1) {
      insights.push('Error rate is above acceptable threshold');
      recommendations.push('Investigate and resolve system errors');
    }

    if (latestMetrics.userSatisfaction < 3.5) {
      insights.push('User satisfaction is below target');
      recommendations.push('Improve AI response quality and user experience');
    }

    if (latestMetrics.topUsedFeatures.length > 0) {
      insights.push(`Most used feature: ${latestMetrics.topUsedFeatures[0]}`);
      recommendations.push(`Focus development efforts on ${latestMetrics.topUsedFeatures[0]} feature`);
    }
  }

  return {
    trends,
    insights,
    recommendations,
  };
} 