/**
 * Company API Client
 * Handles HTTP requests to the server-side CompanyService
 */

import { logger } from '@/shared/utils/logger';

// Company types (matching server-side schema)
export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  address?: Record<string, any>;
  contact_info?: Record<string, any>;
  tax_info?: Record<string, any>;
  billing_info?: Record<string, any>;
  owner_id: string;
  is_active: boolean;
  settings?: Record<string, any>;
  subscription_plan: string;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  name: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  domain?: string;
  businessType?: string;
  fundingStage?: string;
  revenueRange?: string;
}

export interface UpdateCompanyData {
  name?: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  domain?: string;
  settings?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CompanyApi {
  private baseUrl = '/api/companies';

  /**
   * Get company by ID
   */
  async get(companyId: string): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to get company', { companyId, error: data.error });
        return { success: false, error: data.error || 'Failed to get company' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      logger.error('Error getting company', { companyId, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Create new company
   */
  async create(companyData: CreateCompanyData): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(companyData)
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to create company', { companyData, error: data.error });
        return { success: false, error: data.error || 'Failed to create company' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      logger.error('Error creating company', { companyData, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Update company
   */
  async update(companyId: string, updateData: UpdateCompanyData): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to update company', { companyId, updateData, error: data.error });
        return { success: false, error: data.error || 'Failed to update company' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      logger.error('Error updating company', { companyId, updateData, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Delete company (soft delete)
   */
  async delete(companyId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to delete company', { companyId, error: data.error });
        return { success: false, error: data.error || 'Failed to delete company' };
      }

      return { success: true, data: true };
    } catch (error) {
      logger.error('Error deleting company', { companyId, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get company by owner ID
   */
  async getCompanyByOwner(userId: string): Promise<ApiResponse<Company | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/owner/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to get company by owner', { userId, error: data.error });
        return { success: false, error: data.error || 'Failed to get company by owner' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      logger.error('Error getting company by owner', { userId, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Ensure user has a company (create if needed)
   */
  async ensureCompany(signupData: Record<string, any> = {}): Promise<ApiResponse<Company & { created: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/ensure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to ensure company', { signupData, error: data.error });
        return { success: false, error: data.error || 'Failed to ensure company' };
      }

      return { 
        success: true, 
        data: { 
          ...data.data, 
          created: data.created 
        } 
      };
    } catch (error) {
      logger.error('Error ensuring company', { signupData, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Associate user with company
   */
  async associateUser(companyId: string, role: string = 'member'): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}/associate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Failed to associate user with company', { companyId, role, error: data.error });
        return { success: false, error: data.error || 'Failed to associate user with company' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      logger.error('Error associating user with company', { companyId, role, error });
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session?.accessToken || session?.session?.accessToken || '';
      }
    } catch (error) {
      logger.error('Failed to get auth token', { error });
    }
    return '';
  }
}

// Export singleton instance
export const companyApi = new CompanyApi();
export default companyApi;
