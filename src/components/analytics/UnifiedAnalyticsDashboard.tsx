import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { RefreshCw, Download, Filter } from 'lucide-react';

const UnifiedAnalyticsDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState('business-health');

  return (
    <div className="p-6 bg-background text-foreground">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Unified Analytics</h1>
          <p className="text-muted-foreground">Your business at a glance. Cross-platform insights powered by Nexus AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button><RefreshCw className="w-4 h-4 mr-2" /> Refresh Data</Button>
        </div>
      </header>

      <Tabs defaultValue={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business-health">Business Health</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Overview analytics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-health" className="space-y-6 mt-6">
          <div className="text-muted-foreground text-center py-8">
            Business Health Widget has been removed.
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Correlation data will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI-powered insights will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedAnalyticsDashboard; 