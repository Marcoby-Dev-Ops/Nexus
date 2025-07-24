import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailAnalysisRequest {
  emailId: string;
  userId: string;
  emailContent: {
    subject: string;
    body: string;
    sender: string;
    senderName?: string;
    receivedAt: string;
  };
}

interface EmailAnalysisResult {
  opportunities: OpportunityDetection[];
  predictions: PredictiveInsight[];
  workflows: AutomatedWorkflow[];
  businessValue: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  actionItems: string[];
  confidence: number;
}

interface OpportunityDetection {
  type: 'sales' | 'partnership' | 'media' | 'speaking' | 'customer_success' | 'compliance' | 'risk';
  title: string;
  description: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  businessValue: 'low' | 'medium' | 'high' | 'critical';
  estimatedRevenue?: number;
  requiredActions: string[];
  timeline: string;
}

interface PredictiveInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  probability: number;
  recommendedActions: string[];
  businessValue: number;
}

interface AutomatedWorkflow {
  id: string;
  type: 'task_creation' | 'meeting_scheduling' | 'follow_up' | 'escalation' | 'notification';
  trigger: string;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface WorkflowAction {
  type: 'create_task' | 'schedule_meeting' | 'send_notification' | 'update_crm' | 'escalate';
  target: string;
  parameters: Record<string, any>;
  delay?: number;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: EmailAnalysisRequest = await req.json();
    
    // Validate payload
    if (!payload.emailId || !payload.userId || !payload.emailContent) {
      return new Response(
        JSON.stringify({ error: 'Invalid analysis request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform comprehensive email analysis
    const analysisResult = await performEmailAnalysis(payload);
    
    // Store analysis results
    await storeAnalysisResults(payload.emailId, payload.userId, analysisResult);
    
    // Execute high-priority workflows
    await executeHighPriorityWorkflows(analysisResult.workflows, payload.userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Perform comprehensive email analysis with AI intelligence
 */
async function performEmailAnalysis(payload: EmailAnalysisRequest): Promise<EmailAnalysisResult> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user and business context
    const userContext = await getUserContext(payload.userId);
    const businessContext = await getBusinessContext(payload.userId);

    // Analyze email content for opportunities
    const opportunities = await detectOpportunities(payload.emailContent, userContext, businessContext);
    
    // Generate predictive insights
    const predictions = await generatePredictiveInsights(payload.emailContent, userContext, businessContext);
    
    // Generate automated workflows
    const workflows = await generateAutomatedWorkflows(payload.emailContent, opportunities, userContext);
    
    // Calculate business value and urgency
    const businessValue = calculateBusinessValue(opportunities, predictions);
    const urgency = calculateUrgency(opportunities, predictions);
    
    // Generate summary and action items
    const summary = generateSummary(opportunities, predictions, workflows);
    const actionItems = extractActionItems(opportunities, predictions, workflows);
    
    // Calculate overall confidence
    const confidence = calculateConfidence(opportunities, predictions);

    return {
      opportunities,
      predictions,
      workflows,
      businessValue,
      urgency,
      summary,
      actionItems,
      confidence
    };

  } catch (error) {
    console.error('Error performing email analysis:', error);
    throw error;
  }
}

/**
 * Detect business opportunities in email content
 */
async function detectOpportunities(
  emailContent: any, 
  userContext: any, 
  businessContext: any
): Promise<OpportunityDetection[]> {
  const opportunities: OpportunityDetection[] = [];
  const content = `${emailContent.subject} ${emailContent.body}`.toLowerCase();

  // Sales opportunities
  if (content.includes('purchase') || content.includes('buy') || content.includes('order')) {
    opportunities.push({
      type: 'sales',
      title: 'Sales Opportunity Detected',
      description: 'Email contains potential sales opportunity',
      confidence: 0.85,
      urgency: 'high',
      businessValue: 'high',
      estimatedRevenue: 5000,
      requiredActions: ['Follow up within 24 hours', 'Schedule sales call'],
      timeline: '1-2 weeks'
    });
  }

  // Partnership opportunities
  if (content.includes('partnership') || content.includes('collaboration') || content.includes('joint')) {
    opportunities.push({
      type: 'partnership',
      title: 'Partnership Opportunity',
      description: 'Email suggests potential business partnership',
      confidence: 0.78,
      urgency: 'medium',
      businessValue: 'high',
      estimatedRevenue: 10000,
      requiredActions: ['Research potential partner', 'Schedule partnership discussion'],
      timeline: '2-4 weeks'
    });
  }

  // Media opportunities
  if (content.includes('interview') || content.includes('press') || content.includes('media')) {
    opportunities.push({
      type: 'media',
      title: 'Media Opportunity',
      description: 'Email contains media or press opportunity',
      confidence: 0.92,
      urgency: 'high',
      businessValue: 'medium',
      estimatedRevenue: 2000,
      requiredActions: ['Respond to media request', 'Prepare talking points'],
      timeline: '1 week'
    });
  }

  // Speaking opportunities
  if (content.includes('speak') || content.includes('presentation') || content.includes('conference')) {
    opportunities.push({
      type: 'speaking',
      title: 'Speaking Opportunity',
      description: 'Email contains speaking or presentation opportunity',
      confidence: 0.88,
      urgency: 'medium',
      businessValue: 'medium',
      estimatedRevenue: 3000,
      requiredActions: ['Review speaking request', 'Check calendar availability'],
      timeline: '2-3 weeks'
    });
  }

  // Customer success opportunities
  if (content.includes('support') || content.includes('help') || content.includes('issue')) {
    opportunities.push({
      type: 'customer_success',
      title: 'Customer Success Opportunity',
      description: 'Email contains customer support or success opportunity',
      confidence: 0.75,
      urgency: 'high',
      businessValue: 'medium',
      estimatedRevenue: 1500,
      requiredActions: ['Address customer concern', 'Follow up with solution'],
      timeline: '24-48 hours'
    });
  }

  return opportunities;
}

/**
 * Generate predictive insights based on email patterns
 */
async function generatePredictiveInsights(
  emailContent: any, 
  userContext: any, 
  businessContext: any
): Promise<PredictiveInsight[]> {
  const insights: PredictiveInsight[] = [];
  const content = `${emailContent.subject} ${emailContent.body}`.toLowerCase();

  // Sales trend prediction
  if (content.includes('sales') || content.includes('revenue')) {
    insights.push({
      type: 'trend',
      title: 'Sales Trend Prediction',
      description: 'Email suggests positive sales trend based on content analysis',
      confidence: 0.82,
      impact: 'high',
      timeframe: 'Q1 2024',
      probability: 0.75,
      recommendedActions: ['Increase sales team focus', 'Prepare for growth'],
      businessValue: 15000
    });
  }

  // Customer satisfaction prediction
  if (content.includes('satisfied') || content.includes('happy') || content.includes('great')) {
    insights.push({
      type: 'optimization',
      title: 'Customer Satisfaction Prediction',
      description: 'Email indicates high customer satisfaction levels',
      confidence: 0.78,
      impact: 'medium',
      timeframe: 'Next 30 days',
      probability: 0.85,
      recommendedActions: ['Leverage for testimonials', 'Request referrals'],
      businessValue: 5000
    });
  }

  // Risk assessment
  if (content.includes('urgent') || content.includes('problem') || content.includes('issue')) {
    insights.push({
      type: 'risk',
      title: 'Risk Assessment',
      description: 'Email contains potential business risk indicators',
      confidence: 0.88,
      impact: 'critical',
      timeframe: 'Immediate',
      probability: 0.65,
      recommendedActions: ['Escalate to management', 'Prepare response plan'],
      businessValue: -10000
    });
  }

  return insights;
}

/**
 * Generate automated workflows based on email content and opportunities
 */
async function generateAutomatedWorkflows(
  emailContent: any, 
  opportunities: OpportunityDetection[], 
  userContext: any
): Promise<AutomatedWorkflow[]> {
  const workflows: AutomatedWorkflow[] = [];

  // Create follow-up task for high-priority opportunities
  const highPriorityOpportunities = opportunities.filter(o => o.urgency === 'high' || o.urgency === 'critical');
  
  for (const opportunity of highPriorityOpportunities) {
    workflows.push({
      id: crypto.randomUUID(),
      type: 'task_creation',
      trigger: 'high_priority_opportunity',
      actions: [
        {
          type: 'create_task',
          target: 'project_management',
          parameters: {
            title: `Follow up: ${opportunity.title}`,
            description: opportunity.description,
            priority: opportunity.urgency,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            assignee: userContext.userId
          },
          delay: 0
        }
      ],
      conditions: [
        {
          field: 'urgency',
          operator: 'in',
          value: ['high', 'critical']
        }
      ],
      priority: opportunity.urgency === 'critical' ? 'critical' : 'high',
      status: 'pending'
    });
  }

  // Schedule meeting for partnership opportunities
  const partnershipOpportunities = opportunities.filter(o => o.type === 'partnership');
  
  for (const opportunity of partnershipOpportunities) {
    workflows.push({
      id: crypto.randomUUID(),
      type: 'meeting_scheduling',
      trigger: 'partnership_opportunity',
      actions: [
        {
          type: 'schedule_meeting',
          target: 'calendar',
          parameters: {
            title: `Partnership Discussion: ${opportunity.title}`,
            duration: 60,
            attendees: [emailContent.sender],
            description: opportunity.description
          },
          delay: 2 * 60 * 60 * 1000 // 2 hours delay
        }
      ],
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'partnership'
        }
      ],
      priority: 'high',
      status: 'pending'
    });
  }

  // Send notification for media opportunities
  const mediaOpportunities = opportunities.filter(o => o.type === 'media');
  
  for (const opportunity of mediaOpportunities) {
    workflows.push({
      id: crypto.randomUUID(),
      type: 'notification',
      trigger: 'media_opportunity',
      actions: [
        {
          type: 'send_notification',
          target: 'team',
          parameters: {
            channel: 'marketing',
            message: `Media opportunity: ${opportunity.title}`,
            priority: 'high'
          },
          delay: 0
        }
      ],
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'media'
        }
      ],
      priority: 'high',
      status: 'pending'
    });
  }

  return workflows;
}

/**
 * Get user context for analysis
 */
async function getUserContext(userId: string): Promise<any> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return userProfile || {};
}

/**
 * Get business context for analysis
 */
async function getBusinessContext(userId: string): Promise<any> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (!userProfile?.company_id) {
    return {};
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userProfile.company_id)
    .single();

  return company || {};
}

/**
 * Calculate business value based on opportunities and predictions
 */
function calculateBusinessValue(opportunities: OpportunityDetection[], predictions: PredictiveInsight[]): 'low' | 'medium' | 'high' | 'critical' {
  const maxOpportunityValue = Math.max(...opportunities.map(o => {
    switch (o.businessValue) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }), 0);

  const maxPredictionValue = Math.max(...predictions.map(p => {
    switch (p.impact) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }), 0);

  const maxValue = Math.max(maxOpportunityValue, maxPredictionValue);

  switch (maxValue) {
    case 4: return 'critical';
    case 3: return 'high';
    case 2: return 'medium';
    default: return 'low';
  }
}

/**
 * Calculate urgency based on opportunities and predictions
 */
function calculateUrgency(opportunities: OpportunityDetection[], predictions: PredictiveInsight[]): 'low' | 'medium' | 'high' | 'critical' {
  const maxOpportunityUrgency = Math.max(...opportunities.map(o => {
    switch (o.urgency) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }), 0);

  const maxPredictionImpact = Math.max(...predictions.map(p => {
    switch (p.impact) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }), 0);

  const maxUrgency = Math.max(maxOpportunityUrgency, maxPredictionImpact);

  switch (maxUrgency) {
    case 4: return 'critical';
    case 3: return 'high';
    case 2: return 'medium';
    default: return 'low';
  }
}

/**
 * Generate summary of analysis results
 */
function generateSummary(opportunities: OpportunityDetection[], predictions: PredictiveInsight[], workflows: AutomatedWorkflow[]): string {
  const parts = [];

  if (opportunities.length > 0) {
    parts.push(`${opportunities.length} business opportunities detected`);
  }

  if (predictions.length > 0) {
    parts.push(`${predictions.length} predictive insights generated`);
  }

  if (workflows.length > 0) {
    parts.push(`${workflows.length} automated workflows triggered`);
  }

  return parts.length > 0 ? parts.join('. ') : 'No significant insights detected';
}

/**
 * Extract action items from analysis results
 */
function extractActionItems(opportunities: OpportunityDetection[], predictions: PredictiveInsight[], workflows: AutomatedWorkflow[]): string[] {
  const actionItems: string[] = [];

  // Add opportunity action items
  opportunities.forEach(opportunity => {
    actionItems.push(...opportunity.requiredActions);
  });

  // Add prediction action items
  predictions.forEach(prediction => {
    actionItems.push(...prediction.recommendedActions);
  });

  // Add workflow action items
  workflows.forEach(workflow => {
    workflow.actions.forEach(action => {
      actionItems.push(`${action.type}: ${action.target}`);
    });
  });

  return actionItems;
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(opportunities: OpportunityDetection[], predictions: PredictiveInsight[]): number {
  const opportunityConfidence = opportunities.length > 0 
    ? opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length 
    : 0;

  const predictionConfidence = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
    : 0;

  return Math.max(opportunityConfidence, predictionConfidence);
}

/**
 * Store analysis results in database
 */
async function storeAnalysisResults(emailId: string, userId: string, analysis: EmailAnalysisResult): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update email with analysis results
    const { error: updateError } = await supabase
      .from('ai_inbox_items')
      .update({
        ai_priority_score: analysis.confidence * 100,
        ai_category: analysis.opportunities.length > 0 ? analysis.opportunities[0].type : 'general',
        ai_sentiment: analysis.businessValue === 'critical' || analysis.businessValue === 'high' ? 'positive' : 'neutral',
        ai_summary: analysis.summary,
        ai_action_items: analysis.actionItems,
        ai_processed_at: new Date().toISOString(),
        priority_score: analysis.urgency === 'critical' ? 10 : analysis.urgency === 'high' ? 8 : analysis.urgency === 'medium' ? 6 : 4
      })
      .eq('id', emailId);

    if (updateError) {
      console.error('Error updating email with analysis:', updateError);
    }

    // Store opportunities as insights
    for (const opportunity of analysis.opportunities) {
      await supabase
        .from('ai_insights')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          insight_type: 'opportunity',
          title: opportunity.title,
          content: opportunity.description,
          confidence_score: opportunity.confidence,
          urgency: opportunity.urgency,
          category: opportunity.type,
          metadata: {
            email_id: emailId,
            business_value: opportunity.businessValue,
            estimated_revenue: opportunity.estimatedRevenue,
            required_actions: opportunity.requiredActions,
            timeline: opportunity.timeline
          },
          is_active: true,
          created_at: new Date().toISOString()
        });
    }

    // Store predictions as insights
    for (const prediction of analysis.predictions) {
      await supabase
        .from('ai_insights')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          insight_type: 'prediction',
          title: prediction.title,
          content: prediction.description,
          confidence_score: prediction.confidence,
          urgency: prediction.impact,
          category: prediction.type,
          metadata: {
            email_id: emailId,
            impact: prediction.impact,
            timeframe: prediction.timeframe,
            probability: prediction.probability,
            business_value: prediction.businessValue,
            recommended_actions: prediction.recommendedActions
          },
          is_active: true,
          created_at: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error storing analysis results:', error);
    throw error;
  }
}

/**
 * Execute high-priority workflows
 */
async function executeHighPriorityWorkflows(workflows: AutomatedWorkflow[], userId: string): Promise<void> {
  try {
    const highPriorityWorkflows = workflows.filter(w => w.priority === 'critical' || w.priority === 'high');
    
    for (const workflow of highPriorityWorkflows) {
      try {
        // Execute workflow actions
        for (const action of workflow.actions) {
          await executeWorkflowAction(action, userId);
        }
        
        // Update workflow status
        await updateWorkflowStatus(workflow.id, 'completed');
        
      } catch (error) {
        console.error('Error executing workflow:', error);
        await updateWorkflowStatus(workflow.id, 'failed');
      }
    }
  } catch (error) {
    console.error('Error executing high-priority workflows:', error);
  }
}

/**
 * Execute individual workflow action
 */
async function executeWorkflowAction(action: WorkflowAction, userId: string): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (action.type) {
      case 'create_task':
        await supabase
          .from('tasks')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            title: action.parameters.title,
            description: action.parameters.description,
            priority: action.parameters.priority,
            due_date: action.parameters.dueDate,
            assignee: action.parameters.assignee,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        break;

      case 'schedule_meeting':
        await supabase
          .from('meetings')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            title: action.parameters.title,
            description: action.parameters.description,
            duration: action.parameters.duration,
            attendees: action.parameters.attendees,
            scheduled_at: new Date(Date.now() + (action.delay || 0)).toISOString(),
            status: 'scheduled',
            created_at: new Date().toISOString()
          });
        break;

      case 'send_notification':
        await supabase
          .from('notifications')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            type: 'workflow_notification',
            title: 'Automated Workflow',
            message: action.parameters.message,
            data: {
              workflow_action: action.type,
              target: action.target
            },
            is_read: false,
            created_at: new Date().toISOString()
          });
        break;

      default:
        console.warn('Unknown workflow action type:', action.type);
    }
  } catch (error) {
    console.error('Error executing workflow action:', error);
    throw error;
  }
}

/**
 * Update workflow status
 */
async function updateWorkflowStatus(workflowId: string, status: string): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('workflows')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId);

  } catch (error) {
    console.error('Error updating workflow status:', error);
  }
} 