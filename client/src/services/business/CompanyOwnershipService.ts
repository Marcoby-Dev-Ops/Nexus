/**
 * Company Ownership Service
 * Handles company ownership management and transfers
 * Consolidated with CompanyAssociationService for better architecture
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, updateOne } from '@/lib/api-client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CompanyOwner {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role: string;
}

export interface OwnershipTransferRequest {
  companyId: string;
  newOwnerId: string;
  currentUserId: string;
}

export interface CompanyOwnershipStatus {
  companyId: string;
  currentOwnerId: string;
  currentOwnerEmail: string;
  currentOwnerName: string;
  transferHistory: OwnershipTransfer[];
  canTransfer: boolean;
}

export interface OwnershipTransfer {
  id: string;
  companyId: string;
  fromUserId: string;
  toUserId: string;
  transferredAt: string;
  reason?: string;
}

// ============================================================================
// COMPANY OWNERSHIP SERVICE CLASS
// ============================================================================

export class CompanyOwnershipService extends BaseService {
  constructor() {
    super('CompanyOwnershipService');
  }

  /**
   * Get the owner of a company
   */
  async getCompanyOwner(companyId: string): Promise<ServiceResponse<CompanyOwner | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyOwner', { companyId });

      try {
        const { data: company, error: companyError } = await selectOne(
          'companies',
          { id: companyId }
        );

        if (companyError || !company?.owner_id) {
          this.logSuccess('getCompanyOwner', 'no_owner', { companyId });
          return this.createResponse(null);
        }

        const { data: owner, error: ownerError } = await selectOne(
          'user_profiles',
          { user_id: company.owner_id }
        );

        if (ownerError || !owner) {
          this.logFailure('getCompanyOwner', String(ownerError || ''), { companyId });
          return this.handleError(ownerError || 'Owner profile not found', 'Failed to get company owner', { companyId });
        }

        const companyOwner: CompanyOwner = {
          id: owner.user_id,
          email: owner.email || '',
          first_name: owner.first_name,
          last_name: owner.last_name,
          display_name: owner.display_name,
          role: owner.role || 'owner'
        };

  this.logSuccess('getCompanyOwner', 'owner_found', { companyId, ownerId: owner.user_id });
        return this.createResponse(companyOwner);
      } catch (error) {
  this.logFailure('getCompanyOwner', String(error), { companyId });
  return this.handleError(error, 'Failed to get company owner', { companyId });
      }
    }, 'getCompanyOwner');
  }

  /**
   * Check if a user is the owner of a company
   */
  async isCompanyOwner(companyId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('isCompanyOwner', { companyId, userId });

      try {
        const { data: company, error } = await selectOne(
          'companies',
          { id: companyId, owner_id: userId }
        );

        if (error) {
          this.logFailure('isCompanyOwner', String(error), { companyId, userId });
          return this.handleError(error, 'Failed to check company ownership', { companyId, userId });
        }

        const isOwner = !!company;
  this.logSuccess('isCompanyOwner', 'checked_ownership', { companyId, userId, isOwner });
        return this.createResponse(isOwner);
      } catch (error) {
        this.logFailure('isCompanyOwner', error, { companyId, userId });
        return this.handleError(error);
      }
    }, 'isCompanyOwner');
  }

  /**
   * Transfer company ownership to another user
   */
  async transferCompanyOwnership(request: OwnershipTransferRequest): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('transferCompanyOwnership', request);

      try {
        // Verify current user is the owner
        const isOwner = await this.isCompanyOwner(request.companyId, request.currentUserId);
        if (!isOwner.success || !isOwner.data) {
          this.logFailure('transferCompanyOwnership', 'User is not company owner', request);
          return this.handleError('Only company owners can transfer ownership', 'Unauthorized transfer attempt', request);
        }

        // Verify new owner exists and has a profile
        const { data: newOwner, error: newOwnerError } = await selectOne(
          'user_profiles',
          { user_id: request.newOwnerId }
        );

        if (newOwnerError || !newOwner) {
          this.logFailure('transferCompanyOwnership', 'New owner profile not found', request);
          return this.handleError(newOwnerError || 'New owner profile not found', 'Failed to find new owner', request);
        }

        // Update company ownership
        const { error: companyUpdateError } = await updateOne(
          'companies',
          request.companyId,
          { owner_id: request.newOwnerId },
          'id'
        );

        if (companyUpdateError) {
          this.logFailure('transferCompanyOwnership', String(companyUpdateError), request);
          return this.handleError(companyUpdateError, 'Failed to update company owner', request);
        }

        // Update user roles
        const { error: currentOwnerUpdateError } = await updateOne(
          'user_profiles',
          request.currentUserId,
          { role: 'admin' },
          'user_id'
        );

        if (currentOwnerUpdateError) {
          this.logFailure('transferCompanyOwnership', String(currentOwnerUpdateError), request);
          return this.handleError(currentOwnerUpdateError, 'Failed to update current owner role', request);
        }

        const { error: newOwnerUpdateError } = await updateOne(
          'user_profiles',
          request.newOwnerId,
          { role: 'owner' },
          'user_id'
        );

        if (newOwnerUpdateError) {
          this.logFailure('transferCompanyOwnership', String(newOwnerUpdateError), request);
          return this.handleError(newOwnerUpdateError, 'Failed to update new owner role', request);
        }

        this.logSuccess('transferCompanyOwnership', 'transfer_completed', { 
          companyId: request.companyId, 
          fromUserId: request.currentUserId, 
          toUserId: request.newOwnerId 
        });

        return this.createResponse(true);
      } catch (error) {
        this.logFailure('transferCompanyOwnership', String(error), request);
        return this.handleError(error, 'Failed to transfer company ownership', request);
      }
    }, 'transferCompanyOwnership');
  }

  /**
   * Get company ownership status and history
   */
  async getCompanyOwnershipStatus(companyId: string, userId: string): Promise<ServiceResponse<CompanyOwnershipStatus | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyOwnershipStatus', { companyId, userId });

      try {
        const { data: company, error: companyError } = await selectOne(
          'companies',
          '*',
          { id: companyId }
        );

        if (companyError || !company) {
          this.logFailure('getCompanyOwnershipStatus', companyError, { companyId });
          return this.handleError(companyError || 'Company not found');
        }

        const { data: owner, error: ownerError } = await selectOne(
          'user_profiles',
          '*',
          { user_id: company.owner_id }
        );

        if (ownerError || !owner) {
          this.logFailure('getCompanyOwnershipStatus', ownerError, { companyId });
          return this.handleError(ownerError || 'Owner profile not found');
        }

        // Check if current user can transfer ownership
        const canTransfer = company.owner_id === userId;

        const ownershipStatus: CompanyOwnershipStatus = {
          companyId,
          currentOwnerId: company.owner_id,
          currentOwnerEmail: owner.email || '',
          currentOwnerName: `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.display_name || 'Unknown',
          transferHistory: [], // TODO: Implement transfer history tracking
          canTransfer
        };

        this.logSuccess('getCompanyOwnershipStatus', { companyId, canTransfer });
        return this.createResponse(ownershipStatus);
      } catch (error) {
        this.logFailure('getCompanyOwnershipStatus', error, { companyId, userId });
        return this.handleError(error);
      }
    }, 'getCompanyOwnershipStatus');
  }

  /**
   * Get all companies owned by a user
   */
  async getUserOwnedCompanies(userId: string): Promise<ServiceResponse<Array<{ id: string; name: string; status: string }>>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserOwnedCompanies', { userId });

      try {
        const { data: companies, error } = await selectData(
          'companies',
          'id, name, status',
          { owner_id: userId }
        );

        if (error) {
          this.logFailure('getUserOwnedCompanies', error, { userId });
          return this.handleError(error);
        }

  this.logSuccess('getUserOwnedCompanies', 'owned_companies_loaded', { userId, count: companies?.length || 0 });
        return this.createResponse(companies || []);
      } catch (error) {
        this.logFailure('getUserOwnedCompanies', error, { userId });
        return this.handleError(error);
      }
    }, 'getUserOwnedCompanies');
  }

  /**
   * Validate company ownership before operations
   */
  async validateCompanyAccess(companyId: string, userId: string, requiredRole: 'owner' | 'admin' | 'member' = 'member'): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('validateCompanyAccess', { companyId, userId, requiredRole });

      try {
        // Check if user is associated with the company
        const { data: profile, error: profileError } = await selectOne(
          'user_profiles',
          '*',
          { user_id: userId, company_id: companyId }
        );

        if (profileError || !profile) {
          this.logSuccess('validateCompanyAccess', { companyId, userId, result: 'no_access' });
          return this.createResponse(false);
        }

        // Check role-based access
        let hasAccess = false;
        switch (requiredRole) {
          case 'owner':
            hasAccess = profile.role === 'owner';
            break;
          case 'admin':
            hasAccess = ['owner', 'admin'].includes(profile.role || '');
            break;
          case 'member':
            hasAccess = ['owner', 'admin', 'member'].includes(profile.role || '');
            break;
        }

  this.logSuccess('validateCompanyAccess', 'access_validated', { companyId, userId, requiredRole, hasAccess });
        return this.createResponse(hasAccess);
      } catch (error) {
        this.logFailure('validateCompanyAccess', error, { companyId, userId, requiredRole });
        return this.handleError(error);
      }
    }, 'validateCompanyAccess');
  }
}
