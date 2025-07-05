import React from 'react';
import { Brain } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThoughtDashboard } from '@/components/thoughts/ThoughtDashboard';
import { PersonalMemoryCapture } from '@/components/ai/PersonalMemoryCapture';
import { ActionCards } from '@/components/thoughts/ActionCards';

/**
 * WorkspacePage -> Second Brain
 * 
 * This page is being repurposed to serve as the "Second Brain" interface,
 * combining thought capture and a dashboard for viewing and managing those thoughts.
 */
const WorkspacePage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="My Workspace"
        description="Capture, clarify, and implement your ideas. Turn thoughts into actionable projects and tasks."
        icon={<Brain className="w-6 h-6 text-primary" />}
      />

      {/* AI Action Cards */}
      <ActionCards />

      {/* Personal Memory Capture */}
      <PersonalMemoryCapture />

      {/* Thought Dashboard */}
      <ThoughtDashboard />
    </div>
  );
};

export default WorkspacePage; 