/**
 * Company Service - Client-side company management
 * 
 * Provides unified company management with:
 * - Business identity operations
 * - Company profile operations  
 * - Company health monitoring
 * - AI context management
 * - Real-time updates and caching
 */

import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC } from '@/lib/database';
import type { ApiResponse as ServiceApiSuccessResponse } from '@/core/types/errors';

// ============================================================================
// SCHEMAS
// ============================================================================

// Company Foundation Schema
export const CompanyFoundationSchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().optional(),
  legalStructure: z.enum(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship', 'Other']).default('LLC'),
  foundedDate: z.string().optional(),
  headquarters: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  businessModel: z.enum(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Other']).default('B2B'),
  companyStage: z.enum(['Startup', 'Growth', 'Mature', 'Enterprise']).default('Startup'),
  companySize: z.enum(['Small (2-10)', 'Medium (11-50)', 'Large (51-200)', 'Enterprise (200+)']).default('Small (2-10)'),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  socialMedia: z.record(z.string()).optional(),
});

// Mission, Vision, Values Schema
export const MissionVisionValuesSchema = z.object({
  missionStatement: z.string().optional(),
  visionStatement: z.string().optional(),
  purpose: z.string().optional(),
  coreValues: z.array(z.string()).optional(),
  companyCulture: z.object({
    workStyle: z.array(z.string()).optional(),
    communicationStyle: z.array(z.string()).optional(),
    decisionMaking: z.string().optional(),
    innovationApproach: z.string().optional(),
  }).optional(),
  brandPersonality: z.array(z.string()).optional(),
  brandVoice: z.object({
    tone: z.string().optional(),
    style: z.string().optional(),
    examples: z.array(z.string()).optional(),
  }).optional(),
});

// Products and Services Schema
export const ProductsServicesSchema = z.object({
  offerings: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    pricing: z.string().optional(),
    targetMarket: z.string().optional(),
  })).optional(),
  uniqueValueProposition: z.string().optional(),
  competitiveAdvantages: z.array(z.string()).optional(),
  differentiators: z.array(z.string()).optional(),
  productRoadmap: z.array(z.object({
    feature: z.string(),
    timeline: z.string().optional(),
    priority: z.enum(['High', 'Medium', 'Low']).optional(),
    status: z.enum(['Planned', 'In Progress', 'Completed']).optional(),
  })).optional(),
});

// Target Market Schema
export const TargetMarketSchema = z.object({
  totalAddressableMarket: z.object({
    size: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  serviceableAddressableMarket: z.object({
    size: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  serviceableObtainableMarket: z.object({
    size: z.string().optional(),
    percentage: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
  customerSegments: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    size: z.string().optional(),
    characteristics: z.array(z.string()).optional(),
  })).optional(),
  idealCustomerProfile: z.object({
    demographics: z.object({
      industry: z.array(z.string()).optional(),
      companySize: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
      revenue: z.array(z.string()).optional(),
    }).optional(),
    psychographics: z.object({
      painPoints: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
      challenges: z.array(z.string()).optional(),
      motivations: z.array(z.string()).optional(),
    }).optional(),
    behavior: z.object({
      buyingProcess: z.string().optional(),
      decisionFactors: z.array(z.string()).optional(),
      preferredChannels: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  personas: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    demographics: z.record(z.any()).optional(),
    psychographics: z.record(z.any()).optional(),
    behavior: z.array(z.string()).optional(),
    preferredChannels: z.array(z.string()).optional(),
    quotes: z.array(z.string()).optional(),
  })).optional(),
});

// Competitive Landscape Schema
export const CompetitiveLandscapeSchema = z.object({
  directCompetitors: z.array(z.object({
    name: z.string(),
    website: z.string().optional(),
    description: z.string().optional(),
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    marketShare: z.string().optional(),
    pricing: z.string().optional(),
    positioning: z.string().optional(),
  })).optional(),
  indirectCompetitors: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    description: z.string().optional(),
    whyAlternative: z.string().optional(),
  })).optional(),
  competitivePositioning: z.object({
    position: z.string().optional(),
    differentiation: z.array(z.string()).optional(),
    advantages: z.array(z.string()).optional(),
    threats: z.array(z.string()).optional(),
  }).optional(),
  marketTrends: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  threats: z.array(z.string()).optional(),
});

// Business Operations Schema
export const BusinessOperationsSchema = z.object({
  team: z.object({
    size: z.number().optional(),
    structure: z.array(z.object({
      department: z.string(),
      headCount: z.number().optional(),
      keyRoles: z.array(z.string()).optional(),
    })).optional(),
    keyPeople: z.array(z.object({
      name: z.string(),
      role: z.string().optional(),
      department: z.string().optional(),
      responsibilities: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
  keyProcesses: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    owner: z.string().optional(),
    status: z.enum(['Optimized', 'Good', 'Needs Improvement', 'Critical']).optional(),
    tools: z.array(z.string()).optional(),
  })).optional(),
  technologyStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    database: z.array(z.string()).optional(),
    infrastructure: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    integrations: z.array(z.string()).optional(),
  }).optional(),
  operationalMetrics: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    target: z.string().optional(),
    trend: z.enum(['Up', 'Down', 'Stable']).optional(),
    frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']).optional(),
  })).optional(),
});

// Financial Context Schema
export const FinancialContextSchema = z.object({
  revenue: z.object({
    model: z.string().optional(),
    currentAnnual: z.string().optional(),
    growth: z.object({
      rate: z.number().optional(),
      period: z.string().optional(),
    }).optional(),
  }).optional(),
  financialHealth: z.object({
    profitability: z.enum(['Profitable', 'Break-even', 'Loss-making']).optional(),
    cashFlow: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
    burnRate: z.string().optional(),
    runway: z.string().optional(),
  }).optional(),
  funding: z.object({
    stage: z.enum(['Bootstrap', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO']).optional(),
    totalRaised: z.string().optional(),
    lastRound: z.string().optional(),
    investors: z.array(z.string()).optional(),
  }).optional(),
  expenses: z.object({
    operational: z.string().optional(),
    marketing: z.string().optional(),
    development: z.string().optional(),
    overhead: z.string().optional(),
  }).optional(),
});

// Strategic Context Schema
export const StrategicContextSchema = z.object({
  goals: z.object({
    shortTerm: z.array(z.object({
      goal: z.string(),
      target: z.string().optional(),
      timeline: z.string().optional(),
      status: z.enum(['On Track', 'At Risk', 'Completed', 'Behind']).optional(),
    })).optional(),
    longTerm: z.array(z.object({
      goal: z.string(),
      target: z.string().optional(),
      timeline: z.string().optional(),
      status: z.enum(['On Track', 'At Risk', 'Completed', 'Behind']).optional(),
    })).optional(),
  }).optional(),
  strategicPriorities: z.array(z.object({
    priority: z.string(),
    description: z.string().optional(),
    importance: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    timeline: z.string().optional(),
    owner: z.string().optional(),
  })).optional(),
  challenges: z.array(z.object({
    challenge: z.string(),
    impact: z.enum(['High', 'Medium', 'Low']).optional(),
    urgency: z.enum(['High', 'Medium', 'Low']).optional(),
    owner: z.string().optional(),
    status: z.enum(['Identified', 'In Progress', 'Resolved']).optional(),
  })).optional(),
  successMetrics: z.array(z.object({
    metric: z.string(),
    currentValue: z.string().optional(),
    targetValue: z.string().optional(),
    frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']).optional(),
    owner: z.string().optional(),
  })).optional(),
});

// Business Identity Schema (main schema)
export const BusinessIdentitySchema = z.object({
  foundation: CompanyFoundationSchema,
  missionVisionValues: MissionVisionValuesSchema.optional(),
  productsServices: ProductsServicesSchema.optional(),
  targetMarket: TargetMarketSchema.optional(),
  competitiveLandscape: CompetitiveLandscapeSchema.optional(),
  businessOperations: BusinessOperationsSchema.optional(),
  financialContext: FinancialContextSchema.optional(),
  strategicContext: StrategicContextSchema.optional(),
});

// Company Health Schema
export const CompanyHealthSchema = z.object({
  overall: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
  sections: z.object({
    foundation: z.number().min(0).max(100),
    missionVisionValues: z.number().min(0).max(100),
    productsServices: z.number().min(0).max(100),
    targetMarket: z.number().min(0).max(100),
    competitiveLandscape: z.number().min(0).max(100),
    businessOperations: z.number().min(0).max(100),
    financialContext: z.number().min(0).max(100),
    strategicContext: z.number().min(0).max(100),
  }),
  recommendations: z.array(z.object({
    section: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    message: z.string(),
    action: z.string(),
  })),
  lastUpdated: z.string(),
});

// Company Profile Schema (simplified for basic operations)
export const CompanyProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  owner_id: z.string(),
  is_active: z.boolean(),
  settings: z.record(z.any()).optional(),
  subscription_plan: z.string().optional(),
  max_users: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CompanyFoundation = z.infer<typeof CompanyFoundationSchema>;
export type MissionVisionValues = z.infer<typeof MissionVisionValuesSchema>;
export type ProductsServices = z.infer<typeof ProductsServicesSchema>;
export type TargetMarket = z.infer<typeof TargetMarketSchema>;
export type CompetitiveLandscape = z.infer<typeof CompetitiveLandscapeSchema>;
export type BusinessOperations = z.infer<typeof BusinessOperationsSchema>;
export type FinancialContext = z.infer<typeof FinancialContextSchema>;
export type StrategicContext = z.infer<typeof StrategicContextSchema>;
export type BusinessIdentity = z.infer<typeof BusinessIdentitySchema>;
export type CompanyHealth = z.infer<typeof CompanyHealthSchema>;
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const companyServiceConfig = {
  tableName: 'companies',
  schema: CompanyProfileSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Company Service
 * 
 * Provides unified company management with:
 * - Business identity operations
 * - Company profile operations  
 * - Company health monitoring
 * - AI context management
 * - Real-time updates and caching
 */
export class CompanyService extends BaseService implements CrudServiceInterface<CompanyProfile> {
  private identityCache = new Map<string, { data: any; timestamp: number }>();
  private healthCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
  
  constructor() {
    super();
  }

  /**
   * Get cached data or fetch from server
   */
  private async getCachedOrFetch<T>(
    cache: Map<string, { data: any; timestamp: number }>,
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const cached = cache.get(key);
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      this.logger.debug('Returning cached data', { key });
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    cache.set(key, { data, timestamp: now });
    
    return data;
  }

  /**
   * Clear cache for a specific key
   */
  private clearCache(cache: Map<string, { data: any; timestamp: number }>, key: string): void {
    cache.delete(key);
  }

  /**
   * Exhaustive API response shape used by this service.
   * Accepts both legacy `ApiResponse` unions and the generic responses returned
   * from the api-client helpers (which expose `success: boolean`).
   */
  private convertApiResponse<T>(
    apiResponse: ServiceApiSuccessResponse<T> | {
      success?: boolean;
      data?: T | null;
      error?: string | null;
      status?: number;
    }
  ): ServiceResponse<T> {
    const data = (apiResponse && 'data' in apiResponse ? apiResponse.data : null) as T | null;
    const error = (apiResponse && 'error' in apiResponse ? apiResponse.error : undefined) ?? null;
    return {
      data,
      error,
      success: error === null,
    };
  }

  protected config = companyServiceConfig;

  // ============================================================================
  // CRUD OPERATIONS (CrudServiceInterface)
  // ============================================================================

  /**
   * Get company profile by ID
   */
  async get(id: string): Promise<ServiceResponse<CompanyProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });
      
      const result = await selectOne<CompanyProfile>(this.config.tableName, { id });
      const serviceResponse = this.convertApiResponse<CompanyProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      if (!serviceResponse.data) {
          return { data: null, error: `Company profile ${id} not found or inaccessible`, success: false };
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `get company profile ${id}`);
  }

  /**
   * Create new company profile
   */
  async create(data: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<CompanyProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { data });
      
      const result = await insertOne<CompanyProfile>(this.config.tableName, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<CompanyProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `create company profile`);
  }

  /**
   * Update company profile
   */
  async update(id: string, data: Partial<CompanyProfile>): Promise<ServiceResponse<CompanyProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, data });
      
      const result = await updateOne<CompanyProfile>(this.config.tableName, { id }, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<CompanyProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `update company profile ${id}`);
  }

  /**
   * Delete company profile
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });
      
  const result = await deleteOne<boolean>(this.config.tableName, { id });
      const serviceResponse = this.convertApiResponse<boolean>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      return { data: true, error: null, success: true };
    }, `delete company profile ${id}`);
  }

  /**
   * List company profiles with filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<CompanyProfile[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('list', { filters });
      
      const result = await selectData<CompanyProfile>(this.config.tableName, '*', filters);
      const serviceResponse = this.convertApiResponse<CompanyProfile[]>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = (serviceResponse.data || []).map((item: any) => this.config.schema.parse(item));
      return { data: validatedData, error: null, success: true };
    }, `list company profiles`);
  }

  // ============================================================================
  // BUSINESS IDENTITY OPERATIONS
  // ============================================================================

  /**
   * Get business identity for a company
   */
  async getBusinessIdentity(companyId: string): Promise<ServiceResponse<BusinessIdentity>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getBusinessIdentity', { companyId });
      
      try {
        const result = await callRPC('get_business_identity', { companyId });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to get business identity', success: false };
        }
        
        // Handle case where business identity doesn't exist yet
        if (!result.data) {
          return { data: null, error: 'Business identity not found', success: false };
        }
        
        // Validate the data, but handle missing required fields gracefully
        try {
          const validatedData = BusinessIdentitySchema.parse(result.data);
          return { data: validatedData, error: null, success: true };
        } catch (validationError) {
          // If validation fails due to missing required fields, return a default structure
          if (validationError instanceof z.ZodError) {
            const missingFields = validationError.errors.map(err => err.path.join('.'));
            this.logger.warn('Business identity validation failed, missing fields:', { companyId, missingFields });
            
            // Return a default business identity structure
            const defaultBusinessIdentity: BusinessIdentity = {
              foundation: {
                name: '',
                legalStructure: 'LLC' as const,
                foundedDate: '',
                headquarters: {}
              },
              ...result.data // Include any existing data
            };
            
            return { data: defaultBusinessIdentity, error: null, success: true };
          }
          throw validationError;
        }
      } catch (error) {
        this.logger.error('Exception in getBusinessIdentity', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `get business identity for company ${companyId}`);
  }

  /**
   * Update business identity for a company
   */
  async updateBusinessIdentity(companyId: string, updates: Partial<BusinessIdentity>): Promise<ServiceResponse<BusinessIdentity>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateBusinessIdentity', { companyId, updates });
      
      try {
        const result = await callRPC('update_business_identity', { companyId, updates });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to update business identity', success: false };
        }
        
        // Clear cache
        this.clearCache(this.identityCache, companyId);
        
        // Handle validation gracefully
        try {
          const validatedData = BusinessIdentitySchema.parse(result.data);
          return { data: validatedData, error: null, success: true };
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            this.logger.warn('Business identity validation failed during update:', { companyId, error: validationError.errors });
            // Return the data as-is if validation fails, let the UI handle it
            return { data: result.data as BusinessIdentity, error: null, success: true };
          }
          throw validationError;
        }
      } catch (error) {
        this.logger.error('Exception in updateBusinessIdentity', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `update business identity for company ${companyId}`);
  }

  /**
   * Ensure business identity exists for a company
   */
  async ensureBusinessIdentity(companyId: string, identityData: Partial<BusinessIdentity> = {}): Promise<ServiceResponse<BusinessIdentity>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('ensureBusinessIdentity', { companyId, identityData });
      
      try {
        const result = await callRPC('ensure_business_identity', { companyId, identityData });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to ensure business identity', success: false };
        }
        
        // Clear cache
        this.clearCache(this.identityCache, companyId);
        
        const validatedData = BusinessIdentitySchema.parse(result.data);
        return { data: validatedData, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in ensureBusinessIdentity', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `ensure business identity for company ${companyId}`);
  }

  // ============================================================================
  // COMPANY HEALTH OPERATIONS
  // ============================================================================

  /**
   * Get company health metrics
   */
  async getCompanyHealth(companyId: string): Promise<ServiceResponse<CompanyHealth>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyHealth', { companyId });
      
      try {
        const result = await callRPC('get_company_health', { companyId });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to get company health', success: false };
        }
        
        const validatedData = CompanyHealthSchema.parse(result.data);
        return { data: validatedData, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in getCompanyHealth', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `get company health for company ${companyId}`);
  }

  /**
   * Monitor company health and get recommendations
   */
  async monitorCompanyHealth(companyId: string): Promise<ServiceResponse<CompanyHealth>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('monitorCompanyHealth', { companyId });
      
      try {
        const result = await callRPC('monitor_company_health', { companyId });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to monitor company health', success: false };
        }
        
        // Clear cache
        this.clearCache(this.healthCache, companyId);
        
        const validatedData = CompanyHealthSchema.parse(result.data);
        return { data: validatedData, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in monitorCompanyHealth', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `monitor company health for company ${companyId}`);
  }

  // ============================================================================
  // AI CONTEXT OPERATIONS
  // ============================================================================

  /**
   * Get AI context for a company
   */
  async getAIContext(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAIContext', { companyId });
      
      try {
        const result = await callRPC('get_company_ai_context', { companyId });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to get AI context', success: false };
        }
        
        return { data: result.data, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in getAIContext', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `get AI context for company ${companyId}`);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate business identity completion percentage
   */
  calculateIdentityCompletion(identity: BusinessIdentity): number {
    const sections = [
      'foundation',
      'missionVisionValues',
      'productsServices',
      'targetMarket',
      'competitiveLandscape',
      'businessOperations',
      'financialContext',
      'strategicContext'
    ];
    
    let completedSections = 0;
    
    sections.forEach(section => {
      const sectionData = (identity as any)[section];
      if (sectionData && Object.keys(sectionData).length > 0) {
        completedSections++;
      }
    });
    
    return Math.round((completedSections / sections.length) * 100);
  }

  /**
   * Get next recommended action for company
   */
  async getNextAction(companyId: string): Promise<ServiceResponse<{ action: string; priority: string; message: string }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getNextAction', { companyId });
      
      try {
        const result = await callRPC('get_company_next_action', { companyId });
        
        if (!result.success) {
          return { data: null, error: result.error || 'Failed to get next action', success: false };
        }
        
        return { data: result.data, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in getNextAction', { companyId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `get next action for company ${companyId}`);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const companyService = new CompanyService();
