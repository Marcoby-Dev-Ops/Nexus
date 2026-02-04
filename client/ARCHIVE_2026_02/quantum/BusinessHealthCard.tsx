import React from 'react';
import { Heart } from 'lucide-react';

interface BusinessHealthCardProps {
  overallHealth: number;
  lastLoginDelta: number;
}

export function BusinessHealthCard({ overallHealth, lastLoginDelta }: BusinessHealthCardProps) {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Business Health</span>
        <Heart className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">
          {Math.max(35, overallHealth)}%
        </span>
        <span className={`text-sm font-medium ${lastLoginDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
          {lastLoginDelta >= 0 ? '+' : ''}{lastLoginDelta}% this week
        </span>
      </div>
    </div>
  );
}
