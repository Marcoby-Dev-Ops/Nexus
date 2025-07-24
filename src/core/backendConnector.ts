/**
 * Backend Connector Service
 * Centralized service for managing all backend data source connections
 * Provides consistent error handling, retry logic, and health monitoring
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface BackendConnectionConfig {
  timeout?: number;
  retries?: number;
  healthCheckInterval?: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  lastCheck: Date;
}

export interface BackendService {
  name: string;
  baseUrl: string;
  health: ServiceHealth;
  isConnected: boolean;
}

export class BackendConnector {
  private config: BackendConnectionConfig;
  private services = new Map<string, BackendService>();
  private authSession: any = null;
  private authCheckPromise: Promise<any> | null = null;
  private queryWrapper = new DatabaseQueryWrapper();

  constructor(config: Partial<BackendConnectionConfig> = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      healthCheckInterval: 300000, // 5 minutes
      ...config
    };

    this.initializeServices();
  }

  private initializeServices(): void {
    this.services.set('supabase', {
      name: 'Supabase',
      baseUrl: supabase.url,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('database', {
      name: 'Database',
      baseUrl: `${supabase.url}/rest/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('storage', {
      name: 'Storage',
      baseUrl: `${supabase.url}/storage/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('auth', {
      name: 'Authentication',
      baseUrl: `${supabase.url}/auth/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('realtime', {
      name: 'Realtime',
      baseUrl: `${supabase.url}/realtime/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-chat', {
      name: 'AI Chat',
      baseUrl: `${supabase.url}/functions/v1/ai_chat`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('business-health', {
      name: 'Business Health',
      baseUrl: `${supabase.url}/functions/v1/business_health`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-embed-document', {
      name: 'AI Document Embedding',
      baseUrl: `${supabase.url}/functions/v1/ai_embed_document`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-execute-action', {
      name: 'AI Action Execution',
      baseUrl: `${supabase.url}/functions/v1/ai_execute_action`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-generate-business-plan', {
      name: 'AI Business Plan Generator',
      baseUrl: `${supabase.url}/functions/v1/ai_generate_business_plan`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-generate-suggestions', {
      name: 'AI Suggestions Generator',
      baseUrl: `${supabase.url}/functions/v1/ai_generate_suggestions`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });

    this.services.set('ai-metrics-daily', {
      name: 'AI Daily Metrics',
      baseUrl: `${supabase.url}/functions/v1/ai_metrics_daily`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
    });
  }

  /**
   * Get current authentication session
   */
  private async getAuthSession(): Promise<any> {
    if (this.authSession) {
      return this.authSession;
    }

    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    this.authCheckPromise = supabase.auth.getSession();
    try {
      const { data } = await this.authCheckPromise;
      this.authSession = data.session;
      return this.authSession;
    } finally {
      this.authCheckPromise = null;
    }
  }

  /**
   * Test service connectivity
   */
  async testServiceConnectivity(serviceName: string): Promise<ServiceHealth> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'down' = 'down';
    let latency = 0;

    try {
      const session = await this.getAuthSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['apikey'] = supabase.anonKey;
        headers['Authorization'] = `Bearer ${supabase.anonKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${service.baseUrl}/health`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      latency = Date.now() - startTime;

      if (response.ok) {
        status = latency < 1000 ? 'healthy' : 'degraded';
      } else {
        status = 'down';
      }
    } catch (error) {
      latency = Date.now() - startTime;
      status = 'down';
      logger.error(`Service ${serviceName} connectivity test failed:`, error);
    }

    const health: ServiceHealth = {
      status,
      latency,
      lastCheck: new Date(),
    };

    service.health = health;
    service.isConnected = status !== 'down';

    return health;
  }

  /**
   * Test all services connectivity
   */
  async testAllServices(): Promise<Map<string, ServiceHealth>> {
    const results = new Map<string, ServiceHealth>();

    const promises = Array.from(this.services.keys()).map(async (serviceName) => {
      try {
        const health = await this.testServiceConnectivity(serviceName);
        results.set(serviceName, health);
      } catch (error) {
        logger.error(`Failed to test service ${serviceName}:`, error);
        results.set(serviceName, {
          status: 'down',
          latency: 0,
          lastCheck: new Date(),
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get service by name
   */
  getService(serviceName: string): BackendService | null {
    const service = this.services.get(serviceName);
    return service || null;
  }

  /**
   * Log service health with proper authentication
   */
  async logServiceHealth(serviceName: string, status: 'healthy' | 'degraded' | 'down', details?: any) {
    try {
      const logData = {
        service_name: serviceName,
        status,
        details: details || null,
        timestamp: new Date().toISOString()
      };

      const { error } = await this.queryWrapper.query(
        async () => supabase.from('service_health_logs').insert([logData]),
        { context: 'log-service-health' }
      );

      if (error) {
        logger.error('Error logging service health:', error);
      }
    } catch (error) {
      logger.error('Error in logServiceHealth:', error);
    }
  }

  /**
   * Get service health logs with proper authentication
   */
  async getServiceHealthLogs(serviceName?: string, limit = 100) {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from('service_health_logs').select('*').order('timestamp', { ascending: false });
          
          if (serviceName) {
            query = query.eq('service_name', serviceName);
          }
          
          return query.limit(limit);
        },
        { context: 'get-service-health-logs' }
      );

      if (error) {
        logger.error('Error getting service health logs:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getServiceHealthLogs:', error);
      return { data: null, error };
    }
  }

  /**
   * Test backend connectivity with proper authentication
   */
  async testConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.query(
        async () => supabase.from('service_health_logs').select('id').limit(1),
        { context: 'test-connectivity' }
      );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error testing connectivity:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const backendConnector = new BackendConnector();