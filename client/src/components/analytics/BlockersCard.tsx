import React from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Blocker } from '@/types/business/fire-cycle';

interface BlockersCardProps {
  blockers: Blocker[];
}

export const BlockersCard: React.FC<BlockersCardProps> = ({ blockers }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const activeBlockers = blockers.filter(b => b.status === 'active');
  const resolvedBlockers = blockers.filter(b => b.status === 'resolved');

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-500 bg-opacity-10">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Blockers</h3>
          <p className="text-sm text-muted-foreground">Remove obstacles to progress</p>
        </div>
      </div>
      
      {activeBlockers.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="font-medium text-foreground">Active Blockers</h4>
          {activeBlockers.map((blocker) => (
            <div key={blocker.id} className={`p-3 rounded-lg border ${getSeverityColor(blocker.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium">{blocker.title}</h5>
                  <p className="text-sm mt-1">{blocker.description}</p>
                </div>
                <XCircle className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedBlockers.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Resolved Blockers</h4>
          {resolvedBlockers.slice(0, 3).map((blocker) => (
            <div key={blocker.id} className="p-3 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-green-800">{blocker.title}</h5>
                  <p className="text-sm text-green-600 mt-1">{blocker.description}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {blockers.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">No Blockers</h4>
          <p className="text-muted-foreground text-sm">
            Great! You're clear to move forward
          </p>
        </div>
      )}
    </div>
  );
}; 
