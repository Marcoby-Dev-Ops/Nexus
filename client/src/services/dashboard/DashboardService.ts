import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface BuildingBlock {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  implementation_time_hours: number;
  risk_level: 'low' | 'medium' | 'high';
  expected_impact: 'low' | 'medium' | 'high';
  prerequisites: string[];
  success_metrics: string[];
  phase_relevance: string[];
  mental_model_alignment: string[];
  tags: string[];
  documentation: string;
  examples: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHealthSnapshot {
  id: string;
  user_id: string;
  overall_score: number;
  building_block_scores: Record<string, number>;
  assessment_date: string;
  notes?: string;
  created_at: string;
}

export interface UserBuildingBlockImplementation {
  id: string;
  user_id: string;
  building_block_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  buildingBlocks: BuildingBlock[];
  userImplementations: UserBuildingBlockImplementation[];
  recentHealthSnapshots: BusinessHealthSnapshot[];
  overallHealth: number;
  stats: {
    totalBlocks: number;
    completedBlocks: number;
    inProgressBlocks: number;
    notStartedBlocks: number;
  };
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export class DashboardService extends BaseService {
  protected config = {
    serviceName: 'DashboardService',
    baseUrl: '/api/db',
  };

  constructor() {
    super('DashboardService');
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(userId: string): Promise<ServiceResponse<DashboardData>> {
    try {
      logger.info('Fetching dashboard data', { userId });

      // Fetch all data in parallel
      const [buildingBlocksResult, implementationsResult, healthSnapshotsResult] = await Promise.all([
        this.getBuildingBlocks(),
        this.getUserImplementations(userId),
        this.getRecentHealthSnapshots(userId),
      ]);

      if (!buildingBlocksResult.success) {
        return this.handleError(buildingBlocksResult.error, 'Failed to fetch building blocks');
      }

      if (!implementationsResult.success) {
        return this.handleError(implementationsResult.error, 'Failed to fetch user implementations');
      }

      if (!healthSnapshotsResult.success) {
        return this.handleError(healthSnapshotsResult.error, 'Failed to fetch health snapshots');
      }

      const buildingBlocks = buildingBlocksResult.data || [];
      const userImplementations = implementationsResult.data || [];
      const recentHealthSnapshots = healthSnapshotsResult.data || [];

      // Calculate overall health from latest snapshot or implementations
      const overallHealth = this.calculateOverallHealth(recentHealthSnapshots, userImplementations);

      // Calculate stats
      const stats = this.calculateStats(userImplementations);

      const dashboardData: DashboardData = {
        buildingBlocks,
        userImplementations,
        recentHealthSnapshots,
        overallHealth,
        stats,
      };

      logger.info('Dashboard data fetched successfully', { 
        userId, 
        buildingBlocksCount: buildingBlocks.length,
        implementationsCount: userImplementations.length,
        overallHealth 
      });

      return this.createResponse(dashboardData);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch dashboard data');
    }
  }

  /**
   * Get all building blocks
   */
  async getBuildingBlocks(): Promise<ServiceResponse<BuildingBlock[]>> {
    try {
      const result = await select<BuildingBlock>('building_blocks', {
        filters: { is_active: true },
        orderBy: 'name ASC',
      });

      return this.createResponse(result.data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch building blocks');
    }
  }

  /**
   * Get user's building block implementations
   */
  async getUserImplementations(userId: string): Promise<ServiceResponse<UserBuildingBlockImplementation[]>> {
    try {
      const result = await select<UserBuildingBlockImplementation>('user_building_block_implementations', {
        filters: { user_id: userId },
        orderBy: 'updated_at DESC',
      });

      return this.createResponse(result.data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user implementations');
    }
  }

  /**
   * Get recent business health snapshots
   */
  async getRecentHealthSnapshots(userId: string, limit: number = 5): Promise<ServiceResponse<BusinessHealthSnapshot[]>> {
    try {
      const result = await select<BusinessHealthSnapshot>('business_health_snapshots', {
        filters: { user_id: userId },
        orderBy: 'assessment_date DESC',
        limit,
      });

      return this.createResponse(result.data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch health snapshots');
    }
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(
    healthSnapshots: BusinessHealthSnapshot[],
    implementations: UserBuildingBlockImplementation[]
  ): number {
    // If we have recent health snapshots, use the latest one
    if (healthSnapshots.length > 0) {
      return healthSnapshots[0].overall_score;
    }

    // Otherwise, calculate from implementations
    if (implementations.length === 0) {
      return 0;
    }

    const totalProgress = implementations.reduce((sum, impl) => sum + impl.progress_percentage, 0);
    return Math.round(totalProgress / implementations.length);
  }

  /**
   * Calculate dashboard statistics
   */
  private calculateStats(implementations: UserBuildingBlockImplementation[]) {
    const totalBlocks = implementations.length;
    const completedBlocks = implementations.filter(impl => impl.status === 'completed').length;
    const inProgressBlocks = implementations.filter(impl => impl.status === 'in_progress').length;
    const notStartedBlocks = implementations.filter(impl => impl.status === 'not_started').length;

    return {
      totalBlocks,
      completedBlocks,
      inProgressBlocks,
      notStartedBlocks,
    };
  }

  /**
   * Get building blocks by category for dashboard display
   */
  async getBuildingBlocksByCategory(): Promise<ServiceResponse<Record<string, BuildingBlock[]>>> {
    try {
      const result = await this.getBuildingBlocks();
      
      if (!result.success) {
        return this.handleError(result.error, 'Failed to fetch building blocks by category');
      }

      const buildingBlocks = result.data || [];
      const blocksByCategory = buildingBlocks.reduce((acc, block) => {
        if (!acc[block.category]) {
          acc[block.category] = [];
        }
        acc[block.category].push(block);
        return acc;
      }, {} as Record<string, BuildingBlock[]>);

      return this.createResponse(blocksByCategory);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch building blocks by category');
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();







