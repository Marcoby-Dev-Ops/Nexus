import { BaseService, type ServiceResponse } from '../core/services/BaseService';
import { getAuthHeaders } from '../lib/api-client';

export interface InitiativeAcceptance {
  id: string;
  user_id: string;
  company_id?: string;
  initiative_id: string;
  initiative_title: string;
  initiative_description?: string;
  acceptance_type: 'already_have_this' | 'want_to_implement' | 'not_interested';
  implementation_details?: string;
  playbook_data?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  next_steps?: string[];
  pending_task?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateInitiativeAcceptanceRequest {
  initiative_id: string;
  initiative_title: string;
  initiative_description?: string;
  acceptance_type: 'already_have_this' | 'want_to_implement' | 'not_interested';
  implementation_details?: string;
  playbook_data?: any;
  next_steps?: string[];
  pending_task?: any;
}

export class FireInitiativeAcceptanceService extends BaseService {
  private readonly tableName = 'initiative_acceptances';

  /**
   * Create a new initiative acceptance
   */
  async createAcceptance(
    userId: string,
    companyId: string | null,
    data: CreateInitiativeAcceptanceRequest
  ): Promise<ServiceResponse<InitiativeAcceptance>> {
    return this.executeDbOperation(async () => {
      const acceptanceData = {
        id: crypto.randomUUID(),
        user_id: userId,
        company_id: companyId,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}`, {
         method: 'POST',
         headers,
         body: JSON.stringify(acceptanceData)
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create initiative acceptance: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return this.createSuccessResponse(result.data);
    }, `create initiative acceptance for user ${userId}`);
  }

  /**
   * Get all initiative acceptances for a user
   */
  async getUserAcceptances(userId: string): Promise<ServiceResponse<InitiativeAcceptance[]>> {
    return this.executeDbOperation(async () => {
             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}?user_id=${userId}`, {
         headers
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get initiative acceptances: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return this.createSuccessResponse(result.data || []);
    }, `get initiative acceptances for user ${userId}`);
  }

  /**
   * Get a specific initiative acceptance by ID
   */
  async getAcceptanceById(acceptanceId: string): Promise<ServiceResponse<InitiativeAcceptance>> {
    return this.executeDbOperation(async () => {
             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}/${acceptanceId}`, {
         headers
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get initiative acceptance: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return this.createSuccessResponse(result.data);
    }, `get initiative acceptance ${acceptanceId}`);
  }

  /**
   * Update an initiative acceptance
   */
  async updateAcceptance(
    acceptanceId: string,
    updates: Partial<InitiativeAcceptance>
  ): Promise<ServiceResponse<InitiativeAcceptance>> {
    return this.executeDbOperation(async () => {
             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}/${acceptanceId}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify({
           ...updates,
           updated_at: new Date().toISOString()
         })
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update initiative acceptance: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return this.createSuccessResponse(result.data);
    }, `update initiative acceptance ${acceptanceId}`);
  }

  /**
   * Delete an initiative acceptance
   */
  async deleteAcceptance(acceptanceId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}/${acceptanceId}`, {
         method: 'DELETE',
         headers
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete initiative acceptance: ${response.statusText} - ${errorText}`);
      }

      return this.createSuccessResponse(true);
    }, `delete initiative acceptance ${acceptanceId}`);
  }

  /**
   * Check if user has already accepted a specific initiative
   */
  async hasUserAcceptedInitiative(
    userId: string,
    initiativeId: string
  ): Promise<ServiceResponse<InitiativeAcceptance | null>> {
    return this.executeDbOperation(async () => {
             const headers = await getAuthHeaders();
       const response = await fetch(`/api/db/${this.tableName}?user_id=${userId}&initiative_id=${initiativeId}`, {
         headers
       });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check initiative acceptance: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const acceptances = result.data || [];
      
      // Return the first matching acceptance or null
      return this.createSuccessResponse(acceptances.length > 0 ? acceptances[0] : null);
    }, `check if user ${userId} has accepted initiative ${initiativeId}`);
  }
}
