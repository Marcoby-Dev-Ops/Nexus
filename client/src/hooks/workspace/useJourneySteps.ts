import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { unifiedPlaybookService } from '@/services/playbook/UnifiedPlaybookService';
import { logger } from '@/shared/utils/logger';

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
  icon: React.ReactNode;
  actionLink?: string;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  rewards?: string[];
}

export interface WorkspaceMission {
  id: string;
  title: string;
  description: string;
  category: 'journey' | 'daily' | 'weekly' | 'achievement';
  completed: boolean;
  progress: number;
  maxProgress: number;
  icon: React.ReactNode;
  actionLink?: string;
  rewards?: string[];
}

export const useJourneySteps = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [missions, setMissions] = useState<WorkspaceMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize journey steps based on onboarding completion
  const initializeJourneySteps = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Check onboarding completion status
      const onboardingStatus = await unifiedPlaybookService.getUserJourney(user.id, 'onboarding-v1');
      
      if (!onboardingStatus.success) {
        throw new Error('Failed to check onboarding status');
      }

      const { userProfileComplete, businessProfileComplete, requiredModulesComplete } = onboardingStatus.data || {};

      // Define journey steps with completion status based on onboarding
      const steps: JourneyStep[] = [
        {
          id: 'profile-setup',
          title: 'Complete Your Profile',
          description: 'Add your business information and preferences',
          completed: userProfileComplete,
          required: true,
          order: 1,
          icon: null, // Will be set by component
          actionLink: '/profile',
          estimatedTime: '5 min',
          difficulty: 'beginner',
          rewards: ['Profile Badge', 'Personalized Experience']
        },
        {
          id: 'first-integration',
          title: 'Connect Your First Tool',
          description: 'Integrate with your existing business tools',
          completed: requiredModulesComplete, // Based on integration setup in onboarding
          required: true,
          order: 2,
          icon: null,
          actionLink: '/integrations',
          estimatedTime: '10 min',
          difficulty: 'beginner',
          rewards: ['Integration Badge', 'Data Sync Enabled']
        },
        {
          id: 'business-assessment',
          title: 'Complete Business Assessment',
          description: 'Set up your business goals and success metrics',
          completed: businessProfileComplete,
          required: true,
          order: 3,
          icon: null,
          actionLink: '/assessment',
          estimatedTime: '15 min',
          difficulty: 'beginner',
          rewards: ['Assessment Badge', 'Business Intelligence']
        },
        {
          id: 'team-invite',
          title: 'Invite Your Team',
          description: 'Start collaborating with your team members',
          completed: false, // This is post-onboarding
          required: false,
          order: 4,
          icon: null,
          actionLink: '/team',
          estimatedTime: '5 min',
          difficulty: 'beginner',
          rewards: ['Team Badge', 'Collaboration Features']
        },
        {
          id: 'first-automation',
          title: 'Create Your First Automation',
          description: 'Set up automated workflows to save time',
          completed: false, // This is post-onboarding
          required: false,
          order: 5,
          icon: null,
          actionLink: '/automation',
          estimatedTime: '20 min',
          difficulty: 'intermediate',
          rewards: ['Automation Badge', 'Time Savings']
        },
        {
          id: 'analytics-setup',
          title: 'Configure Analytics',
          description: 'Set up tracking for your business metrics',
          completed: false, // This is post-onboarding
          required: false,
          order: 6,
          icon: null,
          actionLink: '/analytics',
          estimatedTime: '15 min',
          difficulty: 'intermediate',
          rewards: ['Analytics Badge', 'Business Insights']
        },
      ];

      setJourneySteps(steps);

      // Initialize missions (these are separate from journey steps)
      const initialMissions: WorkspaceMission[] = [
        {
          id: 'daily-checkin',
          title: 'Daily Check-in',
          description: 'Review your business health and priorities',
          category: 'daily',
          completed: false,
          progress: 0,
          maxProgress: 1,
          icon: null,
          actionLink: '/dashboard',
          rewards: ['Daily Streak', 'Consistency Bonus']
        },
        {
          id: 'weekly-review',
          title: 'Weekly Business Review',
          description: 'Analyze your week and plan ahead',
          category: 'weekly',
          completed: false,
          progress: 0,
          maxProgress: 1,
          icon: null,
          actionLink: '/analytics',
          rewards: ['Weekly Insights', 'Strategic Planning']
        },
        {
          id: 'ai-conversation',
          title: 'Have an AI Conversation',
          description: 'Chat with Nexus AI about your business',
          category: 'daily',
          completed: false,
          progress: 0,
          maxProgress: 1,
          icon: null,
          actionLink: '/chat',
          rewards: ['AI Badge', 'Business Guidance']
        },
        {
          id: 'integration-sync',
          title: 'Sync Your Integrations',
          description: 'Ensure all your data is up to date',
          category: 'weekly',
          completed: false,
          progress: 0,
          maxProgress: 1,
          icon: null,
          actionLink: '/integrations',
          rewards: ['Data Sync Badge', 'Accurate Insights']
        }
      ];

      setMissions(initialMissions);

    } catch (err) {
      logger.error('Error initializing journey steps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load journey steps');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load journey steps when user changes
  useEffect(() => {
    if (user?.id) {
      initializeJourneySteps();
    }
  }, [user?.id, initializeJourneySteps]);

  // Update journey step completion
  const updateJourneyStep = useCallback((stepId: string, completed: boolean) => {
    setJourneySteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, completed }
          : step
      )
    );
  }, []);

  // Update mission completion
  const updateMission = useCallback((missionId: string, completed: boolean, progress?: number) => {
    setMissions(prev => 
      prev.map(mission => 
        mission.id === missionId 
          ? { 
              ...mission, 
              completed, 
              progress: progress !== undefined ? progress : (completed ? mission.maxProgress : mission.progress)
            }
          : mission
      )
    );
  }, []);

  // Calculate progress
  const completedJourneySteps = journeySteps.filter(step => step.completed).length;
  const totalJourneySteps = journeySteps.length;
  const journeyProgress = totalJourneySteps > 0 ? (completedJourneySteps / totalJourneySteps) * 100 : 0;

  const completedMissions = missions.filter(mission => mission.completed).length;
  const totalMissions = missions.length;
  const missionProgress = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  return {
    journeySteps,
    missions,
    loading,
    error,
    journeyProgress,
    missionProgress,
    completedJourneySteps,
    totalJourneySteps,
    completedMissions,
    totalMissions,
    updateJourneyStep,
    updateMission,
    refresh: initializeJourneySteps
  };
};
