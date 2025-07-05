import React from 'react';
import { Gauge, RefreshCw, CheckCircle2, AlertCircle, Clock, Activity, Lightbulb, Zap, TrendingUp, Brain } from 'lucide-react';
import { useSystemContext } from '../../../contexts/SystemContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'syncing':
      return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case 'paused':
      return <Clock className="w-4 h-4 text-warning" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success/10 text-success border-success/20';
    case 'syncing': return 'bg-primary/10 text-primary border-primary/20';
    case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'paused': return 'bg-warning/10 text-warning border-warning/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const SystemMaturityCards: React.FC = () => {
  const { integrationStatus, businessHealth, aiInsights, loading, refresh } = useSystemContext();
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {/* System Health Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>Business health score and trend</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="mb-4">
            <div className="text-4xl font-bold flex items-center gap-2">
              {loading ? '...' : businessHealth.score}
              <span className={`text-base font-medium ${businessHealth.trend === 'up' ? 'text-success' : businessHealth.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>({businessHealth.trend})</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {businessHealth.summary}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardContent>
      </Card>
      {/* AI Opportunities Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Opportunities
          </CardTitle>
          <CardDescription>AI-generated insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 mb-4">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : aiInsights.length === 0 ? (
              <div className="text-muted-foreground">No insights available</div>
            ) : (
              aiInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className={`p-2 rounded border-l-4 ${
                  insight.impact === 'high' ? 'border-destructive bg-destructive/5' :
                  insight.impact === 'medium' ? 'border-warning bg-warning/5' :
                  'border-muted bg-muted/5'
                }`}>
                  <div className="font-semibold flex items-center gap-2">
                    {insight.type === 'opportunity' && <Zap className="w-4 h-4 text-success" />}
                    {insight.type === 'alert' && <AlertCircle className="w-4 h-4 text-destructive" />}
                    {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-primary" />}
                    {insight.type === 'optimization' && <Lightbulb className="w-4 h-4 text-yellow-500" />}
                    {insight.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{insight.description}</div>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/ai-hub'}>
            <Brain className="w-4 h-4 mr-2" /> Explore AI Hub
          </Button>
        </CardContent>
      </Card>
      {/* Integrations Status Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Integrations
          </CardTitle>
          <CardDescription>Status of connected services</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 mb-4">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : integrationStatus.length === 0 ? (
              <div className="text-muted-foreground">No integrations connected</div>
            ) : (
              integrationStatus.slice(0, 3).map((integration) => (
                <div key={integration.id} className="flex items-center gap-2 p-2 rounded border border-border">
                  {getStatusIcon(integration.status)}
                  <span className="font-medium">{integration.name}</span>
                  <span className={`text-xs ml-auto px-2 py-0.5 rounded ${getStatusColor(integration.status)}`}>{integration.status}</span>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/integrations'}>
            <RefreshCw className="w-4 h-4 mr-2" /> Manage Integrations
          </Button>
        </CardContent>
      </Card>
      {/* Quick Actions Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>Jump to key workflows</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 mb-4">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/maturity/analytics'}>
              View Maturity Analytics
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/maturity/processes'}>
              View Processes
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/ai-hub'}>
              Ask AI for Maturity Insight
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MaturityAnalyticsPage: React.FC = () => (
  <div className="space-y-8">
    <SystemMaturityCards />
    <div>
      <h1 className="text-2xl font-bold inline-flex items-center gap-2">
        <Gauge className="w-6 h-6" /> Maturity Analytics
      </h1>
      <p className="text-muted-foreground">Assess process standardisation, documentation and organisational strength</p>
    </div>
    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
      Detailed maturity dashboards coming soon…
    </div>
  </div>
);

export default MaturityAnalyticsPage; 