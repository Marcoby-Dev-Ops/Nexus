import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { BaseService } from './BaseService';

export interface PolicyTemplate {
  name: string;
  description: string;
  tablePattern: string;
  policyType: 'user_level' | 'company_level' | 'hybrid' | 'readonly' | 'public_read';
}

export interface TablePolicyInfo {
  tableName: string;
  hasUserId: boolean;
  hasCompanyId: boolean;
  hasDeletedAt: boolean;
  currentPolicyType?: string;
  policyCount: number;
  rlsEnabled: boolean;
}

export interface PolicySummary {
  tableName: string;
  policyName: string;
  command: string;
  condition: string;
}

export interface PolicyCoverage {
  tableName: string;
  hasRls: boolean;
  policyCount: number;
  status: 'complete' | 'partial' | 'missing' | 'error';
}

export class CentralizedRLSService extends BaseService {

  /**
   * Get all policy templates available in the system
   */
  async getPolicyTemplates(): Promise<ServiceResponse<PolicyTemplate[]>> {
    try {
      const templates: PolicyTemplate[] = [
        {
          name: 'User-Level Policies',
          description: 'For tables with user_id column - users can only access their own data',
          tablePattern: 'user_id',
          policyType: 'user_level'
        },
        {
          name: 'Company-Level Policies',
          description: 'For tables with company_id column - company members can access company data',
          tablePattern: 'company_id',
          policyType: 'company_level'
        },
        {
          name: 'Hybrid Policies',
          description: 'For tables with both user_id and company_id - users can access own data AND company data',
          tablePattern: 'user_id + company_id',
          policyType: 'hybrid'
        },
        {
          name: 'Read-Only Policies',
          description: 'For analytics and logging tables - authenticated users can read and insert',
          tablePattern: 'none',
          policyType: 'readonly'
        },
        {
          name: 'Public Read Policies',
          description: 'For public reference data - anonymous read, authenticated write',
          tablePattern: 'public',
          policyType: 'public_read'
        }
      ];

      return this.createResponse(templates);
    } catch (error) {
      return this.handleError(error, 'Failed to get policy templates');
    }
  }

  /**
   * Get information about all tables and their current policy status
   */
  async getTablePolicyInfo(): Promise<ServiceResponse<TablePolicyInfo[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_policy_info');
      
      if (error) {
        throw error;
      }

      return this.createResponse(data);
    } catch (error) {
      return this.handleError(error, 'Failed to get table policy info');
    }
  }

  /**
   * Get a summary of all policies in the system
   */
  async getPolicySummary(): Promise<ServiceResponse<PolicySummary[]>> {
    try {
      const { data, error } = await this.supabase.rpc('list_policy_summary');
      
      if (error) {
        throw error;
      }

      return this.createResponse(data);
    } catch (error) {
      return this.handleError(error, 'Failed to get policy summary');
    }
  }

  /**
   * Validate policy coverage across all tables
   */
  async validatePolicyCoverage(): Promise<ServiceResponse<PolicyCoverage[]>> {
    try {
      const { data, error } = await this.supabase.rpc('validate_policy_coverage');
      
      if (error) {
        throw error;
      }

      return this.createResponse(data);
    } catch (error) {
      return this.handleError(error, 'Failed to validate policy coverage');
    }
  }

  /**
   * Apply user-level policies to a specific table
   */
  async applyUserLevelPolicies(tableName: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('apply_user_level_policies', { table_name: tableName });
      
      if (error) {
        throw error;
      }

      this.logger.info(`Applied user-level policies to table: ${tableName}`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to apply user-level policies to ${tableName}`);
    }
  }

  /**
   * Apply company-level policies to a specific table
   */
  async applyCompanyLevelPolicies(tableName: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('apply_company_level_policies', { table_name: tableName });
      
      if (error) {
        throw error;
      }

      this.logger.info(`Applied company-level policies to table: ${tableName}`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to apply company-level policies to ${tableName}`);
    }
  }

  /**
   * Apply hybrid policies to a specific table
   */
  async applyHybridPolicies(tableName: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('apply_hybrid_policies', { table_name: tableName });
      
      if (error) {
        throw error;
      }

      this.logger.info(`Applied hybrid policies to table: ${tableName}`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to apply hybrid policies to ${tableName}`);
    }
  }

  /**
   * Apply read-only policies to a specific table
   */
  async applyReadOnlyPolicies(tableName: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('apply_readonly_policies', { table_name: tableName });
      
      if (error) {
        throw error;
      }

      this.logger.info(`Applied read-only policies to table: ${tableName}`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to apply read-only policies to ${tableName}`);
    }
  }

  /**
   * Apply policies to a new table based on its structure
   */
  async applyPoliciesToNewTable(tableName: string, policyType: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.rpc('apply_policies_to_new_table', { 
        table_name: tableName, 
        policy_type: policyType 
      });
      
      if (error) {
        throw error;
      }

      this.logger.info(`Applied ${policyType} policies to new table: ${tableName}`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to apply policies to new table ${tableName}`);
    }
  }

  /**
   * Migrate all existing policies to the centralized system
   */
  async migrateToCentralizedSystem(): Promise<ServiceResponse<void>> {
    try {
      // Execute the migration script
      const { error } = await supabase.rpc('migrate_to_centralized_rls');
      
      if (error) {
        throw error;
      }

      this.logger.info('Successfully migrated to centralized RLS system');
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, 'Failed to migrate to centralized RLS system');
    }
  }

  /**
   * Get tables that need policy attention
   */
  async getTablesNeedingAttention(): Promise<ServiceResponse<TablePolicyInfo[]>> {
    try {
      const coverageResult = await this.validatePolicyCoverage();
      if (!coverageResult.success) {
        throw new Error('Failed to validate policy coverage');
      }

      const tablesNeedingAttention = coverageResult.data?.filter(
        table => table.status === 'missing' || table.status === 'partial' || table.status === 'error'
      ) || [];

      return this.createResponse(tablesNeedingAttention);
    } catch (error) {
      return this.handleError(error, 'Failed to get tables needing attention');
    }
  }

  /**
   * Get policy statistics
   */
  async getPolicyStatistics(): Promise<ServiceResponse<{
    totalTables: number;
    tablesWithRLS: number;
    totalPolicies: number;
    completeCoverage: number;
    partialCoverage: number;
    missingCoverage: number;
  }>> {
    try {
      const [tableInfo, policySummary, coverage] = await Promise.all([
        this.getTablePolicyInfo(),
        this.getPolicySummary(),
        this.validatePolicyCoverage()
      ]);

      if (!tableInfo.success || !policySummary.success || !coverage.success) {
        throw new Error('Failed to get policy statistics');
      }

      const totalTables = tableInfo.data?.length || 0;
      const tablesWithRLS = tableInfo.data?.filter(t => t.rlsEnabled).length || 0;
      const totalPolicies = policySummary.data?.length || 0;
      
      const completeCoverage = coverage.data?.filter(t => t.status === 'complete').length || 0;
      const partialCoverage = coverage.data?.filter(t => t.status === 'partial').length || 0;
      const missingCoverage = coverage.data?.filter(t => t.status === 'missing').length || 0;

      return this.createResponse({
        totalTables,
        tablesWithRLS,
        totalPolicies,
        completeCoverage,
        partialCoverage,
        missingCoverage
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get policy statistics');
    }
  }

  /**
   * Fix policies for a specific table using centralized standards
   */
  async fixTablePolicies(tableName: string): Promise<ServiceResponse<void>> {
    try {
      // First, get table info to determine the correct policy type
      const tableInfoResult = await this.getTablePolicyInfo();
      if (!tableInfoResult.success) {
        throw new Error('Failed to get table information');
      }

      const tableInfo = tableInfoResult.data?.find(t => t.tableName === tableName);
      if (!tableInfo) {
        throw new Error(`Table ${tableName} not found`);
      }

      // Determine policy type based on table structure
      let policyType: string;
      if (tableInfo.hasUserId && tableInfo.hasCompanyId) {
        policyType = 'hybrid';
      } else if (tableInfo.hasUserId) {
        policyType = 'user_level';
      } else if (tableInfo.hasCompanyId) {
        policyType = 'company_level';
      } else {
        policyType = 'readonly';
      }

      // Apply the appropriate policies
      switch (policyType) {
        case 'user_level':
          await this.applyUserLevelPolicies(tableName);
          break;
        case 'company_level':
          await this.applyCompanyLevelPolicies(tableName);
          break;
        case 'hybrid':
          await this.applyHybridPolicies(tableName);
          break;
        case 'readonly':
          await this.applyReadOnlyPolicies(tableName);
          break;
        default:
          throw new Error(`Unknown policy type: ${policyType}`);
      }

      this.logger.info(`Fixed policies for table ${tableName} using ${policyType} policies`);
      return this.createResponse();
    } catch (error) {
      return this.handleError(error, `Failed to fix policies for table ${tableName}`);
    }
  }

  /**
   * Fix policies for multiple tables that are failing
   */
  async fixFailingTables(tables: string[]): Promise<ServiceResponse<{
    fixed: string[];
    failed: string[];
    errors: Record<string, string>;
  }>> {
    try {
      const results = {
        fixed: [] as string[],
        failed: [] as string[],
        errors: {} as Record<string, string>
      };

      for (const tableName of tables) {
        try {
          const result = await this.fixTablePolicies(tableName);
          if (result.success) {
            results.fixed.push(tableName);
          } else {
            results.failed.push(tableName);
            results.errors[tableName] = result.error || 'Unknown error';
          }
        } catch (error) {
          results.failed.push(tableName);
          results.errors[tableName] = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      this.logger.info(`Fixed policies for ${results.fixed.length} tables, ${results.failed.length} failed`);
      return this.createResponse(results);
    } catch (error) {
      return this.handleError(error, 'Failed to fix failing tables');
    }
  }
}

// Export singleton instance
export const centralizedRLSService = new CentralizedRLSService();
