export interface KeyMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  category: 'revenue' | 'growth' | 'efficiency' | 'health';
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface FireCyclePhase {
  id: 'focus' | 'insight' | 'roadmap' | 'execute';
  label: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
  actions: FireCycleAction[];
}

export interface FireCycleAction {
  id: string;
  label: string;
  description: string;
  type: 'primary' | 'secondary';
  onClick: () => void;
}

export interface FireCycleContext {
  currentPhase: FireCyclePhase;
  phases: FireCyclePhase[];
  progress: number;
  nextAction?: FireCycleAction;
  setPhase: (phaseId: FireCyclePhase['id']) => void;
  completePhase: (phaseId: FireCyclePhase['id']) => void;
  getPhaseActions: (phaseId: FireCyclePhase['id']) => FireCycleAction[];
} 