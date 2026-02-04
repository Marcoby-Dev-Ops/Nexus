import React from 'react';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { AIUsageMonitoringDashboard } from '@/components/admin/AIUsageMonitoringDashboard';

export const AIUsageMonitoringPage: React.FC = () => {
  return (
    <PageLayout>
      <AIUsageMonitoringDashboard />
    </PageLayout>
  );
};
