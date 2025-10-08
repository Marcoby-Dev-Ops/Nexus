export type QuantumBlockId =
  | 'value-proposition' | 'customer-segments' | 'channels' | 'customer-relationships' 
  | 'revenue-streams' | 'key-resources' | 'key-activities';

export type QuantumHealth = { 
  strength: number; 
  health: number; 
  maturity: 'seed' | 'grow' | 'scale' | 'optimize' 
};

export type QuantumBlockProfile = {
  id: QuantumBlockId;
  title: string;
  description?: string;
  properties: Record<string, unknown>;       // freeform per block
  relationships: { 
    to: QuantumBlockId; 
    type: 'causal' | 'correlated' | 'dependency'; 
    weight: number 
  }[];
  health: QuantumHealth;
  insights: string[];                         // bullet points (AI)
  recommendations: Array<{ 
    id: string; 
    title: string; 
    impact: 'low' | 'med' | 'high'; 
    effort: 'low' | 'med' | 'high' 
  }>;
  lastUpdated: string;
  metrics: {
    currentScore: number;
    targetScore: number;
    trend: 'up' | 'down' | 'stable';
    improvement: number;
  };
};

export type QuantumImprovePlan = {
  current: QuantumHealth;
  target: QuantumHealth;
  actions: Array<{ 
    id: string; 
    title: string; 
    description: string;
    category: 'process' | 'people' | 'technology' | 'strategy';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedEffort: number;
    expectedImpact: string;
    currentScore: number;
    targetScore: number;
    status: 'not-started' | 'in-progress' | 'completed';
    dependencies: string[];
    resources: string[];
    steps: string[]; 
    owner?: string; 
    etaDays?: number 
  }>;
  timeline: {
    phase: string;
    duration: string;
    actions: string[];
  }[];
  metrics: {
    overallImprovement: number;
    timeToTarget: string;
    confidence: number;
  };
};

export type QuantumOnboardingData = {
  blocks: Record<QuantumBlockId, Partial<QuantumBlockProfile>>;
  overallHealth: QuantumHealth;
  completedAt?: string;
};
