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
  responseTime?: number;
  uptime?: number;
}

export interface BackendService {
  name: string;
  baseUrl: string;
  health: ConnectionHealth;
  isConnected: boolean;
  type: 'edge-function' | 'api' | 'database' | 'storage';
  requiresAuth: boolean;
  critical: boolean;
}

export interface ServiceResponse<T = any> {
  data: T;
  error?: string;
  status: number;
  latency: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  version?: string;
}

export class BackendConnector {
  private config: BackendConnectionConfig;
  private services: Map<string, BackendService> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private connectionListeners: Set<(services: BackendService[]) => void> = new Set();
  private isDestroyed = false;
  private isInitialized = false;
  private authSession: any = null;
  private authCheckPromise: Promise<any> | null = null;

  constructor(config: Partial<BackendConnectionConfig> = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000, // 1 minute
      ...config
    };
  }

  /**
   * Initialize all backend services
   */
  private async initializeServices(): Promise<void> {
    // Core Services - always register these
    this.services.set('supabase', {
      name: 'Supabase',
      baseUrl: env.supabase.url,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'api',
      requiresAuth: false,
      critical: true
    });

    this.services.set('database', {
      name: 'Database',
      baseUrl: `${env.supabase.url}/rest/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'database',
      requiresAuth: true,
      critical: true
    });

    this.services.set('storage', {
      name: 'Storage',
      baseUrl: `${env.supabase.url}/storage/v1`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'storage',
      requiresAuth: true,
      critical: false
    });

    // Edge Functions - register but don't check existence during init
    // They will be checked during health monitoring
    this.services.set('ai-chat', {
      name: 'AI Chat',
      baseUrl: `${env.supabase.url}/functions/v1/ai_chat`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false // Make non-critical to avoid blocking
    });

    this.services.set('business-health', {
      name: 'Business Health',
      baseUrl: `${env.supabase.url}/functions/v1/business_health`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false // Make non-critical to avoid blocking
    });

    // New AI Functions
    this.services.set('ai-embed-document', {
      name: 'AI Document Embedding',
      baseUrl: `${env.supabase.url}/functions/v1/ai_embed_document`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false
    });

    this.services.set('ai-execute-action', {
      name: 'AI Action Execution',
      baseUrl: `${env.supabase.url}/functions/v1/ai_execute_action`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false
    });

    this.services.set('ai-generate-business-plan', {
      name: 'AI Business Plan Generator',
      baseUrl: `${env.supabase.url}/functions/v1/ai_generate_business_plan`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false
    });

    this.services.set('ai-generate-suggestions', {
      name: 'AI Suggestions Generator',
      baseUrl: `${env.supabase.url}/functions/v1/ai_generate_suggestions`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false
    });

    this.services.set('ai-metrics-daily', {
      name: 'AI Daily Metrics',
      baseUrl: `${env.supabase.url}/functions/v1/ai_metrics_daily`,
      health: { status: 'unknown', latency: 0, lastCheck: new Date() },
      isConnected: false,
      type: 'edge-function',
      requiresAuth: true,
      critical: false
    });
  }

  /**
   * Get or refresh authentication session
   */
  private async getAuthSession(): Promise<any> {
    // If we already have a valid session, return it
    if (this.authSession && this.authSession.expires_at > Date.now() / 1000) {
      return this.authSession;
    }

    // If there's already an auth check in progress, wait for it
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    // Start a new auth check
    this.authCheckPromise = this.performAuthCheck();
    try {
      const session = await this.authCheckPromise;
      this.authSession = session;
      return session;
    } finally {
      this.authCheckPromise = null;
    }
  }

  /**
   * Perform authentication check
   */
  private async performAuthCheck(): Promise<any> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error({ error }, 'Failed to get auth session');
        return null;
      }

      if (!session) {
        logger.debug('No auth session found');
        return null;
      }

      logger.debug('Auth session retrieved successfully');
      return session;
    } catch (error) {
      logger.error({ error }, 'Error during auth check');
      return null;
    }
  }

  /**
   * Initialize the backend connector
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing backend connector');
      
      // Initialize services
      await this.initializeServices();
      
      // Get initial auth session
      await this.getAuthSession();
      
      // Start health monitoring with delay to allow auth to complete
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.startHealthMonitoring();
        }
      }, 3000); // 3 second delay

      this.isInitialized = true;
      logger.info('Backend connector initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize backend connector');
      // Still start health monitoring even if initialization fails
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.startHealthMonitoring();
        }
      }, 3000);
    }
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    if (this.isDestroyed) return;

    // Initial health check
    this.checkAllServicesHealth();

    this.healthCheckInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.checkAllServicesHealth();
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Log health check result to Supabase table
   */
  private async logServiceHealth(
    serviceName: string, 
    status: string, 
    latency: number, 
    error?: string,
    responseTime?: number
  ) {
    try {
      // Get auth session before attempting to log
      const session = await this.getAuthSession();
      
      if (!session) {
        logger.debug('No auth session available for health logging');
        return;
      }

      // Check if the table exists before trying to insert
      const { error: tableError } = await supabase
        .from('service_health_logs')
        .select('id')
        .limit(1);

      if (tableError) {
        // Table doesn't exist, skip logging
        logger.debug({ serviceName, status, latency }, 'Health logging skipped - table not found');
        return;
      }

      // Use the correct column names for the service_health_logs table
      await supabase.from('service_health_logs').insert([
        {
          service_name: serviceName,
          status,
          latency_ms: Math.round(latency), // Convert to integer milliseconds
          error_message: error,
          checked_at: new Date().toISOString(),
          metadata: {
            response_time: responseTime,
            timestamp: new Date().toISOString()
          }
        }
      ]);
    } catch (error) {
      logger.error({ error, serviceName }, 'Failed to log service health');
    }
  }

  /**
   * Check health of all services
   */
  private async checkAllServicesHealth(): Promise<void> {
    // Get auth session once for all services
    const session = await this.getAuthSession();
    
    const promises = Array.from(this.services.values()).map(async service => {
      // Skip health checks for authenticated services if no session is available
      if (service.requiresAuth && !session) {
        logger.debug(`Skipping health check for ${service.name} - no auth session`);
        service.health = {
          status: 'degraded',
          latency: 0,
          lastCheck: new Date(),
          error: 'No authentication session'
        };
        service.isConnected = false;
        return service.health;
      }
      
      return this.checkServiceHealth(service);
    });

    try {
      await Promise.allSettled(promises);
      this.notifyConnectionListeners();
    } catch (error) {
      logger.error({ error }, 'Error during health check');
    }
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: BackendService): Promise<ConnectionHealth> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
    let error: string | undefined;
    let responseTime: number | undefined;

    try {
      // Get auth session for authenticated services
      let session = null;
      if (service.requiresAuth) {
        session = await this.getAuthSession();
        if (!session) {
          status = 'degraded';
          error = 'No authentication session';
        }
      }

      let response: Response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        switch (service.type) {
          case 'api': {
            // Simple ping to Supabase API
            response = await fetch(`${service.baseUrl}/rest/v1/`, {
              method: 'HEAD',
              signal: controller.signal,
              headers: {
                'apikey': env.supabase.anonKey,
                'Authorization': `Bearer ${env.supabase.anonKey}`
              }
            });
            status = response.ok ? 'healthy' : 'degraded';
            break;
          }

          case 'database': {
            // Test database connection with a simple query
            const { error: dbError } = await supabase
              .from('service_health_logs')
              .select('id')
              .limit(1);
            
            if (dbError && dbError.code === 'PGRST116') {
              status = 'unhealthy';
              error = 'Database connection failed';
            } else if (dbError && dbError.code === '42501') {
              status = 'degraded';
              error = 'Permission denied - auth required';
            } else {
              status = 'healthy';
            }
            break;
          }

          case 'storage': {
            // Test storage connection
            response = await fetch(`${service.baseUrl}/bucket`, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'apikey': env.supabase.anonKey,
                'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${env.supabase.anonKey}`
              }
            });
            if (response.status === 404) throw new Error('Storage not found');
            if (response.status === 401 || response.status === 403) status = 'degraded';
            else status = 'healthy';
            break;
          }

          case 'edge-function': {
            try {
              response = await fetch(service.baseUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${env.supabase.anonKey}`
                }
              });
              if (response.status === 404) throw new Error('Edge function not found');
              // 400/401/403 means function exists but has issues (auth, config, etc.)
              if (response.status === 400 || response.status === 401 || response.status === 403) {
                status = 'degraded';
                error = `Function exists but returned ${response.status}`;
              } else {
                status = 'healthy';
              }
              break;
            } catch {
              // fallback without auth
              const fallbackResponse = await fetch(service.baseUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${env.supabase.anonKey}`
                }
              });
              if (fallbackResponse.status === 404) throw new Error('Edge function not found');
              if (fallbackResponse.status === 400 || fallbackResponse.status === 401 || fallbackResponse.status === 403) {
                status = 'degraded';
                error = `Function exists but returned ${fallbackResponse.status}`;
              } else {
                status = 'healthy';
              }
            }
            break;
          }
        }

        responseTime = Date.now() - startTime;
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error = errorMessage;
      status = 'unhealthy';
      responseTime = Date.now() - startTime;
    }

    // Update service health
    service.health = {
      status,
      latency: responseTime || 0,
      lastCheck: new Date(),
      error,
      responseTime
    };

    service.isConnected = status === 'healthy' || status === 'degraded';

    // Log health result
    await this.logServiceHealth(service.name, status, responseTime || 0, error);

    return service.health;
  }

  /**
   * Make a request to a backend service with proper authentication
   */
  async request<T>(
    serviceName: string,
    endpoint: string = '',
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    const startTime = Date.now();
    let data: T;

    try {
      // Get auth session if required
      let session = null;
      if (service.requiresAuth) {
        session = await this.getAuthSession();
        if (!session) {
          throw new Error('Authentication required but no session available');
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
      };

      // Add authentication headers
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['apikey'] = env.supabase.anonKey;
        headers['Authorization'] = `Bearer ${env.supabase.anonKey}`;
      }

      // Make request with retry logic
      const url = `${service.baseUrl}${endpoint}`;
      data = await this.makeRequestWithRetry<T>(url, {
        ...options,
        headers
      });

      const responseTime = Date.now() - startTime;

      return {
        data,
        status: 200,
        latency: responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        data: null as T,
        error: errorMessage,
        status: 500,
        latency: responseTime
      };
    }
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
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.makeRequestWithRetry<T>(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get current session (for compatibility)
   */
  private async getSession() {
    return this.getAuthSession();
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
   * Get services by type
   */
  getServicesByType(type: BackendService['type']): BackendService[] {
    return Array.from(this.services.values()).filter(service => service.type === type);
  }

  /**
   * Get critical services
   */
  getCriticalServices(): BackendService[] {
    return Array.from(this.services.values()).filter(service => service.critical);
  }

  /**
   * Check if all critical services are healthy
   */
  isSystemHealthy(): boolean {
    const criticalServices = this.getCriticalServices();
    return criticalServices.every(service => service.isConnected === true);
  }

  /**
   * Get system health summary
   */
  getSystemHealth(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    criticalHealthy: boolean;
  } {
    const services = this.getServices();
    const criticalServices = this.getCriticalServices();
    
    const healthCounts = services.reduce((acc, service) => {
      if (service.health.status === 'healthy') {
        acc.healthy++;
      } else if (service.health.status === 'degraded') {
        acc.degraded++;
      } else if (service.health.status === 'unhealthy') {
        acc.unhealthy++;
      } else {
        acc.unknown++;
      }
      return acc;
    }, { healthy: 0, degraded: 0, unhealthy: 0, unknown: 0 });

    return {
      total: services.length,
      healthy: healthCounts.healthy,
      degraded: healthCounts.degraded,
      unhealthy: healthCounts.unhealthy,
      criticalHealthy: criticalServices.every(service => service.isConnected)
    };
  }

  /**
   * Force health check for specific service
   */
  async checkServiceHealthByName(serviceName: string): Promise<ConnectionHealth | null> {
    const service = this.services.get(serviceName);
    if (!service) {
      logger.error({ serviceName }, 'Service not found for health check');
      return null;
    }

    try {
      const health = await this.checkServiceHealth(service);
      const updatedService: BackendService = {
        ...service,
        health,
        isConnected: health.status === 'healthy'
      };

      this.services.set(serviceName, updatedService);
      this.notifyConnectionListeners();

      return health;
    } catch (error) {
      logger.error({ serviceName, error }, 'Manual health check failed');
      return null;
    }
  }

  /**
   * Update service configuration
   */
  updateServiceConfig(serviceName: string, config: Partial<BackendService>): void {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const updatedService = { ...service, ...config };
    this.services.set(serviceName, updatedService);
    this.notifyConnectionListeners();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    this.connectionListeners.clear();
    this.services.clear();
  }

  /**
   * Get detailed health status for all services
   */
  getDetailedHealthStatus(): {
    services: BackendService[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      criticalHealthy: boolean;
    };
    lastUpdate: Date;
  } {
    const services = this.getServices();
    const summary = this.getSystemHealth();
    
    return {
      services,
      summary,
      lastUpdate: new Date()
    };
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealthStatus(serviceName: string): BackendService | null {
    const service = this.services.get(serviceName);
    return service || null;
  }
}

// Export singleton instance
export const backendConnector = new BackendConnector();

// Don't auto-initialize - let consumers call initialize() explicitly
// This prevents unnecessary health checks on pages that don't need them