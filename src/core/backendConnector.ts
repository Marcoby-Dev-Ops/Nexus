/**
 * Backend Connector Service
 * Centralized service for managing all backend data source connections
 * Provides consistent error handling, retry logic, and health monitoring
 */

import { supabase } from '@/core/supabase';
import { env } from '@/core/environment';
import { logger } from '@/core/auth/logger';

export interface BackendConnectionConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency: number;
  lastCheck: Date;
  error?: string;
}

export interface BackendService {
  name: string;
  baseUrl: string;
  health: ConnectionHealth;
  isConnected: boolean;
}

export class BackendConnector {
  private config: BackendConnectionConfig;
  private services: Map<string, BackendService> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private connectionListeners: Set<(services: BackendService[]) => void> = new Set();

  constructor(config: Partial<BackendConnectionConfig> = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000, // 1 minute
      ...config
    };

    this.initializeServices();
    this.startHealthMonitoring();
  }

  /**
   * Initialize all backend services
   */
  private initializeServices(): void {
    // Only register actual function endpoints and valid API endpoints:
    this.services.set('ai-chat', {
      name: 'AI Chat',
      baseUrl: `${env.supabase.url}/functions/v1/ai_chat`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false
    });
    this.services.set('business-health', {
      name: 'Business Health',
      baseUrl: `${env.supabase.url}/functions/v1/business_health`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false
    });
    // ...other valid services...
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServicesHealth();
    }, this.config.healthCheckInterval);

    // Initial health check
    this.checkAllServicesHealth();
  }

  /**
   * Log health check result to Supabase table
   */
  private async logServiceHealth(serviceName: string, status: string, latency: number, error?: string) {
    try {
      await supabase.from('service_health_logs').insert([
        {
          service_name: serviceName,
          status,
          latency_ms: latency,
          error_message: error || null,
          checked_at: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      // Don't throw, just log
      logger.error({ serviceName, status, latency, error, err }, 'Failed to log service health');
    }
  }

  /**
   * Check health of all backend services
   */
  private async checkAllServicesHealth(): Promise<void> {
    const healthChecks = Array.from(this.services.entries()).map(async ([key, service]) => {
      try {
        const startTime = Date.now();
        const health = await this.checkServiceHealth(service);
        const latency = Date.now() - startTime;

        const updatedService: BackendService = {
          ...service,
          health: {
            ...health,
            latency,
            lastCheck: new Date()
          },
          isConnected: health.status === 'healthy'
        };

        this.services.set(key, updatedService);
        logger.info({ service: key, health: health.status, latency }, 'Service health check completed');
        // Log health to Supabase
        await this.logServiceHealth(service.name, health.status, latency, health.error);
      } catch (error) {
        logger.error({ service: key, error }, 'Service health check failed');
        
        const updatedService: BackendService = {
          ...service,
          health: {
            status: 'unhealthy',
            latency: 0,
            lastCheck: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          isConnected: false
        };

        this.services.set(key, updatedService);
        // Log failed health to Supabase
        await this.logServiceHealth(service.name, 'unhealthy', 0, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    await Promise.all(healthChecks);
    this.notifyConnectionListeners();
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: BackendService): Promise<ConnectionHealth> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      let response: Response;
      
      // Health check: public endpoints (no Authorization header)
      if ([
        'business-health',
        'ai-chat',
        'assistant',
        'health'
      ].includes(service.name)) {
        response = await fetch(service.baseUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else if (service.name === 'edge-functions') {
        // Check edge-functions health endpoint (if needed)
        response = await fetch(`${service.baseUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.supabase.anonKey}`
          }
        });
      } else {
        // Protected endpoints: require Authorization header
        const session = await this.getSession();
        if (!session) throw new Error('Authentication required');
        response = await fetch(service.baseUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check that the response body contains { status: 'ok' }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(`Unexpected health status: ${data.status}`);
      }

      return {
        status: 'healthy',
        latency: 0,
        lastCheck: new Date()
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'unhealthy',
          latency: 0,
          lastCheck: new Date(),
          error: 'Request timeout'
        };
      }

      return {
        status: 'unhealthy',
        latency: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Make authenticated request to backend service
   */
  async request<T>(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    if (!service.isConnected) {
      throw new Error(`Service ${serviceName} is not connected`);
    }

    // Always require authentication for protected requests
    const session = await this.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const url = `${service.baseUrl}${endpoint}`;
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers
      }
    };

    return this.makeRequestWithRetry<T>(url, requestOptions);
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry<T>(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.config.retries) {
        logger.warn({ url, attempt, error }, 'Request failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.makeRequestWithRetry<T>(url, options, attempt + 1);
      }

      logger.error({ url, error }, 'Request failed after all retries');
      throw error;
    }
  }

  /**
   * Get current session
   */
  private async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      logger.error({ error }, 'Failed to get session');
      return null;
    }
  }

  /**
   * Subscribe to connection status changes
   */
  subscribe(listener: (services: BackendService[]) => void): () => void {
    this.connectionListeners.add(listener);
    
    // Initial call
    listener(Array.from(this.services.values()));
    
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Notify listeners of connection changes
   */
  private notifyConnectionListeners(): void {
    const services = Array.from(this.services.values());
    this.connectionListeners.forEach(listener => {
      try {
        listener(services);
      } catch (error) {
        logger.error({ error }, 'Error in connection listener');
      }
    });
  }

  /**
   * Get all services
   */
  getServices(): BackendService[] {
    return Array.from(this.services.values());
  }

  /**
   * Get specific service
   */
  getService(name: string): BackendService | undefined {
    return this.services.get(name);
  }

  /**
   * Check if all critical services are healthy
   */
  isSystemHealthy(): boolean {
    const criticalServices = ['supabase', 'edge-functions'];
    return criticalServices.every(name => {
      const service = this.services.get(name);
      return service?.isConnected === true;
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.connectionListeners.clear();
  }
}

// Export singleton instance
export const backendConnector = new BackendConnector(); 