import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Brain } from 'lucide-react';
import { AIInsightsWidget } from '@/components/workspace/widgets/AIInsightsWidget';
import { CalendarWidget } from '@/components/workspace/widgets/CalendarWidget';
import { TasksWidget } from '@/components/workspace/widgets/TasksWidget';
import { IdeasWidget } from '@/components/workspace/widgets/IdeasWidget';
import { RecentsWidget } from '@/components/workspace/widgets/RecentsWidget';
import { FavoritesWidget } from '@/components/workspace/widgets/FavoritesWidget';
import { QuickActionsWidget } from '@/components/workspace/widgets/QuickActionsWidget';
import { EmailWidget } from '@/components/workspace/widgets/EmailWidget';
import { ProactiveAlertsWidget } from '@/components/workspace/widgets/ProactiveAlertsWidget';

/**
 * WorkspacePage -> Second Brain
 * 
 * This page is being repurposed to serve as the "Second Brain" interface,
 * combining thought capture and a dashboard for viewing and managing those thoughts.
 */
const WorkspacePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="My Workspace"
        description="Your personal command center to think, see, and act."
        icon={<Brain className="w-6 h-6 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <AIInsightsWidget />
          <CalendarWidget />
          <TasksWidget />
          <IdeasWidget />
          <EmailWidget />
        </div>

        {/* Side Column */}
        <div className="lg:col-span-1 space-y-8">
          <ProactiveAlertsWidget />
          <QuickActionsWidget />
          <FavoritesWidget />
          <RecentsWidget />
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage; 