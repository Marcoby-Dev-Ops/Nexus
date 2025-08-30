/**
 * Living Business Assessment Hook
 * Comprehensive hook that provides business health data with peer comparisons,
 * trends, achievements, and benchmarking for motivation and continuous improvement
 * Uses the updated BusinessBenchmarkingService with real database queries
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { businessBenchmarkingService, type LivingAssessment } from '@/services/business/businessBenchmarkingService';


interface UseLivingBusinessAssessmentResult {
  assessment: LivingAssessment | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isImproving: boolean;
  lastUpdated: string | null;
  motivationalMessage: string | null;
}

export function useLivingBusinessAssessment(): UseLivingBusinessAssessmentResult {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<LivingAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch comprehensive living assessment using the real service
  const fetchAssessment = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Use external user ID directly
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
      const internalUserId = userId;

      // Get business profile for the service
      const businessProfile = {
        industry: 'technology', // Default, will be overridden by service
        size: 'small',
        founded: '2020'
      };

      // Use the real businessBenchmarkingService with internal user ID
      const result = await businessBenchmarkingService.getLivingAssessment(internalUserId, businessProfile);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch business assessment');
      }

      setAssessment(result.data);
      setLastUpdated(result.data.lastUpdated);

      logger.info({ 
        currentScore: result.data.currentScore,
        rank: result.data.benchmarks.yourRank,
        percentile: result.data.benchmarks.percentile,
        achievements: result.data.achievements.length,
        similarBusinesses: result.data.peerComparison.similarBusinesses
      }, 'Fetched living business assessment from real service');

    } catch (error: any) {
      logger.error({ error }, 'Failed to fetch living business assessment');
      setError(error.message || 'Failed to fetch business assessment');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh assessment manually
  const refresh = useCallback(async () => {
    await fetchAssessment();
  }, [fetchAssessment]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchAssessment();
    }
  }, [user?.id]); // Remove fetchAssessment from dependencies

  // Auto-refresh - longer intervals in development
  useEffect(() => {
    if (!user?.id) return;
    
    const refreshInterval = process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min dev, 5min prod
    const interval = setInterval(() => {
      fetchAssessment();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [user?.id]); // Remove fetchAssessment from dependencies

  // Calculate derived values
  const isImproving = assessment?.trends.direction === 'up';
  
  const getMotivationalMessage = useCallback((): string | null => {
    if (!assessment) return null;

    const { currentScore, benchmarks, peerComparison } = assessment;

    // High performers
    if (currentScore >= 80) {
      return `🏆 Excellent! You're in the top ${100 - benchmarks.percentile}% of businesses on Nexus.`;
    }

    // Above average performers
    if (currentScore > benchmarks.peerAverage) {
      const ahead = peerComparison.scoreComparison.lower;
      return `🚀 Great job! You're ahead of ${ahead} similar businesses.`;
    }

    // Below average but improving
    if (isImproving) {
      return `📈 You're improving! Keep connecting data sources to boost your score.`;
    }

    // Need motivation
    if (currentScore < 30) {
      return `💪 Getting started is the hardest part. Connect just 2-3 data sources to see your score jump!`;
    }

    // General encouragement
    const behind = peerComparison.scoreComparison.higher;
    if (behind > 0) {
      return `🎯 You're ${Math.abs(currentScore - benchmarks.peerAverage)} points from the average. You've got this!`;
    }

    return `📊 Keep building your data connections to improve your business health score.`;
  }, [assessment, isImproving]);

  return {
    assessment,
    loading,
    error,
    refresh,
    isImproving,
    lastUpdated,
    motivationalMessage: getMotivationalMessage()
  };
}

/**
 * Quick Business Health Hook
 * Lightweight hook for components that just need basic health data
 */
export function useQuickBusinessHealth() {
  const { assessment, loading, error } = useLivingBusinessAssessment();

  return {
    score: assessment?.currentScore || 0,
    rank: assessment?.benchmarks.yourRank || 0,
    percentile: assessment?.benchmarks.percentile || 0,
    trend: assessment?.trends.monthlyChange || 0,
    connectedSources: assessment?.peerComparison.similarBusinesses || 0,
    loading,
    error
  };
}

/**
 * Business Motivation Hook
 * Hook focused on motivation and gamification elements
 */
export function useBusinessMotivation() {
  const { assessment, isImproving, motivationalMessage } = useLivingBusinessAssessment();

  const getNextMilestone = useCallback(() => {
    // Generate next milestones based on current assessment
    if (!assessment) return null;

    const { currentScore, achievements } = assessment;
    const hasIntegrationAchievement = achievements.some(a => a.category === 'integration');
    const hasProfileAchievement = achievements.some(a => a.category === 'profile');

    if (!hasIntegrationAchievement) {
      return {
        id: 'first-integration',
        title: 'Connect Your First Integration',
        description: 'Connect a data source to start building your business health score',
        targetScore: currentScore + 10,
        reward: 'Basic Analytics Dashboard'
      };
    }

    if (!hasProfileAchievement) {
      return {
        id: 'complete-profile',
        title: 'Complete Business Profile',
        description: 'Fill out your complete business profile for personalized insights',
        targetScore: currentScore + 20,
        reward: 'Personalized AI Recommendations'
      };
    }

    if (currentScore < 80) {
      return {
        id: 'reach-excellent',
        title: 'Reach Excellent Health',
        description: 'Achieve an 80+ business health score',
        targetScore: 80,
        reward: 'Premium Business Insights'
      };
    }

    return null;
  }, [assessment]);

  const getRecentAchievement = useCallback(() => {
    if (!assessment?.achievements.length) return null;
    
    // Return most recent achievement
    return assessment.achievements.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }, [assessment]);

  const getCompetitivePosition = useCallback(() => {
    if (!assessment) return null;

    const { benchmarks, peerComparison } = assessment;
    const ahead = peerComparison.scoreComparison.lower;
    const behind = peerComparison.scoreComparison.higher;

    return {
      rank: benchmarks.yourRank,
      percentile: benchmarks.percentile,
      ahead,
      behind,
      total: peerComparison.similarBusinesses
    };
  }, [assessment]);

  return {
    motivationalMessage,
    isImproving,
    nextMilestone: getNextMilestone(),
    recentAchievement: getRecentAchievement(),
    competitivePosition: getCompetitivePosition()
  };
} 
