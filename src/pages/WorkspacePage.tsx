import React, { useRef } from 'react';
import { Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PersonalMemoryCapture } from '@/components/ai/PersonalMemoryCapture';
import { ThoughtDashboard } from '@/components/thoughts/ThoughtDashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarOverview } from '@/components/workspace/CalendarOverview';
import type { ThoughtDashboardHandle } from '@/components/thoughts/ThoughtDashboard';
import { ExecutiveAssistantWidget } from '@/components/workspace/ExecutiveAssistantWidget';

/**
 * WorkspacePage -> Second Brain
 * 
 * This page is being repurposed to serve as the "Second Brain" interface,
 * combining thought capture and a dashboard for viewing and managing those thoughts.
 */
const WorkspacePage: React.FC = () => {
  const dashboardRef = useRef<ThoughtDashboardHandle>(null);

  const handleThoughtSaved = () => {
    dashboardRef.current?.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Workspace"
        description="Capture, connect, and expand on your ideas. A personalised hub powered by AI."
        icon={<Brain className="w-6 h-6 text-primary" />}
      />

      <Tabs defaultValue="capture" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="capture" className="mt-4">
          <PersonalMemoryCapture 
            currentContext={{
              department: 'General',
              page: 'My Workspace',
            }}
            onThoughtSaved={handleThoughtSaved}
          />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-4">
          <ThoughtDashboard ref={dashboardRef} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <CalendarOverview />
        </TabsContent>
      </Tabs>

      <ExecutiveAssistantWidget />
    </div>
  );
};

export default WorkspacePage; 