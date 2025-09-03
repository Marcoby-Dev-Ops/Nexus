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
  owner_id: z.string().nullish(), // Accept any string format (UUID or hash)
  
  // Business Information
  business_phone: z.string().nullish(),
  duns_number: z.string().nullish(),
  ein: z.string().nullish(), // Employer Identification Number
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
  user_id: z.string(), // Accept any string format (UUID or hash)
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
      return { data: validatedData, error: null, success: true };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<Company>): Promise<ServiceResponse<Company>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      // Note: Company name uniqueness validation removed to allow multiple companies with same name
      // This is common in real-world scenarios where different organizations may have similar names

      // Validate EIN if provided
      if (data.ein) {
        const { data: existingEIN, error: einSearchError } = await selectData('companies', 'id, name');
        
        if (einSearchError) {
          return { data: null, error: `Failed to validate EIN: ${einSearchError}`, success: false };
        }
        
        // Filter by EIN manually
        const einMatches = existingEIN?.filter((company: any) => 
          company.ein === data.ein
        ) || [];
        
        if (einMatches.length > 0) {
          return { data: null, error: `Company with EIN "${data.ein}" already exists`, success: false };
        }
      }

      // Validate domain if provided
      if (data.domain) {
        const { data: existingDomain, error: domainSearchError } = await selectData('companies', 'id, name');
        
        if (domainSearchError) {
          return { data: null, error: `Failed to validate domain: ${domainSearchError}`, success: false };
        }
        
        // Filter by domain manually
        const domainMatches = existingDomain?.filter((company: any) => 
          company.domain?.toLowerCase() === data.domain?.toLowerCase()
        ) || [];
        
        if (domainMatches.length > 0) {
          return { data: null, error: `Company with domain "${data.domain}" already exists`, success: false };
        }
      }

      const { data: result, error } = await insertOne('companies', {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null, success: true };
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
      return { data: validatedData, error: null, success: true };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const { error } = await deleteOne('companies', id);
      if (error) throw error;
      return { data: true, error: null, success: true };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<Company[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData('companies', '*', filters);
      if (error) throw new Error(error);
      if (!data) throw new Error('No data returned');
      const validatedData = data.map((item: any) => this.config.schema.parse(item));
      return { data: validatedData, error: null, success: true };
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
      const { data: profile, error: profileError } = await selectOne('user_profiles', userId, 'company_id, role, first_name, last_name, email');

      if (profileError) {
        logger.error('Error checking user profile:', profileError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to check user profile',
          error: profileError
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: false };
      }

      // If user already has a company, return success
      if ((profile as any)?.company_id) {
        const result: ProvisioningResult = {
          success: true,
          companyId: (profile as any).company_id,
          action: 'found',
          message: 'User already associated with company'
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: true };
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
        return { data: ProvisioningResultSchema.parse(result), error: null, success: true };
      }

      // Default: create personal workspace
      return await this.createPersonalCompany(userId, profile as any);
    }, `ensure company association for user ${userId}`);
  }

  /**
   * Get or create company for user
   */
  async getOrCreateCompany(userId: string): Promise<ServiceResponse<{ companyId: string | null; error: string | null }>> {
    return this.executeDbOperation(async () => {
      const { data: profile, error: profileError } = await selectOne('user_profiles', userId, 'company_id');

      if (profileError) {
        return { data: { companyId: null, error: profileError }, error: null, success: false };
      }

      if ((profile as any)?.company_id) {
        return { data: { companyId: (profile as any).company_id, error: null as string | null }, error: null, success: true };
      }

      // Create a personal company
      const { data: company, error: companyError } = await insertOne('companies', {
        name: 'My Business',
        industry: 'Personal',
        size: '1',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (companyError) {
        return { data: { companyId: null, error: companyError }, error: null, success: false };
      }

      // Update user profile
      const { error: updateError } = await updateOne('user_profiles', userId, {
        company_id: (company as any).id,
        role: 'owner',
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        return { data: { companyId: null, error: updateError }, error: null, success: false };
      }

      return { data: { companyId: (company as any).id, error: null as string | null }, error: null, success: true };
    }, `get or create company for user ${userId}`);
  }

  // ====================================================================
  // COMPANY CREATION WITH ADMIN ROLE
  // ====================================================================

  /**
   * Create a new company and assign the first user as admin
   * This is the primary method for creating companies with proper role assignment
   */
  async createCompanyWithAdmin(
    userId: string,
    companyData: {
      name: string;
      industry?: string;
      size?: string;
      description?: string;
      website?: string;
    }
  ): Promise<ServiceResponse<{ companyId: string; isAdmin: boolean }>> {
    return this.executeDbOperation(async () => {
      // Check if user already has a company
      const { data: existingProfile, error: profileError } = await selectOne('user_profiles', userId, 'company_id, role');
      
      if (profileError) {
        return { data: null, error: profileError, success: false };
      }

      if ((existingProfile as any)?.company_id) {
        return { 
          data: { companyId: (existingProfile as any).company_id, isAdmin: (existingProfile as any).role === 'admin' }, 
          error: null, 
          success: true 
        };
      }

      // Create the company
      const { data: company, error: companyError } = await insertOne('companies', {
        name: companyData.name,
        industry: companyData.industry || 'Technology',
        size: companyData.size || '1-10',
        description: companyData.description,
        website: companyData.website,
        owner_id: userId, // Set the creator as owner
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (companyError) {
        return { data: null, error: companyError, success: false };
      }

      // Associate user with company as admin
      const { error: updateError } = await updateOne('user_profiles', userId, {
        company_id: (company as any).id,
        role: 'admin', // First user becomes admin
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        // Rollback company creation if user association fails
        await deleteOne('companies', (company as any).id);
        return { data: null, error: updateError, success: false };
      }

      return { 
        data: { companyId: (company as any).id, isAdmin: true }, 
        error: null, 
        success: true 
      };
    }, `create company with admin for user ${userId}`);
  }

  /**
   * Find company owned by a specific user
   */
  async getCompanyByOwner(userId: string): Promise<ServiceResponse<Company | null>> {
    return this.executeDbOperation(async () => {
      const { data: companies, error } = await selectData('companies', '*', { owner_id: userId });
      
      if (error) {
        return { data: null, error, success: false };
      }

      if (!companies || companies.length === 0) {
        return { data: null, error: null, success: true };
      }

      // Return the first company owned by this user
      const validatedData = this.config.schema.parse(companies[0]);
      return { data: validatedData, error: null, success: true };
    }, `get company by owner ${userId}`);
  }

  /**
   * Add a user to an existing company with a specific role
   */
  async addUserToCompany(
    userId: string,
    companyId: string,
    role: 'admin' | 'owner' | 'manager' | 'member' = 'member'
  ): Promise<ServiceResponse<{ success: boolean; role: string }>> {
    return this.executeDbOperation(async () => {
      // Check if company exists
      const { data: company, error: companyError } = await selectOne('companies', companyId);
      
      if (companyError || !company) {
        return { data: null, error: 'Company not found', success: false };
      }

      // Check if user is already associated with a company
      const { data: userProfile, error: profileError } = await selectOne('user_profiles', userId, 'company_id, role');
      
      if (profileError) {
        return { data: null, error: profileError, success: false };
      }

      if ((userProfile as any)?.company_id) {
        return { data: null, error: 'User is already associated with a company', success: false };
      }

      // Associate user with company
      const { error: updateError } = await updateOne('user_profiles', userId, {
        company_id: companyId,
        role: role,
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        return { data: null, error: updateError, success: false };
      }

      return { 
        data: { success: true, role }, 
        error: null, 
        success: true 
      };
    }, `add user ${userId} to company ${companyId} with role ${role}`);
  }

  /**
   * Get company members with their roles
   */
  async getCompanyMembers(companyId: string): Promise<ServiceResponse<Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isAdmin: boolean;
  }>>> {
    return this.executeDbOperation(async () => {
      const { data: members, error } = await selectData('user_profiles', 'user_id, first_name, last_name, email, role', {
        company_id: companyId
      });

      if (error) {
        return { data: null, error: error, success: false };
      }

      const formattedMembers = (members || []).map((member: any) => ({
        userId: member.user_id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        role: member.role,
        isAdmin: member.role === 'admin' || member.role === 'owner'
      }));

      return { 
        data: formattedMembers, 
        error: null, 
        success: true 
      };
    }, `get company members for company ${companyId}`);
  }

  /**
   * Check if user is admin of their company
   */
  async isUserCompanyAdmin(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { data: profile, error } = await selectOne('user_profiles', userId, 'company_id, role');
      
      if (error || !profile) {
        return { data: false, error: error || 'User profile not found', success: true };
      }

      const isAdmin = (profile as any).role === 'admin' || (profile as any).role === 'owner';
      return { data: isAdmin, error: null, success: true };
    }, `check if user ${userId} is company admin`);
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
      
      if (companyError) throw new Error(companyError);
      
      // Get owner
      let owner = null;
      if ((company as any).owner_id) {
        const { data: ownerData } = await selectOne('user_profiles', (company as any).owner_id);
        owner = ownerData;
      }
      
      // Get departments
      const { data: departments } = await selectData('departments', '*', {
        company_id: companyId
      });
      
      // Get company roles
      const { data: roles } = await selectData('company_roles', '*', {
        company_id: companyId
      });
      
      // Get user company roles
      const { data: userRoles } = await selectData('user_company_roles', '*', {
        company_id: companyId
      });
      
      return {
        data: {
          company,
          owner,
          departments: departments || [],
          roles: roles || [],
          userRoles: userRoles || []
        },
        error: null,
        success: true
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
      
      if (companyError) throw new Error(companyError);
      
      // Calculate health metrics based on company data
      const metrics = {
        financial: this.calculateFinancialHealth(company as any),
        operational: this.calculateOperationalHealth(company as any),
        customer: this.calculateCustomerHealth(company as any),
        growth: this.calculateGrowthHealth(company as any),
      };
      
      const overallScore = Math.round(
        (metrics.financial + metrics.operational + metrics.customer + metrics.growth) / 4
      );
      
      const recommendations = this.generateRecommendations(company as any, metrics);
      
      const health: CompanyHealth = {
        companyId,
        overallScore,
        metrics,
        recommendations,
        lastUpdated: new Date().toISOString(),
      };
      
      return { data: CompanyHealthSchema.parse(health), error: null, success: true };
    }, `get company health ${companyId}`);
  }

  /**
   * Get company departments
   */
  async getCompanyDepartments(companyId: string): Promise<ServiceResponse<Department[]>> {
    this.logMethodCall('getCompanyDepartments', { companyId });
    
    // Return empty array for now - departments feature not yet implemented
    return { data: [], error: null, success: true };
  }

  /**
   * Get company roles
   */
  async getCompanyRoles(companyId: string): Promise<ServiceResponse<CompanyRole[]>> {
    this.logMethodCall('getCompanyRoles', { companyId });
    
    // Return empty array for now - roles feature not yet implemented
    return { data: [], error: null, success: true };
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(companyId: string): Promise<ServiceResponse<any>> {
    this.logMethodCall('getCompanyAnalytics', { companyId });
    
    return this.executeDbOperation(async () => {
      // Get company data
      const { data: company, error: companyError } = await selectOne('companies', companyId);
      
      if (companyError) throw new Error(companyError);
      
      const companyData = company as any;
      // Calculate basic analytics from company data
      const analytics = {
        companyId,
        employeeCount: companyData.employee_count || 0,
        mrr: companyData.mrr || 0,
        growthStage: companyData.growth_stage || 'unknown',
        industry: companyData.industry || 'unknown',
        size: companyData.size || 'unknown',
        websiteVisitors: companyData.website_visitors_month || 0,
        csat: companyData.csat || 0,
        grossMargin: companyData.gross_margin || 0,
        lastUpdated: new Date().toISOString(),
      };
      
      return { data: analytics, error: null, success: true };
    }, `get company analytics ${companyId}`);
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

      const { data: company, error: companyError } = await insertOne('companies', {
        name: companyName,
        industry: options.industry || 'Technology',
        size: options.size || '1-10',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (companyError) {
        logger.error('Error creating default company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create default company',
          error: companyError
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: false };
      }

      // Update user profile with company association
      const { error: updateError } = await updateOne('user_profiles', userId, {
        company_id: (company as any).id,
        role: 'owner',
        updated_at: new Date().toISOString(),
        ...(options.jobTitle && { job_title: options.jobTitle })
      });

      if (updateError) {
        logger.error('Error updating user profile:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to update user profile',
          error: updateError
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: false };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: (company as any).id,
        action: 'created',
        message: 'Default company created successfully'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null, success: true };
    }, `create default company for user ${userId}`);
  }

  /**
   * Create personal company for user
   */
  private async createPersonalCompany(userId: string, profile: any): Promise<ServiceResponse<ProvisioningResult>> {
    return this.executeDbOperation(async () => {
      const { data: company, error: companyError } = await insertOne('companies', {
        name: 'My Business',
        industry: 'Personal',
        size: '1',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (companyError) {
        logger.error('Error creating personal company:', companyError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to create personal company',
          error: companyError
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: false };
      }

      // Update user profile
      const { error: updateError } = await updateOne('user_profiles', userId, {
        company_id: (company as any).id,
        role: 'owner',
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        logger.error('Error updating user profile:', updateError);
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to update user profile',
          error: updateError
        };
        return { data: ProvisioningResultSchema.parse(result), error: null, success: false };
      }

      const result: ProvisioningResult = {
        success: true,
        companyId: (company as any).id,
        action: 'created',
        message: 'Personal company created successfully'
      };
      return { data: ProvisioningResultSchema.parse(result), error: null, success: true };
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
