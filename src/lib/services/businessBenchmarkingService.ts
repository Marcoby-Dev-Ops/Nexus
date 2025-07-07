/**
 * Business Benchmarking Service
 * Provides peer comparison and industry insights for living business assessment
 * Helps users understand their performance relative to similar businesses
 */

import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { dataConnectivityHealthService } from './dataConnectivityHealthService';

export interface BusinessBenchmark {
  industryAverage: number;
  peerAverage: number;
  topPerformers: number;
  yourRank: number;
  totalBusinesses: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface IndustryInsight {
  industry: string;
  averageScore: number;
  topCategories: string[];
  commonConnections: string[];
  growthOpportunities: string[];
}

export interface PeerComparison {
  similarBusinesses: number;
  scoreComparison: {
    higher: number;
    lower: number;
    similar: number;
  };
  categoryComparisons: {
    [category: string]: {
      yourScore: number;
      peerAverage: number;
      performance: 'above' | 'below' | 'average';
    };
  };
  recommendations: string[];
}

export interface TrendData {
  scoreHistory: Array<{
    date: string;
    score: number;
    connectedSources: number;
    verifiedSources: number;
  }>;
  weeklyChange: number;
  monthlyChange: number;
  quarterlyChange: number;
  improvementRate: number;
}

export interface LivingAssessment {
  currentScore: number;
  benchmarks: BusinessBenchmark;
  trends: TrendData;
  peerComparison: PeerComparison;
  industryInsights: IndustryInsight;
  achievements: Array<{
    title: string;
    description: string;
    unlockedAt: string;
    category: string;
  }>;
  nextMilestones: Array<{
    title: string;
    description: string;
    pointsNeeded: number;
    estimatedTime: string;
  }>;
}

export class BusinessBenchmarkingService {
  private static instance: BusinessBenchmarkingService;
  
  public static getInstance(): BusinessBenchmarkingService {
    if (!BusinessBenchmarkingService.instance) {
      BusinessBenchmarkingService.instance = new BusinessBenchmarkingService();
    }
    return BusinessBenchmarkingService.instance;
  }

  /**
   * Get complete living assessment for a business
   */
  async getLivingAssessment(userId: string, businessProfile?: any): Promise<LivingAssessment> {
    try {
      // Get current connectivity health
      const healthData = await dataConnectivityHealthService.getConnectivityStatus(userId);
      
      // Get all assessment components in parallel
      const [
        benchmarks,
        trends,
        peerComparison,
        industryInsights,
        achievements,
        nextMilestones
      ] = await Promise.all([
        this.getBenchmarks(userId, healthData.overallScore, businessProfile),
        this.getTrendData(userId),
        this.getPeerComparison(userId, healthData, businessProfile),
        this.getIndustryInsights(businessProfile?.industry),
        this.getAchievements(userId, healthData),
        this.getNextMilestones(userId, healthData)
      ]);

      return {
        currentScore: healthData.overallScore,
        benchmarks,
        trends,
        peerComparison,
        industryInsights,
        achievements,
        nextMilestones
      };

    } catch (error) {
      logger.error('Failed to get living assessment', error);
      throw error;
    }
  }

  /**
   * Get benchmark data comparing user to peers and industry
   */
  private async getBenchmarks(userId: string, currentScore: number, businessProfile?: any): Promise<BusinessBenchmark> {
    try {
      // Get anonymized scores from other users
      const { data: scores, error } = await supabase
        .rpc('get_anonymized_business_scores', {
          user_industry: businessProfile?.industry,
          user_size: businessProfile?.size,
          exclude_user: userId
        });

      if (error) throw error;

      const allScores = scores || [];
      const industryScores = allScores.filter((s: any) => s.industry === businessProfile?.industry);
      
      // Calculate benchmarks
      const industryAverage = industryScores.length > 0 
        ? Math.round(industryScores.reduce((sum: number, s: any) => sum + s.score, 0) / industryScores.length)
        : 0;

      const peerAverage = allScores.length > 0
        ? Math.round(allScores.reduce((sum: number, s: any) => sum + s.score, 0) / allScores.length)
        : 0;

      const topPerformers = allScores.length > 0
        ? Math.round(allScores.sort((a: any, b: any) => b.score - a.score).slice(0, Math.ceil(allScores.length * 0.1))[0]?.score || 0)
        : 0;

      const higherScores = allScores.filter((s: any) => s.score > currentScore).length;
      const yourRank = higherScores + 1;
      const totalBusinesses = allScores.length + 1;
      const percentile = Math.round(((totalBusinesses - yourRank) / totalBusinesses) * 100);

      // Determine trend (simplified - would use historical data)
      const trend: 'improving' | 'declining' | 'stable' = currentScore > peerAverage ? 'improving' : 'stable';

      return {
        industryAverage,
        peerAverage,
        topPerformers,
        yourRank,
        totalBusinesses,
        percentile,
        trend
      };

    } catch (error) {
      logger.error('Failed to get benchmarks', error);
      // Return default benchmarks if query fails
      return {
        industryAverage: 45,
        peerAverage: 52,
        topPerformers: 85,
        yourRank: 1,
        totalBusinesses: 1,
        percentile: 100,
        trend: 'stable'
      };
    }
  }

  /**
   * Get trend data showing business health over time
   */
  private async getTrendData(userId: string): Promise<TrendData> {
    try {
      // Get historical business health scores
      const { data: history, error } = await supabase
        .from('business_health_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const scoreHistory = (history || []).map(h => ({
        date: h.created_at,
        score: h.overall_score,
        connectedSources: h.connected_sources,
        verifiedSources: h.verified_sources
      }));

      // Calculate changes
      const weeklyChange = this.calculateChange(scoreHistory, 7);
      const monthlyChange = this.calculateChange(scoreHistory, 30);
      const quarterlyChange = this.calculateChange(scoreHistory, 90);
      
      const improvementRate = scoreHistory.length > 1 
        ? Math.round(((scoreHistory[0].score - scoreHistory[scoreHistory.length - 1].score) / scoreHistory.length) * 100) / 100
        : 0;

      return {
        scoreHistory,
        weeklyChange,
        monthlyChange,
        quarterlyChange,
        improvementRate
      };

    } catch (error) {
      logger.error('Failed to get trend data', error);
      return {
        scoreHistory: [],
        weeklyChange: 0,
        monthlyChange: 0,
        quarterlyChange: 0,
        improvementRate: 0
      };
    }
  }

  /**
   * Get peer comparison data
   */
  private async getPeerComparison(userId: string, healthData: any, businessProfile?: any): Promise<PeerComparison> {
    try {
      // Get similar businesses (same industry, similar size)
      const { data: peers, error } = await supabase
        .rpc('get_peer_businesses', {
          user_industry: businessProfile?.industry,
          user_size: businessProfile?.size,
          exclude_user: userId
        });

      if (error) throw error;

      const similarBusinesses = peers?.length || 0;
      const yourScore = healthData.overallScore;

      // Calculate score comparison
      const higher = peers?.filter((p: any) => p.overall_score > yourScore).length || 0;
      const lower = peers?.filter((p: any) => p.overall_score < yourScore).length || 0;
      const similar = similarBusinesses - higher - lower;

      // Calculate category comparisons
      const categoryComparisons: any = {};
      Object.entries(healthData.categoryBreakdown).forEach(([category, data]: [string, any]) => {
        const peerCategoryScores = peers?.map((p: any) => p.category_scores[category]).filter(Boolean) || [];
        const peerAverage = peerCategoryScores.length > 0 
          ? peerCategoryScores.reduce((sum: number, score: number) => sum + score, 0) / peerCategoryScores.length
          : 0;

        categoryComparisons[category] = {
          yourScore: data.percentage,
          peerAverage: Math.round(peerAverage),
          performance: data.percentage > peerAverage + 10 ? 'above' : 
                      data.percentage < peerAverage - 10 ? 'below' : 'average'
        };
      });

      // Generate recommendations
      const recommendations = this.generatePeerRecommendations(categoryComparisons, yourScore, peers);

      return {
        similarBusinesses,
        scoreComparison: { higher, lower, similar },
        categoryComparisons,
        recommendations
      };

    } catch (error) {
      logger.error('Failed to get peer comparison', error);
      return {
        similarBusinesses: 0,
        scoreComparison: { higher: 0, lower: 0, similar: 0 },
        categoryComparisons: {},
        recommendations: []
      };
    }
  }

  /**
   * Get industry insights and trends
   */
  private async getIndustryInsights(industry?: string): Promise<IndustryInsight> {
    if (!industry) {
      return {
        industry: 'General',
        averageScore: 52,
        topCategories: ['Communications', 'Sales'],
        commonConnections: ['Gmail', 'HubSpot CRM'],
        growthOpportunities: ['Connect financial data', 'Verify business profile']
      };
    }

    try {
      const { data: insights, error } = await supabase
        .rpc('get_industry_insights', { industry_name: industry });

      if (error) throw error;

      return insights || {
        industry,
        averageScore: 52,
        topCategories: ['Communications', 'Sales'],
        commonConnections: ['Gmail', 'HubSpot CRM'],
        growthOpportunities: ['Connect financial data', 'Verify business profile']
      };

    } catch (error) {
      logger.error('Failed to get industry insights', error);
      return {
        industry,
        averageScore: 52,
        topCategories: ['Communications', 'Sales'],
        commonConnections: ['Gmail', 'HubSpot CRM'],
        growthOpportunities: ['Connect financial data', 'Verify business profile']
      };
    }
  }

  /**
   * Get user achievements
   */
  private async getAchievements(userId: string, healthData: any): Promise<Array<any>> {
    const achievements = [];

    // First connection achievement
    if (healthData.connectedSources.length >= 1) {
      achievements.push({
        title: 'First Connection',
        description: 'Connected your first data source to Nexus',
        unlockedAt: new Date().toISOString(),
        category: 'Getting Started'
      });
    }

    // Verification achievements
    const verifiedCount = healthData.connectedSources.filter((s: any) => s.isVerified).length;
    if (verifiedCount >= 1) {
      achievements.push({
        title: 'Verified Business',
        description: 'Verified your first business data source',
        unlockedAt: new Date().toISOString(),
        category: 'Verification'
      });
    }

    // Score milestones
    if (healthData.overallScore >= 25) {
      achievements.push({
        title: 'Quarter Health',
        description: 'Reached 25% business health score',
        unlockedAt: new Date().toISOString(),
        category: 'Milestones'
      });
    }

    if (healthData.overallScore >= 50) {
      achievements.push({
        title: 'Half Health',
        description: 'Reached 50% business health score',
        unlockedAt: new Date().toISOString(),
        category: 'Milestones'
      });
    }

    // Category achievements
    Object.entries(healthData.categoryBreakdown).forEach(([category, data]: [string, any]) => {
      if (data.percentage >= 75) {
        achievements.push({
          title: `${category} Master`,
          description: `Achieved 75% connectivity in ${category}`,
          unlockedAt: new Date().toISOString(),
          category: 'Category Excellence'
        });
      }
    });

    return achievements;
  }

  /**
   * Get next milestones for user motivation
   */
  private async getNextMilestones(userId: string, healthData: any): Promise<Array<any>> {
    const milestones = [];
    const currentScore = healthData.overallScore;

    // Score-based milestones
    if (currentScore < 25) {
      milestones.push({
        title: 'Quarter Health',
        description: 'Reach 25% business health score',
        pointsNeeded: Math.ceil((25 - currentScore) * healthData.maxPossibleScore / 100),
        estimatedTime: '2-3 connections'
      });
    } else if (currentScore < 50) {
      milestones.push({
        title: 'Half Health',
        description: 'Reach 50% business health score',
        pointsNeeded: Math.ceil((50 - currentScore) * healthData.maxPossibleScore / 100),
        estimatedTime: '3-4 connections'
      });
    } else if (currentScore < 75) {
      milestones.push({
        title: 'Strong Health',
        description: 'Reach 75% business health score',
        pointsNeeded: Math.ceil((75 - currentScore) * healthData.maxPossibleScore / 100),
        estimatedTime: '4-5 connections'
      });
    }

    // Verification milestones
    const verifiedCount = healthData.connectedSources.filter((s: any) => s.isVerified).length;
    if (verifiedCount < 3) {
      milestones.push({
        title: 'Verification Expert',
        description: 'Verify 3 business data sources',
        pointsNeeded: 0,
        estimatedTime: 'Verify existing connections'
      });
    }

    // Category milestones
    Object.entries(healthData.categoryBreakdown).forEach(([category, data]: [string, any]) => {
      if (data.percentage < 50) {
        milestones.push({
          title: `${category} Foundation`,
          description: `Reach 50% connectivity in ${category}`,
          pointsNeeded: Math.ceil((50 - data.percentage) * data.maxScore / 100),
          estimatedTime: '1-2 connections'
        });
      }
    });

    return milestones.slice(0, 3); // Return top 3 milestones
  }

  /**
   * Helper methods
   */
  private calculateChange(scoreHistory: any[], days: number): number {
    if (scoreHistory.length < 2) return 0;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentScores = scoreHistory.filter(s => new Date(s.date) >= cutoffDate);
    if (recentScores.length < 2) return 0;
    
    const latest = recentScores[0].score;
    const oldest = recentScores[recentScores.length - 1].score;
    
    return Math.round((latest - oldest) * 100) / 100;
  }

  private generatePeerRecommendations(categoryComparisons: any, yourScore: number, peers: any[]): string[] {
    const recommendations = [];
    
    // Find categories where user is below peer average
    Object.entries(categoryComparisons).forEach(([category, comp]: [string, any]) => {
      if (comp.performance === 'below') {
        recommendations.push(`Improve ${category} connections - you're ${Math.round(comp.peerAverage - comp.yourScore)}% below similar businesses`);
      }
    });

    // Overall score recommendations
    if (peers && peers.length > 0) {
      const peerAverage = peers.reduce((sum: number, p: any) => sum + p.overall_score, 0) / peers.length;
      if (yourScore < peerAverage - 10) {
        recommendations.push(`Connect more data sources - similar businesses average ${Math.round(peerAverage)}% health score`);
      }
    }

    return recommendations.slice(0, 3);
  }
}

export const businessBenchmarkingService = BusinessBenchmarkingService.getInstance(); 