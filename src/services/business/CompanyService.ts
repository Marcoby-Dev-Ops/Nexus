import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
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
  assigned_by: z.string().uuid(),
  assigned_at: z.string(),
  expires_at: z.string().optional(),
});

export type UserCompanyRole = z.infer<typeof UserCompanyRoleSchema>;

// Company Analytics Schema
export const CompanyAnalyticsSchema = z.object({
  company_id: z.string().uuid(),
  total_users: z.number().nonnegative(),
  active_users: z.number().nonnegative(),
  inactive_users: z.number().nonnegative(),
  departments_count: z.number().nonnegative(),
  avg_session_duration: z.number().nonnegative(),
  most_used_features: z.array(z.string()),
  user_engagement_score: z.number().min(0).max(100),
  security_score: z.number().min(0).max(100),
  compliance_score: z.number().min(0).max(100),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CompanyAnalytics = z.infer<typeof CompanyAnalyticsSchema>;

// Company Health Schema
export const CompanyHealthSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  overall_score: z.number().min(0).max(100),
  security_score: z.number().min(0).max(100),
  compliance_score: z.number().min(0).max(100),
  user_engagement_score: z.number().min(0).max(100),
  system_health_score: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  last_assessment: z.string(),
  next_assessment: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CompanyHealth = z.infer<typeof CompanyHealthSchema>;

/**
 * Company Service Configuration
 */
const companyServiceConfig: ServiceConfig = {
  tableName: 'companies',
  schema: CompanySchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * CompanyService - Handles company management and operations
 *
 * Features:
 * - Company CRUD operations
 * - Department management
 * - Role management
 * - User-company relationships
 * - Company analytics
 * - Health monitoring
 * - Business metrics tracking
 * - Integration management
 */
export class CompanyService extends BaseService implements CrudServiceInterface<Company> {
  protected config = companyServiceConfig;

  constructor() {
    super();
  }

  // CRUD Methods required by CrudServiceInterface
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
        
        if (ownerData) {
          owner = ownerData;
        }
      }
      
      // Get departments
      const { data: departments } = await selectData('departments', {
        filters: { company_id: companyId },
        orderBy: { column: 'name', ascending: true }
      });
      
      // Get analytics
      const { data: analytics } = await selectOne('company_analytics', undefined, {
        filters: { company_id: companyId }
      });
      
      // Get health
      const { data: health } = await selectOne('company_health', undefined, {
        filters: { company_id: companyId }
      });
      
      const companyDetails = {
        company: CompanySchema.parse(company),
        owner,
        departments: departments?.map((dept: any) => DepartmentSchema.parse(dept)) || [],
        analytics: analytics ? CompanyAnalyticsSchema.parse(analytics) : null,
        health: health ? CompanyHealthSchema.parse(health) : null,
      };
      
      return { data: companyDetails, error: null };
    }, 'getCompanyWithDetails');
  }

  /**
   * Get company by domain
   */
  async getCompanyByDomain(domain: string) {
    this.logMethodCall('getCompanyByDomain', { domain });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne('companies', undefined, {
        filters: { domain }
      });
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, 'getCompanyByDomain');
  }

  /**
   * Get companies by industry
   */
  async getCompaniesByIndustry(industry: string) {
    this.logMethodCall('getCompaniesByIndustry', { industry });
    
    return this.list({ industry });
  }

  /**
   * Get companies by size
   */
  async getCompaniesBySize(size: string) {
    this.logMethodCall('getCompaniesBySize', { size });
    
    return this.list({ size });
  }

  /**
   * Search companies by name or description
   */
  async searchCompanies(query: string, filters?: Record<string, any>) {
    this.logMethodCall('searchCompanies', { query, filters });
    
    return this.list({ name: query }); // Assuming name is the field for search
  }

  /**
   * Get company departments
   */
  async getCompanyDepartments(companyId: string) {
    this.logMethodCall('getCompanyDepartments', { companyId });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData('departments', {
        filters: { company_id: companyId },
        orderBy: { column: 'name', ascending: true }
      });
      
      if (error) throw error;
      
      const validatedData = data.map(dept => DepartmentSchema.parse(dept));
      return { data: validatedData, error: null };
    }, 'getCompanyDepartments');
  }

  /**
   * Create department
   */
  async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) {
    this.logMethodCall('createDepartment', { department });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await insertOne('departments', {
        ...department,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      const validatedData = DepartmentSchema.parse(data);
      return { data: validatedData, error: null };
    }, 'createDepartment');
  }

  /**
   * Update department
   */
  async updateDepartment(departmentId: string, updates: Partial<Department>) {
    this.logMethodCall('updateDepartment', { departmentId, updates });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await updateOne('departments', departmentId, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      const validatedData = DepartmentSchema.parse(data);
      return { data: validatedData, error: null };
    }, 'updateDepartment');
  }

  /**
   * Delete department
   */
  async deleteDepartment(departmentId: string) {
    this.logMethodCall('deleteDepartment', { departmentId });
    
    return this.executeDbOperation(async () => {
      const { error } = await deleteOne('departments', departmentId);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, 'deleteDepartment');
  }

  /**
   * Get company roles
   */
  async getCompanyRoles(companyId: string) {
    this.logMethodCall('getCompanyRoles', { companyId });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData('company_roles', {
        filters: { company_id: companyId },
        orderBy: { column: 'name', ascending: true }
      });
      
      if (error) throw error;
      
      const validatedData = data.map(role => CompanyRoleSchema.parse(role));
      return { data: validatedData, error: null };
    }, 'getCompanyRoles');
  }

  /**
   * Create company role
   */
  async createCompanyRole(role: Omit<CompanyRole, 'id' | 'created_at' | 'updated_at'>) {
    this.logMethodCall('createCompanyRole', { role });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await insertOne('company_roles', {
        ...role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      const validatedData = CompanyRoleSchema.parse(data);
      return { data: validatedData, error: null };
    }, 'createCompanyRole');
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(companyId: string) {
    this.logMethodCall('getCompanyAnalytics', { companyId });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne('company_analytics', undefined, {
        filters: { company_id: companyId }
      });
      
      if (error) throw error;
      if (!data) {
        return { data: null as any, error: null };
      }
      const validatedData = CompanyAnalyticsSchema.parse(data);
      return { data: validatedData, error: null };
    }, 'getCompanyAnalytics');
  }

  /**
   * Get company health
   */
  async getCompanyHealth(companyId: string) {
    this.logMethodCall('getCompanyHealth', { companyId });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne('company_health', undefined, {
        filters: { company_id: companyId }
      });
      
      if (error) throw error;
      if (!data) {
        return { data: null as any, error: null };
      }
      const validatedData = CompanyHealthSchema.parse(data);
      return { data: validatedData, error: null };
    }, 'getCompanyHealth');
  }

  /**
   * Transfer company ownership
   */
  async transferOwnership(companyId: string, newOwnerId: string, currentUserId: string) {
    this.logMethodCall('transferOwnership', { companyId, newOwnerId, currentUserId });
    
    return this.executeDbOperation(async () => {
      // Verify current user is the owner
      const { data: company, error: companyError } = await selectOne('companies', companyId, {
        filters: { owner_id: currentUserId }
      });
      
      if (companyError || !company) {
        throw new Error('Only the current owner can transfer ownership');
      }
      
      // Verify new owner exists and belongs to the company
      const { data: newOwner, error: newOwnerError } = await selectOne('user_profiles', newOwnerId);
      
      if (newOwnerError || !newOwner) {
        throw new Error('New owner not found');
      }
      
      if (newOwner.company_id !== companyId) {
        throw new Error('New owner must belong to the company');
      }
      
      // Transfer ownership
      const { data: updatedCompany, error: updateError } = await updateOne('companies', companyId, {
        owner_id: newOwnerId,
        updated_at: new Date().toISOString()
      });
      
      if (updateError) throw updateError;
      
      const validatedData = this.config.schema.parse(updatedCompany);
      return { data: validatedData, error: null };
    }, 'transferOwnership');
  }

  /**
   * Get companies by owner
   */
  async getCompaniesByOwner(ownerId: string) {
    this.logMethodCall('getCompaniesByOwner', { ownerId });
    
    return this.list({ owner_id: ownerId });
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string) {
    this.logMethodCall('getCompanyStats', { companyId });
    
    return this.executeDbOperation(async () => {
      // Get user count
      const { data: users } = await selectData('user_profiles', {
        filters: { company_id: companyId }
      });
      const userCount = users?.length || 0;
      
      // Get department count
      const { data: departments } = await selectData('departments', {
        filters: { company_id: companyId }
      });
      const departmentCount = departments?.length || 0;
      
      // Get role count
      const { data: roles } = await selectData('company_roles', {
        filters: { company_id: companyId }
      });
      const roleCount = roles?.length || 0;
      
      // Get connected integrations
      const { data: integrations } = await selectData('user_integrations', {
        filters: { company_id: companyId, status: 'connected' }
      });
      const integrationCount = integrations?.length || 0;
      
      const stats = {
        userCount: userCount || 0,
        departmentCount: departmentCount || 0,
        roleCount: roleCount || 0,
        integrationCount: integrationCount || 0,
      };
      
      return { data: stats, error: null };
    }, 'getCompanyStats');
  }
}

// Export singleton instance
export const companyService = new CompanyService(); 
