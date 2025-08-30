import { ApiManager } from '@/services/ApiManager';
import type { 
  Integration, 
  CreateIntegrationRequest, 
  UpdateIntegrationRequest, 
  IntegrationFilter,
  IntegrationTestResult 
} from '../types/integration';

export class IntegrationService {
  private apiManager: ApiManager;

  constructor() {
    this.apiManager = new ApiManager();
  }

  async getIntegrations(filter?: IntegrationFilter): Promise<Integration[]> {
    try {
      const params = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await this.apiManager.get(`/api/integrations?${params.toString()}`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async getIntegration(id: string): Promise<Integration> {
    try {
      const response = await this.apiManager.get(`/api/integrations/${id}`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async createIntegration(data: CreateIntegrationRequest): Promise<Integration> {
    try {
      const response = await this.apiManager.post('/api/integrations', data);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async updateIntegration(id: string, data: UpdateIntegrationRequest): Promise<Integration> {
    try {
      const response = await this.apiManager.put(`/api/integrations/${id}`, data);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async deleteIntegration(id: string): Promise<void> {
    try {
      await this.apiManager.delete(`/api/integrations/${id}`);
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async testIntegration(id: string): Promise<IntegrationTestResult> {
    try {
      const response = await this.apiManager.post(`/api/integrations/${id}/test`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async activateIntegration(id: string): Promise<Integration> {
    try {
      const response = await this.apiManager.post(`/api/integrations/${id}/activate`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async deactivateIntegration(id: string): Promise<Integration> {
    try {
      const response = await this.apiManager.post(`/api/integrations/${id}/deactivate`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async getIntegrationEvents(id: string, limit = 50): Promise<any[]> {
    try {
      const response = await this.apiManager.get(`/api/integrations/${id}/events?limit=${limit}`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }

  async getIntegrationLogs(id: string, limit = 100): Promise<any[]> {
    try {
      const response = await this.apiManager.get(`/api/integrations/${id}/logs?limit=${limit}`);
      return response.data;
    } catch (error) {
      // Error logging removed for production
      throw error;
    }
  }
}
