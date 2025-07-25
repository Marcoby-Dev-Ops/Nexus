import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { useAuth } from '@/hooks/index';
import { dataPointMappingService, type MappingReport } from '@/core/services/dataPointMappingService';
import { RefreshCw, AlertTriangle, CheckCircle, Database, TrendingUp } from 'lucide-react';

export const DataPointMappingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<MappingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMappingReport = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const mappingReport = await dataPointMappingService.generateMappingReport(user.id);
      setReport(mappingReport);
    } catch (err) {
      setError(err instanceof Error ? err.message: 'Failed to fetch mapping report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappingReport();
  }, [user?.id]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to view data point mappings.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading data point mappings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No mapping report available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Point Mapping Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor data point coverage and ensure all definitions have proper landing spots
          </p>
        </div>
        <Button onClick={fetchMappingReport} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalDataPoints}</div>
            <p className="text-xs text-muted-foreground">
              Across all integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.coveragePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {report.dataPointsWithData} of {report.totalDataPoints} have data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value Points</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.highValueDataPoints}</div>
            <p className="text-xs text-muted-foreground">
              Critical business data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Data</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.dataPointsWithoutData}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Data Coverage Progress</CardTitle>
          <CardDescription>
            Overall data point coverage across all integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Coverage</span>
              <span>{report.coveragePercentage}%</span>
            </div>
            <Progress value={report.coveragePercentage} className="w-full" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{report.dataPointsWithData} with data</span>
              <span>{report.dataPointsWithoutData} missing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Issues Found
            </CardTitle>
            <CardDescription>
              Data points that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                  <span>{issue}</span>
                </div>
              ))}
              {report.issues.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  ... and {report.issues.length - 10} more issues
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Data Point Details</CardTitle>
          <CardDescription>
            Detailed breakdown of data point mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.mappings.slice(0, 20).map((mapping) => (
              <div key={mapping.dataPointId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mapping.dataPointName}</span>
                    <Badge variant={mapping.hasData ? "default" : "secondary"}>
                      {mapping.hasData ? "Has Data" : "No Data"}
                    </Badge>
                    <Badge variant="outline">{mapping.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mapping.integrationName} • {mapping.businessValue} value
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {mapping.dataCount} records
                  </div>
                  {mapping.lastUpdate && (
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(mapping.lastUpdate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {report.mappings.length > 20 && (
              <p className="text-center text-sm text-muted-foreground">
                Showing first 20 of {report.mappings.length} data points
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 