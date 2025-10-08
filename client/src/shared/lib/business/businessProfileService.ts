import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { callEdgeFunction, insertOne, selectOne, updateOne, deleteOne } from '@/lib/api-client';

export interface BusinessProfile {
  id?: string;
  user_id: string;
  org_id: string;
  company_name: string;
  industry: string | null;
  business_model: string | null;
  company_size: string | null;
  mission_statement: string | null;
  primary_services: string[] | null;
  unique_value_proposition: string | null;
  competitive_advantages: string[] | null;
  target_markets: string[] | null;
  ideal_client_profile: string[] | null;
  service_delivery_methods: string[] | null;
  current_clients: string[] | null;
  revenue_model: string | null;
  pricing_strategy: string | null;
  financial_goals: string[] | null;
  strategic_objectives: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  org_group_id?: string;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  permissions: string[];
  is_primary: boolean;
  joined_at: string;
}

export interface OrganizationValidationResult {
  exists: boolean;
  org?: Organization;
}

export interface UserMembershipResult {
  isMember: boolean;
  role?: string;
}

export interface OrganizationCreationResult {
  orgId?: string;
}

export interface BusinessProfileResult {
  profileId?: string;
}

export interface OrganizationWithProfileResult {
  orgId?: string;
  profileId?: string;
}

/**
 * Business Profile Service Class
 */
export class BusinessProfileService extends BaseService {
  /**
   * Validate if organization exists
   */
  async validateOrganization(orgId: string): Promise<ServiceResponse<OrganizationValidationResult>> {
    const validation = this.validateIdParam(orgId, 'orgId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await selectOne('organizations', orgId);
        
        if (error) {
          return { data: { exists: false }, error };
        }
        
        return { 
          data: { exists: !!data, org: data as Organization }, 
          error: null 
        };
      },
      'validateOrganization'
    );
  }

  /**
   * Check if user is member of organization
   */
  async isUserMemberOfOrg(userId: string, orgId: string): Promise<ServiceResponse<UserMembershipResult>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const orgIdValidation = this.validateIdParam(orgId, 'orgId');
    if (orgIdValidation) {
      return this.createErrorResponse(orgIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('user_organizations', '*', { user_id: userId, org_id: orgId });
        
        if (error) {
          return { data: { isMember: false }, error };
        }
        
        const membership = data?.[0] as UserOrganization;
        return { 
          data: { 
            isMember: !!membership, 
            role: membership?.role 
          }, 
          error: null 
        };
      },
      'isUserMemberOfOrg'
    );
  }

  /**
   * Create new organization (consolidated with company functionality)
   */
  async createOrganization(tenantId: string, userId: string, name: string, description?: string, industry?: string, size?: string): Promise<ServiceResponse<OrganizationCreationResult>> {
    const tenantIdValidation = this.validateIdParam(tenantId, 'tenantId');
    if (tenantIdValidation) {
      return this.createErrorResponse(tenantIdValidation);
    }

    const nameValidation = this.validateRequiredParam(name, 'name');
    if (nameValidation) {
      return this.createErrorResponse(nameValidation);
    }

    return this.executeDbOperation(
      async () => {
        // Call organizations API to create organization
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            industry,
            size
          })
        });

        const data = await response.json();

        if (!data.success) {
          return { data: null, error: data.error || 'Failed to create organization' };
        }

        return { 
          data: { orgId: data.data?.orgId }, 
          error: null 
        };
      },
      'createOrganization'
    );
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(userId: string, orgId: string, role: string = 'member'): Promise<ServiceResponse<boolean>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const orgIdValidation = this.validateIdParam(orgId, 'orgId');
    if (orgIdValidation) {
      return this.createErrorResponse(orgIdValidation);
    }

    const roleValidation = this.validateRequiredParam(role, 'role');
    if (roleValidation) {
      return this.createErrorResponse(roleValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { error } = await insertOne('user_organizations', {
          user_id: userId,
          org_id: orgId,
          role,
          permissions: [],
          is_primary: false,
          joined_at: new Date().toISOString()
        });

        return { data: !error, error };
      },
      'addUserToOrganization'
    );
  }

  /**
   * Save business profile
   */
  async saveBusinessProfile(orgId: string, profileData: Partial<BusinessProfile>): Promise<ServiceResponse<BusinessProfileResult>> {
    const orgIdValidation = this.validateIdParam(orgId, 'orgId');
    if (orgIdValidation) {
      return this.createErrorResponse(orgIdValidation);
    }

    const companyNameValidation = this.validateRequiredParam(profileData.company_name, 'company_name');
    if (companyNameValidation) {
      return this.createErrorResponse(companyNameValidation);
    }

    return this.executeDbOperation(
      async () => {
        // Check if profile already exists
        const { data: existingProfile } = await selectOne('business_profiles', undefined, {
          filters: { org_id: orgId }
        });

        let profileId: string;

        if (existingProfile) {
          // Update existing profile
          const { data: updatedProfile, error: updateError } = await updateOne('business_profiles', existingProfile.id, {
            company_name: profileData.company_name,
            industry: profileData.industry,
            business_model: profileData.business_model,
            company_size: profileData.company_size,
            primary_services: profileData.primary_services,
            unique_value_proposition: profileData.unique_value_proposition,
            competitive_advantages: profileData.competitive_advantages,
            target_markets: profileData.target_markets,
            ideal_client_profile: profileData.ideal_client_profile,
            service_delivery_methods: profileData.service_delivery_methods,
            current_clients: profileData.current_clients,
            revenue_model: profileData.revenue_model,
            pricing_strategy: profileData.pricing_strategy,
            financial_goals: profileData.financial_goals,
            strategic_objectives: profileData.strategic_objectives,
            updated_at: new Date().toISOString()
          });

          if (updateError) throw updateError;
          profileId = updatedProfile.id;
        } else {
          // Create new profile
          const { data: newProfile, error: insertError } = await insertOne('business_profiles', {
            user_id: profileData.user_id || '',
            org_id: orgId,
            company_name: profileData.company_name,
            industry: profileData.industry,
            business_model: profileData.business_model,
            company_size: profileData.company_size,
            primary_services: profileData.primary_services,
            unique_value_proposition: profileData.unique_value_proposition,
            competitive_advantages: profileData.competitive_advantages,
            target_markets: profileData.target_markets,
            ideal_client_profile: profileData.ideal_client_profile,
            service_delivery_methods: profileData.service_delivery_methods,
            current_clients: profileData.current_clients,
            revenue_model: profileData.revenue_model,
            pricing_strategy: profileData.pricing_strategy,
            financial_goals: profileData.financial_goals,
            strategic_objectives: profileData.strategic_objectives,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (insertError) throw insertError;
          profileId = newProfile.id;
        }

        return { 
          data: { profileId }, 
          error: null 
        };
      },
      'saveBusinessProfile'
    );
  }

  /**
   * Create organization with profile
   */
  async createOrganizationWithProfile(
    tenantId: string, 
    userId: string, 
    orgName: string, 
    profileData: Partial<BusinessProfile>
  ): Promise<ServiceResponse<OrganizationWithProfileResult>> {
    const tenantIdValidation = this.validateIdParam(tenantId, 'tenantId');
    if (tenantIdValidation) {
      return this.createErrorResponse(tenantIdValidation);
    }

    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const orgNameValidation = this.validateRequiredParam(orgName, 'orgName');
    if (orgNameValidation) {
      return this.createErrorResponse(orgNameValidation);
    }

    return this.executeDbOperation(
      async () => {
        // First create the organization
        const orgResult = await this.createOrganization(tenantId, userId, orgName);
        if (!orgResult.success || !orgResult.data?.orgId) {
          return { data: null, error: orgResult.error || 'Failed to create organization' };
        }

        // Then save the business profile
        const profileResult = await this.saveBusinessProfile(orgResult.data.orgId, profileData);
        if (!profileResult.success) {
          return { data: null, error: profileResult.error || 'Failed to save business profile' };
        }

        return { 
          data: { 
            orgId: orgResult.data.orgId, 
            profileId: profileResult.data?.profileId 
          }, 
          error: null 
        };
      },
      'createOrganizationWithProfile'
    );
  }

  /**
   * Join organization with profile
   */
  async joinOrganizationWithProfile(
    userId: string, 
    orgId: string, 
    profileData: Partial<BusinessProfile>
  ): Promise<ServiceResponse<BusinessProfileResult>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const orgIdValidation = this.validateIdParam(orgId, 'orgId');
    if (orgIdValidation) {
      return this.createErrorResponse(orgIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        // First add user to organization
        const membershipResult = await this.addUserToOrganization(userId, orgId);
        if (!membershipResult.success) {
          return { data: null, error: membershipResult.error || 'Failed to add user to organization' };
        }

        // Then save the business profile
        const profileResult = await this.saveBusinessProfile(orgId, profileData);
        if (!profileResult.success) {
          return { data: null, error: profileResult.error || 'Failed to save business profile' };
        }

        return { 
          data: { profileId: profileResult.data?.profileId }, 
          error: null 
        };
      },
      'joinOrganizationWithProfile'
    );
  }

  /**
   * Delete business profile
   */
  async deleteBusinessProfile(orgId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(orgId, 'orgId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        // Removed business_profiles dependency - feature disabled
        return { data: true, error: null };
      },
      'deleteBusinessProfile'
    );
  }

  /**
   * Get profile template
   */
  getProfileTemplate(): Partial<BusinessProfile> {
    return {
      company_name: '',
      industry: null,
      business_model: null,
      company_size: null,
      mission_statement: null,
      primary_services: [],
      unique_value_proposition: null,
      competitive_advantages: [],
      target_markets: [],
      ideal_client_profile: [],
      service_delivery_methods: [],
      current_clients: [],
      revenue_model: null,
      pricing_strategy: null,
      financial_goals: [],
      strategic_objectives: []
    };
  }
}

// Export singleton instance
export const businessProfileService = new BusinessProfileService();

// Legacy function exports for backward compatibility
export const getBusinessProfile = async (businessId: string) => {
  // Removed business_profiles dependency - feature disabled
  return null;
};

export const updateBusinessProfile = async (businessId: string, updates: any) => {
  // Removed business_profiles dependency - feature disabled
  return null;
}; 
