/**
 * Business Body Hook
 * 
 * React hook that provides the complete business body state including all 8 autonomous
 * business systems and 7 building blocks. Integrates with existing business health
 * infrastructure for seamless data flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { businessSystemService } from '@/core/business-systems/BusinessSystemService';
import { useLiveBusinessHealth } from '@/hooks/dashboard/useLiveBusinessHealth';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import type { BusinessBodyState, BusinessSystem, SystemHealth } from '@/core/business-systems/BusinessSystemTypes';

interface UseBusinessBodyResult {
  businessBody: BusinessBodyState | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  
  // System-specific getters
  getSystem: (systemId: BusinessSystem) => any;
  getSystemHealth: (systemId: BusinessSystem) => SystemHealth;
  getBuildingBlock: (blockId: string) => any;
  
  // Health indicators
  overallHealth: SystemHealth;
  healthySystems: number;
  totalSystems: number;
  systemHealthPercentage: number;
  
  // Alerts and recommendations
  activeAlerts: any[];
  recommendations: any[];
  
  // Auto-optimization status
  autoOptimizationEnabled: boolean;
  lastOptimization: string | null;
}

export function useBusinessBody(): UseBusinessBodyResult {
  const { user } = useAuth();
  const { healthData, loading: healthLoading, error: healthError, refresh: refreshHealth } = useLiveBusinessHealth();
  
  const [businessBody, setBusinessBody] = useState<BusinessBodyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch business body state
  const fetchBusinessBody = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await businessSystemService.getBusinessBodyState(user.id);
      
      if (result.success && result.data) {
        setBusinessBody(result.data);
        setLastUpdated(new Date().toISOString());
        
        logger.info({
          overallHealth: result.data.overallHealth,
          systemsCount: Object.keys(result.data.systems).length,
          alertsCount: result.data.alerts.length,
          recommendationsCount: result.data.recommendations.length
        }, 'Fetched business body state');
      } else {
        throw new Error(result.error || 'Failed to fetch business body state');
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to fetch business body state');
      setError(error.message || 'Failed to fetch business body state');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh business body state
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshHealth(),
      fetchBusinessBody()
    ]);
  }, [refreshHealth, fetchBusinessBody]);

  // Initial data fetch
  useEffect(() => {
    fetchBusinessBody();
  }, [fetchBusinessBody]);

  // Auto-refresh every 5 minutes (business systems change less frequently than health data)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBusinessBody();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchBusinessBody]);

  // System-specific getters
  const getSystem = useCallback((systemId: BusinessSystem) => {
    return businessBody?.systems[systemId] || null;
  }, [businessBody]);

  const getSystemHealth = useCallback((systemId: BusinessSystem) => {
    return businessBody?.systems[systemId]?.health || 'healthy';
  }, [businessBody]);

  const getBuildingBlock = useCallback((blockId: string) => {
    return businessBody?.buildingBlocks[blockId] || null;
  }, [businessBody]);

  // Calculate health indicators
  const overallHealth = businessBody?.overallHealth || 'healthy';
  const healthySystems = businessBody ? Object.values(businessBody.systems).filter(system => 
    system.health === 'healthy' || system.health === 'optimal'
  ).length : 0;
  const totalSystems = businessBody ? Object.keys(businessBody.systems).length : 0;
  const systemHealthPercentage = totalSystems > 0 ? (healthySystems / totalSystems) * 100 : 0;

  // Filter active alerts and recommendations
  const activeAlerts = businessBody?.alerts.filter(alert => !alert.resolved) || [];
  const recommendations = businessBody?.recommendations || [];

  return {
    businessBody,
    loading: loading || healthLoading,
    error: error || healthError,
    lastUpdated,
    refresh,
    
    // System-specific getters
    getSystem,
    getSystemHealth,
    getBuildingBlock,
    
    // Health indicators
    overallHealth,
    healthySystems,
    totalSystems,
    systemHealthPercentage,
    
    // Alerts and recommendations
    activeAlerts,
    recommendations,
    
    // Auto-optimization status
    autoOptimizationEnabled: businessBody?.autoOptimizationEnabled || false,
    lastOptimization: businessBody?.lastOptimization || null
  };
}

/**
 * Hook for individual system monitoring
 */
export function useBusinessSystem(systemId: BusinessSystem) {
  const { getSystem, getSystemHealth, loading, error, refresh } = useBusinessBody();
  
  const system = getSystem(systemId);
  const health = getSystemHealth(systemId);
  
  return {
    system,
    health,
    loading,
    error,
    refresh,
    isHealthy: health === 'healthy' || health === 'optimal',
    isWarning: health === 'warning',
    isCritical: health === 'critical' || health === 'failed'
  };
}

/**
 * Hook for building block monitoring
 */
export function useBuildingBlock(blockId: string) {
  const { getBuildingBlock, loading, error, refresh } = useBusinessBody();
  
  const block = getBuildingBlock(blockId);
  
  return {
    block,
    loading,
    error,
    refresh,
    isHealthy: block?.health === 'healthy' || block?.health === 'optimal',
    isWarning: block?.health === 'warning',
    isCritical: block?.health === 'critical' || block?.health === 'failed'
  };
}

/**
 * Hook for system interactions
 */
export function useSystemInteractions() {
  const { businessBody, loading, error, refresh } = useBusinessBody();
  
  const interactions = businessBody?.interactions || [];
  
  // Get interactions for a specific system
  const getSystemInteractions = useCallback((systemId: BusinessSystem) => {
    return interactions.filter(interaction => 
      interaction.fromSystem === systemId || interaction.toSystem === systemId
    );
  }, [interactions]);
  
  // Get strong interactions (strength > 80)
  const strongInteractions = interactions.filter(interaction => interaction.strength > 80);
  
  // Get weak interactions (strength < 50)
  const weakInteractions = interactions.filter(interaction => interaction.strength < 50);
  
  return {
    interactions,
    getSystemInteractions,
    strongInteractions,
    weakInteractions,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for business body alerts
 */
export function useBusinessAlerts() {
  const { activeAlerts, recommendations, loading, error, refresh } = useBusinessBody();
  
  // Filter alerts by severity
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');
  const mediumAlerts = activeAlerts.filter(alert => alert.severity === 'medium');
  const lowAlerts = activeAlerts.filter(alert => alert.severity === 'low');
  
  // Filter recommendations by impact
  const highImpactRecommendations = recommendations.filter(rec => rec.impact === 'high');
  const mediumImpactRecommendations = recommendations.filter(rec => rec.impact === 'medium');
  const lowImpactRecommendations = recommendations.filter(rec => rec.impact === 'low');
  
  return {
    alerts: activeAlerts,
    recommendations,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    highImpactRecommendations,
    mediumImpactRecommendations,
    lowImpactRecommendations,
    loading,
    error,
    refresh,
    hasCriticalAlerts: criticalAlerts.length > 0,
    hasHighPriorityItems: criticalAlerts.length > 0 || highAlerts.length > 0 || highImpactRecommendations.length > 0
  };
}
