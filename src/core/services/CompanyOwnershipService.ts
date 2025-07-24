import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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

export class CompanyOwnershipService {
  /**
   * Get the owner of a company
   */
  async getCompanyOwner(companyId: string): Promise<CompanyOwner | null> {
    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single();

      if (companyError || !company?.owner_id) {
        return null;
      }

      const { data: owner, error: ownerError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, display_name, role')
        .eq('id', company.owner_id)
        .single();

      if (ownerError) {
        logger.error('Error fetching company owner:', ownerError);
        return null;
      }

      return {
        id: owner.id,
        email: owner.email || '',
        first_name: owner.first_name,
        last_name: owner.last_name,
        display_name: owner.display_name,
        role: owner.role || 'owner'
      };
    } catch (error) {
      logger.error('Error getting company owner:', error);
      return null;
    }
  }

  /**
   * Check if a user is the owner of a company
   */
  async isCompanyOwner(companyId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .eq('owner_id', userId)
        .single();

      if (error) {
        logger.error('Error checking company ownership:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking company ownership:', error);
      return false;
    }
  }

  /**
   * Transfer company ownership to another user
   */
  async transferOwnership(request: OwnershipTransferRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify current user is the owner
      const isOwner = await this.isCompanyOwner(request.companyId, request.currentUserId);
      if (!isOwner) {
        return {
          success: false,
          error: 'Only the current owner can transfer ownership'
        };
      }

      // Verify new owner exists and belongs to the company
      const { data: newOwner, error: newOwnerError } = await supabase
        .from('user_profiles')
        .select('id, company_id')
        .eq('id', request.newOwnerId)
        .eq('company_id', request.companyId)
        .single();

      if (newOwnerError || !newOwner) {
        return {
          success: false,
          error: 'New owner must be a member of the company'
        };
      }

      // Use the database function to transfer ownership
      const { data, error } = await supabase.rpc('transfer_company_ownership', {
        company_uuid: request.companyId,
        new_owner_uuid: request.newOwnerId,
        current_user_uuid: request.currentUserId
      });

      if (error) {
        logger.error('Error transferring ownership:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error transferring ownership:', error);
      return {
        success: false,
        error: 'Failed to transfer ownership'
      };
    }
  }

  /**
   * Get all companies owned by a user
   */
  async getUserOwnedCompanies(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId);

      if (error) {
        logger.error('Error fetching user owned companies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching user owned companies:', error);
      return [];
    }
  }

  /**
   * Set a user as the owner of a company (for new companies)
   */
  async setCompanyOwner(companyId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ owner_id: userId, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) {
        logger.error('Error setting company owner:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Also update the user's role to 'owner'
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ role: 'owner', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .eq('company_id', companyId);

      if (profileError) {
        logger.error('Error updating user role:', profileError);
        // Don't fail the whole operation, just log the error
      }

      return { success: true };
    } catch (error) {
      logger.error('Error setting company owner:', error);
      return {
        success: false,
        error: 'Failed to set company owner'
      };
    }
  }

  /**
   * Get company ownership statistics
   */
  async getOwnershipStats(): Promise<{
    totalCompanies: number;
    companiesWithOwners: number;
    orphanedCompanies: number;
  }> {
    try {
      const { data: totalCompanies, error: totalError } = await supabase
        .from('companies')
        .select('id', { count: 'exact' });

      const { data: companiesWithOwners, error: ownersError } = await supabase
        .from('companies')
        .select('id', { count: 'exact' })
        .not('owner_id', 'is', null);

      if (totalError || ownersError) {
        logger.error('Error getting ownership stats:', totalError || ownersError);
        return {
          totalCompanies: 0,
          companiesWithOwners: 0,
          orphanedCompanies: 0
        };
      }

      return {
        totalCompanies: totalCompanies?.length || 0,
        companiesWithOwners: companiesWithOwners?.length || 0,
        orphanedCompanies: (totalCompanies?.length || 0) - (companiesWithOwners?.length || 0)
      };
    } catch (error) {
      logger.error('Error getting ownership stats:', error);
      return {
        totalCompanies: 0,
        companiesWithOwners: 0,
        orphanedCompanies: 0
      };
    }
  }
} 