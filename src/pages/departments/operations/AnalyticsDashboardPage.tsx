import React, { useState } from 'react';
import {
  BarChart,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Clock,
  RefreshCw,
  Zap,
  Target,
  Globe,
  Smartphone,
  Laptop
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Input } from '../../../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Separator } from '../../../components/ui/Separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

/**
 * AnalyticsDashboardPage - Comprehensive analytics dashboard for operations
 */
const AnalyticsDashboardPage: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Key performance metrics
  const performanceMetrics = [
    {
      id: 'users',
      title: 'Active Users',
      value: '24,892',
      change: '+12.3%',
      trend: 'up',
      icon: <Users className="h-4 w-4" />,
      color: 'text-primary'
    },
    {
      id: 'sessions',
      title: 'Total Sessions',
      value: '38,129',
      change: '+18.2%',
      trend: 'up',
      icon: <Activity className="h-4 w-4" />,
      color: 'text-success'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: '6.4%',
      change: '+1.2%',
      trend: 'up',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-secondary'
    },
    {
      id: 'retention',
      title: 'User Retention',
      value: '78.5%',
      change: '-2.1%',
      trend: 'down',
      icon: <Target className="h-4 w-4" />,
      color: 'text-amber-500'
    }
  ];

  // Usage patterns
  const usageData = [
    { category: 'Finance Tools', usage: 32, growth: 15 },
    { category: 'AI Features', usage: 28, growth: 45 },
    { category: 'Reporting', usage: 18, growth: 12 },
    { category: 'Dashboards', usage: 12, growth: 8 },
    { category: 'Integrations', usage: 10, growth: 22 }
  ];

  // User acquisition sources
  const acquisitionSources = [
    { source: 'Organic Search', percentage: 42, color: 'bg-primary' },
    { source: 'Direct', percentage: 24, color: 'bg-success' },
    { source: 'Referral', percentage: 18, color: 'bg-secondary' },
    { source: 'Social Media', percentage: 12, color: 'bg-pink-500' },
    { source: 'Paid Ads', percentage: 4, color: 'bg-amber-500' }
  ];

  // Device breakdown
  const deviceBreakdown = [
    { device: 'Desktop', percentage: 58, icon: <Laptop className="h-4 w-4" /> },
    { device: 'Mobile', percentage: 34, icon: <Smartphone className="h-4 w-4" /> },
    { device: 'Tablet', percentage: 8, icon: <Globe className="h-4 w-4" /> }
  ];

  // Regional performance
  const regionalData = [
    {
      region: 'North America',
      users: 12482,
      growth: '+14.3%',
      conversion: '7.2%',
      status: 'increasing'
    },
    {
      region: 'Europe',
      users: 7384,
      growth: '+9.7%',
      conversion: '6.1%',
      status: 'increasing'
    },
    {
      region: 'Asia Pacific',
      users: 3840,
      growth: '+22.5%',
      conversion: '5.9%',
      status: 'increasing'
    },
    {
      region: 'Latin America',
      users: 892,
      growth: '+18.3%',
      conversion: '4.8%',
      status: 'increasing'
    },
    {
      region: 'Middle East & Africa',
      users: 294,
      growth: '+32.1%',
      conversion: '3.9%',
      status: 'increasing'
    }
  ];

  // Format large numbers
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track performance, usage, and growth metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue={activeTimeframe} onValueChange={setActiveTimeframe}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Timeframe</SelectLabel>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map(metric => (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="font-medium">{metric.title}</div>
                    <div className={`p-2 rounded-full bg-${metric.color.split('-')[1]}-500/10 ${metric.color}`}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center pt-1">
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className={`h-4 w-4 mr-1 ${metric.id === 'retention' ? 'text-destructive' : 'text-success'}`} />
                    ) : (
                      <ArrowDownRight className={`h-4 w-4 mr-1 ${metric.id === 'retention' ? 'text-success' : 'text-destructive'}`} />
                    )}
                    <p className={`text-sm ${
                      (metric.trend === 'up' && metric.id !== 'retention') || (metric.trend === 'down' && metric.id === 'retention')
                        ? 'text-success'
                        : 'text-destructive'
                    }`}>
                      {metric.change} from previous {activeTimeframe}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Usage and Acquisition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-primary" />
                  Feature Usage
                </CardTitle>
                <CardDescription>
                  Most used features and their growth rates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {usageData.map((feature, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{feature.category}</div>
                      <div className="text-sm text-muted-foreground">
                        {feature.usage}% usage • <span className="text-success">+{feature.growth}% growth</span>
                      </div>
                    </div>
                    <Progress value={feature.usage} className="h-2 bg-muted" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('behavior')}>
                  View Detailed Usage Analytics
                </Button>
              </CardFooter>
            </Card>

            {/* Acquisition Sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-primary" />
                  Acquisition Sources
                </CardTitle>
                <CardDescription>
                  How users are finding and joining Nexus
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {acquisitionSources.map((source, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{source.source}</div>
                      <div className="text-sm text-muted-foreground">
                        {source.percentage}% of users
                      </div>
                    </div>
                    <Progress value={source.percentage} className={`h-2 ${source.color}`} />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('acquisition')}>
                  View Acquisition Details
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Regional Performance</CardTitle>
                <Button variant="outline" size="sm">View Map</Button>
              </div>
              <CardDescription>
                User distribution and performance by geographic region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">Region</th>
                      <th className="py-3 text-right font-medium">Users</th>
                      <th className="py-3 text-right font-medium">Growth</th>
                      <th className="py-3 text-right font-medium">Conversion</th>
                      <th className="py-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalData.map((region, index) => (
                      <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="py-3 text-left">{region.region}</td>
                        <td className="py-3 text-right">{formatNumber(region.users)}</td>
                        <td className="py-3 text-right text-success">{region.growth}</td>
                        <td className="py-3 text-right">{region.conversion}</td>
                        <td className="py-3 text-right">
                          <Badge className="bg-success">{region.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter Regions
              </Button>
              <Button onClick={() => setActiveTab('demographics')}>
                <Globe className="h-4 w-4 mr-2" />
                Demographic Details
              </Button>
            </CardFooter>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Breakdown</CardTitle>
              <CardDescription>
                User devices and platform distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex flex-col items-center justify-center text-center p-4 rounded-lg border">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                      {device.icon}
                    </div>
                    <div className="text-2xl font-bold mb-1">{device.percentage}%</div>
                    <div className="text-sm text-muted-foreground">{device.device}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Acquisition Tab */}
        <TabsContent value="acquisition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Acquisition</CardTitle>
              <CardDescription>
                Detailed breakdown of traffic sources and conversion paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Acquisition details would go here */}
              <div className="text-center py-12 text-muted-foreground">
                Detailed acquisition analytics would be displayed here, including traffic sources, 
                campaigns, and conversion funnel visualization.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Behavior</CardTitle>
              <CardDescription>
                How users interact with the platform and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Behavior details would go here */}
              <div className="text-center py-12 text-muted-foreground">
                Detailed behavior analytics would be displayed here, including user flows, 
                feature usage, session duration, and engagement metrics.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Demographics</CardTitle>
              <CardDescription>
                Detailed breakdown of user profiles and characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Demographics details would go here */}
              <div className="text-center py-12 text-muted-foreground">
                Detailed demographic analytics would be displayed here, including age, location, 
                organization size, industry, and user roles.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboardPage; 