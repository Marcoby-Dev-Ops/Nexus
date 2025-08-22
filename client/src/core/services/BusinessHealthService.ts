import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { callEdgeFunction } from '@/lib/api-client';

export interface BusinessHealthSnapshot {
  id?: string;
  user_id: string;
  org_id: string | null;
  overall_score: number;
  category_scores: Record<string, number>;
  last_calculated: string;
  data_sources: string[];
  connected_sources: number;
  verified_sources: number;
  data_quality_score: number;
  completion_percentage: number;
}

export class BusinessHealthService extends BaseService {
  private static instance: BusinessHealthService;

  private constructor() {
    super();
  }

  static getInstance(): BusinessHealthService {
    if (!BusinessHealthService.instance) {
      BusinessHealthService.instance = new BusinessHealthService();
    }
    return BusinessHealthService.instance;
  }

  async readLatest(): Promise<ServiceResponse<BusinessHealthSnapshot | null>> {
    try {
      const data = await callEdgeFunction<{ success: boolean; data: BusinessHealthSnapshot | null; error?: string }>(
        'business_health',
        { action: 'read' }
      );

      if (!data?.success) {
        return this.createErrorResponse<BusinessHealthSnapshot | null>(data?.error || 'Failed to read business health');
      }

      return this.createSuccessResponse<BusinessHealthSnapshot | null>(data.data ?? null);
    } catch (error) {
      const err = this.handleError(error, 'readLatest');
      return err as ServiceResponse<BusinessHealthSnapshot | null>;
    }
  }

  async refresh(): Promise<ServiceResponse<BusinessHealthSnapshot>> {
    try {
      const data = await callEdgeFunction<{ success: boolean; data?: BusinessHealthSnapshot; error?: string }>(
        'business_health',
        { action: 'refresh' }
      );

      if (!data?.success || !data.data) {
        return this.createErrorResponse<BusinessHealthSnapshot>(data?.error || 'Failed to refresh business health');
      }

      return this.createSuccessResponse<BusinessHealthSnapshot>(data.data);
    } catch (error) {
      const err = this.handleError(error, 'refresh');
      return err as ServiceResponse<BusinessHealthSnapshot>;
    }
  }
}

export const businessHealthService = BusinessHealthService.getInstance();


