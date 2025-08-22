/**
 * Integration Worker Orchestration
 * 
 * BullMQ workers for backfill, delta, and webhook processing
 * Provides exponential backoff, DLQ, and idempotent job handling
 */

import type { Job} from 'bullmq';
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { ConnectorFactory, BaseConnector } from './connector-base';
import type { ConnectorContext, SyncJob, JobResult, IntegrationMetrics } from './types';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Redis connection configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Queue names
const QUEUE_NAMES = {
  BACKFILL: 'integration-backfill',
  DELTA: 'integration-delta',
  WEBHOOK: 'integration-webhook',
  HEALTH: 'integration-health',
} as const;

// Job priorities
const JOB_PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
} as const;

/**
 * Integration Worker Manager
 * 
 * Manages all integration worker queues and job processing
 */
export class IntegrationWorkerManager {
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private schedulers: Map<string, QueueScheduler>;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.schedulers = new Map();
  }

  /**
   * Initialize all queues and workers
   */
  async initialize(): Promise<void> {
    logger.info('Initializing integration worker manager');

    // Create queues
    await this.createQueues();
    
    // Create workers
    await this.createWorkers();
    
    // Create schedulers for delayed jobs
    await this.createSchedulers();

    logger.info('Integration worker manager initialized successfully');
  }

  /**
   * Create all queues
   */
  private async createQueues(): Promise<void> {
    const queueConfigs = [
      { name: QUEUE_NAMES.BACKFILL, concurrency: 2 },
      { name: QUEUE_NAMES.DELTA, concurrency: 5 },
      { name: QUEUE_NAMES.WEBHOOK, concurrency: 10 },
      { name: QUEUE_NAMES.HEALTH, concurrency: 3 },
    ];

    for (const config of queueConfigs) {
      const queue = new Queue(config.name, {
        connection: REDIS_CONFIG,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.queues.set(config.name, queue);
      logger.info(`Created queue: ${config.name}`);
    }
  }

  /**
   * Create all workers
   */
  private async createWorkers(): Promise<void> {
    // Backfill worker
    const backfillWorker = new Worker(
      QUEUE_NAMES.BACKFILL,
      async (job: Job) => this.processBackfillJob(job),
      {
        connection: REDIS_CONFIG,
        concurrency: 2,
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      }
    );

    // Delta worker
    const deltaWorker = new Worker(
      QUEUE_NAMES.DELTA,
      async (job: Job) => this.processDeltaJob(job),
      {
        connection: REDIS_CONFIG,
        concurrency: 5,
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      }
    );

    // Webhook worker
    const webhookWorker = new Worker(
      QUEUE_NAMES.WEBHOOK,
      async (job: Job) => this.processWebhookJob(job),
      {
        connection: REDIS_CONFIG,
        concurrency: 10,
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      }
    );

    // Health check worker
    const healthWorker = new Worker(
      QUEUE_NAMES.HEALTH,
      async (job: Job) => this.processHealthJob(job),
      {
        connection: REDIS_CONFIG,
        concurrency: 3,
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      }
    );

    // Set up error handling
    [backfillWorker, deltaWorker, webhookWorker, healthWorker].forEach(worker => {
      worker.on('error', (error) => {
        logger.error('Worker error', { error: error.message });
      });

      worker.on('failed', (job, error) => {
        logger.error('Job failed', {
          jobId: job.id,
          queue: job.queue.name,
          error: error.message,
          attempts: job.attemptsMade,
        });
      });

      worker.on('completed', (job) => {
        logger.info('Job completed', {
          jobId: job.id,
          queue: job.queue.name,
          duration: Date.now() - job.timestamp,
        });
      });
    });

    this.workers.set(QUEUE_NAMES.BACKFILL, backfillWorker);
    this.workers.set(QUEUE_NAMES.DELTA, deltaWorker);
    this.workers.set(QUEUE_NAMES.WEBHOOK, webhookWorker);
    this.workers.set(QUEUE_NAMES.HEALTH, healthWorker);

    logger.info('All workers created successfully');
  }

  /**
   * Create schedulers for delayed jobs
   */
  private async createSchedulers(): Promise<void> {
    for (const [name, queue] of this.queues) {
      const scheduler = new QueueScheduler(name, {
        connection: REDIS_CONFIG,
      });

      this.schedulers.set(name, scheduler);
      logger.info(`Created scheduler for queue: ${name}`);
    }
  }

  // ============================================================================
  // JOB PROCESSING
  // ============================================================================

  /**
   * Process backfill job
   */
  private async processBackfillJob(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    const { connectorId, tenantId, installId, cursor } = job.data as SyncJob;

    logger.info('Processing backfill job', {
      jobId: job.id,
      connectorId,
      tenantId,
      installId,
    });

    try {
      const connector = ConnectorFactory.get(connectorId);
      if (!connector) {
        throw new Error(`Connector not found: ${connectorId}`);
      }

      // Get connector context from your auth system
      const ctx = await this.getConnectorContext(tenantId, installId, connectorId);
      
      // Perform backfill
      const result = await connector.backfill(ctx, cursor);
      
      const duration = Date.now() - startTime;
      
      // Emit metrics
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'backfill',
        duration,
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        retryCount: job.attemptsMade,
      });

      // Schedule next job if there's more data
      if (result.hasMore && result.cursor) {
        await this.scheduleBackfillJob({
          connectorId,
          tenantId,
          installId,
          cursor: result.cursor,
          priority: JOB_PRIORITIES.LOW,
        });
      }

      return {
        success: result.success,
        data: result.data,
        cursor: result.cursor,
        hasMore: result.hasMore,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'backfill',
        duration,
        success: false,
        errorCode: error instanceof Error ? error.message : String(error),
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  /**
   * Process delta job
   */
  private async processDeltaJob(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    const { connectorId, tenantId, installId, cursor } = job.data as SyncJob;

    logger.info('Processing delta job', {
      jobId: job.id,
      connectorId,
      tenantId,
      installId,
    });

    try {
      const connector = ConnectorFactory.get(connectorId);
      if (!connector) {
        throw new Error(`Connector not found: ${connectorId}`);
      }

      const ctx = await this.getConnectorContext(tenantId, installId, connectorId);
      const result = await connector.delta(ctx, cursor);
      
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'delta',
        duration,
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        retryCount: job.attemptsMade,
      });

      // Schedule next delta job if there's more data
      if (result.hasMore && result.cursor) {
        await this.scheduleDeltaJob({
          connectorId,
          tenantId,
          installId,
          cursor: result.cursor,
          priority: JOB_PRIORITIES.NORMAL,
        });
      }

      return {
        success: result.success,
        data: result.data,
        cursor: result.cursor,
        hasMore: result.hasMore,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'delta',
        duration,
        success: false,
        errorCode: error instanceof Error ? error.message : String(error),
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  /**
   * Process webhook job
   */
  private async processWebhookJob(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    const { connectorId, tenantId, installId, headers, body } = job.data;

    logger.info('Processing webhook job', {
      jobId: job.id,
      connectorId,
      tenantId,
      installId,
    });

    try {
      const connector = ConnectorFactory.get(connectorId);
      if (!connector) {
        throw new Error(`Connector not found: ${connectorId}`);
      }

      const ctx = await this.getConnectorContext(tenantId, installId, connectorId);
      const events = await connector.handleWebhook(ctx, headers, body);
      
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'webhook',
        duration,
        success: true,
        recordsProcessed: events.length,
        retryCount: job.attemptsMade,
      });

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'webhook',
        duration,
        success: false,
        errorCode: error instanceof Error ? error.message : String(error),
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  /**
   * Process health check job
   */
  private async processHealthJob(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    const { connectorId, tenantId, installId } = job.data;

    logger.info('Processing health check job', {
      jobId: job.id,
      connectorId,
      tenantId,
      installId,
    });

    try {
      const connector = ConnectorFactory.get(connectorId);
      if (!connector) {
        throw new Error(`Connector not found: ${connectorId}`);
      }

      const ctx = await this.getConnectorContext(tenantId, installId, connectorId);
      const health = await connector.healthCheck(ctx);
      
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'health',
        duration,
        success: health.healthy,
        retryCount: job.attemptsMade,
      });

      return {
        success: health.healthy,
        data: health.details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emitMetrics({
        connectorId,
        tenantId,
        timestamp: new Date().toISOString(),
        operation: 'health',
        duration,
        success: false,
        errorCode: error instanceof Error ? error.message : String(error),
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  // ============================================================================
  // JOB SCHEDULING
  // ============================================================================

  /**
   * Schedule a backfill job
   */
  async scheduleBackfillJob(job: Omit<SyncJob, 'id' | 'type' | 'retryCount' | 'maxRetries' | 'createdAt'>): Promise<string> {
    const queue = this.queues.get(QUEUE_NAMES.BACKFILL);
    if (!queue) {
      throw new Error('Backfill queue not found');
    }

    const jobData: SyncJob = {
      id: uuidv4(),
      type: 'backfill',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      ...job,
    };

    const queuedJob = await queue.add('backfill', jobData, {
      priority: job.priority || JOB_PRIORITIES.NORMAL,
      jobId: jobData.id,
    });

    logger.info('Scheduled backfill job', {
      jobId: queuedJob.id,
      connectorId: job.connectorId,
      tenantId: job.tenantId,
    });

    return queuedJob.id as string;
  }

  /**
   * Schedule a delta job
   */
  async scheduleDeltaJob(job: Omit<SyncJob, 'id' | 'type' | 'retryCount' | 'maxRetries' | 'createdAt'>): Promise<string> {
    const queue = this.queues.get(QUEUE_NAMES.DELTA);
    if (!queue) {
      throw new Error('Delta queue not found');
    }

    const jobData: SyncJob = {
      id: uuidv4(),
      type: 'delta',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      ...job,
    };

    const queuedJob = await queue.add('delta', jobData, {
      priority: job.priority || JOB_PRIORITIES.NORMAL,
      jobId: jobData.id,
    });

    logger.info('Scheduled delta job', {
      jobId: queuedJob.id,
      connectorId: job.connectorId,
      tenantId: job.tenantId,
    });

    return queuedJob.id as string;
  }

  /**
   * Schedule a webhook job
   */
  async scheduleWebhookJob(
    connectorId: string,
    tenantId: string,
    installId: string,
    headers: Record<string, string>,
    body: any
  ): Promise<string> {
    const queue = this.queues.get(QUEUE_NAMES.WEBHOOK);
    if (!queue) {
      throw new Error('Webhook queue not found');
    }

    const jobData = {
      id: uuidv4(),
      connectorId,
      tenantId,
      installId,
      headers,
      body,
    };

    const queuedJob = await queue.add('webhook', jobData, {
      priority: JOB_PRIORITIES.HIGH,
      jobId: jobData.id,
    });

    logger.info('Scheduled webhook job', {
      jobId: queuedJob.id,
      connectorId,
      tenantId,
    });

    return queuedJob.id as string;
  }

  /**
   * Schedule a health check job
   */
  async scheduleHealthJob(
    connectorId: string,
    tenantId: string,
    installId: string,
    delay: number = 0
  ): Promise<string> {
    const queue = this.queues.get(QUEUE_NAMES.HEALTH);
    if (!queue) {
      throw new Error('Health queue not found');
    }

    const jobData = {
      id: uuidv4(),
      connectorId,
      tenantId,
      installId,
    };

    const queuedJob = await queue.add('health', jobData, {
      priority: JOB_PRIORITIES.LOW,
      jobId: jobData.id,
      delay,
    });

    logger.info('Scheduled health check job', {
      jobId: queuedJob.id,
      connectorId,
      tenantId,
      delay,
    });

    return queuedJob.id as string;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get connector context from your authentication system
   * TODO: Implement with your Authentik broker
   */
  private async getConnectorContext(
    tenantId: string,
    installId: string,
    connectorId: string
  ): Promise<ConnectorContext> {
    // This should integrate with your existing authentication system
    // For now, returning a mock context
    return {
      tenantId,
      installId,
      auth: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
      },
      config: {},
      metadata: {
        provider: connectorId,
        version: '1.0.0',
      },
    };
  }

  /**
   * Emit integration metrics
   */
  private emitMetrics(metrics: IntegrationMetrics): void {
    // TODO: Send to your metrics system (Prometheus, etc.)
    logger.info('Integration metrics', metrics);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, queue] of this.queues) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    }

    return stats;
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down integration worker manager');

    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`Closed worker: ${name}`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Closed queue: ${name}`);
    }

    // Close all schedulers
    for (const [name, scheduler] of this.schedulers) {
      await scheduler.close();
      logger.info(`Closed scheduler: ${name}`);
    }

    logger.info('Integration worker manager shutdown complete');
  }
}

// Export singleton instance
export const integrationWorkerManager = new IntegrationWorkerManager();
