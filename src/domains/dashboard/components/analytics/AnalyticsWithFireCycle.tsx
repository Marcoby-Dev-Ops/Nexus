import React from 'react';
import { useData } from '@/shared/contexts/DataContext';
import { KeyMetricsCard } from './KeyMetricsCard';
import type { KeyMetric } from '@/domains/business/fire-cycle/types';

interface AnalyticsWithFireCycleProps {
  metrics: KeyMetric[];
  className?: string;
}

export const AnalyticsWithFireCycle: React.FC<AnalyticsWithFireCycleProps> = ({
  metrics,
  className = ''
}) => {
  const { systemStatus } = useData();
  return (
    <div className={`space-y-6 ${className}`}>
      {/* FIRE CYCLE Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KeyMetricsCard 
          title="Focus" 
          value={systemStatus?.fire?.focus || 0} 
          unit="%" 
          trend="up" 
        />
        <KeyMetricsCard 
          title="Insight" 
          value={systemStatus?.fire?.insight || 0} 
          unit="%" 
          trend="up" 
        />
        <KeyMetricsCard 
          title="Roadmap" 
          value={systemStatus?.fire?.roadmap || 0} 
          unit="%" 
          trend="up" 
        />
        <KeyMetricsCard 
          title="Execute" 
          value={systemStatus?.fire?.execute || 0} 
          unit="%" 
          trend="up" 
        />
      </div>
      
      {/* Analytics Content */}
      <div className="grid gap-6 md: grid-cols-2 lg:grid-cols-3">
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