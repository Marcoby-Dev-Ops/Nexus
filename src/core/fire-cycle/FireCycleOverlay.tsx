import React, { useState } from 'react';
import { Target, Lightbulb, Map, Play, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { useData } from '@/shared/contexts/DataContext';
import type { FireCyclePhase } from '@/domains/business/fire-cycle/types';

const PHASES: FireCyclePhase[] = [
  {
    id: 'focus',
    label: 'Focus',
    description: 'What matters most right now?',
    isComplete: false,
    isCurrent: true,
    actions: [
      {
        id: 'set-focus',
        label: 'Set Focus',
        description: 'Define your current priority',
        type: 'primary',
        onClick: () => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Set Focus clicked')
      }
    ]
  },
  {
    id: 'insight',
    label: 'Insight',
    description: 'What are you learning?',
    isComplete: false,
    isCurrent: false,
    actions: [
      {
        id: 'review-insights',
        label: 'Review Insights',
        description: 'Analyze your data and trends',
        type: 'primary',
        onClick: () => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Review Insights clicked')
      }
    ]
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    description: 'What\'s the plan?',
    isComplete: false,
    isCurrent: false,
    actions: [
      {
        id: 'build-roadmap',
        label: 'Build Roadmap',
        description: 'Create your action plan',
        type: 'primary',
        onClick: () => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Build Roadmap clicked')
      }
    ]
  },
  {
    id: 'execute',
    label: 'Execute',
    description: 'Take action and track progress',
    isComplete: false,
    isCurrent: false,
    actions: [
      {
        id: 'start-execution',
        label: 'Start Execution',
        description: 'Begin implementing your plan',
        type: 'primary',
        onClick: () => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Start Execution clicked')
      }
    ]
  }
];

const getPhaseIcon = (phaseId: FireCyclePhase['id']) => {
  switch (phaseId) {
    case 'focus': return Target;
    case 'insight': return Lightbulb;
    case 'roadmap': return Map;
    case 'execute': return Play;
    default: return Circle;
  }
};



interface FireCycleOverlayProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

export const FireCycleOverlay: React.FC<FireCycleOverlayProps> = ({ 
  variant = 'compact',
  className = ''
}) => {
  const { systemStatus } = useData();
  const [phase, setPhase] = useState<FireCyclePhase['id']>('focus');
  const [showActions, setShowActions] = useState(false);

  const currentPhase = PHASES.find(p => p.id === phase) || PHASES[0];
  const currentPhaseIndex = PHASES.findIndex(p => p.id === phase);
  const progress = ((currentPhaseIndex + 1) / PHASES.length) * 100;

  const handlePhaseClick = (phaseId: FireCyclePhase['id']) => {
    setPhase(phaseId);
  };

  const handleNextPhase = () => {
    const nextIndex = (currentPhaseIndex + 1) % PHASES.length;
    setPhase(PHASES[nextIndex].id);
  };

  const handleActionClick = (__action: any) => {
    action.onClick();
    setShowActions(false);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        {/* Compact Bar */}
        <div className="flex items-center space-x-3 bg-card border rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              FIRE Cycle
            </span>
            <div className="flex items-center space-x-1">
              {PHASES.map((p, index) => {
                const Icon = getPhaseIcon(p.id);
                const isActive = p.id === phase;
                const isCompleted = index < currentPhaseIndex;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePhaseClick(p.id)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : isCompleted
                        ? 'text-green-600 bg-green-100'
                        : 'text-muted-foreground hover: text-foreground hover:bg-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-foreground">
              {currentPhase.label}
            </div>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover: bg-muted transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showActions ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Actions Dropdown */}
        {showActions && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground mb-2">
                {currentPhase.label} Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentPhase.description}
              </p>
            </div>
            <div className="p-2">
              {currentPhase.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    action.type === 'primary'
                      ? 'bg-primary text-primary-foreground hover: bg-primary/90'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm opacity-80">{action.description}</div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <button
                onClick={handleNextPhase}
                className="w-full flex items-center justify-center space-x-2 p-2 rounded-md bg-muted hover: bg-muted/80 transition-colors"
              >
                <span className="text-sm font-medium">Next Phase</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded variant
  return (
    <div className={`bg-card border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">FIRE Cycle</h3>
          <p className="text-sm text-muted-foreground">
            You are in: <span className="font-medium text-primary">{currentPhase.label}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">
            {Math.round(progress)}% Complete
          </div>
          <div className="w-24 h-2 bg-muted rounded-full mt-1">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((p, index) => {
          const Icon = getPhaseIcon(p.id);
          const isActive = p.id === phase;
          const isCompleted = index < currentPhaseIndex;
          
          return (
            <div
              key={p.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-primary/10 border-primary/20' 
                  : isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{p.label}</div>
                <div className="text-sm text-muted-foreground">{p.description}</div>
              </div>
              {isActive && (
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 rounded hover: bg-muted transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showActions ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showActions && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-medium text-foreground mb-3">
            {currentPhase.label} Actions
          </h4>
          <div className="space-y-2">
            {currentPhase.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  action.type === 'primary'
                    ? 'bg-primary text-primary-foreground hover: bg-primary/90'
                    : 'bg-card hover:bg-muted border'
                }`}
              >
                <div className="font-medium">{action.label}</div>
                <div className="text-sm opacity-80">{action.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 