/**
 * FIRE Cycle Domain - Main Index
 * Consolidates all FIRE cycle functionality including Focus, Insight, Roadmap, and Execute phases
 */

// FIRE Cycle Types
export * from './types';

export interface FireCyclePhase {
  id: string;
  name: 'focus' | 'insight' | 'roadmap' | 'execute';
  description: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  startDate?: string;
  endDate?: string;
}

export interface FireCycleInsight {
  id: string;
  phase: FireCyclePhase['name'];
  title: string;
  description: string;
  category: 'opportunity' | 'risk' | 'trend' | 'action';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
} 