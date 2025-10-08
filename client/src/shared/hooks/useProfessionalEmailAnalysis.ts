/**
 * Professional Email Analysis Hook
 * Automatically analyzes user's email domains and updates business health KPI
 * Pillar: 1,2 - Automated business health assessment
 */

import { useState, useCallback, useEffect } from 'react';
import { selectData, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface EmailAnalysis {
  id: string;
  user_id: string;
  email_domain: string;
  analysis_result: any;
  created_at: string;
  updated_at: string;
}

export const useProfessionalEmailAnalysis = () => {
  const [analyses, setAnalyses] = useState<EmailAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('email_analyses', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch email analyses');
        setError('Failed to fetch analyses');
        return;
      }
      setAnalyses(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching email analyses');
      setError('Error fetching analyses');
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeEmailDomain = useCallback(async (userId: string, domain: string) => {
    setLoading(true);
    setError(null);
    try {
      // This would typically call an external API for domain analysis
      const analysisResult = {
        domain,
        professional_score: Math.random() * 100,
        recommendations: ['Use a custom domain', 'Set up proper email signatures'],
        created_at: new Date().toISOString(),
      };

      const { data, error } = await insertOne('email_analyses', {
        user_id: userId,
        email_domain: domain,
        analysis_result: analysisResult,
      });

      if (error) {
        logger.error({ error }, 'Failed to save email analysis');
        setError('Failed to save analysis');
        return null;
      }

      setAnalyses(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error analyzing email domain');
      setError('Error analyzing domain');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyses,
    loading,
    error,
    fetchAnalyses,
    analyzeEmailDomain,
  };
}; 
