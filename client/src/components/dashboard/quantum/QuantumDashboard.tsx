import React from 'react';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useQuantumDashboard } from '@/hooks/dashboard/useQuantumDashboard';
import { DashboardHeader } from './DashboardHeader';
import { BusinessHealthCard } from './BusinessHealthCard';
import { StageIndicatorCard } from './StageIndicatorCard';
import { BrainTicketFeed } from './BrainTicketFeed';
import { ActionableInsights } from './ActionableInsights';
import { PlaybookRecommendations } from './PlaybookRecommendations';
import { AIAssistantCard } from './AIAssistantCard';
import { AvailableJourneys } from './AvailableJourneys';

interface QuantumDashboardProps {
  className?: string;
}

export function QuantumDashboard({ className }: QuantumDashboardProps) {
  const { profile } = useUserProfile();
  const {
    overallHealth,
    lastLoginDelta,
    maturityLevel,
    brainTickets,
    playbookRecommendations,
    refreshing,
    error,
    refreshDashboard,
    hasCriticalAlerts,
    hasHighPriorityItems,
  } = useQuantumDashboard();

  const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={refreshDashboard}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <DashboardHeader 
        displayName={displayName}
        onRefresh={refreshDashboard}
        refreshing={refreshing}
      />

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BusinessHealthCard 
          overallHealth={overallHealth}
          lastLoginDelta={lastLoginDelta}
        />
        <StageIndicatorCard 
          maturityLevel={maturityLevel}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-2 space-y-6">
          <ActionableInsights 
            hasCriticalAlerts={hasCriticalAlerts}
            hasHighPriorityItems={hasHighPriorityItems}
          />
          
          <BrainTicketFeed 
            brainTickets={brainTickets}
          />
          
          <PlaybookRecommendations 
            playbookRecommendations={playbookRecommendations}
          />
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <AIAssistantCard />
          
          <AvailableJourneys />
        </div>
      </div>
    </div>
  );
}
