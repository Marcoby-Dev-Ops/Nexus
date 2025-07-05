/**
 * @file aiInsightsService.ts
 * @description Service for fetching AI-driven insights and suggestions.
 */

import { supabase } from '../core/supabase';
import { useAuth } from '@/contexts/AuthContext'; // We might need this for the session token

export interface AIInsight {
  id: string;
  type: 'suggestion' | 'alert' | 'success'; // This can be expanded
  icon: React.ReactNode;
  message: string;
  action: string | null;
}

// This is a placeholder for a more sophisticated mapping in the future
const mapSuggestionToInsight = (suggestion: any, index: number): AIInsight => ({
  id: `suggestion-${index}`,
  type: 'suggestion',
  // A real implementation would have more dynamic icons
  icon: '💡', // Placeholder
  message: suggestion.description,
  action: suggestion.actionLabel,
});

class AIInsightsService {
  /**
   * Fetches AI-generated suggestions for a given context (e.g., department).
   * 
   * @param {string} departmentId - The context for which to fetch suggestions.
   * @returns {Promise<AIInsight[]>} A promise that resolves to an array of AI insights.
   */
  async getInsights(departmentId: string = 'general'): Promise<AIInsight[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication is required to get AI suggestions.');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai_generate_suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ departmentId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch AI insights.');
    }

    const suggestions = await response.json();
    // The function seems to return the array directly or under a 'suggestions' key.
    const suggestionsArray = suggestions.suggestions || suggestions;
    
    return suggestionsArray.map(mapSuggestionToInsight);
  }
}

export const aiInsightsService = new AIInsightsService(); 