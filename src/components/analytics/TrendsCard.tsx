import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Trend } from '@/types/business/fire-cycle';

interface TrendsCardProps {
  trends: Trend[];
}

export const TrendsCard: React.FC<TrendsCardProps> = ({ trends }) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Trends</h3>
          <p className="text-sm text-muted-foreground">Monitor business patterns</p>
        </div>
      </div>
      
      {trends.length > 0 ? (
        <div className="space-y-3">
          {trends.map((trend) => (
            <div key={trend.id} className="p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{trend.name}</h4>
                  <p className="text-sm text-muted-foreground">{trend.description}</p>
                </div>
                {getDirectionIcon(trend.direction)}
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                  Strength: {trend.strength}/10
                </span>
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                  {trend.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">No Trends</h4>
          <p className="text-muted-foreground text-sm">
            Add trends to track business patterns
          </p>
        </div>
      )}
    </div>
  );
}; 