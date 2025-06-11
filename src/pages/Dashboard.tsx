import React from 'react';
import { 
  BarChart2, 
  Users, 
  CreditCard, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Calendar,
  Lightbulb,
  Brain
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import BusinessHealthScore from '../components/dashboard/BusinessHealthScore';

/**
 * Dashboard - Overview page with key metrics and navigation
 */
const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your Nexus dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Business Health Score */}
      <BusinessHealthScore />

      {/* Overview & Additional KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center justify-center mx-auto">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +20.1%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center justify-center mx-auto">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +180.1%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center justify-center mx-auto">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +19%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive flex items-center justify-center mx-auto">
                <ArrowDownRight className="mr-1 h-4 w-4" />
                -201
              </span> from last month
            </p>
          </CardContent>
        </Card>
        {/* Ideas Created */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">Ideas Created</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">from last month</p>
          </CardContent>
        </Card>
        {/* AI Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-x-2 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" size="sm">Ask AI</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent activity across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[
              { title: 'New Sales Report Generated', time: '2 minutes ago', icon: <BarChart2 /> },
              { title: 'Meeting with Marketing Team', time: '1 hour ago', icon: <Users /> },
              { title: 'New Revenue Forecast', time: '3 hours ago', icon: <TrendingUp /> },
              { title: 'Updated Customer Contact Info', time: '5 hours ago', icon: <Users /> },
            ].map((activity, i) => (
              <div key={i} className="flex items-center">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  {activity.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 