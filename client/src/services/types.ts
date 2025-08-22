export interface UserContext {
  userId: string;
  organizationId: string;
  userRole: string;
  businessDomain: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  currentGoals: string[];
  availableTime: number; // hours per week
  technicalCapabilities: string[];
  businessMetrics: Record<string, number>;
}

export interface FireAnalysis {
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
  reasoning: string;
}

export interface BuildingBlock {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  implementationTime: number; // hours
  riskLevel: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  prerequisites: string[];
  successMetrics: string[];
  phaseRelevance: ('focus' | 'insight' | 'roadmap' | 'execute')[];
  mentalModelAlignment: string[];
  tags: string[];
  documentation: string;
  examples: string[];
}

export interface UnifiedResponse {
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  mentalModelInsights: Record<string, any>;
  recommendedBlocks: BuildingBlock[];
  nextActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  successMetrics: {
    primary: string[];
    secondary: string[];
    tracking: string[];
  };
  confidence: number;
  reasoning: string;
  studyPlan?: {
    researchTasks: string[];
    implementationSteps: string[];
    timeline: Record<string, string[]>;
  };
}
