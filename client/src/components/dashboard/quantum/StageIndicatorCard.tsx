import React from 'react';
import { Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StageIndicatorCardProps {
  maturityLevel: string;
}

export function StageIndicatorCard({ maturityLevel }: StageIndicatorCardProps) {
  const getMaturityBadgeVariant = (level: string) => {
    switch (level) {
      case 'startup': return 'default';
      case 'growing': return 'secondary';
      case 'scaling': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Stage</span>
        <Rocket className="h-4 w-4 text-info" />
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground capitalize">{maturityLevel}</span>
          <Badge variant={getMaturityBadgeVariant(maturityLevel)} className="text-xs">
            {maturityLevel === 'startup' ? 'Getting Started' : 
             maturityLevel === 'growing' ? 'Growing' : 
             maturityLevel === 'scaling' ? 'Scaling' : 'Mature'}
          </Badge>
        </div>
        {/* Stage Progression Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Startup</span>
            <span>Growth</span>
            <span>Scale</span>
            <span>Enterprise</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                maturityLevel === 'startup' ? 'bg-primary w-1/4' :
                maturityLevel === 'growing' ? 'bg-primary w-1/2' :
                maturityLevel === 'scaling' ? 'bg-primary w-3/4' :
                'bg-primary w-full'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
