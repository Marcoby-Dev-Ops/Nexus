import React from 'react';
import { Flag, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Priority } from '@/types/business/fire-cycle';

interface PrioritiesCardProps {
  priorities: Priority[];
}

export const PrioritiesCard: React.FC<PrioritiesCardProps> = ({ priorities }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Flag className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
          <Flag className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Priorities</h3>
          <p className="text-sm text-muted-foreground">Your most important actions</p>
        </div>
      </div>
      
      {priorities.length > 0 ? (
        <div className="space-y-3">
          {priorities.map((priority) => (
            <div key={priority.id} className="p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{priority.title}</h4>
                  <p className="text-sm text-muted-foreground">{priority.description}</p>
                </div>
                {getStatusIcon(priority.status)}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className={`px-2 py-1 rounded-full font-medium ${getImpactColor(priority.impact)}`}>
                  {priority.impact} impact
                </span>
                <span className={`px-2 py-1 rounded-full font-medium ${
                  priority.effort === 'high' ? 'text-red-600 bg-red-100' :
                  priority.effort === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                  'text-green-600 bg-green-100'
                }`}>
                  {priority.effort} effort
                </span>
                <span>{priority.progress}% complete</span>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${priority.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Set Priorities</h4>
          <p className="text-muted-foreground text-sm">
            Define your most important actions and track progress
          </p>
        </div>
      )}
    </div>
  );
}; 