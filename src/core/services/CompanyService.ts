import { z } from 'zod';
import { UnifiedService } from './UnifiedService';
import { ServiceConfig } from './interfaces';

// Company Schema
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  owner_id: z.string().uuid().optional(),
  
  // Business Information
  business_phone: z.string().optional(),
  duns_number: z.string().optional(),
  employee_count: z.number().positive().optional(),
  founded: z.string().optional(),
  headquarters: z.string().optional(),
  fiscal_year_end: z.string().optional(),
  growth_stage: z.string().optional(),
  
  // Social and Marketing
  social_profiles: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  followers_count: z.number().nonnegative().optional(),
  client_base_description: z.string().optional(),
  
  // Business Metrics
  mrr: z.number().nonnegative().optional(),
  burn_rate: z.number().optional(),
  cac: z.number().nonnegative().optional(),
  gross_margin: z.number().min(0).max(100).optional(),
  csat: z.number().min(0).max(100).optional(),
  avg_deal_cycle_days: z.number().positive().optional(),
  avg_first_response_mins: z.number().positive().optional(),
  on_time_delivery_pct: z.number().min(0).max(100).optional(),
  website_visitors_month: z.number().nonnegative().optional(),
  
  // Integrations and Systems
  inventory_management_system: z.string().optional(),
  hubspotid: z.string().optional(),
  
  // Settings and Configuration
  settings: z.record(z.any()).optional(),
  address: z.record(z.any()).optional(),
  key_metrics: z.record(z.any()).optional(),
  
  // Metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  assigned_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
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
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  last_assessment: z.string().datetime(),
  next_assessment: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CompanyHealth = z.infer<typeof CompanyHealthSchema>;

/**
 * Company Service Configuration
 */
const companyServiceConfig: ServiceConfig = {
  tableName: 'companies',
  schema: CompanySchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

/**
 * Modernized Company Service
 * Extends UnifiedService for consistent CRUD operations
 */
export class CompanyService extends UnifiedService<Company> {
  protected config = companyServiceConfig;

  /**
   * Get company with full details including owner, departments, and analytics
   */
  async getCompanyWithDetails(companyId: string) {
    this.logMethodCall('getCompanyWithDetails', { companyId });
    
    return this.executeDbOperation(async () => {
      // Get company
      const { data: company, error: companyError } = await this.supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (companyError) throw companyError;
      
      // Get owner
      let owner = null;
      if (company.owner_id) {
        const { data: ownerData } = await this.supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .eq('id', company.owner_id)
          .single();
        
        if (ownerData) {
          owner = ownerData;
        }
      }
      
      // Get departments
      const { data: departments } = await this.supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      // Get analytics
      const { data: analytics } = await this.supabase
        .from('company_analytics')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      // Get health
      const { data: health } = await this.supabase
        .from('company_health')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      const companyDetails = {
        company: CompanySchema.parse(company),
        owner,
        departments: departments?.map(dept => DepartmentSchema.parse(dept)) || [],
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
      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('domain', domain)
        .single();
      
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
    
    return this.search(query, filters);
  }

  /**
   * Get company departments
   */
  async getCompanyDepartments(companyId: string) {
    this.logMethodCall('getCompanyDepartments', { companyId });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
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
      const { data, error } = await this.supabase
        .from('departments')
        .insert({
          ...department,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
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
      const { data, error } = await this.supabase
        .from('departments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', departmentId)
        .select()
        .single();
      
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
      const { error } = await this.supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);
      
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
      const { data, error } = await this.supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
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
      const { data, error } = await this.supabase
        .from('company_roles')
        .insert({
          ...role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
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
      const { data, error } = await this.supabase
        .from('company_analytics')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      
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
      const { data, error } = await this.supabase
        .from('company_health')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      
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
      const { data: company, error: companyError } = await this.supabase
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .eq('owner_id', currentUserId)
        .single();
      
      if (companyError || !company) {
        throw new Error('Only the current owner can transfer ownership');
      }
      
      // Verify new owner exists and belongs to the company
      const { data: newOwner, error: newOwnerError } = await this.supabase
        .from('user_profiles')
        .select('id, company_id')
        .eq('id', newOwnerId)
        .single();
      
      if (newOwnerError || !newOwner) {
        throw new Error('New owner not found');
      }
      
      if (newOwner.company_id !== companyId) {
        throw new Error('New owner must belong to the company');
      }
      
      // Transfer ownership
      const { data: updatedCompany, error: updateError } = await this.supabase
        .from('companies')
        .update({
          owner_id: newOwnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)
        .select()
        .single();
      
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
      const { count: userCount } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      
      // Get department count
      const { count: departmentCount } = await this.supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      
      // Get role count
      const { count: roleCount } = await this.supabase
        .from('company_roles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      
      // Get active integrations
      const { count: integrationCount } = await this.supabase
        .from('user_integrations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');
      
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

// Create and export service instance
export const companyService = new CompanyService(); 