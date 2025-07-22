/**
 * Centralized Apps Hub
 * Unified control center for all business applications and functions
 * Demonstrates the vision of centralized business operations through AI orchestration
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Zap, Brain, TrendingUp, AlertCircle, CheckCircle, 
  Settings, Play, Pause, BarChart3, Users, DollarSign, 
  MessageSquare, Globe, Database, Layers, ArrowRight,
  RefreshCw, Bell, Target, Workflow, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { orchestrator } from '@/domains/integrations/services/centralizedAppsOrchestrator';
import type { BusinessApp, BusinessFunction, AppCategory } from '@/domains/integrations/services/centralizedAppsOrchestrator';

interface CentralizedAppsHubProps {
  className?: string;
}

export const CentralizedAppsHub: React.FC<CentralizedAppsHubProps> = ({ className = '' }) => {
  const [apps, setApps] = useState<BusinessApp[]>([]);
  const [functions, setFunctions] = useState<BusinessFunction[]>([]);
  const [centralizedStatus, setCentralizedStatus] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCommand, setActiveCommand] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async (): Promise<void> => {
    try {
      // Get all connected apps and business functions
      const connectedApps = orchestrator.getConnectedApps();
      const businessFunctions = orchestrator.getBusinessFunctions();
      const status = orchestrator.getAppsCentralizedStatus();
      
      setApps(connectedApps);
      setFunctions(businessFunctions);
      setCentralizedStatus(status);

      // Get business insights (mock for demo)
      const businessInsights = await orchestrator.getBusinessInsights('current-user');
      setInsights(businessInsights);

    } catch (error) {
      console.error('Failed to initialize centralized dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeUnifiedCommand = async (): Promise<void> => {
    if (!activeCommand.trim() || selectedApps.length === 0) return;

    try {
      const result = await orchestrator.executeUnifiedCommand(
        activeCommand,
        selectedApps,
        'current-user'
      );

      console.log('Unified command executed:', result);
      // Show success/results in UI
    } catch (error) {
      console.error('Failed to execute unified command:', error);
    }
  };

  const executeBusinessFunction = async (functionId: string): Promise<void> => {
    try {
      const result = await orchestrator.executeBusinessFunction(
        functionId,
        { initiated: 'dashboard' },
        'current-user'
      );

      console.log('Business function executed:', result);
    } catch (error) {
      console.error('Failed to execute business function:', error);
    }
  };

  const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'configuring': return <RefreshCw className="w-4 h-4 text-warning animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: AppCategory): React.JSX.Element => {
    const iconClass = "w-5 h-5";
    switch (category) {
      case 'crm-sales': return <Users className={`${iconClass} text-primary`} />;
      case 'finance-accounting': return <DollarSign className={`${iconClass} text-success`} />;
      case 'marketing-advertising': return <Target className={`${iconClass} text-pink-600`} />;
      case 'operations-productivity': return <Settings className={`${iconClass} text-secondary`} />;
      case 'analytics-bi': return <BarChart3 className={`${iconClass} text-warning`} />;
      case 'communication': return <MessageSquare className={`${iconClass} text-primary`} />;
      default: return <Layers className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getAutomationColor = (level: number): string => {
    if (level >= 80) return 'text-success bg-success/5';
    if (level >= 60) return 'text-warning bg-warning/5';
    return 'text-destructive bg-destructive/5';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Centralizing your business apps...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-primary-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Centralized Business OS
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Unified control center for all your business applications and workflows
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            {centralizedStatus?.connectedApps} Apps Connected
          </Badge>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Connect New App
          </Button>
        </div>
      </div>

      {/* Centralized Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Apps</p>
                <p className="text-2xl font-bold">{centralizedStatus?.connectedApps}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Functions</p>
                <p className="text-2xl font-bold">{functions.length}</p>
              </div>
              <Workflow className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">{centralizedStatus?.totalDataPoints?.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{Math.round((centralizedStatus?.healthyApps / centralizedStatus?.connectedApps) * 100)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Command Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Unified Command Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Execute Across Multiple Apps</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={activeCommand}
                  onChange={(e) => setActiveCommand(e.target.value)}
                  placeholder="e.g., Generate monthly sales report, Update customer contact info, Send marketing campaign..."
                  className="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={executeUnifiedCommand} disabled={!activeCommand.trim() || selectedApps.length === 0}>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Target Applications</label>
              <div className="flex flex-wrap gap-2">
                {apps.slice(0, 6).map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      if (selectedApps.includes(app.id)) {
                        setSelectedApps(selectedApps.filter(id => id !== app.id));
                      } else {
                        setSelectedApps([...selectedApps, app.id]);
                      }
                    }}
                    className={`px-4 py-1 rounded-full text-sm border transition-all ${
                      selectedApps.includes(app.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/90 border-border hover:border-primary'
                    }`}
                  >
                    {getCategoryIcon(app.category)}
                    <span className="ml-1">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Functions - Automated Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Workflow className="w-5 h-5 mr-2" />
            Automated Business Functions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {functions.map(func => (
              <div key={func.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getCategoryIcon(func.category)}
                    <h3 className="font-semibold ml-2">{func.name}</h3>
                  </div>
                  <Badge className={getAutomationColor(func.automationLevel)}>
                    {func.automationLevel}% Automated
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{func.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {func.requiredApps.length} apps • {func.supportingAgents.length} agents
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => executeBusinessFunction(func.id)}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Applications Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Connected Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map(app => (
              <div key={app.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getCategoryIcon(app.category)}
                    <div className="ml-3">
                      <h3 className="font-semibold">{app.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{app.category.replace('-', ' & ')}</p>
                    </div>
                  </div>
                  {getStatusIcon(app.status)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Integration Level:</span>
                    <Badge variant="outline" className="capitalize">{app.integrationLevel}</Badge>
                  </div>
                  {app.dataPoints && (
                    <div className="flex justify-between text-sm">
                      <span>Data Points:</span>
                      <span className="font-medium">{app.dataPoints.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium text-success">{app.metrics.successRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {app.capabilities.length} capabilities
                  </div>
                  <Button size="sm" variant="outline">
                    <Settings className="w-3 h-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Cross-Platform Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {insights.kpis.map((kpi: any, index: number) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Sources: {kpi.source.join(', ')}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">AI Recommendations</h4>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="w-4 h-4 mt-0.5 mr-2 text-primary" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Cross-App Opportunities</h4>
                <ul className="space-y-2">
                  {insights.crossAppOpportunities.map((opp: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Zap className="w-4 h-4 mt-0.5 mr-2 text-warning" />
                      <span className="text-sm">{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 