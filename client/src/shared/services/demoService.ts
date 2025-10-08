/**
 * Demo Service
 * Handles demo data generation and management
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DemoData {
  id: string;
  user_id: string;
  demo_type: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DemoConfig {
  demo_type: string;
  description: string;
  data_schema: Record<string, any>;
  is_enabled: boolean;
  max_instances: number;
}

export interface DemoStats {
  totalDemos: number;
  activeDemos: number;
  byType: Record<string, number>;
  recentActivity: number;
}

// ============================================================================
// DEMO SERVICE CLASS
// ============================================================================

export class DemoService extends BaseService {
  constructor() {
    super('DemoService');
  }

  /**
   * Create demo data for a user
   */
  async createDemoData(
    userId: string, 
    demoType: string, 
    data: Record<string, any>
  ): Promise<ServiceResponse<DemoData>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createDemoData', { userId, demoType });

      try {
        // Check if user already has this demo type
        const { data: existingDemo, error: checkError } = await this.supabase
          .from('demo_data')
          .select('*')
          .eq('user_id', userId)
          .eq('demo_type', demoType)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          this.logFailure('createDemoData', checkError.message);
          return { data: null, error: checkError };
        }

        if (existingDemo) {
          this.logFailure('createDemoData', 'Demo data already exists for this user and type');
          return { 
            data: null, 
            error: 'Demo data already exists for this user and type' 
          };
        }

        // Create new demo data
        const { data: newDemo, error: insertError } = await this.supabase
          .from('demo_data')
          .insert({
            user_id: userId,
            demo_type: demoType,
            data: data,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          this.logFailure('createDemoData', insertError.message);
          return { data: null, error: insertError };
        }

        this.logSuccess('createDemoData', `Created demo data for user ${userId}, type ${demoType}`);
        return { data: newDemo as DemoData, error: null };
      } catch (error) {
        this.logFailure('createDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get demo data for a user
   */
  async getUserDemoData(userId: string): Promise<ServiceResponse<DemoData[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserDemoData', { userId });

      try {
        const { data, error } = await this.supabase
          .from('demo_data')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) {
          this.logFailure('getUserDemoData', error.message);
          return { data: null, error };
        }

        this.logSuccess('getUserDemoData', `Retrieved ${data?.length || 0} demo data entries for user ${userId}`);
        return { data: data as DemoData[] || [], error: null };
      } catch (error) {
        this.logFailure('getUserDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get specific demo data
   */
  async getDemoData(userId: string, demoType: string): Promise<ServiceResponse<DemoData | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDemoData', { userId, demoType });

      try {
        const { data, error } = await this.supabase
          .from('demo_data')
          .select('*')
          .eq('user_id', userId)
          .eq('demo_type', demoType)
          .eq('is_active', true)
          .single();

        if (error) {
          this.logFailure('getDemoData', error.message);
          return { data: null, error };
        }

        this.logSuccess('getDemoData', `Retrieved demo data for user ${userId}, type ${demoType}`);
        return { data: data as DemoData, error: null };
      } catch (error) {
        this.logFailure('getDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Update demo data
   */
  async updateDemoData(
    userId: string, 
    demoType: string, 
    updates: Partial<DemoData>
  ): Promise<ServiceResponse<DemoData>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateDemoData', { userId, demoType });

      try {
        const { data, error } = await this.supabase
          .from('demo_data')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('demo_type', demoType)
          .eq('is_active', true)
          .select()
          .single();

        if (error) {
          this.logFailure('updateDemoData', error.message);
          return { data: null, error };
        }

        this.logSuccess('updateDemoData', `Updated demo data for user ${userId}, type ${demoType}`);
        return { data: data as DemoData, error: null };
      } catch (error) {
        this.logFailure('updateDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Delete demo data
   */
  async deleteDemoData(userId: string, demoType: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('deleteDemoData', { userId, demoType });

      try {
        const { error } = await this.supabase
          .from('demo_data')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('demo_type', demoType);

        if (error) {
          this.logFailure('deleteDemoData', error.message);
          return { data: null, error };
        }

        this.logSuccess('deleteDemoData', `Deleted demo data for user ${userId}, type ${demoType}`);
        return { data: true, error: null };
      } catch (error) {
        this.logFailure('deleteDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Generate sample demo data
   */
  async generateSampleData(userId: string, demoType: string): Promise<ServiceResponse<DemoData>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('generateSampleData', { userId, demoType });

      try {
        const sampleData = this.getSampleDataForType(demoType);
        
        const result = await this.createDemoData(userId, demoType, sampleData);
        
        if (!result.success) {
          return result;
        }

        this.logSuccess('generateSampleData', `Generated sample data for user ${userId}, type ${demoType}`);
        return result;
      } catch (error) {
        this.logFailure('generateSampleData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get demo statistics
   */
  async getDemoStats(): Promise<ServiceResponse<DemoStats>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDemoStats', {});

      try {
        const { data: demos, error } = await this.supabase
          .from('demo_data')
          .select('*')
          .eq('is_active', true);

        if (error) {
          this.logFailure('getDemoStats', error.message);
          return { data: null, error };
        }

        const stats: DemoStats = {
          totalDemos: demos?.length || 0,
          activeDemos: demos?.filter(d => d.is_active).length || 0,
          byType: {},
          recentActivity: 0
        };

        // Group by demo type
        demos?.forEach(demo => {
          const type = demo.demo_type;
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        // Count recent activity (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        stats.recentActivity = demos?.filter(demo => 
          new Date(demo.updated_at) > oneWeekAgo
        ).length || 0;

        this.logSuccess('getDemoStats', `Retrieved stats: ${stats.totalDemos} total demos, ${stats.activeDemos} active`);
        return { data: stats, error: null };
      } catch (error) {
        this.logFailure('getDemoStats', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get available demo types
   */
  async getAvailableDemoTypes(): Promise<ServiceResponse<DemoConfig[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAvailableDemoTypes', {});

      try {
        const demoConfigs: DemoConfig[] = [
          {
            demo_type: 'business_health',
            description: 'Business health monitoring demo',
            data_schema: {
              metrics: ['revenue', 'customers', 'satisfaction'],
              timeframes: ['daily', 'weekly', 'monthly']
            },
            is_enabled: true,
            max_instances: 1
          },
          {
            demo_type: 'ai_assistant',
            description: 'AI assistant functionality demo',
            data_schema: {
              features: ['chat', 'analysis', 'recommendations'],
              models: ['gpt-4', 'claude-3']
            },
            is_enabled: true,
            max_instances: 1
          },
          {
            demo_type: 'integrations',
            description: 'Third-party integrations demo',
            data_schema: {
              providers: ['microsoft', 'gmail', 'slack'],
              features: ['sync', 'automation', 'analytics']
            },
            is_enabled: true,
            max_instances: 3
          },
          {
            demo_type: 'automation',
            description: 'Workflow automation demo',
            data_schema: {
              triggers: ['email', 'schedule', 'webhook'],
              actions: ['notification', 'data_update', 'api_call']
            },
            is_enabled: true,
            max_instances: 2
          }
        ];

        this.logSuccess('getAvailableDemoTypes', `Retrieved ${demoConfigs.length} available demo types`);
        return { data: demoConfigs, error: null };
      } catch (error) {
        this.logFailure('getAvailableDemoTypes', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Check if user has demo data
   */
  async hasDemoData(userId: string, demoType: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('hasDemoData', { userId, demoType });

      try {
        const { data, error } = await this.supabase
          .from('demo_data')
          .select('id')
          .eq('user_id', userId)
          .eq('demo_type', demoType)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          this.logFailure('hasDemoData', error.message);
          return { data: null, error };
        }

        const hasData = !!data;
        this.logSuccess('hasDemoData', `User ${userId} has demo data for type ${demoType}: ${hasData}`);
        return { data: hasData, error: null };
      } catch (error) {
        this.logFailure('hasDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Clean up expired demo data
   */
  async cleanupExpiredDemoData(): Promise<ServiceResponse<{ deletedCount: number; errors: string[] }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('cleanupExpiredDemoData', {});

      try {
        // Find demo data older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: expiredDemos, error } = await this.supabase
          .from('demo_data')
          .select('*')
          .lt('created_at', thirtyDaysAgo.toISOString())
          .eq('is_active', true);

        if (error) {
          this.logFailure('cleanupExpiredDemoData', error.message);
          return { data: null, error };
        }

        let deletedCount = 0;
        const errors: string[] = [];

        for (const demo of expiredDemos || []) {
          try {
            const result = await this.deleteDemoData(demo.user_id, demo.demo_type);
            if (result.success) {
              deletedCount++;
            } else {
              errors.push(`Failed to delete demo ${demo.demo_type} for user ${demo.user_id}`);
            }
          } catch (error) {
            errors.push(`Error deleting demo ${demo.demo_type} for user ${demo.user_id}: ${error}`);
          }
        }

        this.logSuccess('cleanupExpiredDemoData', `Deleted ${deletedCount} expired demos, ${errors.length} errors`);
        return { 
          data: { 
            deletedCount, 
            errors 
          }, 
          error: null 
        };
      } catch (error) {
        this.logFailure('cleanupExpiredDemoData', error instanceof Error ? error.message : 'Unknown error');
        return { data: null, error };
      }
    });
  }

  /**
   * Get sample data for a specific demo type
   */
  private getSampleDataForType(demoType: string): Record<string, any> {
    const sampleData: Record<string, Record<string, any>> = {
      business_health: {
        metrics: {
          revenue: 50000,
          customers: 150,
          satisfaction: 4.2,
          growth_rate: 12.5
        },
        alerts: [
          { type: 'warning', message: 'Customer satisfaction below target', severity: 'medium' },
          { type: 'info', message: 'Revenue growth on track', severity: 'low' }
        ],
        insights: [
          'Revenue increased 15% this month',
          'Customer churn rate improved by 8%',
          'New feature adoption at 65%'
        ]
      },
      ai_assistant: {
        conversations: [
          { role: 'user', content: 'How can I improve my business metrics?' },
          { role: 'assistant', content: 'Based on your data, I recommend focusing on customer retention strategies.' }
        ],
        features: {
          chat_enabled: true,
          analysis_enabled: true,
          recommendations_enabled: true
        },
        usage_stats: {
          total_conversations: 25,
          average_response_time: 2.3,
          satisfaction_score: 4.5
        }
      },
      integrations: {
        connected_services: [
          { name: 'Microsoft 365', status: 'connected', last_sync: '2024-01-15T10:30:00Z' },
          { name: 'Gmail', status: 'connected', last_sync: '2024-01-15T09:45:00Z' }
        ],
        automation_rules: [
          { name: 'Email to Task', trigger: 'new_email', action: 'create_task', active: true },
          { name: 'Calendar Sync', trigger: 'calendar_update', action: 'sync_event', active: true }
        ],
        data_synced: {
          emails: 1250,
          contacts: 450,
          calendar_events: 89,
          tasks: 234
        }
      },
      automation: {
        workflows: [
          {
            name: 'Customer Onboarding',
            status: 'active',
            steps: ['welcome_email', 'setup_call', 'resource_access'],
            completion_rate: 85
          },
          {
            name: 'Lead Follow-up',
            status: 'active',
            steps: ['initial_contact', 'qualification', 'proposal'],
            completion_rate: 72
          }
        ],
        triggers: {
          email_received: 45,
          form_submitted: 23,
          time_based: 12
        },
        outcomes: {
          tasks_created: 156,
          emails_sent: 89,
          data_updated: 234
        }
      }
    };

    return sampleData[demoType] || { message: 'Sample data not available for this demo type' };
  }
}

// Export singleton instance
export const demoService = new DemoService(); 
