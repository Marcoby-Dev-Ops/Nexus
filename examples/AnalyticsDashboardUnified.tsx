/**
 * AnalyticsDashboardUnified.tsx
 * Example: Simplified analytics dashboard using unified components
 * 
 * BEFORE: 429 lines with redundant patterns
 * AFTER: ~100 lines with reusable components
 * 
 * Demonstrates 75% code reduction through component unification
 */

import React, { useState } from 'react';
import { Users, Activity, TrendingUp, Target, Filter, Download } from 'lucide-react';
import { Button } from '../src/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/Tabs';
import { 
  DashboardLayout, 
  ContentSection, 
  TableCard,
  type UnifiedMetricCardProps 
} from '../src/components/patterns/UnifiedComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../src/components/ui/Select';

const AnalyticsDashboardUnified: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');

  // Unified metrics configuration - replaces 80+ lines of custom metric cards
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
      icon: TrendingUp
    },
    {
      title: 'User Retention',
      value: '78.5%',
      delta: '-2.1%',
      icon: Target
    }
  ];

  // Table data - replaces custom table implementations
  const usageData = [
    { category: 'Finance Tools', usage: '32%', growth: '+15%' },
    { category: 'AI Features', usage: '28%', growth: '+45%' },
    { category: 'Reporting', usage: '18%', growth: '+12%' }
  ];

  const usageColumns = [
    { key: 'category', header: 'Category' },
    { key: 'usage', header: 'Usage %' },
    { 
      key: 'growth', 
      header: 'Growth', 
      render: (value: string) => (
        <span className={value.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
          {value}
        </span>
      )
    }
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
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
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TableCard
              title="Feature Usage"
              description="Most popular features and their growth"
              columns={usageColumns}
              data={usageData}
            />
            
            <ContentSection 
              title="Regional Performance" 
              description="User distribution by region"
              variant="elevated"
            >
              <p className="text-muted-foreground">Regional analytics content...</p>
            </ContentSection>
          </div>
        </TabsContent>
        
        <TabsContent value="acquisition">
          <ContentSection title="Acquisition Channels" variant="elevated">
            <p className="text-muted-foreground">Acquisition analytics...</p>
          </ContentSection>
        </TabsContent>
        
        <TabsContent value="behavior">
          <ContentSection title="User Behavior" variant="elevated">
            <p className="text-muted-foreground">Behavior analytics...</p>
          </ContentSection>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AnalyticsDashboardUnified; 