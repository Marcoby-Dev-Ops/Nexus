/**
 * Company Ownership Service
 * Handles company ownership management and transfers
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

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
        const { data: company, error: companyError } = await this.supabase
          .from('companies')
          .select('owner_id')
          .eq('id', companyId)
          .single();

        if (companyError || !company?.owner_id) {
          this.logSuccess('getCompanyOwner', { companyId, result: 'no_owner' });
          return { data: null, error: null };
        }

        const { data: owner, error: ownerError } = await this.supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, display_name, role')
          .eq('id', company.owner_id)
          .single();

        if (ownerError) {
          this.logFailure('getCompanyOwner', ownerError, { companyId });
          return { data: null, error: ownerError };
        }

        const companyOwner: CompanyOwner = {
          id: owner.id,
          email: owner.email || '',
          first_name: owner.first_name,
          last_name: owner.last_name,
          display_name: owner.display_name,
          role: owner.role || 'owner'
        };

        this.logSuccess('getCompanyOwner', { companyId, ownerId: owner.id });
        return { data: companyOwner, error: null };
      } catch (error) {
        this.logFailure('getCompanyOwner', error, { companyId });
        return { data: null, error };
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
        const { data, error } = await this.supabase
          .from('companies')
          .select('owner_id')
          .eq('id', companyId)
          .eq('owner_id', userId)
          .single();

        if (error) {
          this.logFailure('isCompanyOwner', error, { companyId, userId });
          return { data: null, error };
        }

        const isOwner = !!data;
        this.logSuccess('isCompanyOwner', { companyId, userId, isOwner });
        return { data: isOwner, error: null };
      } catch (error) {
        this.logFailure('isCompanyOwner', error, { companyId, userId });
        return { data: null, error };
      }
    }, 'isCompanyOwner');
  }

  /**
   * Transfer company ownership to another user
   */
  async transferOwnership(request: OwnershipTransferRequest): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('transferOwnership', { 
        companyId: request.companyId, 
        newOwnerId: request.newOwnerId,
        currentUserId: request.currentUserId 
      });

      try {
        // Verify current user is the owner
        const isOwnerResult = await this.isCompanyOwner(request.companyId, request.currentUserId);
        if (!isOwnerResult.success) {
          return { data: null, error: isOwnerResult.error };
        }

        if (!isOwnerResult.data) {
          this.logFailure('transferOwnership', new Error('Only the current owner can transfer ownership'), { request });
          return { 
            data: { 
              success: false, 
              error: 'Only the current owner can transfer ownership' 
            }, 
            error: null 
          };
        }

        // Verify new owner exists and belongs to the company
        const { data: newOwner, error: newOwnerError } = await this.supabase
          .from('user_profiles')
          .select('id, company_id')
          .eq('id', request.newOwnerId)
          .eq('company_id', request.companyId)
          .single();

        if (newOwnerError || !newOwner) {
          this.logFailure('transferOwnership', new Error('New owner must be a member of the company'), { request });
          return { 
            data: { 
              success: false, 
              error: 'New owner must be a member of the company' 
            }, 
            error: null 
          };
        }

        // Use the database function to transfer ownership
        const { data, error } = await await this.database.rpc("transfer_company_ownership", {
          p_company_id: request.companyId,
          p_new_owner_id: request.newOwnerId,
          p_current_user_id: request.currentUserId
        });

        if (error) {
          this.logFailure('transferOwnership', error, { request });
          return { 
            data: { 
              success: false, 
              error: error.message 
            }, 
            error: null 
          };
        }

        this.logSuccess('transferOwnership', { 
          companyId: request.companyId, 
          newOwnerId: request.newOwnerId 
        });

        return { 
          data: { success: true }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('transferOwnership', error, { request });
        return { data: null, error };
      }
    }, 'transferOwnership');
  }

  /**
   * Get all companies owned by a user
   */
  async getUserOwnedCompanies(userId: string): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserOwnedCompanies', { userId });

      try {
        const { data, error } = await this.supabase
          .from('companies')
          .select(`
            id,
            name,
            industry,
            size,
            created_at,
            updated_at,
            owner_id
          `)
          .eq('owner_id', userId);

        if (error) {
          this.logFailure('getUserOwnedCompanies', error, { userId });
          return { data: null, error };
        }

        this.logSuccess('getUserOwnedCompanies', { 
          userId, 
          count: data?.length || 0 
        });

        return { data: data || [], error: null };
      } catch (error) {
        this.logFailure('getUserOwnedCompanies', error, { userId });
        return { data: null, error };
      }
    }, 'getUserOwnedCompanies');
  }

  /**
   * Set company owner
   */
  async setCompanyOwner(companyId: string, userId: string): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('setCompanyOwner', { companyId, userId });

      try {
        // Verify user exists
        const { data: user, error: userError } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          this.logFailure('setCompanyOwner', new Error('User not found'), { companyId, userId });
          return { 
            data: { 
              success: false, 
              error: 'User not found' 
            }, 
            error: null 
          };
        }

        // Update company owner
        const { error: updateError } = await this.supabase
          .from('companies')
          .update({ owner_id: userId })
          .eq('id', companyId);

        if (updateError) {
          this.logFailure('setCompanyOwner', updateError, { companyId, userId });
          return { 
            data: { 
              success: false, 
              error: updateError.message 
            }, 
            error: null 
          };
        }

        this.logSuccess('setCompanyOwner', { companyId, userId });
        return { 
          data: { success: true }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('setCompanyOwner', error, { companyId, userId });
        return { data: null, error };
      }
    }, 'setCompanyOwner');
  }

  /**
   * Get ownership statistics
   */
  async getOwnershipStats(): Promise<ServiceResponse<{
    totalCompanies: number;
    companiesWithOwners: number;
    orphanedCompanies: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getOwnershipStats', {});

      try {
        // Get total companies
        const { count: totalCompanies } = await this.supabase
          .from('companies')
          .select('*', { count: 'exact', head: true });

        // Get companies with owners
        const { count: companiesWithOwners } = await this.supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .not('owner_id', 'is', null);

        const stats = {
          totalCompanies: totalCompanies || 0,
          companiesWithOwners: companiesWithOwners || 0,
          orphanedCompanies: (totalCompanies || 0) - (companiesWithOwners || 0)
        };

        this.logSuccess('getOwnershipStats', stats);
        return { data: stats, error: null };
      } catch (error) {
        this.logFailure('getOwnershipStats', error);
        return { data: null, error };
      }
    }, 'getOwnershipStats');
  }

  /**
   * Get orphaned companies (companies without owners)
   */
  async getOrphanedCompanies(): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getOrphanedCompanies', {});

      try {
        const { data, error } = await this.supabase
          .from('companies')
          .select(`
            id,
            name,
            industry,
            size,
            created_at,
            updated_at
          `)
          .is('owner_id', null);

        if (error) {
          this.logFailure('getOrphanedCompanies', error);
          return { data: null, error };
        }

        this.logSuccess('getOrphanedCompanies', { 
          count: data?.length || 0 
        });

        return { data: data || [], error: null };
      } catch (error) {
        this.logFailure('getOrphanedCompanies', error);
        return { data: null, error };
      }
    }, 'getOrphanedCompanies');
  }

  /**
   * Assign ownership to orphaned companies
   */
  async assignOrphanedCompanyOwnership(
    companyId: string, 
    userId: string
  ): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('assignOrphanedCompanyOwnership', { companyId, userId });

      try {
        // Verify company is orphaned
        const { data: company, error: companyError } = await this.supabase
          .from('companies')
          .select('id, owner_id')
          .eq('id', companyId)
          .single();

        if (companyError) {
          this.logFailure('assignOrphanedCompanyOwnership', companyError, { companyId, userId });
          return { 
            data: { 
              success: false, 
              error: 'Company not found' 
            }, 
            error: null 
          };
        }

        if (company.owner_id) {
          this.logFailure('assignOrphanedCompanyOwnership', new Error('Company already has an owner'), { companyId, userId });
          return { 
            data: { 
              success: false, 
              error: 'Company already has an owner' 
            }, 
            error: null 
          };
        }

        // Assign ownership
        const result = await this.setCompanyOwner(companyId, userId);
        
        if (!result.success) {
          return result;
        }

        this.logSuccess('assignOrphanedCompanyOwnership', { companyId, userId });
        return { 
          data: { success: true }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('assignOrphanedCompanyOwnership', error, { companyId, userId });
        return { data: null, error };
      }
    }, 'assignOrphanedCompanyOwnership');
  }
}

// Export singleton instance
export const companyOwnershipService = new CompanyOwnershipService(); 
