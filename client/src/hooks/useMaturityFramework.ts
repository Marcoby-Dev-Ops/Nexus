import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { 
  maturityFrameworkService, 
  type MaturityProfile, 
  type MaturityScore, 
  type MaturityRecommendation,
  type MaturityDomain,
  type MaturityLevelDefinition
} from '@/services/playbook/MaturityFrameworkService';
import { logger } from '@/shared/utils/logger';

export interface UseMaturityFrameworkReturn {
  // Profile data
  profile: MaturityProfile | null;
  loading: boolean;
  error: string | null;
  
  // Assessment functionality
  conductAssessment: (surveyResponses: Record<string, any>) => Promise<MaturityProfile>;
  refreshProfile: () => Promise<void>;
  
  // Domain and level information
  domains: MaturityDomain[];
  maturityLevels: MaturityLevelDefinition[];
  
  // Recommendations
  recommendations: MaturityRecommendation[];
  highPriorityRecommendations: MaturityRecommendation[];
  
  // Utility functions
  getDomainScore: (domainId: string) => MaturityScore | null;
  getOverallLevel: () => string;
  getOverallScore: () => number;
  getLevelColor: (level: number) => string;
  getLevelName: (level: number) => string;
  getPercentileText: (percentile: number) => string;
  getTrendIcon: (trend: 'improving' | 'declining' | 'stable') => string;
  getTrendColor: (trend: 'improving' | 'declining' | 'stable') => string;
}

export function useMaturityFramework(): UseMaturityFrameworkReturn {
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  
  const [profile, setProfile] = useState<MaturityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<MaturityDomain[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevelDefinition[]>([]);

  // Load domains and maturity levels on mount
  useEffect(() => {
    const loadFrameworkData = async () => {
      try {
        const domainsData = maturityFrameworkService.getMaturityDomains();
        const levelsData = maturityFrameworkService.getMaturityLevels();
        
        setDomains(domainsData);
        setMaturityLevels(levelsData);
      } catch (error) {
        logger.error('Error loading maturity framework data:', error);
        setError('Failed to load maturity framework data');
      }
    };

    loadFrameworkData();
  }, []);

  // Load user's maturity profile
  const loadProfile = useCallback(async () => {
    if (!user?.id || !userProfile?.company_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await maturityFrameworkService.getMaturityProfile(user.id, userProfile.company_id);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        // No profile exists yet - this is normal for new users
        setProfile(null);
      }
    } catch (error) {
      logger.error('Error loading maturity profile:', error);
      setError('Failed to load maturity profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile?.company_id]);

  // Load profile when user or company changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Conduct initial assessment
  const conductAssessment = useCallback(async (surveyResponses: Record<string, any>): Promise<MaturityProfile> => {
    if (!user?.id || !userProfile?.company_id) {
      throw new Error('User or company information not available');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await maturityFrameworkService.conductInitialAssessment(
        user.id,
        userProfile.company_id,
        surveyResponses
      );

      if (response.success && response.data) {
        setProfile(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to conduct assessment');
      }
    } catch (error) {
      logger.error('Error conducting maturity assessment:', error);
      setError(error instanceof Error ? error.message : 'Failed to conduct assessment');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile?.company_id]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Get domain score by ID
  const getDomainScore = useCallback((domainId: string): MaturityScore | null => {
    if (!profile?.domainScores) return null;
    return profile.domainScores.find(score => score.domainId === domainId) || null;
  }, [profile]);

  // Get overall level name
  const getOverallLevel = useCallback((): string => {
    if (!profile?.overallLevel) return 'Unknown';
    const level = maturityLevels.find(l => l.level === profile.overallLevel);
    return level?.name || 'Unknown';
  }, [profile?.overallLevel, maturityLevels]);

  // Get overall score
  const getOverallScore = useCallback((): number => {
    return profile?.overallScore || 0;
  }, [profile?.overallScore]);

  // Get level color for UI
  const getLevelColor = useCallback((level: number): string => {
    if (level >= 4) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    if (level >= 3) return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
    if (level >= 2) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
    if (level >= 1) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950';
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
  }, []);

  // Get level name
  const getLevelName = useCallback((level: number): string => {
    const levelDef = maturityLevels.find(l => l.level === level);
    return levelDef?.name || 'Unknown';
  }, [maturityLevels]);

  // Get percentile text
  const getPercentileText = useCallback((percentile: number): string => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  }, []);

  // Get trend icon
  const getTrendIcon = useCallback((trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  }, []);

  // Get trend color
  const getTrendColor = useCallback((trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }, []);

  // Filter recommendations
  const recommendations = profile?.recommendations || [];
  const highPriorityRecommendations = recommendations.filter(rec => rec.priority === 'high');

  return {
    // Profile data
    profile,
    loading,
    error,
    
    // Assessment functionality
    conductAssessment,
    refreshProfile,
    
    // Domain and level information
    domains,
    maturityLevels,
    
    // Recommendations
    recommendations,
    highPriorityRecommendations,
    
    // Utility functions
    getDomainScore,
    getOverallLevel,
    getOverallScore,
    getLevelColor,
    getLevelName,
    getPercentileText,
    getTrendIcon,
    getTrendColor
  };
}

// Mock data for development and testing
export const getMockMaturityProfile = (): MaturityProfile => {
  return {
    userId: 'mock-user-id',
    companyId: 'mock-company-id',
    overallScore: 2.8,
    overallLevel: 2,
    domainScores: [
      {
        domainId: 'sales',
        domainName: 'Sales',
        score: 2.5,
        level: 2,
        percentile: 65,
        trend: 'improving',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'lead-management',
            name: 'Lead Management',
            score: 2.0,
            level: 2,
            insights: ['Lead capture rate is 15% - industry average is 25%']
          },
          {
            id: 'pipeline-health',
            name: 'Pipeline Health',
            score: 2.8,
            level: 2,
            insights: ['25% of deals are stale - industry best practice is <10%']
          },
          {
            id: 'forecast-accuracy',
            name: 'Forecast Accuracy',
            score: 2.7,
            level: 2,
            insights: ['Forecast variance is 25% - target is <15%']
          }
        ],
        recommendations: []
      },
      {
        domainId: 'marketing',
        domainName: 'Marketing',
        score: 1.8,
        level: 1,
        percentile: 45,
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'campaign-tracking',
            name: 'Campaign Tracking',
            score: 1.5,
            level: 1,
            insights: ['No campaign attribution tracking in place']
          },
          {
            id: 'content-effectiveness',
            name: 'Content Effectiveness',
            score: 2.0,
            level: 2,
            insights: ['Content performance not analyzed regularly']
          },
          {
            id: 'lead-generation',
            name: 'Lead Generation',
            score: 2.0,
            level: 2,
            insights: ['Using 3 lead generation channels - can expand to 5+']
          }
        ],
        recommendations: []
      },
      {
        domainId: 'operations',
        domainName: 'Operations',
        score: 3.2,
        level: 3,
        percentile: 55,
        trend: 'improving',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'process-standardization',
            name: 'Process Standardization',
            score: 3.0,
            level: 3,
            insights: ['Core processes are documented but not consistently followed']
          },
          {
            id: 'workflow-automation',
            name: 'Workflow Automation',
            score: 2.5,
            level: 2,
            insights: ['30% of repetitive tasks automated - can increase to 60%']
          },
          {
            id: 'quality-control',
            name: 'Quality Control',
            score: 4.0,
            level: 4,
            insights: ['Quality metrics tracked and reviewed regularly']
          }
        ],
        recommendations: []
      },
      {
        domainId: 'finance',
        domainName: 'Finance',
        score: 2.0,
        level: 2,
        percentile: 40,
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'cashflow-management',
            name: 'Cashflow Management',
            score: 1.5,
            level: 1,
            insights: ['Can forecast cashflow 3 months ahead - target is 6+ months']
          },
          {
            id: 'expense-control',
            name: 'Expense Control',
            score: 2.5,
            level: 2,
            insights: ['Expenses tracked monthly - can improve to real-time']
          },
          {
            id: 'financial-reporting',
            name: 'Financial Reporting',
            score: 2.0,
            level: 2,
            insights: ['Financial reports reviewed monthly - can increase frequency']
          }
        ],
        recommendations: []
      },
      {
        domainId: 'leadership',
        domainName: 'Leadership & Strategy',
        score: 2.5,
        level: 2,
        percentile: 50,
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'goal-setting',
            name: 'Goal Setting',
            score: 2.0,
            level: 2,
            insights: ['No formal OKR framework in place']
          },
          {
            id: 'decision-making',
            name: 'Decision Making',
            score: 3.0,
            level: 3,
            insights: ['Strategic decisions made within days']
          },
          {
            id: 'strategic-alignment',
            name: 'Strategic Alignment',
            score: 2.5,
            level: 2,
            insights: ['Team alignment is 60% - target is 80%+']
          }
        ],
        recommendations: []
      },
      {
        domainId: 'people',
        domainName: 'People & Culture',
        score: 3.0,
        level: 3,
        percentile: 60,
        trend: 'improving',
        lastUpdated: new Date().toISOString(),
        subDimensionScores: [
          {
            id: 'role-clarity',
            name: 'Role Clarity',
            score: 3.5,
            level: 3,
            insights: ['Job descriptions are clear and up-to-date']
          },
          {
            id: 'onboarding',
            name: 'Onboarding',
            score: 2.5,
            level: 2,
            insights: ['Standardized onboarding process exists but can be improved']
          },
          {
            id: 'retention',
            name: 'Retention',
            score: 3.0,
            level: 3,
            insights: ['Employee retention rate is 75% - target is 80%+']
          }
        ],
        recommendations: []
      }
    ],
    recommendations: [
      {
        id: 'sales-1',
        priority: 'high',
        domain: 'sales',
        title: 'Implement Lead Qualification Process',
        context: 'Your sales process lacks structured lead qualification, leading to inefficient pipeline management.',
        action: 'Create a standardized lead qualification checklist and scoring system.',
        impact: 'Improve conversion rates by 20-30% and reduce time spent on unqualified leads.',
        effort: 'medium',
        estimatedTime: '2-3 days',
        nexusModule: 'sales-hub',
        automationTemplate: 'lead-qualification-workflow',
        successMetrics: ['Lead conversion rate', 'Sales cycle length', 'Pipeline velocity'],
        relatedRecommendations: []
      },
      {
        id: 'sales-2',
        priority: 'medium',
        domain: 'sales',
        title: 'Set Up Pipeline Hygiene Automation',
        context: 'Your pipeline has 25% stale deals - industry best practice is <10%.',
        action: 'Create automated alerts for deals idle >14 days and implement follow-up sequences.',
        impact: 'Reduce stale deals by 50% and improve forecast accuracy.',
        effort: 'low',
        estimatedTime: '1 day',
        nexusModule: 'sales-hub',
        automationTemplate: 'pipeline-hygiene-automation',
        successMetrics: ['Stale deals percentage', 'Deal velocity', 'Forecast accuracy'],
        relatedRecommendations: []
      },
      {
        id: 'marketing-1',
        priority: 'high',
        domain: 'marketing',
        title: 'Implement Campaign Attribution',
        context: 'You cannot track which campaigns generate which leads, making ROI optimization impossible.',
        action: 'Set up UTM tracking and lead source attribution in your CRM.',
        impact: 'Gain visibility into campaign performance and optimize marketing spend.',
        effort: 'medium',
        estimatedTime: '2-3 days',
        nexusModule: 'marketing-hub',
        automationTemplate: 'campaign-attribution-setup',
        successMetrics: ['Campaign ROI', 'Lead source quality', 'Marketing spend efficiency'],
        relatedRecommendations: []
      }
    ],
    lastAssessment: new Date().toISOString(),
    nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    improvementHistory: [],
    benchmarkData: {
      companySize: 'small',
      industry: 'technology',
      region: 'north_america',
      peerGroup: 'tech_smb',
      percentileRankings: {
        'sales': 65,
        'marketing': 45,
        'operations': 55,
        'finance': 40,
        'leadership': 50,
        'people': 60
      },
      topPerformers: [
        {
          domain: 'sales',
          averageScore: 4.2,
          bestPractices: ['Automated lead scoring', 'Pipeline hygiene automation', 'Forecast accuracy tracking'],
          commonTraits: ['Data-driven decisions', 'Regular pipeline reviews', 'Strong CRM adoption']
        }
      ]
    }
  };
};
