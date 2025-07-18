import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { modelManager } from '@/domains/ai/lib/modelManager';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { chartColors } from '@/shared/services/chartColors';

interface ModelReport {
  monthlyCost: number;
  modelPerformance: Record<string, {
    successRate: number;
    averageLatency: number;
    averageCost: number;
    errorCount: number;
  }>;
  suggestions: string[];
}

export const ModelManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<ModelReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchReport();
  }, [timeRange]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await modelManager.generateReport();
      setReport(data);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load model management data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCostEfficiency = () => {
    if (!report) return 0;
    const totalCost = report.monthlyCost;
    const totalSuccess = Object.values(report.modelPerformance).reduce(
      (sum, perf) => sum + (perf.successRate * 100),
      0
    );
    return totalSuccess / totalCost;
  };

  const getPerformanceData = () => {
    if (!report) return [];
    return Object.entries(report.modelPerformance).map(([model, perf]) => ({
      model,
      successRate: perf.successRate * 100,
      averageLatency: perf.averageLatency,
      averageCost: perf.averageCost,
      errorCount: perf.errorCount
    }));
  };

  const COLOR_PALETTE = chartColors.categorical;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Model Management</h1>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setTimeRange('day')}>
            Day
          </Button>
          <Button variant="outline" onClick={() => setTimeRange('week')}>
            Week
          </Button>
          <Button variant="outline" onClick={() => setTimeRange('month')}>
            Month
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report?.monthlyCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCostEfficiency().toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate per dollar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report ? Object.keys(report.modelPerformance).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report
                ? (
                    Object.values(report.modelPerformance).reduce(
                      (sum, perf) => sum + perf.errorCount,
                      0
                    ) /
                    Object.values(report.modelPerformance).length
                  ).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per model
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="successRate" fill={chartColors.primary} name="Success Rate (%)" />
                  <Bar dataKey="errorCount" fill={chartColors.warning} name="Error Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPerformanceData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="averageCost"
                    nameKey="model"
                  >
                    {getPerformanceData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latency Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="averageLatency"
                    stroke={chartColors.accent}
                    name="Average Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report?.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg flex items-start space-x-2"
                >
                  {suggestion.includes('budget') ? (
                    <DollarSign className="w-4 h-4 mt-1 text-warning" />
                  ) : suggestion.includes('error') ? (
                    <AlertCircle className="w-4 h-4 mt-1 text-destructive" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mt-1 text-success" />
                  )}
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 