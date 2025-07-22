import React from 'react';
import { FireCycleContextual } from '@/core/fire-cycle/FireCycleContextual';
import { KeyMetricsCard } from './KeyMetricsCard';
import type { KeyMetric } from '@/domains/fire-cycle/types';

interface AnalyticsWithFireCycleProps {
  metrics: KeyMetric[];
  className?: string;
}

export const AnalyticsWithFireCycle: React.FC<AnalyticsWithFireCycleProps> = ({
  metrics,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* FIRE CYCLE Contextual Prompt */}
      <FireCycleContextual 
        context="analytics" 
        className="mb-6"
      />
      
      {/* Analytics Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KeyMetricsCard metrics={metrics} />
        </div>
        
        {/* Additional Analytics Components */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Based on your current FIRE cycle phase, here are relevant actions you can take.
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Insights</h3>
            <p className="text-sm text-muted-foreground">
              Discover patterns and trends in your data to inform your next steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 