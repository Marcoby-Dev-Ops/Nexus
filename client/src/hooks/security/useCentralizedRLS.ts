/**
 * Centralized RLS Hook
 * React hook that provides centralized row-level security management
 * Implements policy governance, audit trails, and recommendations
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  centralizedRLSService, 
  type RLSPolicy, 
  type PolicyRecommendation, 
  type PolicyStatistics, 
  type PolicyAuditEntry,
  type MigrationResult,
  type PredictivePolicyTemplate,
  type PolicyPrediction,
  type PredictivePolicyResult,
  type DevelopmentStatus,
  type PolicyValidation
} from '@/services/security/centralizedRLSService';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';

export interface CentralizedRLSState {
  policies: RLSPolicy[];
  recommendations: PolicyRecommendation[];
  statistics: PolicyStatistics | null;
  auditTrail: PolicyAuditEntry[];
  migrationResults: MigrationResult[];
  overview: any[];
  // Predictive Policy State
  predictions: PolicyPrediction[];
  developmentStatus: DevelopmentStatus[];
  policyValidation: PolicyValidation | null;
  predictiveTemplates: PredictivePolicyTemplate[];
  loading: boolean;
  error: string | null;
}

export interface CentralizedRLSActions {
  registerPolicy: (policy: Omit<RLSPolicy, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  applyPoliciesToTable: (tableName: string) => Promise<boolean>;
  getPolicyRecommendations: (tableName: string) => Promise<PolicyRecommendation[]>;
  migrateExistingPolicies: () => Promise<MigrationResult[]>;
  getPolicyStatistics: () => Promise<PolicyStatistics | null>;
  getTablePolicies: (tableName: string) => Promise<RLSPolicy[]>;
  getPolicyAudit: (policyId?: string) => Promise<PolicyAuditEntry[]>;
  updatePolicy: (policyId: string, updates: Partial<RLSPolicy>) => Promise<boolean>;
  deactivatePolicy: (policyId: string) => Promise<boolean>;
  activatePolicy: (policyId: string) => Promise<boolean>;
  getPolicyOverview: () => Promise<any[]>;
  validatePolicyCondition: (conditionSql: string) => Promise<boolean>;
  createStandardPolicies: (tableName: string) => Promise<string[]>;
  refreshPolicies: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  refreshAuditTrail: (policyId?: string) => Promise<void>;
  // Predictive Policy Actions
  predictPoliciesForTable: (tableName: string) => Promise<PolicyPrediction[]>;
  applyPredictivePolicies: (tableName: string) => Promise<PredictivePolicyResult | null>;
  applyPredictivePoliciesToAllTables: () => Promise<PredictivePolicyResult[]>;
  ensureTableDevelopmentReady: (tableName: string) => Promise<boolean>;
  getDevelopmentStatus: () => Promise<DevelopmentStatus[]>;
  validateTablePolicies: (tableName: string) => Promise<PolicyValidation | null>;
  getPredictivePolicyTemplates: () => Promise<PredictivePolicyTemplate[]>;
  createPredictivePolicyTemplate: (template: Omit<PredictivePolicyTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<string | null>;
  updatePredictivePolicyTemplate: (templateId: string, updates: Partial<PredictivePolicyTemplate>) => Promise<boolean>;
  deletePredictivePolicyTemplate: (templateId: string) => Promise<boolean>;
  refreshPredictions: (tableName?: string) => Promise<void>;
  refreshDevelopmentStatus: () => Promise<void>;
  refreshPredictiveTemplates: () => Promise<void>;
}

export function useCentralizedRLS(): CentralizedRLSState & CentralizedRLSActions {
  const { user } = useAuth();
  const [state, setState] = useState<CentralizedRLSState>({
    policies: [],
    recommendations: [],
    statistics: null,
    auditTrail: [],
    migrationResults: [],
    overview: [],
    // Predictive Policy State
    predictions: [],
    developmentStatus: [],
    policyValidation: null,
    predictiveTemplates: [],
    loading: false,
    error: null
  });

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id]);

  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Load statistics, overview, development status, and templates in parallel
      const [statsResult, overviewResult, devStatusResult, templatesResult] = await Promise.all([
        centralizedRLSService.getPolicyStatistics(),
        centralizedRLSService.getPolicyOverview(),
        centralizedRLSService.getDevelopmentStatus(),
        centralizedRLSService.getPredictivePolicyTemplates()
      ]);

      if (statsResult.success) {
        setState(prev => ({ ...prev, statistics: statsResult.data }));
      }

      if (overviewResult.success) {
        setState(prev => ({ ...prev, overview: overviewResult.data }));
      }

      if (devStatusResult.success) {
        setState(prev => ({ ...prev, developmentStatus: devStatusResult.data }));
      }

      if (templatesResult.success) {
        setState(prev => ({ ...prev, predictiveTemplates: templatesResult.data }));
      }

      if (!statsResult.success || !overviewResult.success || !devStatusResult.success || !templatesResult.success) {
        setState(prev => ({ 
          ...prev, 
          error: statsResult.error || overviewResult.error || devStatusResult.error || templatesResult.error || 'Failed to load initial data' 
        }));
      }
    } catch (error) {
      logger.error('Error loading initial RLS data', { error });
      setState(prev => ({ ...prev, error: 'Failed to load initial data' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const registerPolicy = useCallback(async (policy: Omit<RLSPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.registerPolicy(policy);
      
      if (result.success) {
        // Refresh policies for the table
        await getTablePolicies(policy.table_name);
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error registering policy', { error, policy });
      setState(prev => ({ ...prev, error: 'Failed to register policy' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const applyPoliciesToTable = useCallback(async (tableName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.applyPoliciesToTable(tableName);
      
      if (result.success) {
        // Refresh policies for the table
        await getTablePolicies(tableName);
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error applying policies to table', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to apply policies' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getPolicyRecommendations = useCallback(async (tableName: string): Promise<PolicyRecommendation[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getPolicyRecommendations(tableName);
      
      if (result.success) {
        setState(prev => ({ ...prev, recommendations: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting policy recommendations', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to get recommendations' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const migrateExistingPolicies = useCallback(async (): Promise<MigrationResult[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.migrateExistingPolicies();
      
      if (result.success) {
        setState(prev => ({ ...prev, migrationResults: result.data }));
        // Refresh statistics after migration
        await refreshStatistics();
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error migrating existing policies', { error });
      setState(prev => ({ ...prev, error: 'Failed to migrate policies' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getPolicyStatistics = useCallback(async (): Promise<PolicyStatistics | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getPolicyStatistics();
      
      if (result.success) {
        setState(prev => ({ ...prev, statistics: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return null;
      }
    } catch (error) {
      logger.error('Error getting policy statistics', { error });
      setState(prev => ({ ...prev, error: 'Failed to get statistics' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getTablePolicies = useCallback(async (tableName: string): Promise<RLSPolicy[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getTablePolicies(tableName);
      
      if (result.success) {
        setState(prev => ({ ...prev, policies: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting table policies', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to get table policies' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getPolicyAudit = useCallback(async (policyId?: string): Promise<PolicyAuditEntry[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getPolicyAudit(policyId);
      
      if (result.success) {
        setState(prev => ({ ...prev, auditTrail: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting policy audit trail', { error, policyId });
      setState(prev => ({ ...prev, error: 'Failed to get audit trail' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const updatePolicy = useCallback(async (policyId: string, updates: Partial<RLSPolicy>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.updatePolicy(policyId, updates);
      
      if (result.success) {
        // Refresh policies if table name is provided
        if (updates.table_name) {
          await getTablePolicies(updates.table_name);
        }
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error updating policy', { error, policyId, updates });
      setState(prev => ({ ...prev, error: 'Failed to update policy' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const deactivatePolicy = useCallback(async (policyId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.deactivatePolicy(policyId);
      
      if (result.success) {
        // Refresh statistics
        await refreshStatistics();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error deactivating policy', { error, policyId });
      setState(prev => ({ ...prev, error: 'Failed to deactivate policy' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const activatePolicy = useCallback(async (policyId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.activatePolicy(policyId);
      
      if (result.success) {
        // Refresh statistics
        await refreshStatistics();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error activating policy', { error, policyId });
      setState(prev => ({ ...prev, error: 'Failed to activate policy' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getPolicyOverview = useCallback(async (): Promise<any[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getPolicyOverview();
      
      if (result.success) {
        setState(prev => ({ ...prev, overview: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting policy overview', { error });
      setState(prev => ({ ...prev, error: 'Failed to get overview' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const validatePolicyCondition = useCallback(async (conditionSql: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.validatePolicyCondition(conditionSql);
      
      if (result.success) {
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error validating policy condition', { error, conditionSql });
      setState(prev => ({ ...prev, error: 'Failed to validate condition' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const createStandardPolicies = useCallback(async (tableName: string): Promise<string[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.createStandardPolicies(tableName);
      
      if (result.success) {
        // Refresh policies and statistics
        await Promise.all([
          getTablePolicies(tableName),
          refreshStatistics()
        ]);
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error creating standard policies', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to create standard policies' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshPolicies = useCallback(async (): Promise<void> => {
    if (state.policies.length > 0) {
      const tableName = state.policies[0].table_name;
      await getTablePolicies(tableName);
    }
  }, [state.policies]);

  const refreshStatistics = useCallback(async (): Promise<void> => {
    await getPolicyStatistics();
  }, []);

  const refreshAuditTrail = useCallback(async (policyId?: string): Promise<void> => {
    await getPolicyAudit(policyId);
  }, []);

  // ====================================================================
  // PREDICTIVE POLICY METHODS
  // ====================================================================

  const predictPoliciesForTable = useCallback(async (tableName: string): Promise<PolicyPrediction[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.predictPoliciesForTable(tableName);
      
      if (result.success) {
        setState(prev => ({ ...prev, predictions: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error predicting policies for table', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to predict policies' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const applyPredictivePolicies = useCallback(async (tableName: string): Promise<PredictivePolicyResult | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.applyPredictivePolicies(tableName);
      
      if (result.success) {
        // Refresh policies and development status
        await Promise.all([
          getTablePolicies(tableName),
          refreshDevelopmentStatus()
        ]);
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return null;
      }
    } catch (error) {
      logger.error('Error applying predictive policies', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to apply predictive policies' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const applyPredictivePoliciesToAllTables = useCallback(async (): Promise<PredictivePolicyResult[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.applyPredictivePoliciesToAllTables();
      
      if (result.success) {
        // Refresh development status
        await refreshDevelopmentStatus();
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error applying predictive policies to all tables', { error });
      setState(prev => ({ ...prev, error: 'Failed to apply predictive policies to all tables' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const ensureTableDevelopmentReady = useCallback(async (tableName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.ensureTableDevelopmentReady(tableName);
      
      if (result.success) {
        // Refresh development status
        await refreshDevelopmentStatus();
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error ensuring table is development ready', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to ensure table is development ready' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getDevelopmentStatus = useCallback(async (): Promise<DevelopmentStatus[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getDevelopmentStatus();
      
      if (result.success) {
        setState(prev => ({ ...prev, developmentStatus: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting development status', { error });
      setState(prev => ({ ...prev, error: 'Failed to get development status' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const validateTablePolicies = useCallback(async (tableName: string): Promise<PolicyValidation | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.validateTablePolicies(tableName);
      
      if (result.success) {
        setState(prev => ({ ...prev, policyValidation: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return null;
      }
    } catch (error) {
      logger.error('Error validating table policies', { error, tableName });
      setState(prev => ({ ...prev, error: 'Failed to validate table policies' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getPredictivePolicyTemplates = useCallback(async (): Promise<PredictivePolicyTemplate[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.getPredictivePolicyTemplates();
      
      if (result.success) {
        setState(prev => ({ ...prev, predictiveTemplates: result.data }));
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return [];
      }
    } catch (error) {
      logger.error('Error getting predictive policy templates', { error });
      setState(prev => ({ ...prev, error: 'Failed to get predictive policy templates' }));
      return [];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const createPredictivePolicyTemplate = useCallback(async (template: Omit<PredictivePolicyTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.createPredictivePolicyTemplate(template);
      
      if (result.success) {
        // Refresh templates
        await refreshPredictiveTemplates();
        return result.data;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return null;
      }
    } catch (error) {
      logger.error('Error creating predictive policy template', { error, template });
      setState(prev => ({ ...prev, error: 'Failed to create predictive policy template' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const updatePredictivePolicyTemplate = useCallback(async (templateId: string, updates: Partial<PredictivePolicyTemplate>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.updatePredictivePolicyTemplate(templateId, updates);
      
      if (result.success) {
        // Refresh templates
        await refreshPredictiveTemplates();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error updating predictive policy template', { error, templateId, updates });
      setState(prev => ({ ...prev, error: 'Failed to update predictive policy template' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const deletePredictivePolicyTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await centralizedRLSService.deletePredictivePolicyTemplate(templateId);
      
      if (result.success) {
        // Refresh templates
        await refreshPredictiveTemplates();
        return true;
      } else {
        setState(prev => ({ ...prev, error: result.error }));
        return false;
      }
    } catch (error) {
      logger.error('Error deleting predictive policy template', { error, templateId });
      setState(prev => ({ ...prev, error: 'Failed to delete predictive policy template' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshPredictions = useCallback(async (tableName?: string): Promise<void> => {
    if (tableName) {
      await predictPoliciesForTable(tableName);
    }
  }, []);

  const refreshDevelopmentStatus = useCallback(async (): Promise<void> => {
    await getDevelopmentStatus();
  }, []);

  const refreshPredictiveTemplates = useCallback(async (): Promise<void> => {
    await getPredictivePolicyTemplates();
  }, []);

  return {
    ...state,
    registerPolicy,
    applyPoliciesToTable,
    getPolicyRecommendations,
    migrateExistingPolicies,
    getPolicyStatistics,
    getTablePolicies,
    getPolicyAudit,
    updatePolicy,
    deactivatePolicy,
    activatePolicy,
    getPolicyOverview,
    validatePolicyCondition,
    createStandardPolicies,
    refreshPolicies,
    refreshStatistics,
    refreshAuditTrail,
    // Predictive Policy Actions
    predictPoliciesForTable,
    applyPredictivePolicies,
    applyPredictivePoliciesToAllTables,
    ensureTableDevelopmentReady,
    getDevelopmentStatus,
    validateTablePolicies,
    getPredictivePolicyTemplates,
    createPredictivePolicyTemplate,
    updatePredictivePolicyTemplate,
    deletePredictivePolicyTemplate,
    refreshPredictions,
    refreshDevelopmentStatus,
    refreshPredictiveTemplates
  };
}
