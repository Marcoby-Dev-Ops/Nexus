/**
 * Learning System Types for Nexus Organizational Intelligence
 * Enables the platform to learn user patterns, suggest actions, and automate workflows
 */

export interface UserProfile {
  id: string;
  businessType: string;
  industry: string;
  teamSize: number;
  role: string;
  workingHours: {
    timezone: string;
    startTime: string;
    endTime: string;
    workDays: string[];
  };
  preferences: {
    communicationStyle: 'direct' | 'detailed' | 'visual';
    updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    focusAreas: string[];
    dashboardLayout: Record<string, unknown>;
  };
  learningMetadata: {
    onboardingCompleted: boolean;
    lastActive: string;
    sessionCount: number;
    averageSessionDuration: number;
    mostUsedFeatures: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  dataSource: string[];
  metrics: {
    impact: number; // 1-10 scale
    confidence: number; // 0-1 scale
    timeToValue: number; // minutes
    effort: number; // 1-5 scale
  };
  suggestedActions: ActionSuggestion[];
  automationPotential: AutomationOpportunity | null;
  context: {
    pageRelevance: string[]; // Which pages this insight is most relevant for
    triggerConditions: Record<string, unknown>;
    historicalData: unknown[];
  };
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'acted_on' | 'dismissed' | 'expired';
}

export interface ActionSuggestion {
  id: string;
  type: 'quick_action' | 'guided_workflow' | 'external_link' | 'automation';
  title: string;
  description: string;
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  steps: ActionStep[];
  expectedOutcome: string;
  trackingMetrics: string[];
}

export interface ActionStep {
  id: string;
  title: string;
  description: string;
  type: 'navigation' | 'form_fill' | 'api_call' | 'external_action';
  component?: string; // Component to render for this step
  validation?: Record<string, unknown>;
  automatable: boolean;
}

export interface AutomationOpportunity {
  id: string;
  title: string;
  description: string;
  type: 'n8n_workflow' | 'api_automation' | 'scheduled_task' | 'trigger_based';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number; // minutes
  estimatedTimeSavings: number; // minutes per week
  requiredIntegrations: string[];
  workflow: {
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    conditions?: WorkflowCondition[];
  };
  riskLevel: 'low' | 'medium' | 'high';
  testingRequired: boolean;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'data_change' | 'threshold' | 'manual';
  config: Record<string, unknown>;
  description: string;
}

export interface WorkflowAction {
  type: 'api_call' | 'notification' | 'data_update' | 'report_generation';
  config: Record<string, unknown>;
  description: string;
  fallbackAction?: WorkflowAction;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
  value: unknown;
  description: string;
}

export interface LearningEvent {
  id: string;
  userId: string;
  type: 'page_view' | 'action_taken' | 'insight_dismissed' | 'automation_created' | 'integration_connected';
  data: Record<string, unknown>;
  context: {
    page: string;
    sessionId: string;
    timestamp: string;
    userAgent: string;
  };
  outcome?: {
    successful: boolean;
    timeToComplete?: number;
    errorMessage?: string;
    satisfactionRating?: number;
  };
}

export interface ProgressiveAction {
  id: string;
  pageId: string;
  position: 'header' | 'sidebar' | 'floating' | 'inline' | 'contextual';
  trigger: {
    type: 'page_load' | 'data_threshold' | 'time_based' | 'user_behavior';
    conditions: Record<string, unknown>;
  };
  action: ActionSuggestion;
  displayConfig: {
    style: 'button' | 'card' | 'banner' | 'tooltip' | 'modal';
    variant: 'primary' | 'secondary' | 'accent' | 'warning' | 'success';
    dismissible: boolean;
    persistent: boolean;
  };
  analytics: {
    impressions: number;
    clicks: number;
    completions: number;
    dismissals: number;
    avgTimeToAction: number;
  };
}

export interface SecondBrainContext {
  currentPage: string;
  userContext: UserProfile;
  recentEvents: LearningEvent[];
  activeInsights: BusinessInsight[];
  availableData: IntegrationDataPoint[];
  environmentFactors: {
    timeOfDay: string;
    dayOfWeek: string;
    businessHours: boolean;
    teamOnlineStatus: Record<string, boolean>;
  };
}

export interface IntegrationDataPoint {
  source: string;
  type: string;
  value: unknown;
  timestamp: string;
  metadata: Record<string, unknown>;
  relevanceScore: number; // 0-1 scale for how relevant this data is to current context
}

export interface LearningSystemConfig {
  insightGeneration: {
    frequency: number; // minutes between insight generation runs
    maxInsightsPerPage: number;
    confidenceThreshold: number; // 0-1 scale
    dataFreshnessTolerance: number; // minutes
  };
  actionSuggestions: {
    maxSuggestionsPerPage: number;
    prioritizationWeights: {
      impact: number;
      effort: number;
      timeToValue: number;
      userSkillLevel: number;
    };
  };
  automation: {
    autoApprovalThreshold: number; // confidence level for auto-approval
    testingRequiredForComplexity: string[]; // complexity levels requiring testing
    maxAutomationsPerWeek: number;
  };
  learning: {
    eventRetentionDays: number;
    profileUpdateFrequency: number; // hours
    feedbackLoopTimeout: number; // hours to wait for outcome data
  };
}

// Hook interfaces
export interface UseSecondBrainReturn {
  insights: BusinessInsight[];
  actions: ProgressiveAction[];
  automationOpportunities: AutomationOpportunity[];
  isLearning: boolean;
  recordEvent: (event: Omit<LearningEvent, 'id' | 'userId'>) => void;
  dismissInsight: (insightId: string) => void;
  executeAction: (actionId: string) => Promise<void>;
  createAutomation: (opportunityId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => void;
}

export interface UseLearningAnalyticsReturn {
  userGrowth: {
    skillProgression: Record<string, number>;
    efficiencyGains: number[];
    automationImpact: number;
    timeToValueTrend: number[];
  };
  systemPerformance: {
    insightAccuracy: number;
    actionCompletionRate: number;
    automationSuccessRate: number;
    userSatisfactionScore: number;
  };
  recommendations: {
    nextBestActions: ActionSuggestion[];
    skillDevelopmentAreas: string[];
    integrationSuggestions: string[];
    optimizationOpportunities: AutomationOpportunity[];
  };
}

export interface UseProgressiveUIReturn {
  currentContext: SecondBrainContext;
  relevantActions: ProgressiveAction[];
  dynamicContent: {
    insights: BusinessInsight[];
    suggestions: ActionSuggestion[];
    automations: AutomationOpportunity[];
  };
  uiAdaptations: {
    layoutAdjustments: Record<string, unknown>;
    contentPriority: string[];
    interactionHints: string[];
  };
} 