import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Building2, 
  Zap, 
  Network, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface DashboardMetrics {
  totalUsers: number;
  totalTenants: number;
  activeIntegrations: number;
  monthlyRevenue: number;
  aiUsageCost: number;
  systemUptime: number;
  activeAlerts: number;
  userGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'tenant_created' | 'integration_connected' | 'payment_received' | 'alert_triggered';
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalTenants: 0,
    activeIntegrations: 0,
    monthlyRevenue: 0,
    aiUsageCost: 0,
    systemUptime: 99.9,
    activeAlerts: 0,
    userGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for now
      setMetrics({
        totalUsers: 1247,
        totalTenants: 89,
        activeIntegrations: 342,
        monthlyRevenue: 45600,
        aiUsageCost: 2340,
        systemUptime: 99.9,
        activeAlerts: 3,
        userGrowth: 12.5,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'user_signup',
          description: 'New user registered: john.doe@company.com',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'tenant_created',
          description: 'New tenant created: Acme Corporation',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '3',
          type: 'payment_received',
          description: 'Payment received: $299.00 from TechStart Inc.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: '4',
          type: 'alert_triggered',
          description: 'High AI usage detected for tenant: DataCorp',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          severity: 'medium',
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <Users className="w-4 h-4" />;
      case 'tenant_created':
        return <Building2 className="w-4 h-4" />;
      case 'integration_connected':
        return <Network className="w-4 h-4" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4" />;
      case 'alert_triggered':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup':
      case 'tenant_created':
      case 'payment_received':
        return 'text-green-600 bg-green-100';
      case 'alert_triggered':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of Nexus platform metrics and activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {metrics.userGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              {Math.abs(metrics.userGrowth)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalTenants)}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">AI Usage Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.aiUsageCost)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeIntegrations)}</div>
            <p className="text-xs text-muted-foreground">Connected services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform events and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                {activity.severity && (
                  <Badge variant={activity.severity === 'high' ? 'destructive' : 'secondary'}>
                    {activity.severity}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
