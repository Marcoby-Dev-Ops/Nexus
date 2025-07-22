import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/core/supabase";
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import type { 
    AssessmentSummary, 
    AssessmentCategoryScore, 
    AssessmentResponse, 
    Offer,
    AssessmentCategory
} from '@prisma/client';
import type { 
  AssessmentQuestion, 
  AssessmentCategory 
} from '@/shared/types/supabase';

export interface AssessmentData {
  summary: AssessmentSummary | null;
  categoryScores: AssessmentCategoryScore[];
  responses: (AssessmentResponse & { question: (AssessmentQuestion & { offer: Offer | null }) | null })[];
  questions: (AssessmentQuestion & { category: AssessmentCategory })[];
}

export function useAssessmentData() {
  const { user, loading: authLoading } = useAuthContext();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.company_id) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const companyId = user.company_id;

      const [
        summaryRes,
        categoryScoresRes,
        responsesRes,
        questionsRes,
      ] = await Promise.all([
        supabase.from('AssessmentSummary').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('AssessmentCategoryScore').select('*').eq('company_id', companyId),
        supabase.from('AssessmentResponse').select(`*, question:AssessmentQuestion (*, offer:Offer (*))`).eq('company_id', companyId),
        supabase.from('AssessmentQuestion').select(`*, category:AssessmentCategory (*)`),
      ]);

      if (summaryRes.error) throw summaryRes.error;
      if (categoryScoresRes.error) throw categoryScoresRes.error;
      if (responsesRes.error) throw responsesRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setData({
        summary: summaryRes.data,
        categoryScores: categoryScoresRes.data || [],
        responses: responsesRes.data || [],
        questions: questionsRes.data || [],
      });
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
} 