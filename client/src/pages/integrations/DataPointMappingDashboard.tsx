import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useToast } from '@/shared/components/ui/use-toast';
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import { HubSpotDataConnector } from '@/services/integrations/hubspot/HubSpotDataConnector';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Zap,
  Target,
  Activity
} from 'lucide-react';

const DataPointMappingDashboard: React.FC = () => {
  const [mappingReport, setMappingReport] = useState<MappingReport | null>(null);
  const [unmappedDataPoints, setUnmappedDataPoints] = useState<UnmappedDataPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Note: consolidatedIntegrationService doesn't have data point mapping methods yet
  // This would need to be implemented in the consolidated service
  const hubSpotConnector = new HubSpotDataConnector();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Note: These methods need to be implemented in consolidatedIntegrationService
      // For now, we'll set empty data to prevent errors
      setMappingReport(null);
      setUnmappedDataPoints(null);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data point mappings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncHubSpotData = async () => {
    try {
      setLoading(true);
      
      // Initialize HubSpot connector
      const initResult = await hubSpotConnector.initialize(user!.id);
      if (!initResult.success) {
        toast({
          title: 'HubSpot Not Connected',
          description: initResult.error || 'Please connect your HubSpot account first',
          variant: 'destructive',
        });
        return;
      }

      // Sync data points
      const syncResult = await hubSpotConnector.syncDataPoints(user!.id);
      if (syncResult.success) {
        toast({
          title: 'Success',
          description: 'HubSpot data synced successfully!',
          variant: 'default',
        });
        
        // Reload data to show updated metrics
        await loadData();
      } else {
        toast({
          title: 'Sync Failed',
          description: syncResult.error || 'Failed to sync HubSpot data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync HubSpot data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBusinessValueColor = (value: string) => {
    switch (value) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (hasData: boolean) => {
    return hasData ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Point Mapping</h1>
          <p className="text-muted-foreground">
            Manage your business data points and integration mappings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncHubSpotData} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Sync HubSpot
          </Button>
          <Button onClick={loadData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappingReport?.totalDataPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available for mapping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappingReport?.coveragePercentage.toFixed(1) || 0}%</div>
            <Progress value={mappingReport?.coveragePercentage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {mappingReport?.dataPointsWithData || 0} of {mappingReport?.totalDataPoints || 0} mapped
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value Points</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappingReport?.highValueDataPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Critical business metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmapped Points</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unmappedDataPoints?.totalUnmapped || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mappings">Current Mappings</TabsTrigger>
          <TabsTrigger value="unmapped">Unmapped Points</TabsTrigger>
          <TabsTrigger value="issues">Issues & Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Coverage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Data Coverage by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mappingReport?.mappings.reduce((acc, mapping) => {
                  acc[mapping.category] = (acc[mapping.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>) && 
                Object.entries(mappingReport.mappings.reduce((acc, mapping) => {
                  acc[mapping.category] = (acc[mapping.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between py-2">
                    <span className="capitalize">{category}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Business Value Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Business Value Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>High Value</span>
                    <Badge className={getBusinessValueColor('high')}>
                      {mappingReport?.highValueDataPoints || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium Value</span>
                    <Badge className={getBusinessValueColor('medium')}>
                      {mappingReport?.mediumValueDataPoints || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Low Value</span>
                    <Badge className={getBusinessValueColor('low')}>
                      {mappingReport?.lowValueDataPoints || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Current Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Data Point Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappingReport?.mappings.map((mapping) => (
                  <div key={mapping.dataPointId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(mapping.hasData)}
                      <div>
                        <h4 className="font-medium">{mapping.dataPointName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {mapping.integrationName} • {mapping.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getBusinessValueColor(mapping.businessValue)}>
                        {mapping.businessValue}
                      </Badge>
                      <Badge variant={mapping.hasData ? "default" : "secondary"}>
                        {mapping.hasData ? `${mapping.dataCount} records` : 'No data'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unmapped Points Tab */}
        <TabsContent value="unmapped" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unmapped Data Points</CardTitle>
              <p className="text-sm text-muted-foreground">
                These data points are available but not yet connected to your integrations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unmappedDataPoints?.unmappedDataPoints.map((dataPoint) => (
                  <div key={dataPoint.dataPointId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{dataPoint.dataPointName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dataPoint.integrationName} • {dataPoint.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getBusinessValueColor(dataPoint.businessValue)}>
                        {dataPoint.businessValue}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Map Data Point
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issues & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappingReport?.issues.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No issues detected. Your data point mappings are in good shape!
                    </AlertDescription>
                  </Alert>
                ) : (
                  mappingReport?.issues.map((issue, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataPointMappingDashboard;
