/**
 * Business Setup Subdomain
 * Handles business onboarding and initial configuration
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface BusinessSetup {
  id: string;
  step: 'profile' | 'integrations' | 'team' | 'goals' | 'complete';
  progress: number;
  data: Record<string, any>;
  completedAt?: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: Record<string, any>;
}

export interface BusinessGoals {
  id: string;
  revenue: {
    target: number;
    timeframe: string;
    currency: string;
  };
  growth: {
    target: number;
    metric: string;
    timeframe: string;
  };
  efficiency: {
    target: number;
    metric: string;
    timeframe: string;
  };
} 