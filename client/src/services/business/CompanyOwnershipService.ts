/**
 * Company Ownership Service
 * Handles company ownership management and transfers
 * Consolidated with CompanyAssociationService for better architecture
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

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
          '*',
          { id: companyId }
        );

        if (companyError || !company?.owner_id) {
          this.logSuccess('getCompanyOwner', { companyId, result: 'no_owner' });
          return this.createResponse(null);
        }

        const { data: owner, error: ownerError } = await selectOne(
          'user_profiles',
          '*',
          { user_id: company.owner_id }
        );

        if (ownerError || !owner) {
          this.logFailure('getCompanyOwner', ownerError, { companyId });
          return this.handleError(ownerError || 'Owner profile not found');
        }

        const companyOwner: CompanyOwner = {
          id: owner.user_id,
          email: owner.email || '',
          first_name: owner.first_name,
          last_name: owner.last_name,
          display_name: owner.display_name,
          role: owner.role || 'owner'
        };

        this.logSuccess('getCompanyOwner', { companyId, ownerId: owner.user_id });
        return this.createResponse(companyOwner);
      } catch (error) {
        this.logFailure('getCompanyOwner', error, { companyId });
        return this.handleError(error);
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
          '*',
          { id: companyId, owner_id: userId }
        );

        if (error) {
          this.logFailure('isCompanyOwner', error, { companyId, userId });
          return this.handleError(error);
        }

        const isOwner = !!company;
        this.logSuccess('isCompanyOwner', { companyId, userId, isOwner });
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
          return this.handleError('Only company owners can transfer ownership');
        }

        // Verify new owner exists and has a profile
        const { data: newOwner, error: newOwnerError } = await selectOne(
          'user_profiles',
          '*',
          { user_id: request.newOwnerId }
        );

        if (newOwnerError || !newOwner) {
          this.logFailure('transferCompanyOwnership', 'New owner profile not found', request);
          return this.handleError('New owner profile not found');
        }

        // Update company ownership
        const { error: companyUpdateError } = await updateOne(
          'companies',
          { id: request.companyId },
          { owner_id: request.newOwnerId }
        );

        if (companyUpdateError) {
          this.logFailure('transferCompanyOwnership', companyUpdateError, request);
          return this.handleError(companyUpdateError);
        }

        // Update user roles
        const { error: currentOwnerUpdateError } = await updateOne(
          'user_profiles',
          { user_id: request.currentUserId },
          { role: 'admin' }
        );

        if (currentOwnerUpdateError) {
          this.logFailure('transferCompanyOwnership', currentOwnerUpdateError, request);
          return this.handleError(currentOwnerUpdateError);
        }

        const { error: newOwnerUpdateError } = await updateOne(
          'user_profiles',
          { user_id: request.newOwnerId },
          { role: 'owner' }
        );

        if (newOwnerUpdateError) {
          this.logFailure('transferCompanyOwnership', newOwnerUpdateError, request);
          return this.handleError(newOwnerUpdateError);
        }

        this.logSuccess('transferCompanyOwnership', { 
          companyId: request.companyId, 
          fromUserId: request.currentUserId, 
          toUserId: request.newOwnerId 
        });

        return this.createResponse(true);
      } catch (error) {
        this.logFailure('transferCompanyOwnership', error, request);
        return this.handleError(error);
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

        this.logSuccess('getUserOwnedCompanies', { userId, count: companies?.length || 0 });
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

        this.logSuccess('validateCompanyAccess', { companyId, userId, requiredRole, hasAccess });
        return this.createResponse(hasAccess);
      } catch (error) {
        this.logFailure('validateCompanyAccess', error, { companyId, userId, requiredRole });
        return this.handleError(error);
      }
    }, 'validateCompanyAccess');
  }
}
