import { selectData, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import type { Company } from '@/services/core/CompanyService';

export interface UserContextData {
  userId: string;
  profile: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    company_id?: string;
    role?: string;
    experience_level?: string;
    preferences?: Record<string, any>;
  };
  company?: Company;
  buildingBlocks: BuildingBlockStatus[];
  recentActivity: RecentActivity[];
}

export interface BuildingBlockStatus {
  id: string;
  name: string;
  status: 'complete' | 'in_progress' | 'not_started';
  category: string;
  progress?: number;
  lastUpdated?: string;
  data?: Record<string, any>;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatContextResponse {
  success: boolean;
  data?: UserContextData;
  error?: string;
}

class ChatContextApi {
  async getUserContext(userId: string): Promise<ChatContextResponse> {
    try {
      logger.info('Fetching user context for chat', { userId });

      // Get user profile
      const profileResult = await selectOne('user_profiles', { user_id: userId });
      if (!profileResult.success || !profileResult.data) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = profileResult.data;
      const companyId = profile.company_id;

      // Get company data if available
      let company: Company | undefined;
      if (companyId) {
        const companyResult = await selectOne('companies', { id: companyId });
        if (companyResult.success && companyResult.data) {
          company = companyResult.data as Company;
        }
      }

      // Get building blocks status
      const buildingBlocks = await this.getBuildingBlocksStatus(userId);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(userId);

      const contextData: UserContextData = {
        userId,
        profile: {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          company_id: profile.company_id,
          role: profile.role,
          experience_level: profile.experience_level,
          preferences: profile.preferences
        },
        company,
        buildingBlocks,
        recentActivity
      };

      logger.info('Successfully fetched user context', {
        userId,
        hasCompany: !!company,
        buildingBlocksCount: buildingBlocks.length,
        activityCount: recentActivity.length
      });

      return {
        success: true,
        data: contextData
      };

    } catch (error) {
      logger.error('Error fetching user context for chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user context'
      };
    }
  }

  private async getBuildingBlocksStatus(userId: string): Promise<BuildingBlockStatus[]> {
    try {
      // Get user's building blocks progress from the database
      const result = await selectData('user_building_blocks', {
        user_id: userId
      });

      if (!result.success) {
        logger.warn('Failed to fetch building blocks status, using defaults');
        return this.getDefaultBuildingBlocks();
      }

      const userBlocks = result.data || [];
      
      // Map database results to BuildingBlockStatus format
      const buildingBlocks: BuildingBlockStatus[] = userBlocks.map((block: any) => ({
        id: block.block_id,
        name: block.block_name || block.block_id,
        status: block.status || 'not_started',
        category: block.category || 'general',
        progress: block.progress || 0,
        lastUpdated: block.updated_at,
        data: block.block_data || {}
      }));

      // If no building blocks found, return defaults
      if (buildingBlocks.length === 0) {
        return this.getDefaultBuildingBlocks();
      }

      return buildingBlocks;

    } catch (error) {
      logger.error('Error fetching building blocks status:', error);
      return this.getDefaultBuildingBlocks();
    }
  }

  private getDefaultBuildingBlocks(): BuildingBlockStatus[] {
    // Return the 7 core building blocks with default status
    return [
      {
        id: 'identity',
        name: 'Identity',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'revenue',
        name: 'Revenue',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'cash',
        name: 'Cash',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'delivery',
        name: 'Delivery',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'people',
        name: 'People',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'knowledge',
        name: 'Knowledge',
        status: 'not_started',
        category: 'core',
        progress: 0
      },
      {
        id: 'systems',
        name: 'Systems',
        status: 'not_started',
        category: 'core',
        progress: 0
      }
    ];
  }

  private async getRecentActivity(userId: string): Promise<RecentActivity[]> {
    try {
      // Get recent user activity from various tables
      const activityPromises = [
        // Chat messages
        selectData('chat_messages', {
          userid: userId,
          limit: 5,
          orderBy: { created_at: 'desc' }
        }),
        // User actions/events
        selectData('user_activity', {
          user_id: userId,
          limit: 5,
          orderBy: { created_at: 'desc' }
        }),
        // Recent tasks or todos
        selectData('tasks', {
          user_id: userId,
          limit: 3,
          orderBy: { created_at: 'desc' }
        })
      ];

      const [chatMessages, userActivity, tasks] = await Promise.all(activityPromises);

      const recentActivity: RecentActivity[] = [];

      // Process chat messages
      if (chatMessages.success && chatMessages.data) {
        chatMessages.data.forEach((msg: any) => {
          recentActivity.push({
            id: msg.id,
            type: 'chat_message',
            description: `Chat message: ${msg.content.substring(0, 50)}...`,
            timestamp: msg.created_at,
            metadata: { role: msg.role, conversationId: msg.conversationid }
          });
        });
      }

      // Process user activity
      if (userActivity.success && userActivity.data) {
        userActivity.data.forEach((activity: any) => {
          recentActivity.push({
            id: activity.id,
            type: 'user_activity',
            description: `${activity.action} on ${activity.page}`,
            timestamp: activity.created_at,
            metadata: activity.metadata
          });
        });
      }

      // Process tasks
      if (tasks.success && tasks.data) {
        tasks.data.forEach((task: any) => {
          recentActivity.push({
            id: task.id,
            type: 'task',
            description: `Task: ${task.title}`,
            timestamp: task.created_at,
            metadata: { status: task.status, priority: task.priority }
          });
        });
      }

      // Sort by timestamp and return most recent
      return recentActivity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getCompanyContext(companyId: string): Promise<ChatContextResponse> {
    try {
      logger.info('Fetching company context for chat', { companyId });

      // Get company data
      const companyResult = await selectOne('companies', { id: companyId });
      if (!companyResult.success || !companyResult.data) {
        throw new Error('Failed to fetch company data');
      }

      const company = companyResult.data as Company;

      // Get company analytics if available
      if (company.analytics) {
        const analyticsResult = await selectOne('company_analytics', { company_id: companyId });
        if (analyticsResult.success && analyticsResult.data) {
          company.analytics = { ...company.analytics, ...analyticsResult.data };
        }
      }

      // Get company health if available
      if (company.health) {
        const healthResult = await selectOne('company_health', { company_id: companyId });
        if (healthResult.success && healthResult.data) {
          company.health = { ...company.health, ...healthResult.data };
        }
      }

      return {
        success: true,
        data: {
          userId: '', // Not applicable for company context
          profile: {} as any,
          company,
          buildingBlocks: [],
          recentActivity: []
        }
      };

    } catch (error) {
      logger.error('Error fetching company context for chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch company context'
      };
    }
  }

  async getBuildingBlocksContext(userId: string): Promise<ChatContextResponse> {
    try {
      logger.info('Fetching building blocks context for chat', { userId });

      const buildingBlocks = await this.getBuildingBlocksStatus(userId);

      return {
        success: true,
        data: {
          userId,
          profile: {} as any,
          company: undefined,
          buildingBlocks,
          recentActivity: []
        }
      };

    } catch (error) {
      logger.error('Error fetching building blocks context for chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch building blocks context'
      };
    }
  }
}

export const chatContextApi = new ChatContextApi();
