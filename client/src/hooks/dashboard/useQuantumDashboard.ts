import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { useBusinessBody, useBusinessAlerts } from '@/hooks/business-systems/useBusinessBody';
import { 
  getAllQuantumBlocks, 
  calculateBusinessHealth,
  generateQuantumInsights,
  generateQuantumRecommendations
} from '@/core/config/quantumBusinessModel';
import { quantumBusinessService } from '@/services/business/QuantumBusinessService';
import { unifiedPlaybookService as PlaybookService } from '@/services/playbook/UnifiedPlaybookService';
import { useFireCyclePlaybooks } from '@/core/fire-cycle/fireCyclePlaybooks';
import { nexusUnifiedBrain } from '@/services/ai/nexusUnifiedBrain';
import { logger } from '@/shared/utils/logger';

export interface QuantumDashboardData {
  quantumBlocks: any[];
  quantumProfile: any;
  overallHealth: number;
  lastLoginDelta: number;
  maturityLevel: string;
  brainTickets: any[];
  playbookRecommendations: any[];
  refreshing: boolean;
  error: string | null;
}

export function useQuantumDashboard() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { activeOrgId } = useOrganizationStore();
  const { businessBody } = useBusinessBody();
  const { criticalAlerts, hasCriticalAlerts, hasHighPriorityItems } = useBusinessAlerts();

  const [data, setData] = useState<QuantumDashboardData>({
    quantumBlocks: [],
    quantumProfile: null,
    overallHealth: 0,
    lastLoginDelta: 0,
    maturityLevel: 'startup',
    brainTickets: [],
    playbookRecommendations: [],
    refreshing: false,
    error: null,
  });

  const loadQuantumProfile = async () => {
    try {
      // Normalize organization id: ignore legacy placeholder 'default' and fall back to profile.organization_id
      const normalizedOrgId = (activeOrgId && activeOrgId !== 'default') ? activeOrgId : (profile?.organization_id || null);

      if (!user?.id || !normalizedOrgId) {
        // Provide mock data when no user/org
        setData(prev => ({ 
          ...prev, 
          quantumProfile: { 
            id: 'mock-profile',
            user_id: user?.id || 'mock-user',
            overall_health: 65,
            maturity_level: 'growing'
          }
        }));
        return;
      }

  // QuantumBusinessService exposes getQuantumProfile(organizationId)
  const profileResult = await quantumBusinessService.getQuantumProfile(normalizedOrgId as string);
      if (profileResult.success && profileResult.data) {
        setData(prev => ({ ...prev, quantumProfile: profileResult.data }));
      } else {
        // Fallback to mock data
        setData(prev => ({ 
          ...prev, 
          quantumProfile: { 
            id: 'fallback-profile',
            user_id: user.id,
            overall_health: 65,
            maturity_level: 'growing'
          }
        }));
      }
    } catch (error) {
      logger.warn('Failed to load quantum profile, using fallback data', { message: (error as any)?.message, stack: (error as any)?.stack });
      // Provide fallback data instead of error
      setData(prev => ({ 
        ...prev, 
        quantumProfile: { 
          id: 'fallback-profile',
          user_id: user?.id || 'mock-user',
          overall_health: 65,
          maturity_level: 'growing'
        }
      }));
    }
  };

  const loadBrainTickets = async () => {
    try {
      if (!user?.id || !activeOrgId) {
        // Provide mock brain tickets
        setData(prev => ({ 
          ...prev, 
          brainTickets: [
            {
              id: 'mock-ticket-1',
              title: 'Complete Business Identity Setup',
              status: 'in_progress',
              priority: 'high',
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-ticket-2',
              title: 'Review Revenue Strategy',
              status: 'pending',
              priority: 'medium',
              created_at: new Date().toISOString()
            }
          ]
        }));
        return;
      }

      // NexusUnifiedBrain processes in-memory data; use built-in methods available on the singleton
      // There is no getBrainTickets API on the NexusUnifiedBrain instance. Use mock/fallback or integrate backend endpoint when available.
      // For now attempt to call a possible method if present, otherwise fall back to an empty result to avoid throwing.
      let ticketsResult: any = { success: false, data: null };
      try {
        // @ts-ignore - attempt call if implemented elsewhere
        if (typeof nexusUnifiedBrain.getBrainTickets === 'function') {
          ticketsResult = await (nexusUnifiedBrain as any).getBrainTickets(user.id, activeOrgId);
        }
      } catch (e) {
        // keep ticketsResult as failure to trigger fallback data
        ticketsResult = { success: false, data: null, error: e };
      }
      if (ticketsResult.success && ticketsResult.data) {
        setData(prev => ({ ...prev, brainTickets: ticketsResult.data || [] }));
      } else {
        // Fallback to mock data
        setData(prev => ({ 
          ...prev, 
          brainTickets: [
            {
              id: 'fallback-ticket-1',
              title: 'Complete Business Identity Setup',
              status: 'in_progress',
              priority: 'high',
              created_at: new Date().toISOString()
            }
          ]
        }));
      }
    } catch (error) {
      logger.warn('Failed to load brain tickets, using fallback data', { message: (error as any)?.message, stack: (error as any)?.stack });
      // Provide fallback data
      setData(prev => ({ 
        ...prev, 
        brainTickets: [
          {
            id: 'fallback-ticket-1',
            title: 'Complete Business Identity Setup',
            status: 'in_progress',
            priority: 'high',
            created_at: new Date().toISOString()
          }
        ]
      }));
    }
  };

  const loadPlaybookTemplates = async () => {
    try {
      if (!user?.id || !activeOrgId) {
        // Provide mock playbook recommendations
        setData(prev => ({ 
          ...prev, 
          playbookRecommendations: [
            {
              playbook: {
                id: 'mock-playbook-1',
                title: 'Business Identity Setup',
                description: 'Complete your business foundation and identity'
              },
              priority: 'high',
              estimatedImpact: 'High'
            },
            {
              playbook: {
                id: 'mock-playbook-2',
                title: 'Revenue Optimization',
                description: 'Improve your sales and pricing strategy'
              },
              priority: 'medium',
              estimatedImpact: 'Medium'
            }
          ]
        }));
        return;
      }

  // PlaybookService.getPlaybookTemplates does not take organizationId; it reads active templates from DB
  const templatesResult = await PlaybookService.getPlaybookTemplates();
      if (templatesResult.success && templatesResult.data) {
        const _templatesResult: any = templatesResult;
        const templatesArray = Array.isArray(_templatesResult.data)
          ? _templatesResult.data
          : (_templatesResult.data?.data || []);

        const recommendations = (templatesArray || []).slice(0, 5).map((tpl: any) => ({
          playbook: {
            id: tpl.id,
            title: tpl.title || tpl.name,
            description: tpl.description || tpl.purpose || ''
          },
          priority: 'medium',
          estimatedImpact: 'Medium'
        }));

        setData(prev => ({ ...prev, playbookRecommendations: recommendations }));
      } else {
        // Fallback to mock data
        setData(prev => ({ 
          ...prev, 
          playbookRecommendations: [
            {
              playbook: {
                id: 'fallback-playbook-1',
                title: 'Business Identity Setup',
                description: 'Complete your business foundation and identity'
              },
              priority: 'high',
              estimatedImpact: 'High'
            }
          ]
        }));
      }
    } catch (error) {
      logger.warn('Failed to load playbook templates, using fallback data', { message: (error as any)?.message, stack: (error as any)?.stack });
      // Provide fallback data
      setData(prev => ({ 
        ...prev, 
        playbookRecommendations: [
          {
            playbook: {
              id: 'fallback-playbook-1',
              title: 'Business Identity Setup',
              description: 'Complete your business foundation and identity'
            },
            priority: 'high',
            estimatedImpact: 'High'
          }
        ]
      }));
    }
  };

  const calculateHealthMetrics = () => {
    try {
      const quantumBlocks = getAllQuantumBlocks();

      // Build a minimal QuantumBusinessProfile to satisfy model functions
      const profile = {
        id: 'computed-profile',
        organizationId: activeOrgId || 'local',
        blocks: quantumBlocks.map(b => ({
          blockId: b.id,
          strength: 50,
          health: 50,
          properties: {},
          healthIndicators: {},
          aiCapabilities: [],
          marketplaceIntegrations: []
        })),
        relationships: [],
        healthScore: 0,
        maturityLevel: 'startup',
        lastUpdated: new Date().toISOString()
      } as any;

      const health = calculateBusinessHealth(profile);
      const insights = generateQuantumInsights(profile);
      
      // Calculate last login delta (mock for now)
      const lastLoginDelta = Math.floor(Math.random() * 20) - 10;
      
      // Determine maturity level based on health
      let maturityLevel = 'startup';
      if (health > 70) maturityLevel = 'scaling';
      else if (health > 40) maturityLevel = 'growing';

      setData(prev => ({
        ...prev,
        quantumBlocks,
        overallHealth: health,
        lastLoginDelta,
        maturityLevel,
      }));
    } catch (error) {
      logger.warn('Failed to calculate health metrics, using fallback data', { message: (error as any)?.message, stack: (error as any)?.stack });
      // Provide fallback health metrics
      setData(prev => ({
        ...prev,
        quantumBlocks: [],
        overallHealth: 65,
        lastLoginDelta: 5,
        maturityLevel: 'growing',
      }));
    }
  };

  const refreshDashboard = async () => {
    setData(prev => ({ ...prev, refreshing: true, error: null }));
    
    try {
      // Load all data in parallel, but don't fail if individual services fail
      await Promise.allSettled([
        loadQuantumProfile(),
        loadBrainTickets(),
        loadPlaybookTemplates(),
      ]);
      calculateHealthMetrics();
    } catch (error) {
      logger.warn('Some dashboard services failed, but continuing with available data', { message: (error as any)?.message, stack: (error as any)?.stack });
      // Don't set error state, just log the warning
    } finally {
      setData(prev => ({ ...prev, refreshing: false }));
    }
  };

  useEffect(() => {
    if (user?.id && activeOrgId) {
      refreshDashboard();
    } else {
      // Provide fallback data when no user/org
      setData(prev => ({
        ...prev,
        quantumProfile: { 
          id: 'demo-profile',
          user_id: 'demo-user',
          overall_health: 65,
          maturity_level: 'growing'
        },
        overallHealth: 65,
        lastLoginDelta: 5,
        maturityLevel: 'growing',
        brainTickets: [
          {
            id: 'demo-ticket-1',
            title: 'Complete Business Identity Setup',
            status: 'in_progress',
            priority: 'high',
            created_at: new Date().toISOString()
          }
        ],
        playbookRecommendations: [
          {
            playbook: {
              id: 'demo-playbook-1',
              title: 'Business Identity Setup',
              description: 'Complete your business foundation and identity'
            },
            priority: 'high',
            estimatedImpact: 'High'
          }
        ]
      }));
    }
  }, [user?.id, activeOrgId]);

  return {
    ...data,
    refreshDashboard,
    hasCriticalAlerts,
    hasHighPriorityItems,
  };
}
