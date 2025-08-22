import React from 'react';
import { Lightbulb, Star } from 'lucide-react';
import type { Opportunity } from '@/types/business/fire-cycle';

interface OpportunitiesCardProps {
  opportunities: Opportunity[];
}

export const OpportunitiesCard: React.FC<OpportunitiesCardProps> = ({ opportunities }) => {
  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'text-red-600 bg-red-100';
    if (impact >= 6) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pursuing':
        return 'text-blue-600 bg-blue-100';
      case 'captured':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-muted-foreground bg-muted';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Opportunities</h3>
          <p className="text-sm text-muted-foreground">Seize growth potential</p>
        </div>
      </div>
      
      {opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{opportunity.title}</h4>
                  <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                </div>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${getImpactColor(opportunity.potentialImpact)}`}>
                  Impact: {opportunity.potentialImpact}/10
                </span>
                <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(opportunity.status)}`}>
                  {opportunity.status}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                  {opportunity.timeframe}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">No Opportunities</h4>
          <p className="text-muted-foreground text-sm">
            Add opportunities to track growth potential
          </p>
        </div>
      )}
    </div>
  );
}; 