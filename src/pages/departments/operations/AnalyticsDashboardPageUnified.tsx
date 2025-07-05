/**
 * AnalyticsDashboardPageUnified.tsx
 * Simplified analytics dashboard using unified components
 * 
 * BEFORE: 429 lines with redundant patterns
 * AFTER: ~100 lines with reusable components
 * 
 * Pillar: 1 (Efficient Automation) - Reduced maintenance overhead
 * Pillar: 5 (Speed & Performance) - Optimized bundle size
 */

import React, { useState } from 'react';
import { Users, Activity, TrendingUp, Target, Filter, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { 
  DashboardLayout, 
  ContentSection, 
  TableCard,
  type UnifiedMetricCardProps 
} from '../../../components/patterns/UnifiedComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

/**
 * AnalyticsDashboardPageUnified - Consolidated analytics dashboard
 */
const AnalyticsDashboardPageUnified: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Unified metrics configuration
  const performanceMetrics: UnifiedMetricCardProps[] = [
    {
      title: 'Active Users',
      value: '24,892',
      delta: '+12.3%',
      icon: Users,
      sparklineData: [20000, 21000, 22500, 24000, 24892]
    },
    {
      title: 'Total Sessions',
      value: '38,129',
      delta: '+18.2%',
      icon: Activity,
      sparklineData: [30000, 32000, 35000, 37000, 38129]
    },
    {
      title: 'Conversion Rate',
      value: '6.4%',
      delta: '+1.2%',
      icon: TrendingUp,
      sparklineData: [5.8, 6.0, 6.1, 6.2, 6.4]
    },
    {
      title: 'User Retention',
      value: '78.5%',
      delta: '-2.1%',
      icon: Target,
      sparklineData: [82, 81, 80, 79, 78.5]
    }
  ];

  // Usage data for table
  const usageData = [
    { category: 'Finance Tools', usage: '32%', growth: '+15%', trend: 'up' },
    { category: 'AI Features', usage: '28%', growth: '+45%', trend: 'up' },
    { category: 'Reporting', usage: '18%', growth: '+12%', trend: 'up' },
    { category: 'Dashboards', usage: '12%', growth: '+8%', trend: 'up' },
    { category: 'Integrations', usage: '10%', growth: '+22%', trend: 'up' }
  ];

  // Regional data for table
  const regionalData = [
    { region: 'North America', users: '12,482', growth: '+14.3%', conversion: '7.2%' },
    { region: 'Europe', users: '7,384', growth: '+9.7%', conversion: '6.1%' },
    { region: 'Asia Pacific', users: '3,840', growth: '+22.5%', conversion: '5.9%' },
    { region: 'Latin America', users: '892', growth: '+18.3%', conversion: '4.8%' },
    { region: 'Middle East & Africa', users: '294', growth: '+32.1%', conversion: '3.9%' }
  ];

  // Table column definitions
  const usageColumns = [
    { key: 'category', header: 'Category' },
    { key: 'usage', header: 'Usage %' },
    { key: 'growth', header: 'Growth', render: (value: string) => (
      <span className={value.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
        {value}
      </span>
    )}
  ];

  const regionalColumns = [
    { key: 'region', header: 'Region' },
    { key: 'users', header: 'Users' },
    { key: 'growth', header: 'Growth', render: (value: string) => (
      <span className="text-emerald-600">{value}</span>
    )},
    { key: 'conversion', header: 'Conversion' }
  ];

  return (
    <DashboardLayout
      header={{
        title: "Analytics Dashboard",
        subtitle: "Track performance, usage, and growth metrics",
        actions: (
          <div className="flex items-center gap-2">
            <Select defaultValue={activeTimeframe} onValueChange={setActiveTimeframe}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )
      }}
      metrics={{
        metrics: performanceMetrics,
        columns: 4
      }}
    >
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TableCard
              title="Feature Usage"
              description="Most popular features and their growth"
              columns={usageColumns}
              data={usageData}
            />
            
            <TableCard
              title="Regional Performance"
              description="User distribution and conversion by region"
              columns={regionalColumns}
              data={regionalData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="acquisition" className="space-y-6">
          <ContentSection 
            title="Acquisition Channels" 
            description="User acquisition sources and performance"
            variant="elevated"
          >
            <p className="text-muted-foreground">Acquisition analytics content...</p>
          </ContentSection>
        </TabsContent>
        
        <TabsContent value="behavior" className="space-y-6">
          <ContentSection 
            title="User Behavior" 
            description="User interaction patterns and engagement"
            variant="elevated"
          >
            <p className="text-muted-foreground">Behavior analytics content...</p>
          </ContentSection>
        </TabsContent>
        
        <TabsContent value="demographics" className="space-y-6">
          <ContentSection 
            title="Demographics" 
            description="User demographics and device breakdown"
            variant="elevated"
          >
            <p className="text-muted-foreground">Demographics analytics content...</p>
          </ContentSection>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AnalyticsDashboardPageUnified; 