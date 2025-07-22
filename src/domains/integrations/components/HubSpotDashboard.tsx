/**
 * HubSpot Dashboard Component
 * 
 * Displays comprehensive HubSpot CRM metrics and business insights
 * Based on: https://developers.hubspot.com/docs/getting-started/what-to-build
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3,
  RefreshCw,
  Download,
  Activity,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '@/shared/stores/authStore';
import { callEdgeFunction } from '@/core/supabase';

interface HubSpotMetrics {
  success: boolean;
  metrics: {
    salesPipeline: {
      totalDeals: number;
      totalValue: number;
      averageDealSize: number;
      conversionRate: number;
      dealsByStage: Record<string, number>;
    };
    customerInsights: {
      totalContacts: number;
      totalCompanies: number;
      newContactsThisMonth: number;
      topIndustries: Array<{ industry: string; count: number }>;
    };
    revenueAnalytics: {
      totalRevenue: number;
      monthlyRecurringRevenue: number;
      averageCustomerValue: number;
      topCustomers: Array<{ name: string; value: number }>;
    };
  };
  data: {
    contactsCount: number;
    companiesCount: number;
    dealsCount: number;
    lastUpdated: string;
  };
}

interface HubSpotDashboardProps {
  className?: string;
}

export function HubSpotDashboard({ className }: HubSpotDashboardProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HubSpotMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await callEdgeFunction<HubSpotMetrics>('hubspot-metrics', {
        userId: user.id
      });

      if (result.success) {
        setMetrics(result);
      } else {
        setError('Failed to fetch HubSpot metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading HubSpot metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Activity className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Error Loading Metrics</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchMetrics} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">No HubSpot data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { salesPipeline, customerInsights, revenueAnalytics } = metrics.metrics;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HubSpot CRM Dashboard</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(metrics.data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(customerInsights.totalContacts)}</div>
            <p className="text-xs text-muted-foreground">
              +{customerInsights.newContactsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(customerInsights.totalCompanies)}</div>
            <p className="text-xs text-muted-foreground">
              Active companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesPipeline.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {salesPipeline.totalDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesPipeline.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Deal win rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>Pipeline distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(salesPipeline.dealsByStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{stage}</Badge>
                      <span className="text-sm font-medium">{count} deals</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((count / salesPipeline.totalDeals) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Deal Size</span>
                    <span className="font-medium">{formatCurrency(salesPipeline.averageDealSize)}</span>
                  </div>
                  <Progress value={(salesPipeline.averageDealSize / 100000) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Pipeline Value</span>
                    <span className="font-medium">{formatCurrency(salesPipeline.totalValue)}</span>
                  </div>
                  <Progress value={(salesPipeline.totalValue / 1000000) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Industries</CardTitle>
                <CardDescription>Companies by industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerInsights.topIndustries.map((industry, index) => (
                    <div key={industry.industry} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{industry.industry}</span>
                        <Badge variant="outline">{industry.count}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((industry.count / customerInsights.totalCompanies) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Growth</CardTitle>
                <CardDescription>New contacts this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    +{customerInsights.newContactsThisMonth}
                  </div>
                  <p className="text-sm text-muted-foreground">New contacts</p>
                  <div className="mt-4">
                    <Progress 
                      value={(customerInsights.newContactsThisMonth / Math.max(customerInsights.totalContacts, 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Financial performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueAnalytics.totalRevenue)}</span>
                  </div>
                  <Progress value={(revenueAnalytics.totalRevenue / 1000000) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Recurring Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueAnalytics.monthlyRecurringRevenue)}</span>
                  </div>
                  <Progress value={(revenueAnalytics.monthlyRecurringRevenue / 100000) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Customer Value</span>
                    <span className="font-medium">{formatCurrency(revenueAnalytics.averageCustomerValue)}</span>
                  </div>
                  <Progress value={(revenueAnalytics.averageCustomerValue / 10000) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest value customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueAnalytics.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{customer.name}</span>
                        {index < 3 && <Badge variant="default" className="text-xs">Top {index + 1}</Badge>}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(customer.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>HubSpot CRM data overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(metrics.data.contactsCount)}</div>
              <p className="text-sm text-muted-foreground">Contacts</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatNumber(metrics.data.companiesCount)}</div>
              <p className="text-sm text-muted-foreground">Companies</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatNumber(metrics.data.dealsCount)}</div>
              <p className="text-sm text-muted-foreground">Deals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 