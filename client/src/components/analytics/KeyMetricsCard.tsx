import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KeyMetric } from '@/types/business/fire-cycle';

interface KeyMetricsCardProps {
  metrics: KeyMetric[];
}

export const KeyMetricsCard: React.FC<KeyMetricsCardProps> = ({ metrics }) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'text-green-600 bg-green-100';
      case 'growth':
        return 'text-blue-600 bg-blue-100';
      case 'efficiency':
        return 'text-purple-600 bg-purple-100';
      case 'health':
        return 'text-orange-600 bg-orange-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
          <BarChart3 className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Key Metrics</h3>
          <p className="text-sm text-muted-foreground">Track your business performance</p>
        </div>
      </div>
      
      {metrics.length > 0 ? (
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-foreground">{metric.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                    {metric.category}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-foreground">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {metric.target.toLocaleString()} {metric.unit}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(metric.trend)}
                <span className={`text-sm font-medium ${
                  metric.changePercent > 0 ? 'text-green-500' : 
                  metric.changePercent < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Add Key Metrics</h4>
          <p className="text-muted-foreground text-sm">
            Track the metrics that matter most to your business
          </p>
        </div>
      )}
    </div>
  );
}; 