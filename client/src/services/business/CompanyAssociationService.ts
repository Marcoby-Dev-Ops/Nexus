/**
 * Company Association Service
 * Handles user-company associations and ensures persistence through the app
 * Focuses on CRUD operations and basic associations
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, insertOne, updateOne } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CompanyAssociation {
  userId: string;
  companyId: string;
  companyName: string;
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
  joinedAt: string;
}

export interface UserCompanyProfile {
  userId: string;
  companyId: string;
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  companySize?: string;
  role: string;
  jobTitle?: string;
  department?: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  ownerId: string;
}

export interface AssociateUserRequest {
  userId: string;
  companyId: string;
  role?: 'owner' | 'admin' | 'member';
  jobTitle?: string;
  department?: string;
}

// ============================================================================
// COMPANY ASSOCIATION SERVICE CLASS
// ============================================================================

export class CompanyAssociationService extends BaseService {
  constructor() {
    super('CompanyAssociationService');
  }

  /**
   * Get or create a company for a user
   * Ensures every user has a company association
   */
  async ensureUserCompanyAssociation(
    userId: string, 
    companyName: string,
    userEmail: string
  ): Promise<ServiceResponse<UserCompanyProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('ensureUserCompanyAssociation', { userId, companyName });

      try {
        // First, check if user already has a company association
        const existingProfile = await this.getUserCompanyProfile(userId);
        if (existingProfile.success && existingProfile.data) {
          this.logSuccess('ensureUserCompanyAssociation', { 
            userId, 
            result: 'existing_association',
            companyId: existingProfile.data.companyId 
          });
          return existingProfile;
        }

        // Check if company exists by name
        const { data: existingCompany, error: companyError } = await selectData(
          'companies',
          '*',
          { name: companyName }
        );

        let companyId: string;

        if (companyError || !existingCompany || existingCompany.length === 0) {
          // Create new company
          const createCompanyRequest: CreateCompanyRequest = {
            name: companyName,
            description: `Company created for ${userEmail}`,
            ownerId: userId
          };

          const companyResult = await this.createCompany(createCompanyRequest);
          if (!companyResult.success || !companyResult.data) {
            this.logFailure('ensureUserCompanyAssociation', companyResult.error, { userId, companyName });
            return this.handleError(companyResult.error || 'Failed to create company');
          }

          companyId = companyResult.data.id;
        } else {
          companyId = existingCompany[0].id;
        }

        // Associate user with company
        const associateResult = await this.associateUserWithCompany({
          userId,
          companyId,
          role: 'owner',
          jobTitle: 'Founder'
        });

        if (!associateResult.success) {
          this.logFailure('ensureUserCompanyAssociation', associateResult.error, { userId, companyId });
          return this.handleError(associateResult.error || 'Failed to associate user with company');
        }

        // Get the complete profile
        const profileResult = await this.getUserCompanyProfile(userId);
        if (!profileResult.success) {
          this.logFailure('ensureUserCompanyAssociation', profileResult.error, { userId, companyId });
          return this.handleError(profileResult.error || 'Failed to get user company profile');
        }

        this.logSuccess('ensureUserCompanyAssociation', { 
          userId, 
          companyId, 
          result: 'new_association_created' 
        });

        return profileResult;
      } catch (error) {
        this.logFailure('ensureUserCompanyAssociation', error, { userId, companyName });
        return this.handleError(error);
      }
    }, 'ensureUserCompanyAssociation');
  }

  /**
   * Get user's company profile
   */
  async getUserCompanyProfile(userId: string): Promise<ServiceResponse<UserCompanyProfile | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserCompanyProfile', { userId });

      try {
        const { data: profile, error: profileError } = await selectOne(
          'user_profiles',
          '*',
          { user_id: userId }
        );

        if (profileError || !profile) {
          this.logSuccess('getUserCompanyProfile', { userId, result: 'no_profile' });
          return this.createResponse(null);
        }

        if (!profile.company_id) {
          this.logSuccess('getUserCompanyProfile', { userId, result: 'no_company' });
          return this.createResponse(null);
        }

        // Get company details
        const { data: company, error: companyError } = await selectOne(
          'companies',
          '*',
          { id: profile.company_id }
        );

        if (companyError || !company) {
          this.logFailure('getUserCompanyProfile', companyError, { userId, companyId: profile.company_id });
          return this.handleError(companyError || 'Company not found');
        }

        const userProfile: UserCompanyProfile = {
          userId: profile.user_id,
          companyId: profile.company_id,
          companyName: company.name,
          companyDescription: company.description,
          companyIndustry: company.industry,
          companySize: company.size,
          role: profile.role || 'member',
          jobTitle: profile.job_title,
          department: profile.department,
          isOwner: company.owner_id === userId,
          isAdmin: profile.role === 'admin' || company.owner_id === userId
        };

        this.logSuccess('getUserCompanyProfile', { userId, companyId: profile.company_id });
        return this.createResponse(userProfile);
      } catch (error) {
        this.logFailure('getUserCompanyProfile', error, { userId });
        return this.handleError(error);
      }
    }, 'getUserCompanyProfile');
  }

  /**
   * Create a new company
   */
  async createCompany(request: CreateCompanyRequest): Promise<ServiceResponse<{ id: string; name: string }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createCompany', { name: request.name, ownerId: request.ownerId });

      try {
        const companyData = {
          name: request.name,
          description: request.description,
          industry: request.industry,
          size: request.size,
          website: request.website,
          owner_id: request.ownerId,
          status: 'active'
        };

        const { data: company, error } = await insertOne('companies', companyData);

        if (error || !company) {
          this.logFailure('createCompany', error, { name: request.name });
          return this.handleError(error || 'Failed to create company');
        }

        this.logSuccess('createCompany', { companyId: company.id, name: company.name });
        return this.createResponse({ id: company.id, name: company.name });
      } catch (error) {
        this.logFailure('createCompany', error, { name: request.name });
        return this.handleError(error);
      }
    }, 'createCompany');
  }

  /**
   * Associate a user with a company
   */
  async associateUserWithCompany(request: AssociateUserRequest): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('associateUserWithCompany', { userId: request.userId, companyId: request.companyId });

      try {
        // Update user profile with company association
        const updateData: Record<string, any> = {
          company_id: request.companyId,
          role: request.role || 'member'
        };

        if (request.jobTitle) {
          updateData.job_title = request.jobTitle;
        }

        if (request.department) {
          updateData.department = request.department;
        }

        const { error } = await updateOne(
          'user_profiles',
          { user_id: request.userId },
          updateData
        );

        if (error) {
          this.logFailure('associateUserWithCompany', error, { userId: request.userId, companyId: request.companyId });
          return this.handleError(error);
        }

        this.logSuccess('associateUserWithCompany', { userId: request.userId, companyId: request.companyId });
        return this.createResponse(true);
      } catch (error) {
        this.logFailure('associateUserWithCompany', error, { userId: request.userId, companyId: request.companyId });
        return this.handleError(error);
      }
    }, 'associateUserWithCompany');
  }

  /**
   * Get all users in a company
   */
  async getCompanyUsers(companyId: string): Promise<ServiceResponse<UserCompanyProfile[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyUsers', { companyId });

      try {
        const { data: profiles, error } = await selectData(
          'user_profiles',
          '*',
          { company_id: companyId }
        );

        if (error) {
          this.logFailure('getCompanyUsers', error, { companyId });
          return this.handleError(error);
        }

        if (!profiles || profiles.length === 0) {
          this.logSuccess('getCompanyUsers', { companyId, result: 'no_users' });
          return this.createResponse([]);
        }

        // Get company details
        const { data: company, error: companyError } = await selectOne(
          'companies',
          '*',
          { id: companyId }
        );

        if (companyError || !company) {
          this.logFailure('getCompanyUsers', companyError, { companyId });
          return this.handleError(companyError || 'Company not found');
        }

        const userProfiles: UserCompanyProfile[] = profiles.map(profile => ({
          userId: profile.user_id,
          companyId: profile.company_id,
          companyName: company.name,
          companyDescription: company.description,
          companyIndustry: company.industry,
          companySize: company.size,
          role: profile.role || 'member',
          jobTitle: profile.job_title,
          department: profile.department,
          isOwner: company.owner_id === profile.user_id,
          isAdmin: profile.role === 'admin' || company.owner_id === profile.user_id
        }));

        this.logSuccess('getCompanyUsers', { companyId, userCount: userProfiles.length });
        return this.createResponse(userProfiles);
      } catch (error) {
        this.logFailure('getCompanyUsers', error, { companyId });
        return this.handleError(error);
      }
    }, 'getCompanyUsers');
  }

  /**
   * Remove user from company
   */
  async removeUserFromCompany(userId: string, companyId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('removeUserFromCompany', { userId, companyId });

      try {
        const { error } = await updateOne(
          'user_profiles',
          { user_id: userId },
          { company_id: null, role: 'user' }
        );

        if (error) {
          this.logFailure('removeUserFromCompany', error, { userId, companyId });
          return this.handleError(error);
        }

        this.logSuccess('removeUserFromCompany', { userId, companyId });
        return this.createResponse(true);
      } catch (error) {
        this.logFailure('removeUserFromCompany', error, { userId, companyId });
        return this.handleError(error);
      }
    }, 'removeUserFromCompany');
  }

  /**
   * Update user's role in company
   */
  async updateUserRole(userId: string, companyId: string, newRole: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateUserRole', { userId, companyId, newRole });

      try {
        const { error } = await updateOne(
          'user_profiles',
          { user_id: userId },
          { role: newRole }
        );

        if (error) {
          this.logFailure('updateUserRole', error, { userId, companyId, newRole });
          return this.handleError(error);
        }

        this.logSuccess('updateUserRole', { userId, companyId, newRole });
        return this.createResponse(true);
      } catch (error) {
        this.logFailure('updateUserRole', error, { userId, companyId, newRole });
        return this.handleError(error);
      }
    }, 'updateUserRole');
  }

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyById', { companyId });

      try {
        const { data: company, error } = await selectOne(
          'companies',
          '*',
          { id: companyId }
        );

        if (error) {
          this.logFailure('getCompanyById', error, { companyId });
          return this.handleError(error);
        }

        if (!company) {
          this.logSuccess('getCompanyById', { companyId, result: 'not_found' });
          return this.createResponse(null);
        }

        this.logSuccess('getCompanyById', { companyId });
        return this.createResponse(company);
      } catch (error) {
        this.logFailure('getCompanyById', error, { companyId });
        return this.handleError(error);
      }
    }, 'getCompanyById');
  }

  /**
   * Search companies by name
   */
  async searchCompanies(query: string): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('searchCompanies', { query });

      try {
        // Simple search - in production you might want to use full-text search
        const { data: companies, error } = await selectData(
          'companies',
          '*',
          {} // TODO: Implement proper search with ILIKE or full-text search
        );

        if (error) {
          this.logFailure('searchCompanies', error, { query });
          return this.handleError(error);
        }

        // Filter by name containing query
        const filteredCompanies = companies?.filter(company => 
          company.name.toLowerCase().includes(query.toLowerCase())
        ) || [];

        this.logSuccess('searchCompanies', { query, count: filteredCompanies.length });
        return this.createResponse(filteredCompanies);
      } catch (error) {
        this.logFailure('searchCompanies', error, { query });
        return this.handleError(error);
      }
    }, 'searchCompanies');
  }
}
