import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface BrainAnalysisRequest {
  sessionId: string;
  userId: string;
  stepId: string;
  actionType: 'feedback' | 'insight' | 'recommendation' | 'execution';
  actionData: Record<string, any>;
  currentIntelligence: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
    recommendationRelevance: number;
    learningProgress: number;
  };
  userProfile?: Record<string, any>;
  fireCyclePhase: 'feedback' | 'insight' | 'recommendation' | 'execution';
}

interface BrainAnalysisResponse {
  success: boolean;
  intelligenceGain: number;
  insights: Array<{
    type: 'opportunity' | 'risk' | 'optimization' | 'trend' | 'recommendation';
    title: string;
    description: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    confidence: number;
  }>;
  brainResponse: {
    analysis: Record<string, any>;
    confidence: number;
    nextSteps: string[];
  };
  updatedIntelligence: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
    recommendationRelevance: number;
    learningProgress: number;
  };
}

// Simulated AI analysis - in production, this would call OpenAI or similar
function analyzeBrainData(
  request: BrainAnalysisRequest
): BrainAnalysisResponse {
  const { actionType, actionData, currentIntelligence, userProfile, fireCyclePhase } = request;
  
  // Calculate intelligence gains based on action type and data
  let intelligenceGain = 0;
  let insights: any[] = [];
  let recommendations: any[] = [];
  
  switch (fireCyclePhase) {
    case 'feedback':
      // User provided information - analyze for insights
      intelligenceGain = Math.min(15, Object.keys(actionData).length * 3);
      
      if (actionData.company?.name) {
        insights.push({
          type: 'opportunity' as const,
          title: 'Company Context Identified',
          description: `Great! I can see you're working with ${actionData.company.name}. This helps me provide more relevant insights.`,
          category: 'business-context',
          impact: 'medium' as const,
          confidence: 0.85
        });
      }
      
      if (actionData.user?.role) {
        insights.push({
          type: 'optimization' as const,
          title: 'Role-Based Optimization Available',
          description: `As a ${actionData.user.role}, I can tailor recommendations specifically for your responsibilities.`,
          category: 'role-optimization',
          impact: 'high' as const,
          confidence: 0.92
        });
      }
      break;
      
    case 'insight':
      // System generated insights - provide recommendations
      intelligenceGain = Math.min(20, insights.length * 5);
      
      recommendations.push({
        title: 'Implement Progressive Learning',
        description: 'Based on your business context, I recommend starting with foundational improvements.',
        action: 'Begin with core business processes',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeframe: '2-4 weeks',
        confidence: 0.88
      });
      break;
      
    case 'recommendation':
      // User acted on recommendations - analyze effectiveness
      intelligenceGain = Math.min(25, actionData.implementationScore || 10);
      
      insights.push({
        type: 'trend' as const,
        title: 'Implementation Progress Detected',
        description: 'I can see you\'re making progress on the recommendations. This shows strong execution capability.',
        category: 'execution-tracking',
        impact: 'high' as const,
        confidence: 0.90
      });
      break;
      
    case 'execution':
      // User executed actions - measure outcomes
      intelligenceGain = Math.min(30, actionData.outcomeScore || 15);
      
      recommendations.push({
        title: 'Scale Successful Practices',
        description: 'The actions you\'ve taken show positive results. Let\'s expand on what\'s working.',
        action: 'Document and replicate successful processes',
        impact: 'high' as const,
        effort: 'low' as const,
        timeframe: '1-2 weeks',
        confidence: 0.95
      });
      break;
  }
  
  // Update intelligence metrics
  const updatedIntelligence = {
    understandingLevel: Math.min(100, currentIntelligence.understandingLevel + intelligenceGain * 0.4),
    personalizedInsights: Math.min(100, currentIntelligence.personalizedInsights + insights.length * 10),
    contextAccuracy: Math.min(100, currentIntelligence.contextAccuracy + intelligenceGain * 0.3),
    recommendationRelevance: Math.min(100, currentIntelligence.recommendationRelevance + recommendations.length * 15),
    learningProgress: Math.min(100, currentIntelligence.learningProgress + intelligenceGain * 0.5)
  };
  
  return {
    success: true,
    intelligenceGain,
    insights,
    recommendations,
    brainResponse: {
      analysis: {
        actionType,
        fireCyclePhase,
        dataQuality: Math.min(100, Object.keys(actionData).length * 20),
        userEngagement: intelligenceGain > 10 ? 'high' : 'medium',
        learningVelocity: intelligenceGain / 10
      },
      confidence: Math.min(1, 0.7 + (intelligenceGain / 100)),
      nextSteps: [
        'Continue providing business context',
        'Review generated insights',
        'Implement recommended actions',
        'Track progress and outcomes'
      ]
    },
    updatedIntelligence
  };
}

// Generate department-specific insights
function generateDepartmentInsights(departmentName: string, context: any): any[] {
  const insights = [];
  
  switch (departmentName.toLowerCase()) {
    case 'sales':
      insights.push({
        type: 'opportunity' as const,
        title: 'Sales Process Optimization',
        description: 'I can help optimize your sales pipeline and improve conversion rates.',
        category: 'sales-optimization',
        impact: 'high' as const,
        confidence: 0.85
      });
      break;
      
    case 'marketing':
      insights.push({
        type: 'optimization' as const,
        title: 'Marketing Efficiency Gains',
        description: 'Let\'s streamline your marketing operations and improve ROI tracking.',
        category: 'marketing-efficiency',
        impact: 'medium' as const,
        confidence: 0.80
      });
      break;
      
    case 'operations':
      insights.push({
        type: 'optimization' as const,
        title: 'Operational Excellence',
        description: 'I can help identify bottlenecks and optimize your operational processes.',
        category: 'operations-optimization',
        impact: 'high' as const,
        confidence: 0.88
      });
      break;
      
    case 'finance':
      insights.push({
        type: 'trend' as const,
        title: 'Financial Intelligence',
        description: 'Let\'s improve your financial tracking and reporting capabilities.',
        category: 'finance-intelligence',
        impact: 'high' as const,
        confidence: 0.90
      });
      break;
      
    default:
      insights.push({
        type: 'recommendation' as const,
        title: 'Department-Specific Optimization',
        description: `I can provide tailored insights for your ${departmentName} department.`,
        category: 'department-optimization',
        impact: 'medium' as const,
        confidence: 0.75
      });
  }
  
  return insights;
}

// Generate goal-specific recommendations
function generateGoalRecommendations(goal: any, context: any): any[] {
  const recommendations = [];
  
  switch (goal.category) {
    case 'revenue':
      recommendations.push({
        title: 'Revenue Growth Strategy',
        description: 'Implement data-driven pricing and sales optimization strategies.',
        action: 'Analyze pricing models and sales funnel',
        impact: 'high' as const,
        effort: 'medium' as const,
        timeframe: '3-6 months',
        confidence: 0.85
      });
      break;
      
    case 'efficiency':
      recommendations.push({
        title: 'Process Automation',
        description: 'Identify and automate repetitive tasks to improve efficiency.',
        action: 'Audit current processes and identify automation opportunities',
        impact: 'high' as const,
        effort: 'low' as const,
        timeframe: '1-2 months',
        confidence: 0.90
      });
      break;
      
    case 'growth':
      recommendations.push({
        title: 'Market Expansion Plan',
        description: 'Develop a systematic approach to entering new markets.',
        action: 'Conduct market research and develop expansion strategy',
        impact: 'high' as const,
        effort: 'high' as const,
        timeframe: '6-12 months',
        confidence: 0.80
      });
      break;
      
    case 'quality':
      recommendations.push({
        title: 'Quality Management System',
        description: 'Implement comprehensive quality control and improvement processes.',
        action: 'Establish quality metrics and monitoring systems',
        impact: 'medium' as const,
        effort: 'medium' as const,
        timeframe: '2-4 months',
        confidence: 0.85
      });
      break;
      
    case 'innovation':
      recommendations.push({
        title: 'Innovation Framework',
        description: 'Create a structured approach to fostering innovation.',
        action: 'Establish innovation processes and idea management systems',
        impact: 'high' as const,
        effort: 'high' as const,
        timeframe: '4-8 months',
        confidence: 0.75
      });
      break;
  }
  
  return recommendations;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const request: BrainAnalysisRequest = await req.json();
    
    // Validate required fields
    if (!request.sessionId || !request.userId || !request.stepId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Perform brain analysis
    const analysis = analyzeBrainData(request);
    
    // Add department-specific insights if available
    if (request.actionData.department) {
      const departmentInsights = generateDepartmentInsights(
        request.actionData.department,
        request.actionData
      );
      analysis.insights.push(...departmentInsights);
    }
    
    // Add goal-specific recommendations if available
    if (request.actionData.goal) {
      const goalRecommendations = generateGoalRecommendations(
        request.actionData.goal,
        request.actionData
      );
      analysis.recommendations.push(...goalRecommendations);
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Brain analysis error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 