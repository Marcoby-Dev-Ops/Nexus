import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Bug, X, RefreshCw, Copy, CheckCircle } from 'lucide-react';

interface OnboardingDebugData {
  selectedIntegrations: string[];
  selectedTools: Record<string, string[]>;
  industry: string;
  company: string;
  keyPriorities: string[];
  insightsCount: number;
  maturityScore: number;
  currentStep: string;
  completedSteps: string[];
}

interface OnboardingDebugMonitorProps {
  debugData?: OnboardingDebugData;
  onRefresh?: () => void;
}

export const OnboardingDebugMonitor: React.FC<OnboardingDebugMonitorProps> = ({ 
  debugData, 
  onRefresh 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const copyToClipboard = async () => {
    if (debugData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy debug data:', err);
      }
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-96 bg-background/95 backdrop-blur-sm border-border/50 max-h-96 overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-orange-600" />
              Onboarding Debug
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={onRefresh}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Refresh debug data"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Copy debug data"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {debugData ? (
            <>
              {/* Help Text */}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <strong>Quick Connect:</strong> External services to integrate with Nexus<br/>
                <strong>Tool Categories:</strong> Your current tech stack organized by business function
              </div>
              {/* Current Step */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Current Step</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {debugData.currentStep || 'Not set'}
                </Badge>
              </div>

              {/* Maturity Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Maturity Score</span>
                </div>
                <Badge variant={debugData.maturityScore > 70 ? 'default' : debugData.maturityScore > 40 ? 'secondary' : 'destructive'}>
                  {debugData.maturityScore}/100
                </Badge>
              </div>

              {/* Insights Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Insights Generated</span>
                </div>
                <Badge variant="outline">
                  {debugData.insightsCount}
                </Badge>
              </div>

              {/* Company Info */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Company Info</div>
                <div className="text-xs space-y-1">
                  <div><strong>Company:</strong> {debugData.company || 'Not set'}</div>
                  <div><strong>Industry:</strong> {debugData.industry || 'Not set'}</div>
                </div>
              </div>

              {/* Quick Connect Integrations */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Connect Integrations</div>
                <div className="flex flex-wrap gap-1">
                  {debugData.selectedIntegrations.length > 0 ? (
                    debugData.selectedIntegrations.map((integration) => (
                      <Badge key={integration} variant="secondary" className="text-xs">
                        {integration}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>

              {/* Tool Categories */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Tool Categories</div>
                <div className="space-y-1">
                  {Object.keys(debugData.selectedTools).length > 0 ? (
                    Object.entries(debugData.selectedTools).map(([category, tools]) => (
                      <div key={category} className="text-xs">
                        <strong>{category}:</strong> {tools.join(', ') || 'None'}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>

              {/* Key Priorities */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Key Priorities</div>
                <div className="flex flex-wrap gap-1">
                  {debugData.keyPriorities.length > 0 ? (
                    debugData.keyPriorities.map((priority) => (
                      <Badge key={priority} variant="outline" className="text-xs">
                        {priority}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None set</span>
                  )}
                </div>
              </div>

              {/* Completed Steps */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Completed Steps</div>
                <div className="flex flex-wrap gap-1">
                  {debugData.completedSteps.length > 0 ? (
                    debugData.completedSteps.map((step) => (
                      <Badge key={step} variant="default" className="text-xs">
                        {step}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None completed</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Bug className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No debug data available</p>
              <p className="text-xs text-muted-foreground">Complete onboarding steps to see debug info</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
