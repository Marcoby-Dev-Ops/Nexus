import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, Brain, Eye, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { crossDepartmentalContext } from '../../lib/ai/crossDepartmentalContext';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface OrgMetric {
  label: string;
  value: number;
  target: number;
  color: string;
}

const fetchOrgContext = async () => {
  // Use a placeholder companyId for now; replace with real company context as needed
  const companyId = '00000000-0000-0000-0000-000000000001';
  await crossDepartmentalContext.initialize(companyId);
  return crossDepartmentalContext['organizationalContext'];
};

export const OrganizationalTrinityWidget: React.FC = () => {
  const { data: orgContext, isLoading, isError } = useQuery({
    queryKey: ['organizational_context'],
    queryFn: fetchOrgContext,
  });

  // Metrics for SEE
  const metrics: OrgMetric[] = orgContext
    ? [
        {
          label: 'Revenue Alignment',
          value: orgContext.crossDepartmentalMetrics.revenueAlignment,
          target: 85,
          color: 'blue',
        },
        {
          label: 'Operational Efficiency',
          value: orgContext.crossDepartmentalMetrics.operationalEfficiency,
          target: 90,
          color: 'purple',
        },
        {
          label: 'Resource Utilization',
          value: orgContext.crossDepartmentalMetrics.resourceUtilization,
          target: 80,
          color: 'orange',
        },
        {
          label: 'Communication Health',
          value: orgContext.crossDepartmentalMetrics.communicationHealth,
          target: 90,
          color: 'green',
        },
      ]
    : [];

  // Map business color meanings to semantic Tailwind classes
  const getMetricColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-primary';
      case 'purple': return 'text-secondary';
      case 'orange': return 'text-warning';
      case 'green': return 'text-success';
      case 'red': return 'text-destructive';
      default: return 'text-foreground';
    }
  };

  const [showModal, setShowModal] = useState(false); // Placeholder for future modals

  // Summary values
  const topOpportunity = orgContext?.opportunities?.[0];
  const topMetric = metrics?.[0];
  const topRisk = orgContext?.riskFactors?.[0];

  // Placeholder handlers for navigation
  const handleSeeAll = (section: string) => {
    // TODO: Implement navigation to full-feature page for section
    alert(`Navigate to full ${section} page`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8 bg-card rounded-2xl shadow-lg border border-border">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Brain className="text-primary" />
          Organizational Trinity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overview grid for THINK, SEE, ACT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* THINK Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-primary" />
              <h2 className="text-lg font-semibold">THINK</h2>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {topOpportunity ? (
                <div className="text-sm text-foreground truncate">
                  <span className="font-medium">{topOpportunity.opportunity}</span> <span className="text-muted-foreground">({topOpportunity.departments.join(', ')})</span>
                  <div className="text-xs text-success">Potential: {topOpportunity.potentialValue}</div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No current org-wide opportunities</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('think')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          {/* SEE Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="text-secondary" />
              <h2 className="text-lg font-semibold">SEE</h2>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {topMetric ? (
                <div className="text-sm text-foreground">
                  <span className={`font-bold ${getMetricColorClass(topMetric.color)}`}>{topMetric.label}:</span> {topMetric.value}%
                  <span className="text-xs text-muted-foreground ml-2">(Target: {topMetric.target}%)</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No key metrics</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('see')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          {/* ACT Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-warning" />
              <h2 className="text-lg font-semibold">ACT</h2>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {topRisk ? (
                <div className="text-sm text-foreground truncate">
                  <span className="font-medium">{topRisk.risk}</span>: {topRisk.impact.join(', ')}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No major risks</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('act')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 