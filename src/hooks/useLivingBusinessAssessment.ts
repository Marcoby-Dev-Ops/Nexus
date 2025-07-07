/**
 * Living Business Assessment Hook
 * Comprehensive hook that provides business health data with peer comparisons,
 * trends, achievements, and benchmarking for motivation and continuous improvement
 */

import { useState, useEffect, useCallback } from 'react';
import { businessBenchmarkingService, type LivingAssessment } from '../lib/services/businessBenchmarkingService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/security/logger';

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

  const getBusinessProfile = useCallback(() => {
    // In a real app, this would come from user settings or profile data
    // For now, we'll use mock data based on common business types
    return {
      industry: 'Technology', // Could be derived from connected tools or user input
      size: 'Small Business', // Could be derived from employee count or revenue
      founded: '2023' // Could be from business registration data
    };
  }, []);

  // Fetch comprehensive living assessment
  const fetchAssessment = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const businessProfile = getBusinessProfile();
      const data = await businessBenchmarkingService.getLivingAssessment(user.id, businessProfile);
      
      setAssessment(data);
      setLastUpdated(new Date().toISOString());

      logger.info({ 
        currentScore: data.currentScore,
        rank: data.benchmarks.yourRank,
        percentile: data.benchmarks.percentile,
        achievements: data.achievements.length,
        similarBusinesses: data.peerComparison.similarBusinesses
      }, 'Fetched living business assessment');

    } catch (error: any) {
      logger.error({ error }, 'Failed to fetch living business assessment');
      setError(error.message || 'Failed to fetch business assessment');
    } finally {
      setLoading(false);
    }
  }, [user?.id, getBusinessProfile]);

  // Refresh assessment manually
  const refresh = useCallback(async () => {
    await fetchAssessment();
  }, [fetchAssessment]);

  // Initial fetch
  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // Auto-refresh every 2 minutes to keep assessment current
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssessment();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAssessment]);

  // Calculate derived values
  const isImproving = assessment?.trends.monthlyChange ? assessment.trends.monthlyChange > 0 : false;
  
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
    return assessment?.nextMilestones[0] || null;
  }, [assessment]);

  const getRecentAchievement = useCallback(() => {
    if (!assessment?.achievements.length) return null;
    
    // Return most recent achievement
    return assessment.achievements.sort((a, b) => 
      new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
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