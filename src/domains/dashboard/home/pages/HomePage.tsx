import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useData } from '@/shared/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  RefreshCw, 
  AlertTriangle, 
  Users,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

interface HomePageProps {
  className?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const { 
    profile, 
    systemStatus, 
    loading, 
    error, 
    warnings,
    refreshAll,
    clearError 
  } = useData();

  const [activeSystem, setActiveSystem] = useState<'home' | 'workspace' | 'fire' | 'integrations'>('home');

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Data error:', error);
    }
  }, [error]);

  // Handle warnings
  useEffect(() => {
    if (warnings.length > 0) {
      console.warn('Data warnings:', warnings);
    }
  }, [warnings]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Data Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={refreshAll} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.firstName || 'User'}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your business today
          </p>
        </div>
        <Button onClick={refreshAll} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index} className="text-sm">{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Home System */}
        <Card 
          className={`cursor-pointer transition-all ${
            activeSystem === 'home' ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSystem('home')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Home
              </div>
              <Badge variant="secondary">{systemStatus?.home?.insights || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Insights</span>
                <span className="font-medium">{systemStatus?.home?.insights || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Alerts</span>
                <span className="font-medium text-orange-600">{systemStatus?.home?.alerts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace System */}
        <Card 
          className={`cursor-pointer transition-all ${
            activeSystem === 'workspace' ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSystem('workspace')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workspace
              </div>
              <Badge variant="secondary">{systemStatus?.workspace?.actions || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Actions</span>
                <span className="font-medium">{systemStatus?.workspace?.actions || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Automations</span>
                <span className="font-medium">{systemStatus?.workspace?.automations || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FIRE System */}
        <Card 
          className={`cursor-pointer transition-all ${
            activeSystem === 'fire' ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSystem('fire')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                FIRE
              </div>
              <Badge variant="secondary">{systemStatus?.fire?.focus || 0}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Focus</span>
                <span className="font-medium">{systemStatus?.fire?.focus || 0}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Insight</span>
                <span className="font-medium">{systemStatus?.fire?.insight || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations System */}
        <Card 
          className={`cursor-pointer transition-all ${
            activeSystem === 'integrations' ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSystem('integrations')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Integrations
              </div>
              <Badge variant="secondary">{systemStatus?.integrations?.connected || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Connected</span>
                <span className="font-medium">{systemStatus?.integrations?.connected || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Data Points</span>
                <span className="font-medium">{systemStatus?.integrations?.dataPoints || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active System Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeSystem === 'home' && <BarChart3 className="h-5 w-5" />}
            {activeSystem === 'workspace' && <Users className="h-5 w-5" />}
            {activeSystem === 'fire' && <Zap className="h-5 w-5" />}
            {activeSystem === 'integrations' && <Target className="h-5 w-5" />}
            {activeSystem.charAt(0).toUpperCase() + activeSystem.slice(1)} System
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSystem === 'home' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Recent Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus?.home?.insights || 0} insights available
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Active Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus?.home?.alerts || 0} alerts need attention
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSystem === 'workspace' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Pending Actions</h3>
                  <p className="text-2xl font-bold">{systemStatus?.workspace?.actions || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Active Automations</h3>
                  <p className="text-2xl font-bold">{systemStatus?.workspace?.automations || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Decisions Made</h3>
                  <p className="text-2xl font-bold">{systemStatus?.workspace?.decisions || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeSystem === 'fire' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="font-semibold mb-2">Focus</h3>
                  <p className="text-2xl font-bold">{systemStatus?.fire?.focus || 0}%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="font-semibold mb-2">Insight</h3>
                  <p className="text-2xl font-bold">{systemStatus?.fire?.insight || 0}%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="font-semibold mb-2">Roadmap</h3>
                  <p className="text-2xl font-bold">{systemStatus?.fire?.roadmap || 0}%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="font-semibold mb-2">Execute</h3>
                  <p className="text-2xl font-bold">{systemStatus?.fire?.execute || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {activeSystem === 'integrations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Connected Integrations</h3>
                  <p className="text-2xl font-bold">{systemStatus?.integrations?.connected || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Total Insights</h3>
                  <p className="text-2xl font-bold">{systemStatus?.integrations?.insights || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Data Points</h3>
                  <p className="text-2xl font-bold">{systemStatus?.integrations?.dataPoints || 0}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {systemStatus?.home?.lastUpdated && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {new Date(systemStatus.home.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}; 