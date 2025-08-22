/**
 * Centralized Row-Level Security (CRLS) Service
 * Manages centralized policy governance for the Nexus platform
 * Provides policy registration, application, and recommendations
 */
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, insertOne, updateOne, deleteOne, callRPC } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export interface RLSPolicy {
  id?: string;
  table_name: string;
  policy_name: string;
  policy_type: 'user_owned' | 'company_owned' | 'public_read' | 'hybrid' | 'custom';
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  condition_sql: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

export interface PolicyRecommendation {
  recommended_policy_type: string;
  recommended_operations: string[];
  recommended_conditions: string[];
  reasoning: string;
}

export interface PolicyStatistics {
  total_policies: number;
  active_policies: number;
  policies_by_type: Record<string, number>;
  tables_with_policies: number;
}

export interface PolicyAuditEntry {
  id: string;
  policy_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
  old_values?: any;
  new_values?: any;
  changed_by?: string;
  changed_at: string;
  reason?: string;
}

export interface MigrationResult {
  table_name: string;
  policies_migrated: number;
  status: string;
}

// Predictive Policy Interfaces
export interface PredictivePolicyTemplate {
  id?: string;
  template_name: string;
  description?: string;
  table_pattern: string;
  column_requirements: {
    required: string[];
    optional: string[];
  };
  policy_rules: PredictivePolicyRule[];
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PredictivePolicyRule {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  condition: string;
  description: string;
}

export interface PolicyPrediction {
  template_name: string;
  template_description: string;
  confidence_score: number;
  predicted_policies: PredictivePolicyRule[];
  reasoning: string;
}

export interface PredictivePolicyResult {
  template_applied: string;
  policies_created: number;
  status: string;
}

export interface DevelopmentStatus {
  table_name: string;
  has_policies: boolean;
  policy_count: number;
  template_used: string;
  development_ready: boolean;
  last_updated: string;
}

export interface PolicyValidation {
  validation_passed: boolean;
  issues: string[];
  recommendations: string[];
}

export class CentralizedRLSService extends BaseService {
  private static instance: CentralizedRLSService;

  static getInstance(): CentralizedRLSService {
    if (!CentralizedRLSService.instance) {
      CentralizedRLSService.instance = new CentralizedRLSService();
    }
    return CentralizedRLSService.instance;
  }

  /**
   * Register a new RLS policy in the centralized system
   */
  async registerPolicy(policy: Omit<RLSPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<string>> {
    try {
      logger.info('Registering RLS policy', { table_name: policy.table_name, policy_name: policy.policy_name });

      const { data, error } = await callRPC('register_rls_policy', {
        p_table_name: policy.table_name,
        p_policy_name: policy.policy_name,
        p_policy_type: policy.policy_type,
        p_operation: policy.operation,
        p_condition_sql: policy.condition_sql,
        p_description: policy.description
      });

      if (error) {
        logger.error('Failed to register RLS policy', { error, policy });
        return this.handleError(error);
      }

      logger.info('Successfully registered RLS policy', { policy_id: data });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error registering RLS policy', { error, policy });
      return this.handleError(error);
    }
  }

  /**
   * Apply centralized policies to a specific table
   */
  async applyPoliciesToTable(tableName: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Applying centralized policies to table', { table_name: tableName });

      const { error } = await callRPC('apply_centralized_policies', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to apply centralized policies', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully applied centralized policies', { table_name: tableName });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error applying centralized policies', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Get policy recommendations for a table based on its structure
   */
  async getPolicyRecommendations(tableName: string): Promise<ServiceResponse<PolicyRecommendation[]>> {
    try {
      logger.info('Getting policy recommendations', { table_name: tableName });

      const { data, error } = await callRPC('get_policy_recommendations', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to get policy recommendations', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved policy recommendations', { 
        table_name: tableName, 
        recommendations_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting policy recommendations', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Migrate existing policies to the centralized system
   */
  async migrateExistingPolicies(): Promise<ServiceResponse<MigrationResult[]>> {
    try {
      logger.info('Starting policy migration to centralized system');

      const { data, error } = await callRPC('migrate_existing_policies');

      if (error) {
        logger.error('Failed to migrate existing policies', { error });
        return this.handleError(error);
      }

      logger.info('Successfully migrated existing policies', { 
        migration_results: data,
        total_migrated: data?.reduce((sum, result) => sum + result.policies_migrated, 0) || 0
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error migrating existing policies', { error });
      return this.handleError(error);
    }
  }

  /**
   * Get policy statistics
   */
  async getPolicyStatistics(): Promise<ServiceResponse<PolicyStatistics>> {
    try {
      logger.info('Getting policy statistics');

      const { data, error } = await callRPC('get_policy_statistics');

      if (error) {
        logger.error('Failed to get policy statistics', { error });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved policy statistics', { statistics: data });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting policy statistics', { error });
      return this.handleError(error);
    }
  }

  /**
   * Get all policies for a specific table
   */
  async getTablePolicies(tableName: string): Promise<ServiceResponse<RLSPolicy[]>> {
    try {
      logger.info('Getting table policies', { table_name: tableName });

      const { data, error } = await selectData('rls_policy_registry', {
        filters: { table_name: tableName },
        orderBy: { column: 'operation', ascending: true }
      });

      if (error) {
        logger.error('Failed to get table policies', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved table policies', { 
        table_name: tableName, 
        policies_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting table policies', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Get policy audit trail
   */
  async getPolicyAudit(policyId?: string): Promise<ServiceResponse<PolicyAuditEntry[]>> {
    try {
      logger.info('Getting policy audit trail', { policy_id: policyId });

      const { data, error } = await selectData('rls_policy_audit', {
        filters: policyId ? { policy_id: policyId } : undefined,
        orderBy: { column: 'changed_at', ascending: false }
      });

      if (error) {
        logger.error('Failed to get policy audit trail', { error, policy_id: policyId });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved policy audit trail', { 
        policy_id: policyId, 
        audit_entries_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting policy audit trail', { error, policy_id: policyId });
      return this.handleError(error);
    }
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(policyId: string, updates: Partial<RLSPolicy>): Promise<ServiceResponse<void>> {
    try {
      logger.info('Updating RLS policy', { policy_id: policyId, updates });

      const { error } = await updateOne('rls_policy_registry', policyId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to update RLS policy', { error, policy_id: policyId });
        return this.handleError(error);
      }

      logger.info('Successfully updated RLS policy', { policy_id: policyId });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error updating RLS policy', { error, policy_id: policyId });
      return this.handleError(error);
    }
  }

  /**
   * Deactivate a policy
   */
  async deactivatePolicy(policyId: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Deactivating RLS policy', { policy_id: policyId });

      const { error } = await updateOne('rls_policy_registry', policyId, { 
        is_active: false,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to deactivate RLS policy', { error, policy_id: policyId });
        return this.handleError(error);
      }

      logger.info('Successfully deactivated RLS policy', { policy_id: policyId });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error deactivating RLS policy', { error, policy_id: policyId });
      return this.handleError(error);
    }
  }

  /**
   * Activate a policy
   */
  async activatePolicy(policyId: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Activating RLS policy', { policy_id: policyId });

      const { error } = await updateOne('rls_policy_registry', policyId, { 
        is_active: true,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to activate RLS policy', { error, policy_id: policyId });
        return this.handleError(error);
      }

      logger.info('Successfully activated RLS policy', { policy_id: policyId });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error activating RLS policy', { error, policy_id: policyId });
      return this.handleError(error);
    }
  }

  /**
   * Get policy overview for all tables
   */
  async getPolicyOverview(): Promise<ServiceResponse<any[]>> {
    try {
      logger.info('Getting policy overview');

      const { data, error } = await selectData('v_policy_overview', {
        orderBy: { column: 'table_name', ascending: true }
      });

      if (error) {
        logger.error('Failed to get policy overview', { error });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved policy overview', { 
        overview_entries: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting policy overview', { error });
      return this.handleError(error);
    }
  }

  /**
   * Validate a policy condition for security
   */
  async validatePolicyCondition(conditionSql: string): Promise<ServiceResponse<boolean>> {
    try {
      logger.info('Validating policy condition');

      const { data, error } = await callRPC('validate_policy_condition', {
        p_condition_sql: conditionSql
      });

      if (error) {
        logger.error('Failed to validate policy condition', { error, condition_sql: conditionSql });
        return this.handleError(error);
      }

      logger.info('Successfully validated policy condition', { 
        condition_sql: conditionSql, 
        is_valid: data 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error validating policy condition', { error, condition_sql: conditionSql });
      return this.handleError(error);
    }
  }

  /**
   * Create standard policies for a table based on its structure
   */
  async createStandardPolicies(tableName: string): Promise<ServiceResponse<string[]>> {
    try {
      logger.info('Creating standard policies for table', { table_name: tableName });

      // Get recommendations first
      const recommendationsResult = await this.getPolicyRecommendations(tableName);
      if (!recommendationsResult.success || !recommendationsResult.data?.length) {
        return this.handleError(new Error('No policy recommendations available'));
      }

      const recommendation = recommendationsResult.data[0];
      const policyIds: string[] = [];

      // Create policies based on recommendations
      for (let i = 0; i < recommendation.recommended_operations.length; i++) {
        const operation = recommendation.recommended_operations[i];
        const condition = recommendation.recommended_conditions[i];

        const policyResult = await this.registerPolicy({
          table_name: tableName,
          policy_name: `${tableName}_${operation.toLowerCase()}_policy`,
          policy_type: recommendation.recommended_policy_type as any,
          operation: operation as any,
          condition_sql: condition,
          description: `Auto-generated ${operation} policy for ${tableName}`,
          is_active: true
        });

        if (policyResult.success && policyResult.data) {
          policyIds.push(policyResult.data);
        }
      }

      // Apply the policies to the table
      await this.applyPoliciesToTable(tableName);

      logger.info('Successfully created standard policies', { 
        table_name: tableName, 
        policies_created: policyIds.length 
      });
      return this.createResponse(policyIds);
    } catch (error) {
      logger.error('Error creating standard policies', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  // ====================================================================
  // PREDICTIVE POLICY METHODS
  // ====================================================================

  /**
   * Predict policies for a table based on its structure
   */
  async predictPoliciesForTable(tableName: string): Promise<ServiceResponse<PolicyPrediction[]>> {
    try {
      logger.info('Predicting policies for table', { table_name: tableName });

      const { data, error } = await callRPC('predict_policies_for_table', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to predict policies for table', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully predicted policies for table', { 
        table_name: tableName, 
        predictions_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error predicting policies for table', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Apply predictive policies to a table
   */
  async applyPredictivePolicies(tableName: string): Promise<ServiceResponse<PredictivePolicyResult>> {
    try {
      logger.info('Applying predictive policies to table', { table_name: tableName });

      const { data, error } = await callRPC('apply_predictive_policies', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to apply predictive policies', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully applied predictive policies', { 
        table_name: tableName, 
        result: data 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error applying predictive policies', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Apply predictive policies to all tables
   */
  async applyPredictivePoliciesToAllTables(): Promise<ServiceResponse<PredictivePolicyResult[]>> {
    try {
      logger.info('Applying predictive policies to all tables');

      const { data, error } = await callRPC('apply_predictive_policies_to_all_tables');

      if (error) {
        logger.error('Failed to apply predictive policies to all tables', { error });
        return this.handleError(error);
      }

      logger.info('Successfully applied predictive policies to all tables', { 
        results_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error applying predictive policies to all tables', { error });
      return this.handleError(error);
    }
  }

  /**
   * Ensure a table is development-ready (has policies)
   */
  async ensureTableDevelopmentReady(tableName: string): Promise<ServiceResponse<boolean>> {
    try {
      logger.info('Ensuring table is development ready', { table_name: tableName });

      const { data, error } = await callRPC('ensure_table_development_ready', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to ensure table is development ready', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully ensured table is development ready', { 
        table_name: tableName, 
        is_ready: data 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error ensuring table is development ready', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Get development status for all tables
   */
  async getDevelopmentStatus(): Promise<ServiceResponse<DevelopmentStatus[]>> {
    try {
      logger.info('Getting development status for all tables');

      const { data, error } = await callRPC('get_development_status');

      if (error) {
        logger.error('Failed to get development status', { error });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved development status', { 
        tables_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting development status', { error });
      return this.handleError(error);
    }
  }

  /**
   * Validate table policies
   */
  async validateTablePolicies(tableName: string): Promise<ServiceResponse<PolicyValidation>> {
    try {
      logger.info('Validating table policies', { table_name: tableName });

      const { data, error } = await callRPC('validate_table_policies', {
        p_table_name: tableName
      });

      if (error) {
        logger.error('Failed to validate table policies', { error, table_name: tableName });
        return this.handleError(error);
      }

      logger.info('Successfully validated table policies', { 
        table_name: tableName, 
        validation: data 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error validating table policies', { error, table_name: tableName });
      return this.handleError(error);
    }
  }

  /**
   * Get predictive policy templates
   */
  async getPredictivePolicyTemplates(): Promise<ServiceResponse<PredictivePolicyTemplate[]>> {
    try {
      logger.info('Getting predictive policy templates');

      const { data, error } = await selectData('predictive_policy_templates', {
        filters: { is_active: true },
        orderBy: { column: 'priority', ascending: false }
      });

      if (error) {
        logger.error('Failed to get predictive policy templates', { error });
        return this.handleError(error);
      }

      logger.info('Successfully retrieved predictive policy templates', { 
        templates_count: data?.length || 0 
      });
      return this.createResponse(data);
    } catch (error) {
      logger.error('Error getting predictive policy templates', { error });
      return this.handleError(error);
    }
  }

  /**
   * Create a new predictive policy template
   */
  async createPredictivePolicyTemplate(template: Omit<PredictivePolicyTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<string>> {
    try {
      logger.info('Creating predictive policy template', { template_name: template.template_name });

      const { data, error } = await insertOne('predictive_policy_templates', {
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to create predictive policy template', { error, template });
        return this.handleError(error);
      }

      logger.info('Successfully created predictive policy template', { template_id: data.id });
      return this.createResponse(data.id);
    } catch (error) {
      logger.error('Error creating predictive policy template', { error, template });
      return this.handleError(error);
    }
  }

  /**
   * Update a predictive policy template
   */
  async updatePredictivePolicyTemplate(templateId: string, updates: Partial<PredictivePolicyTemplate>): Promise<ServiceResponse<void>> {
    try {
      logger.info('Updating predictive policy template', { template_id: templateId });

      const { error } = await updateOne('predictive_policy_templates', templateId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to update predictive policy template', { error, template_id: templateId });
        return this.handleError(error);
      }

      logger.info('Successfully updated predictive policy template', { template_id: templateId });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error updating predictive policy template', { error, template_id: templateId });
      return this.handleError(error);
    }
  }

  /**
   * Delete a predictive policy template
   */
  async deletePredictivePolicyTemplate(templateId: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Deleting predictive policy template', { template_id: templateId });

      const { error } = await deleteOne('predictive_policy_templates', templateId);

      if (error) {
        logger.error('Failed to delete predictive policy template', { error, template_id: templateId });
        return this.handleError(error);
      }

      logger.info('Successfully deleted predictive policy template', { template_id: templateId });
      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error deleting predictive policy template', { error, template_id: templateId });
      return this.handleError(error);
    }
  }
}

export const centralizedRLSService = CentralizedRLSService.getInstance();
