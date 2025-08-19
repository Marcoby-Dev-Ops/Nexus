import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

// Company Schema
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  domain: z.string().nullish(),
  industry: z.string().nullish(),
  size: z.string().nullish(),
  logo_url: z.string().url().nullish(),
  website: z.string().url().nullish(),
  description: z.string().max(1000).nullish(),
  owner_id: z.string().uuid().nullish(),
  
  // Business Information
  business_phone: z.string().nullish(),
  duns_number: z.string().nullish(),
  employee_count: z.number().positive().nullish(),
  founded: z.string().nullish(),
  headquarters: z.string().nullish(),
  fiscal_year_end: z.string().nullish(),
  growth_stage: z.string().nullish(),
  
  // Social and Marketing
  social_profiles: z.array(z.string()).nullish(),
  specialties: z.array(z.string()).nullish(),
  followers_count: z.number().nonnegative().nullish(),
  client_base_description: z.string().nullish(),
  
  // Business Metrics
  mrr: z.number().nonnegative().nullish(),
  burn_rate: z.number().nullish(),
  cac: z.number().nonnegative().nullish(),
  gross_margin: z.number().min(0).max(100).nullish(),
  csat: z.number().min(0).max(100).nullish(),
  avg_deal_cycle_days: z.number().positive().nullish(),
  avg_first_response_mins: z.number().positive().nullish(),
  on_time_delivery_pct: z.number().min(0).max(100).nullish(),
  website_visitors_month: z.number().nonnegative().nullish(),
  
  // Integrations and Systems
  inventory_management_system: z.string().nullish(),
  hubspotid: z.string().nullish(),
  
  // Settings and Configuration
  settings: z.record(z.any()).nullish(),
  address: z.record(z.any()).nullish(),
  key_metrics: z.record(z.any()).nullish(),
  
  // Metadata
  created_at: z.string(),
  updated_at: z.string(),
});

export type Company = z.infer<typeof CompanySchema>;

// Department Schema
export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  manager_id: z.string().uuid().optional(),
  parent_department_id: z.string().uuid().optional(),
  budget: z.number().nonnegative().optional(),
  headcount: z.number().nonnegative().optional(),
  goals: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;

// Company Role Schema
export const CompanyRoleSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  is_system_role: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CompanyRole = z.infer<typeof CompanyRoleSchema>;

// User Company Role Schema
export const UserCompanyRoleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  role_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  is_primary: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserCompanyRole = z.infer<typeof UserCompanyRoleSchema>;

// Company Health Schema
export const CompanyHealthSchema = z.object({
  companyId: z.string(),
  overallScore: z.number().min(0).max(100),
  metrics: z.object({
    financial: z.number().min(0).max(100),
    operational: z.number().min(0).max(100),
    customer: z.number().min(0).max(100),
    growth: z.number().min(0).max(100),
  }),
  recommendations: z.array(z.string()),
  lastUpdated: z.string(),
});

export type CompanyHealth = z.infer<typeof CompanyHealthSchema>;

// Company Provisioning Schemas
export const CompanyProvisioningOptionsSchema = z.object({
  createDefaultCompany: z.boolean().optional(),
  redirectToOnboarding: z.boolean().optional(),
  silentMode: z.boolean().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

export const ProvisioningResultSchema = z.object({
  success: z.boolean(),
  companyId: z.string().optional(),
  action: z.enum(['found', 'created', 'redirected', 'failed']),
  message: z.string(),
  error: z.string().optional(),
});

export type CompanyProvisioningOptions = z.infer<typeof CompanyProvisioningOptionsSchema>;
export type ProvisioningResult = z.infer<typeof ProvisioningResultSchema>;

// Service Configuration
const companyServiceConfig: ServiceConfig = {
  tableName: 'companies',
  schema: CompanySchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * Consolidated CompanyService - Handles company management, operations, and provisioning
 *
 * Features:
 * - Company CRUD operations
 * - Department management
 * - Role management
 * - User-company relationships
 * - Company analytics and health monitoring
 * - Business metrics tracking
 * - Integration management
 * - Company provisioning and association
 * - Graceful fallbacks for users without companies
 */
export class CompanyService extends BaseService implements CrudServiceInterface<Company> {
  protected config = companyServiceConfig;
  private queryWrapper = new DatabaseQueryWrapper();

  constructor() {
    super();
  }

  // ====================================================================
  // CRUD OPERATIONS
  // ====================================================================

  async get(id: string): Promise<ServiceResponse<Company>> {
    this.logMethodCall('get', { id });
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne('companies', id);
      if (error) throw error;
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<Company>): Promise<ServiceResponse<Company>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await insertOne('companies', {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  async update(id: string, data: Partial<Company>): Promise<ServiceResponse<Company>> {
    this.logMethodCall('update', { id, data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await updateOne('companies', id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const { error } = await deleteOne('companies', id);
      if (error) throw error;
      return { data: true, error: null };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<Company[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData('companies', {
        filters: filters || undefined
      });
      if (error) throw error;
      const validatedData = data.map((item: any) => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  // ====================================================================
  // COMPANY PROVISIONING OPERATIONS
  // ====================================================================

  /**
   * Ensure user has a company association
   */
  async ensureCompanyAssociation(
    userId: string, 
    options: CompanyProvisioningOptions = {}
  ): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      // Check if user already has a company
      const { data: profile, error: profileError } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_profiles')
          .select('company_id, role, first_name, last_name, email')
          .eq('id', userId)
          .single(),
        userId,
        'check-company-association'
      );

      if (profileError) {
        logger.error('Error checking user profile:', profileError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to check user profile',
          error: profileError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // If user already has a company, return success
      if (profile?.company_id) {
        const result: ProvisioningResult = {
          success: true,
          companyId: profile.company_id,
          action: 'found',
          message: 'User already associated with company'
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // User doesn't have a company - handle based on options
      if (options.createDefaultCompany) {
        return await this.createDefaultCompany(userId, profile, options);
      }

      if (options.redirectToOnboarding) {
        const result: ProvisioningResult = {
          success: true,
          action: 'redirected',
          message: 'Redirecting to onboarding'
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Default: create personal workspace
      return await this.createPersonalCompany(userId, profile);
    }, `ensure company association for user ${userId}`);
  }

  /**
   * Get or create company for user
   */
  async getOrCreateCompany(userId: string): Promise<ServiceResponse<{ companyId: string | null; error: string | null }>> {
    return this.executeDbOperation(async () => {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { data: { companyId: null, error: profileError.message }, error: null };
      }

      if (profile?.company_id) {
        return { data: { companyId: profile.company_id, error: null }, error: null };
      }

      // Create a personal company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'My Business',
          industry: 'Personal',
          size: '1',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        return { data: { companyId: null, error: companyError.message }, error: null };
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return { data: { companyId: null, error: updateError.message }, error: null };
      }

      return { data: { companyId: company.id, error: null }, error: null };
    }, `get or create company for user ${userId}`);
  }

  // ====================================================================
  // COMPANY MANAGEMENT OPERATIONS
  // ====================================================================

  /**
   * Get company with full details including owner, departments, and analytics
   */
  async getCompanyWithDetails(companyId: string) {
    this.logMethodCall('getCompanyWithDetails', { companyId });
    
    return this.executeDbOperation(async () => {
      // Get company
      const { data: company, error: companyError } = await selectOne('companies', companyId);
      
      if (companyError) throw companyError;
      
      // Get owner
      let owner = null;
      if (company.owner_id) {
        const { data: ownerData } = await selectOne('user_profiles', company.owner_id);
        owner = ownerData;
      }
      
      // Get departments
      const { data: departments } = await selectData('departments', {
        filters: { company_id: companyId }
      });
      
      // Get company roles
      const { data: roles } = await selectData('company_roles', {
        filters: { company_id: companyId }
      });
      
      // Get user company roles
      const { data: userRoles } = await selectData('user_company_roles', {
        filters: { company_id: companyId }
      });
      
      return {
        data: {
          company,
          owner,
          departments: departments || [],
          roles: roles || [],
          userRoles: userRoles || []
        },
        error: null
      };
    }, `get company details ${companyId}`);
  }

  /**
   * Get company health metrics
   */
  async getCompanyHealth(companyId: string): Promise<ServiceResponse<CompanyHealth>> {
    this.logMethodCall('getCompanyHealth', { companyId });
    
    return this.executeDbOperation(async () => {
      // Get company data
      const { data: company, error: companyError } = await selectOne('companies', companyId);
      
      if (companyError) throw companyError;
      
      // Calculate health metrics based on company data
      const metrics = {
        financial: this.calculateFinancialHealth(company),
        operational: this.calculateOperationalHealth(company),
        customer: this.calculateCustomerHealth(company),
        growth: this.calculateGrowthHealth(company),
      };
      
      const overallScore = Math.round(
        (metrics.financial + metrics.operational + metrics.customer + metrics.growth) / 4
      );
      
      const recommendations = this.generateRecommendations(company, metrics);
      
      const health: CompanyHealth = {
        companyId,
        overallScore,
        metrics,
        recommendations,
        lastUpdated: new Date().toISOString(),
      };
      
      return { data: CompanyHealthSchema.parse(health), error: null };
    }, `get company health ${companyId}`);
  }

  // ====================================================================
  // PRIVATE HELPER METHODS
  // ====================================================================

  /**
   * Create a default company for the user
   */
  private async createDefaultCompany(userId: string, profile: any, options: CompanyProvisioningOptions): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      const companyName = options.companyName || (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}'s Company`
        : profile?.email
        ? `${profile.email.split('@')[0]}'s Company`
        : 'My Company');

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          industry: options.industry || 'Technology',
          size: options.size || '1-10',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        logger.error('Error creating default company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create default company',
          error: companyError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Update user profile with company association
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString(),
          ...(options.jobTitle && { job_title: options.jobTitle })
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to update user profile',
          error: updateError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: company.id,
        action: 'created',
        message: 'Default company created successfully'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null };
    }, `create default company for user ${userId}`);
  }

  /**
   * Create personal company for user
   */
  private async createPersonalCompany(userId: string, profile: any): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'My Business',
          industry: 'Personal',
          size: '1',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        logger.error('Error creating personal company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create personal company',
          error: companyError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to update user profile',
          error: updateError.message
        };
        return { data: ProvisioningResultSchema.parse(result), error: null };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: company.id,
        action: 'created',
        message: 'Personal company created successfully'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null };
    }, `create personal company for user ${userId}`);
  }

  /**
   * Calculate financial health score
   */
  private calculateFinancialHealth(company: any): number {
    let score = 50; // Base score
    
    if (company.mrr && company.mrr > 0) score += 20;
    if (company.gross_margin && company.gross_margin > 50) score += 15;
    if (company.burn_rate && company.burn_rate < 0.1) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate operational health score
   */
  private calculateOperationalHealth(company: any): number {
    let score = 50; // Base score
    
    if (company.avg_deal_cycle_days && company.avg_deal_cycle_days < 30) score += 20;
    if (company.avg_first_response_mins && company.avg_first_response_mins < 60) score += 15;
    if (company.on_time_delivery_pct && company.on_time_delivery_pct > 90) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate customer health score
   */
  private calculateCustomerHealth(company: any): number {
    let score = 50; // Base score
    
    if (company.csat && company.csat > 80) score += 25;
    if (company.followers_count && company.followers_count > 100) score += 15;
    if (company.client_base_description) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate growth health score
   */
  private calculateGrowthHealth(company: any): number {
    let score = 50; // Base score
    
    if (company.employee_count && company.employee_count > 1) score += 20;
    if (company.website_visitors_month && company.website_visitors_month > 1000) score += 15;
    if (company.specialties && company.specialties.length > 0) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate recommendations based on company data and metrics
   */
  private generateRecommendations(company: any, metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.financial < 70) {
      recommendations.push('Consider implementing better financial tracking and metrics');
    }
    
    if (metrics.operational < 70) {
      recommendations.push('Optimize operational processes to improve efficiency');
    }
    
    if (metrics.customer < 70) {
      recommendations.push('Focus on improving customer satisfaction and engagement');
    }
    
    if (metrics.growth < 70) {
      recommendations.push('Develop growth strategies and expand market presence');
    }
    
    if (!company.website) {
      recommendations.push('Create a professional website to establish online presence');
    }
    
    if (!company.specialties || company.specialties.length === 0) {
      recommendations.push('Define your company specialties to better target customers');
    }
    
    return recommendations;
  }
}

// Create and export service instance
export const companyService = new CompanyService();
