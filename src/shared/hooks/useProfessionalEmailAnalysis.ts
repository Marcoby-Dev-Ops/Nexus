/**
 * Professional Email Analysis Hook
 * Automatically analyzes user's email domains and updates business health KPI
 * Pillar: 1,2 - Automated business health assessment
 */

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { domainAnalysisService } from '@/domains/services/domainAnalysisService';
import { logger } from '@/shared/lib/security/logger';

export interface ProfessionalEmailStatus {
  isAnalyzed: boolean;
  hasProfessionalEmail: boolean;
  customDomainCount: number;
  professionalScore: number;
  primaryDomain?: string;
  recommendations: string[];
  shouldShowUpsell: boolean;
  loading: boolean;
  error: string | null;
}

export const useProfessionalEmailAnalysis = (autoUpdate = true) => {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<ProfessionalEmailStatus>({
    isAnalyzed: false,
    hasProfessionalEmail: false,
    customDomainCount: 0,
    professionalScore: 0,
    recommendations: [],
    shouldShowUpsell: false,
    loading: false,
    error: null
  });

  const analyzeEmailDomains = async (userId?: string) => {
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) return;

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Analyze user's email domains
      const analysis = await domainAnalysisService.analyzeUserEmailDomains(effectiveUserId);
      
      // Get upsell recommendation
      const upsellResult = await domainAnalysisService.getMicrosoft365UpsellRecommendation(effectiveUserId);

      // Determine if user has professional email
      const hasProfessionalEmail = analysis.customDomainCount > 0 || 
                                   analysis.overallProfessionalScore >= 70;

             // Update the KPI automatically if enabled
       if (autoUpdate) {
         await domainAnalysisService.updateProfessionalEmailKPI(
           effectiveUserId, 
           user?.company_id || undefined
         );
       }

      setStatus({
        isAnalyzed: true,
        hasProfessionalEmail,
        customDomainCount: analysis.customDomainCount,
        professionalScore: analysis.overallProfessionalScore,
        primaryDomain: analysis.primaryDomain,
        recommendations: analysis.recommendations,
        shouldShowUpsell: upsellResult.shouldShowUpsell,
        loading: false,
        error: null
      });

      logger.info({ 
        userId: effectiveUserId,
        hasProfessionalEmail,
        customDomains: analysis.customDomainCount,
        professionalScore: analysis.overallProfessionalScore,
        shouldShowUpsell: upsellResult.shouldShowUpsell
      }, 'Professional email analysis completed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      logger.error({ error, userId: effectiveUserId }, 'Error analyzing professional email');
    }
  };

  // Auto-analyze on mount and when user changes
  useEffect(() => {
    if (user?.id && autoUpdate) {
      analyzeEmailDomains();
    }
  }, [user?.id, autoUpdate]);

  return {
    ...status,
    analyzeEmailDomains,
    refresh: () => analyzeEmailDomains()
  };
}; 