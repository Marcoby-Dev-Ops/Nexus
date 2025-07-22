import React from 'react';
import { useCredibilityMonitor } from '@/shared/hooks/useCredibilityGuard';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Credibility Dashboard Component
 * 
 * Real-time monitoring of context credibility - the foundation of user credibility in Nexus
 */
export const CredibilityDashboard: React.FC = () => {
  const {
    isCredible,
    confidence,
    status,
    trend,
    issues,
    recommendations,
    metrics,
    forceCredibilityCheck,
    needsImmediateAttention,
    needsAttention,
    isHealthy
  } = useCredibilityMonitor();

  const getStatusIcon = () => {
    if (isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (needsImmediateAttention) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (confidence >= 95) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (confidence >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* Main Credibility Status */}
      <Card className={getStatusColor()}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">Context Credibility</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <Badge variant={isCredible ? 'default' : 'destructive'}>
                {status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Real-time monitoring of user context accuracy and credibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Confidence Score */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Confidence Score</span>
                <span className="text-sm font-bold">{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-2" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.contextAccuracy}%
                </div>
                <div className="text-xs text-gray-500">Context Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.validationSuccessRate}%
                </div>
                <div className="text-xs text-gray-500">Validation Success</div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={forceCredibilityCheck}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Credibility Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues and Recommendations */}
      {(issues.length > 0 || recommendations.length > 0) && (
        <div className="space-y-3">
          {issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Credibility Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {recommendations.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Recommendations</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Data Freshness</div>
              <div className="text-gray-600">
                {Math.round(metrics.dataFreshness / 1000)}s ago
              </div>
            </div>
            <div>
              <div className="font-medium">Error Count</div>
              <div className="text-gray-600">{metrics.errorCount}</div>
            </div>
            <div>
              <div className="font-medium">Warning Count</div>
              <div className="text-gray-600">{metrics.warningCount}</div>
            </div>
            <div>
              <div className="font-medium">Last Validation</div>
              <div className="text-gray-600">
                {new Date(metrics.lastValidationTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-3 rounded-lg text-center ${isHealthy ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="text-xs font-medium">Health</div>
          <div className={`text-lg font-bold ${isHealthy ? 'text-green-600' : 'text-gray-600'}`}>
            {isHealthy ? '✓' : '✗'}
          </div>
        </div>
        <div className={`p-3 rounded-lg text-center ${!needsAttention ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="text-xs font-medium">Attention</div>
          <div className={`text-lg font-bold ${!needsAttention ? 'text-green-600' : 'text-yellow-600'}`}>
            {needsAttention ? '!' : '✓'}
          </div>
        </div>
        <div className={`p-3 rounded-lg text-center ${!needsImmediateAttention ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="text-xs font-medium">Critical</div>
          <div className={`text-lg font-bold ${!needsImmediateAttention ? 'text-green-600' : 'text-red-600'}`}>
            {needsImmediateAttention ? '!' : '✓'}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Credibility Indicator
 * For use in headers, sidebars, etc.
 */
export const CredibilityIndicator: React.FC = () => {
  const { confidence, isCredible } = useCredibilityMonitor();

  const getIndicatorColor = () => {
    if (confidence >= 95) return 'bg-green-500';
    if (confidence >= 80) return 'bg-blue-500';
    if (confidence >= 60) return 'bg-yellow-500';
    if (confidence >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
      <span className="text-xs font-medium">
        {isCredible ? 'Credible' : 'Compromised'} ({confidence}%)
      </span>
    </div>
  );
}; 