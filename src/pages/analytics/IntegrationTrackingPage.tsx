import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, Activity, CheckCircle, Clock, ArrowRight, BarChart3, Network, Component, Eye, MapPin, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { IntegrationTracker } from '@/services/analytics/IntegrationTracker';
import type { ComponentUsage } from '../services/IntegrationTracker';

interface ComponentStats {
  componentName: string;
  totalUsage: number;
  locations: string[];
  lastUsed: string;
  performance: {
    averageRenderTime: number;
    errorRate: number;
    popularityScore: number;
  };
  dependencies: string[];
  dependents: string[];
}

interface IntegrationAnalytics {
  totalComponents: number;
  activeComponents: number;
  totalUsageCount: number;
  averageUsagePerComponent: number;
  topComponents: ComponentStats[];
  recentActivity: ComponentUsage[];
  healthScore: number;
  trends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    mostImprovedComponent: string;
  };
}

/**
 * IntegrationTrackingPage - Dashboard for tracking component usage and integration health
 * 
 * Features:
 * - Component usage analytics
 * - Integration health monitoring
 * - Dependency tracking
 * - Performance metrics
 * - Usage trends and insights
 */
const IntegrationTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'errors'>('all');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<IntegrationAnalytics | null>(null);
  const [componentStats, setComponentStats] = useState<ComponentStats[]>([]);

  // Load integration data
  useEffect(() => {
    const loadIntegrationData = async () => {
      try {
        setLoading(true);
        
        // Load usage data from IntegrationTracker
        const usageData = await IntegrationTracker.loadUsagesFromSupabase();
        const inMemoryData = IntegrationTracker.getInMemoryUsages();
        
        // Combine and process data
        const allUsageData = [...usageData, ...inMemoryData];
        
        // Mock analytics data - in real implementation, this would be calculated from actual data
        const mockAnalytics: IntegrationAnalytics = {
          totalComponents: 45,
          activeComponents: 38,
          totalUsageCount: 1247,
          averageUsagePerComponent: 27.7,
          topComponents: [
            {
              componentName: 'Button',
              totalUsage: 156,
              locations: ['HomePage', 'SettingsPage', 'ProfilePage', 'AIHubPage'],
              lastUsed: new Date().toISOString(),
              performance: {
                averageRenderTime: 2.3,
                errorRate: 0.1,
                popularityScore: 95
              },
              dependencies: ['Icon', 'Spinner'],
              dependents: ['FormButton', 'ActionButton']
            },
            {
              componentName: 'Card',
              totalUsage: 134,
              locations: ['Dashboard', 'AIHubPage', 'AnalyticsPage', 'ProfilePage'],
              lastUsed: new Date().toISOString(),
              performance: {
                averageRenderTime: 1.8,
                errorRate: 0.05,
                popularityScore: 92
              },
              dependencies: ['CardHeader', 'CardContent'],
              dependents: ['StatsCard', 'InfoCard']
            },
            {
              componentName: 'Input',
              totalUsage: 89,
              locations: ['AccountSettings', 'ProfilePage', 'SearchBar'],
              lastUsed: new Date().toISOString(),
              performance: {
                averageRenderTime: 1.2,
                errorRate: 0.2,
                popularityScore: 88
              },
              dependencies: ['Label', 'ErrorMessage'],
              dependents: ['FormInput', 'SearchInput']
            }
          ],
          recentActivity: allUsageData.slice(-10),
          healthScore: 87,
          trends: {
            weeklyGrowth: 12.5,
            monthlyGrowth: 34.2,
            mostImprovedComponent: 'AIHubPage'
          }
        };

        setAnalytics(mockAnalytics);
        setComponentStats(mockAnalytics.topComponents);
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading integration data: ', error);
      } finally {
        setLoading(false);
      }
    };

    loadIntegrationData();
  }, []);

  // Filter components based on search and filter
  const filteredComponents = componentStats.filter(component => {
    const matchesSearch = component.componentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (selectedFilter) {
      case 'active':
        return matchesSearch && component.totalUsage > 0;
      case 'inactive':
        return matchesSearch && component.totalUsage === 0;
      case 'errors':
        return matchesSearch && component.performance.errorRate > 0.1;
      default: return matchesSearch;
    }
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-success">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-warning">Good</Badge>;
    return <Badge className="bg-destructive">Needs Attention</Badge>;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/integrations')}>
            <Network className="h-4 w-4 mr-2" />
            Manage Integrations
          </Button>
          <Button onClick={() => window.location.reload()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      }
    >
      <p className="text-muted-foreground mb-6">
        Track component usage, monitor integration health, and analyze dependency relationships across your platform
      </p>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Components</p>
                <p className="text-2xl font-bold">{analytics?.totalComponents || 0}</p>
              </div>
              <Component className="h-8 w-8 text-brand-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Components</p>
                <p className="text-2xl font-bold">{analytics?.activeComponents || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{analytics?.totalUsageCount || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthColor(analytics?.healthScore || 0)}`}>
                  {analytics?.healthScore || 0}%
                </p>
              </div>
              <Activity className={`h-8 w-8 ${getHealthColor(analytics?.healthScore || 0)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm: flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'errors'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              onClick={() => setSelectedFilter(filter)}
              className="capitalize"
            >
              {filter === 'all' ? 'All' : filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Integration Health Overview
              </CardTitle>
              <CardDescription>
                Overall health and performance metrics for your component integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Health</span>
                    {getHealthBadge(analytics?.healthScore || 0)}
                  </div>
                  <Progress value={analytics?.healthScore || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on usage patterns, error rates, and performance metrics
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Growth Trend</span>
                    <Badge className="bg-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics?.trends.weeklyGrowth || 0}%
                    </Badge>
                  </div>
                  <Progress value={analytics?.trends.weeklyGrowth || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Weekly growth in component usage
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Rate</span>
                    <Badge variant="outline">
                      {Math.round(((analytics?.activeComponents || 0) / (analytics?.totalComponents || 1)) * 100)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={((analytics?.activeComponents || 0) / (analytics?.totalComponents || 1)) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of components actively being used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Components */}
          <Card>
            <CardHeader>
              <CardTitle>Top Components</CardTitle>
              <CardDescription>Most frequently used components across your platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topComponents.slice(0, 5).map((component, index) => (
                  <div key={component.componentName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-full">
                        <span className="text-sm font-bold text-brand-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{component.componentName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {component.totalUsage} uses across {component.locations.length} locations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {component.performance.popularityScore}% popular
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/integration-tracking/component/${component.componentName}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest component usage and integration events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover: bg-muted rounded-md">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.componentName}</p>
                        <p className="text-xs text-muted-foreground">Used in {activity.location}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          {/* Component List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.componentName} className="hover: shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-brand-primary/10 rounded-lg">
                        <Component className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{component.componentName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {component.totalUsage} uses • {component.locations.length} locations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Performance</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {component.performance.averageRenderTime}ms avg
                          </span>
                          <Badge 
                            variant={component.performance.errorRate > 0.1 ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {(component.performance.errorRate * 100).toFixed(1)}% errors
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/integration-tracking/component/${component.componentName}`)}
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Locations: {component.locations.slice(0, 3).join(', ')}
                          {component.locations.length > 3 && ` +${component.locations.length - 3} more`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          <Users className="h-4 w-4 inline mr-1" />
                          {component.dependents.length} dependents
                        </span>
                        <span className="text-muted-foreground">
                          <Network className="h-4 w-4 inline mr-1" />
                          {component.dependencies.length} dependencies
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Dependency Graph
              </CardTitle>
              <CardDescription>
                Visual representation of component dependencies and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Dependency Visualization</p>
                <p className="text-muted-foreground mb-4">
                  Interactive dependency graph coming soon. This will show how components relate to each other.
                </p>
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Enable Advanced Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>Component usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Growth</span>
                    <Badge className="bg-success">+{analytics?.trends.weeklyGrowth || 0}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Growth</span>
                    <Badge className="bg-primary">+{analytics?.trends.monthlyGrowth || 0}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Most Improved</span>
                    <Badge variant="outline">{analytics?.trends.mostImprovedComponent || 'N/A'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System-wide performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Render Time</span>
                    <span className="text-sm text-muted-foreground">1.8ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Error Rate</span>
                    <Badge variant="outline">0.12%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Components with Issues</span>
                    <span className="text-sm text-destructive">3 components</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default IntegrationTrackingPage; 