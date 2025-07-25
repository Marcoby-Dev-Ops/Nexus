import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import type { Risk } from '@/types/business/fire-cycle';

interface RisksCardProps {
  risks: Risk[];
}

export const RisksCard: React.FC<RisksCardProps> = ({ risks }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mitigating':
        return 'text-blue-600 bg-blue-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Risks</h3>
          <p className="text-sm text-muted-foreground">Monitor and mitigate threats</p>
        </div>
      </div>
      
      {risks.length > 0 ? (
        <div className="space-y-3">
          {risks.map((risk) => (
            <div key={risk.id} className="p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{risk.title}</h4>
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                </div>
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${getSeverityColor(risk.severity)}`}>
                  {risk.severity}
                </span>
                <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(risk.status)}`}>
                  {risk.status}
                </span>
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                  P: {risk.probability}/10
                </span>
                <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-medium">
                  I: {risk.impact}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">No Risks</h4>
          <p className="text-muted-foreground text-sm">
            Great! No active risks to monitor
          </p>
        </div>
      )}
    </div>
  );
}; 