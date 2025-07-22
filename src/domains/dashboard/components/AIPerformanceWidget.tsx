import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  TrendingUp, 
  DollarSign, 
  Star, 
  Activity,
  ArrowRight,
  Brain,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { useNavigate } from 'react-router-dom';
import { aiUsageBillingService } from '@/domains/admin/billing/services/aiUsageBillingService';
import { continuousImprovementService } from '@/domains/ai/lib/continuousImprovementService';
import { LoadingSpinner } from '@/shared/components/patterns/LoadingStates';

interface AIPerformanceWidgetProps {
  className?: string;
}

export const AIPerformanceWidget: React.FC<AIPerformanceWidgetProps> = ({ className }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    healthScore: number;
    monthlySpend: number;
    projectedSpend: number;
    avgRating: number;
    tokenUsage: number;
    tokensRemaining: number;
    recommendations: number;
    status: 'healthy' | 'warning' | 'critical';
  }>({
    healthScore: 0,
    monthlySpend: 0,
    projectedSpend: 0,
    avgRating: 0,
    tokenUsage: 0,
    tokensRemaining: 0,
    recommendations: 0,
    status: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSummaryData();
    }
  }, [user?.id]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      const [billing, improvement] = await Promise.all([
        aiUsageBillingService.getRealTimeBillingStatus(user?.id || ''),
        continuousImprovementService.getImprovementDashboard('week')
      ]);

      const healthScore = improvement?.overallHealthScore || 0.85;
      const status = healthScore > 0.8 ? 'healthy' : healthScore > 0.6 ? 'warning' : 'critical';

      setData({
        healthScore: Math.round(healthScore * 100),
        monthlySpend: billing?.costs?.currentPeriodCost || 0,
        projectedSpend: billing?.costs?.projectedMonthlyCost || 0,
        avgRating: (improvement?.userSatisfaction as any)?.averageRating || 4.2,
        tokenUsage: billing?.usage?.utilizationPercent || 0,
        tokensRemaining: billing?.usage?.tokensRemaining || 0,
        recommendations: improvement?.recommendations?.length || 3,
        status
      });
    } catch (error) {
      console.error('Error loading AI performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Performance
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(data.status)}
            <span className={`text-sm font-medium ${getStatusColor(data.status)}`}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Health Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-success">
              {data.healthScore}%
            </span>
            <Badge variant="secondary" className="text-xs">
              +5%
            </Badge>
          </div>
        </div>

        {/* Monthly Spend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Monthly Spend</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">
              ${data.monthlySpend.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              ${data.projectedSpend.toFixed(2)} projected
            </div>
          </div>
        </div>

        {/* User Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">Avg Rating</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-warning">
              {data.avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
        </div>

        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Token Usage</span>
            <span className="text-sm font-medium">
              {data.tokenUsage.toFixed(0)}%
            </span>
          </div>
          <Progress value={data.tokenUsage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {data.tokensRemaining.toLocaleString()} tokens remaining
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations > 0 && (
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-blue-900">
                {data.recommendations} New Recommendations
              </span>
            </div>
            <p className="text-xs text-primary">
              Potential savings and performance improvements available
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/ai-performance')}
          >
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/settings/ai-performance')}
          >
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 