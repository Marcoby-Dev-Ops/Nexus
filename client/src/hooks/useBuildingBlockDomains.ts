/**
 * Building Block Domains Hook
 * 
 * Manages building block domain data and provides easy integration
 * with the domain browser component and executive assistant.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { 
  buildingBlockPlaybookService, 
  type BuildingBlockDomain, 
  type BuildingBlockInsight,
  type ExecutiveAssistantContext
} from '@/services/BuildingBlockPlaybookService';

export interface UseBuildingBlockDomainsReturn {
  // Data
  domains: BuildingBlockDomain[];
  selectedDomain: string | null;
  assistantContext: ExecutiveAssistantContext | null;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Actions
  loadDomains: () => Promise<void>;
  refreshData: () => Promise<void>;
  selectDomain: (domainId: string | null) => void;
  generateInsights: (domainId?: string) => Promise<BuildingBlockInsight[]>;
  
  // Computed values
  overallHealth: number;
  activeDomains: number;
  totalPlaybooks: number;
  totalAICapabilities: number;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useBuildingBlockDomains = (): UseBuildingBlockDomainsReturn => {
  const { user } = useAuth();
  
  const [domains, setDomains] = useState<BuildingBlockDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [assistantContext, setAssistantContext] = useState<ExecutiveAssistantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load domains data
  const loadDomains = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const domainsData = await buildingBlockPlaybookService.getBuildingBlockDomains(
        user.id, 
        user.company_id || 'default'
      );
      setDomains(domainsData);
      
      // Load executive assistant context
      const context = await buildingBlockPlaybookService.getExecutiveAssistantContext(
        user.id,
        user.company_id || 'default'
      );
      setAssistantContext(context);
    } catch (err) {
      console.error('Error loading domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.company_id]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadDomains();
    setRefreshing(false);
  }, [loadDomains]);

  // Select domain
  const selectDomain = useCallback((domainId: string | null) => {
    setSelectedDomain(domainId);
  }, []);

  // Generate insights for a specific domain or all domains
  const generateInsights = useCallback(async (domainId?: string): Promise<BuildingBlockInsight[]> => {
    if (!user?.id) return [];
    
    try {
      if (domainId) {
        return await buildingBlockPlaybookService.generateDomainInsights(
          domainId,
          user.id,
          user.company_id || 'default'
        );
      } else {
        const allInsights: BuildingBlockInsight[] = [];
        for (const domain of domains) {
          const insights = await buildingBlockPlaybookService.generateDomainInsights(
            domain.id,
            user.id,
            user.company_id || 'default'
          );
          allInsights.push(...insights);
        }
        return allInsights;
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      return [];
    }
  }, [user?.id, user?.company_id, domains]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load domains on mount
  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id, loadDomains]);

  // Computed values
  const overallHealth = domains.length > 0 
    ? Math.round(domains.reduce((sum, d) => sum + d.healthScore, 0) / domains.length)
    : 0;

  const activeDomains = domains.filter(d => d.healthScore > 0).length;

  const totalPlaybooks = domains.reduce((sum, d) => sum + d.playbooks.length, 0);

  const totalAICapabilities = domains.reduce((sum, d) => sum + d.aiCapabilities.length, 0);

  return {
    // Data
    domains,
    selectedDomain,
    assistantContext,
    
    // Loading states
    loading,
    refreshing,
    
    // Actions
    loadDomains,
    refreshData,
    selectDomain,
    generateInsights,
    
    // Computed values
    overallHealth,
    activeDomains,
    totalPlaybooks,
    totalAICapabilities,
    
    // Error handling
    error,
    clearError,
  };
};
