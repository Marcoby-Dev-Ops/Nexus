import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useToast } from '@/shared/ui/components/Toast';
import type { EABusinessObservation } from '@/domains/services/businessObservationService';

interface EABusinessObservationCardProps {
  observation: EABusinessObservation;
  onActionClick?: (actionItem: string, observationId: string) => void;
  onDismiss?: (observationId: string) => void;
  compact?: boolean;
}

export const EABusinessObservationCard: React.FC<EABusinessObservationCardProps> = ({
  observation,
  onActionClick,
  onDismiss,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useToast();

  const getTypeIcon = (type: EABusinessObservation['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-info" />;
      default: return <Lightbulb className="h-4 w-4 text-secondary" />;
    }
  };

  const getPriorityColor = (priority: EABusinessObservation['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default: return 'secondary';
    }
  };

  const handleActionClick = (actionItem: string) => {
    onActionClick?.(actionItem, observation.id);
    showToast({
      title: 'Action Initiated',
      description: `Starting: ${actionItem}`,
      type: 'success'
    });
  };

  const handleDismiss = () => {
    onDismiss?.(observation.id);
    showToast({
      title: 'Observation Dismissed',
      description: 'You can find this in your dismissed items.',
      type: 'info'
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  return (
    <Card className={`${compact ? 'text-sm' : ''} hover: shadow-md transition-shadow`}>
      <CardHeader className={`pb-3 ${compact ? 'py-3' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {getTypeIcon(observation.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className={`${compact ? 'text-sm' : 'text-base'} font-medium truncate`}>
                  {observation.title}
                </CardTitle>
                <Badge variant={getPriorityColor(observation.priority)} className="text-xs">
                  {observation.priority}
                </Badge>
              </div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2`}>
                {observation.description}
              </p>
              
              {/* Metrics */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(observation.estimatedImpact.businessValue)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {observation.estimatedImpact.timeToValue}m
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(observation.confidence * 100)}% confidence
                </div>
                {observation.automationPotential?.canAutomate && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    Auto
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Insights */}
          {observation.insights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {observation.insights.map((insight, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {observation.actionItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
              <div className="space-y-2">
                {observation.actionItems.slice(0, compact ? 2: 5).map((actionItem, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs flex-1">{actionItem}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(actionItem)}
                      className="ml-2 h-6 text-xs"
                    >
                      Start
                    </Button>
                  </div>
                ))}
                {observation.actionItems.length > (compact ? 2: 5) && (
                  <p className="text-xs text-muted-foreground">
                    +{observation.actionItems.length - (compact ? 2: 5)} more actions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Automation Potential */}
          {observation.automationPotential?.canAutomate && (
            <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-primary">Automation Available</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {observation.automationPotential.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {observation.automationPotential.complexity}
                </Badge>
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Set Up Automation
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {observation.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {observation.dataSource.join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs h-6"
                >
                  Dismiss
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-xs h-6">
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EABusinessObservationCard; 