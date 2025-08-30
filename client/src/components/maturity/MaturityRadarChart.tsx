import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';

interface MaturityRadarChartProps {
  domainScores: Array<{
    domainId: string;
    domainName: string;
    score: number;
  }>;
  onDomainClick: (domainId: string) => void;
  selectedDomain: string | null;
}

export const MaturityRadarChart: React.FC<MaturityRadarChartProps> = ({
  domainScores,
  onDomainClick,
  selectedDomain
}) => {
  // Placeholder implementation - replace with actual radar chart library
  return (
    <div className="w-full h-80 flex items-center justify-center">
      <Card className="w-full h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">Domain Performance Radar</div>
            <div className="grid grid-cols-2 gap-4">
              {domainScores.map((domain) => (
                <div
                  key={domain.domainId}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedDomain === domain.domainId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onDomainClick(domain.domainId)}
                >
                  <div className="font-medium">{domain.domainName}</div>
                  <div className="text-2xl font-bold">{domain.score.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">/5</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Click on a domain to see detailed insights
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
