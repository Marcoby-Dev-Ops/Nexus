import React from 'react';
import { Target, Lightbulb, Map, Play } from 'lucide-react';
import { useFireCyclePhase } from './FireCycleProvider';

const PHASES = [
  {
    id: 'focus',
    label: 'Focus',
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    description: 'What matters most right now?'
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    description: 'What are you learning?'
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    color: 'text-green-600',
    bg: 'bg-green-100',
    description: 'What’s the plan?'
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: Play,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    description: 'Take action and track progress.'
  }
] as const;

type PhaseId = typeof PHASES[number]['id'];

export const FireCycleWidget: React.FC<{ className?: string }> = ({ className }) => {
  const { phase, setPhase } = useFireCyclePhase();

  return (
    <div className={`rounded-xl shadow-lg bg-card border p-4 flex flex-col items-center w-full max-w-xs ${className || ''}`.trim()}>
      <div className="mb-2 text-xs font-semibold text-muted-foreground tracking-wide uppercase">FIRE Cycle</div>
      <div className="flex flex-row items-center justify-between w-full mb-4">
        {PHASES.map((p) => {
          const active = phase === p.id;
          return (
            <button
              key={p.id}
              className={`flex flex-col items-center flex-1 px-1 py-2 transition-all ${active ? 'bg-primary/10 border-primary border-2' : 'hover: bg-accent border border-transparent'} rounded-lg mx-1`}
              onClick={() => setPhase(p.id as PhaseId)}
              aria-current={active ? 'step' : undefined}
              aria-label={p.label}
              type="button"
            >
              <p.icon className={`w-6 h-6 mb-1 ${p.color}`} />
              <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{p.label}</span>
            </button>
          );
        })}
      </div>
      <div className="w-full text-center mt-2">
        <span className="text-sm font-semibold text-primary">{PHASES.find(p => p.id === phase)?.label}</span>
        <div className="text-xs text-muted-foreground mt-1">
          {PHASES.find(p => p.id === phase)?.description}
        </div>
      </div>
    </div>
  );
}; 