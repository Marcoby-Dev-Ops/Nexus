import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  MapPin, 
  Clock, 
  Users, 
  Network, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Code,
  FileText,
  Layers
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { Separator } from '@/shared/components/ui/Separator';

interface ComponentDetail {
  name: string;
  description: string;
  type: 'ui' | 'page' | 'service' | 'utility';
  totalUsage: number;
  locations: Array<{
    path: string;
    usageCount: number;
    lastUsed: string;
    performance: {
      renderTime: number;
      errorRate: number;
    };
  }>;
  dependencies: Array<{
    name: string;
    type: 'component' | 'library' | 'service';
    version?: string;
  }>;
  dependents: Array<{
    name: string;
    type: 'component' | 'page';
    usageCount: number;
  }>;
  performance: {
    averageRenderTime: number;
    errorRate: number;
    popularityScore: number;
    performanceTrend: 'up' | 'down' | 'stable';
  };
  history: Array<{
    date: string;
    usageCount: number;
    errorCount: number;
  }>;
  issues: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    location: string;
    timestamp: string;
  }>;
}

/**
 * ComponentDetailPage - Detailed view of a specific component's usage and analytics
 * 
 * Features:
 * - Component usage statistics
 * - Location tracking
 * - Performance metrics
 * - Dependency analysis
 * - Issue tracking
 * - Usage history
 */
const ComponentDetailPage: React.FC = () => {
  const { componentName } = useParams<{ componentName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [componentDetail, setComponentDetail] = useState<ComponentDetail | null>(null);

  useEffect(() => {
    const loadComponentDetail = async () => {
      if (!componentName) return;
      
      setLoading(true);
      
      // Mock data - in real implementation, this would come from the IntegrationTracker service
      const mockDetail: ComponentDetail = {
        name: componentName,
        description: `${componentName} is a reusable component used throughout the Nexus platform for consistent UI patterns and functionality.`,
        type: componentName.includes('Page') ? 'page' : 'ui',
        totalUsage: componentName === 'Button' ? 156 : componentName === 'Card' ? 134 : 89,
        locations: [
          {
            path: '/dashboard',
            usageCount: 12,
            lastUsed: new Date().toISOString(),
            performance: { renderTime: 2.1, errorRate: 0.05 }
          },
          {
            path: '/settings',
            usageCount: 8,
            lastUsed: new Date(Date.now() - 3600000).toISOString(),
            performance: { renderTime: 1.9, errorRate: 0.1 }
          },
          {
            path: '/profile',
            usageCount: 15,
            lastUsed: new Date(Date.now() - 7200000).toISOString(),
            performance: { renderTime: 2.3, errorRate: 0.02 }
          },
          {
            path: '/ai-hub',
            usageCount: 23,
            lastUsed: new Date(Date.now() - 1800000).toISOString(),
            performance: { renderTime: 1.8, errorRate: 0.08 }
          }
        ],
        dependencies: [
          { name: 'React', type: 'library', version: '18.2.0' },
          { name: 'Lucide React', type: 'library', version: '0.263.1' },
          { name: 'Tailwind CSS', type: 'library', version: '3.3.0' }
        ],
        dependents: [
          { name: 'FormButton', type: 'component', usageCount: 24 },
          { name: 'ActionButton', type: 'component', usageCount: 18 },
          { name: 'SettingsPage', type: 'page', usageCount: 12 }
        ],
        performance: {
          averageRenderTime: 2.0,
          errorRate: 0.06,
          popularityScore: 92,
          performanceTrend: 'up'
        },
        history: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          usageCount: Math.floor(Math.random() * 20) + 5,
          errorCount: Math.floor(Math.random() * 3)
        })),
        issues: [
          {
            id: '1',
            type: 'warning',
            message: 'Component rendered with deprecated props in /settings',
            location: '/settings',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            type: 'info',
            message: 'High usage detected - consider optimization',
            location: '/ai-hub',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      };

      setComponentDetail(mockDetail);
      setLoading(false);
    };

    loadComponentDetail();
  }, [componentName]);

  if (loading) {
    return (
      <PageLayout title="Component Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!componentDetail) {
    return (
      <PageLayout title="Component Not Found">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Component Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The component "{componentName}" could not be found in the tracking system.
          </p>
          <Button onClick={() => navigate('/integration-tracking')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integration Tracking
          </Button>
        </div>
      </PageLayout>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ui': return <Layers className="h-4 w-4" />;
      case 'page': return <FileText className="h-4 w-4" />;
      case 'service': return <Network className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ui': return 'bg-primary';
      case 'page': return 'bg-success';
      case 'service': return 'bg-purple';
      default: return 'bg-gray-500';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <PageLayout 
      actions={
        <Button variant="outline" onClick={() => navigate('/integration-tracking')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tracking
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Component Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-md ${getTypeColor(componentDetail.type)} text-primary-foreground`}>
                  {getTypeIcon(componentDetail.type)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{componentDetail.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {componentDetail.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="capitalize">
                  {componentDetail.type}
                </Badge>
                <Badge className="bg-brand-primary">
                  {componentDetail.totalUsage} uses
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                  <p className="text-2xl font-bold">{componentDetail.totalUsage}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-brand-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold">{componentDetail.locations.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Render Time</p>
                  <p className="text-2xl font-bold">{componentDetail.performance.averageRenderTime}ms</p>
                </div>
                <Clock className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">{(componentDetail.performance.errorRate * 100).toFixed(1)}%</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${componentDetail.performance.errorRate > 0.1 ? 'text-destructive' : 'text-success'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Usage Locations
                </CardTitle>
                <CardDescription>
                  Where this component is used throughout the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {componentDetail.locations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-full">
                          <FileText className="h-4 w-4 text-brand-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{location.path}</h4>
                          <p className="text-sm text-muted-foreground">
                            {location.usageCount} uses • Last used {new Date(location.lastUsed).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{location.performance.renderTime}ms</p>
                          <p className="text-xs text-muted-foreground">render time</p>
                        </div>
                        <Badge 
                          variant={location.performance.errorRate > 0.1 ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {(location.performance.errorRate * 100).toFixed(1)}% errors
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Network className="h-5 w-5 mr-2" />
                    Dependencies
                  </CardTitle>
                  <CardDescription>
                    Components and libraries this component depends on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {componentDetail.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded">
                            <Network className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{dep.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{dep.type}</p>
                          </div>
                        </div>
                        {dep.version && (
                          <Badge variant="outline" className="text-xs">
                            v{dep.version}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Dependents
                  </CardTitle>
                  <CardDescription>
                    Components that depend on this component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {componentDetail.dependents.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-6 h-6 bg-success/10 rounded">
                            <Users className="h-3 w-3 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{dep.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{dep.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {dep.usageCount} uses
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Detailed performance analysis and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Popularity Score</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{componentDetail.performance.popularityScore}%</span>
                        {getTrendIcon(componentDetail.performance.performanceTrend)}
                      </div>
                    </div>
                    <Progress value={componentDetail.performance.popularityScore} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Based on usage frequency and adoption rate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Render Performance</span>
                      <span className="text-sm font-bold">{componentDetail.performance.averageRenderTime}ms</span>
                    </div>
                    <Progress value={Math.max(0, 100 - componentDetail.performance.averageRenderTime * 10)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Average render time across all locations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reliability</span>
                      <span className="text-sm font-bold">{(100 - componentDetail.performance.errorRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - componentDetail.performance.errorRate * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Based on error rate and stability metrics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Issues & Alerts
                </CardTitle>
                <CardDescription>
                  Current issues and recommendations for this component
                </CardDescription>
              </CardHeader>
              <CardContent>
                {componentDetail.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
                    <p className="text-lg font-medium mb-2">No Issues Found</p>
                    <p className="text-muted-foreground">
                      This component is performing well with no reported issues.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {componentDetail.issues.map((issue) => (
                      <div key={issue.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{issue.message}</h4>
                            <Badge variant="outline" className="text-xs capitalize">
                              {issue.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Location: {issue.location} • {new Date(issue.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ComponentDetailPage; 