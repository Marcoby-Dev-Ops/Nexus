/**
 * Integration Intelligence Stub Types for 1.0
 * These will be fully implemented in v1.1
 */

// CRM Types
export interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

export interface RiskAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// Financial Types
export interface CashFlowData {
  inflow: number;
  outflow: number;
  net: number;
  period: string;
}

export interface BudgetStatus {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface ExpenseAlert {
  id: string;
  category: string;
  amount: number;
  threshold: number;
}

export interface RevenueMetrics {
  total: number;
  recurring: number;
  oneTime: number;
  growth: number;
}

// Productivity Types
export interface EmailContext {
  unread: number;
  priority: number;
  actionRequired: number;
}

export interface DocumentActivity {
  id: string;
  name: string;
  lastModified: Date;
  collaborators: number;
}

// Market Types
export interface MarketTrend {
  indicator: string;
  value: number;
  change: number;
  period: string;
}

export interface CompetitorData {
  name: string;
  activity: string;
  impact: 'low' | 'medium' | 'high';
}

export interface OpportunitySignal {
  id: string;
  type: string;
  description: string;
  confidence: number;
}

// Personal Types
export interface PersonalThought {
  id: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
}

export interface WorkPatternAnalysis {
  peakHours: string[];
  productivity: number;
  focusTime: number;
}

// Organizational Types
export interface OrganizationalGoal {
  id: string;
  title: string;
  progress: number;
  deadline: Date;
}

export interface DepartmentObjective {
  department: string;
  objective: string;
  progress: number;
}

export interface TeamMetrics {
  productivity: number;
  collaboration: number;
  satisfaction: number;
} 
