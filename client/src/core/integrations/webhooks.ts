/**
 * Webhook Utilities
 * 
 * Provides HMAC verification utilities and uniform event handling
 * for secure webhook processing across all integrations
 */

import type { WebhookConfig, WebhookVerification, WebhookEvent } from './types';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Verify webhook signature using HMAC
 */
export class WebhookVerifier {
  /**
   * Verify webhook signature
   */
  static verify(
    body: string,
    headers: Record<string, string>,
    config: WebhookConfig
  ): WebhookVerification {
    const {
      secret,
      algorithm = 'sha256',
      headerName = 'X-HubSpot-Signature',
      tolerance = 300,
    } = config;

    if (!secret) {
      logger.warn('No webhook secret configured for verification');
      return { isValid: false };
    }

    const signature = headers[headerName];
    if (!signature) {
      logger.warn('No signature header found', { headerName });
      return { isValid: false };
    }

    try {
      // Extract timestamp if present (e.g., Slack format: t=1234567890,v0=signature)
      const timestamp = this.extractTimestamp(signature);
      if (timestamp && tolerance > 0) {
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > tolerance) {
          logger.warn('Webhook timestamp expired', { timestamp, now, tolerance });
          return { isValid: false, timestamp: timestamp.toString() };
        }
      }

      // Generate expected signature
      const expectedSignature = this.generateSignature(body, secret, algorithm);
      const isValid = this.compareSignatures(signature, expectedSignature, algorithm);

      return {
        isValid,
        signature,
        timestamp: timestamp?.toString(),
        body,
      };
    } catch (error) {
      logger.error('Webhook verification failed', { error });
      return { isValid: false };
    }
  }

  /**
   * Generate HMAC signature
   */
  private static generateSignature(
    body: string,
    secret: string,
    algorithm: 'sha256' | 'sha1'
  ): string {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(body);

    return crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    ).then(key => {
      return crypto.subtle.sign('HMAC', key, data);
    }).then(signature => {
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }

  /**
   * Extract timestamp from signature header
   */
  private static extractTimestamp(signature: string): number | null {
    // Handle Slack format: t=1234567890,v0=signature
    const timestampMatch = signature.match(/t=(\d+)/);
    if (timestampMatch) {
      return parseInt(timestampMatch[1], 10);
    }

    // Handle other formats that might include timestamp
    return null;
  }

  /**
   * Compare signatures (constant-time comparison)
   */
  private static compareSignatures(
    received: string,
    expected: string,
    algorithm: 'sha256' | 'sha1'
  ): boolean {
    // Handle different signature formats
    const cleanReceived = this.cleanSignature(received);
    const cleanExpected = this.cleanExpectedSignature(expected, algorithm);

    if (cleanReceived.length !== cleanExpected.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < cleanReceived.length; i++) {
      result |= cleanReceived.charCodeAt(i) ^ cleanExpected.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Clean received signature (remove prefixes, etc.)
   */
  private static cleanSignature(signature: string): string {
    // Remove common prefixes
    return signature
      .replace(/^sha256=/, '')
      .replace(/^sha1=/, '')
      .replace(/^v0=/, '')
      .replace(/^t=\d+,/, '');
  }

  /**
   * Clean expected signature based on algorithm
   */
  private static cleanExpectedSignature(
    signature: string,
    algorithm: 'sha256' | 'sha1'
  ): string {
    // Some providers expect the algorithm prefix
    const prefix = algorithm === 'sha256' ? 'sha256=' : 'sha1=';
    return signature.startsWith(prefix) ? signature : `${prefix}${signature}`;
  }
}

/**
 * Webhook Event Processor
 * 
 * Normalizes webhook events from different providers into a uniform format
 */
export class WebhookEventProcessor {
  /**
   * Process webhook body and extract events
   */
  static processEvents(
    body: any,
    source: string,
    eventType?: string
  ): WebhookEvent[] {
    const events: WebhookEvent[] = [];
    const timestamp = new Date().toISOString();

    try {
      // Handle different webhook formats
      if (Array.isArray(body)) {
        // Array of events
        events.push(...body.map(item => this.normalizeEvent(item, source, timestamp)));
      } else if (body.events && Array.isArray(body.events)) {
        // Wrapped events (e.g., Slack)
        events.push(...body.events.map((event: any) => 
          this.normalizeEvent(event, source, timestamp)
        ));
      } else if (body.data && Array.isArray(body.data)) {
        // Data array format
        events.push(...body.data.map((item: any) => 
          this.normalizeEvent(item, source, timestamp)
        ));
      } else {
        // Single event
        events.push(this.normalizeEvent(body, source, timestamp));
      }
    } catch (error) {
      logger.error('Failed to process webhook events', { error, body });
      throw new Error('Invalid webhook event format');
    }

    return events;
  }

  /**
   * Normalize event to standard format
   */
  private static normalizeEvent(
    event: any,
    source: string,
    timestamp: string
  ): WebhookEvent {
    return {
      id: event.id || event.event_id || uuidv4(),
      type: event.type || event.event_type || 'unknown',
      timestamp: event.timestamp || event.created_at || timestamp,
      data: event.data || event.payload || event,
      source,
      metadata: {
        originalEvent: event,
        processedAt: timestamp,
      },
    };
  }

  /**
   * Validate webhook event structure
   */
  static validateEvent(event: WebhookEvent): boolean {
    return !!(
      event.id &&
      event.type &&
      event.timestamp &&
      event.data &&
      event.source
    );
  }
}

/**
 * Webhook Handler Base Class
 * 
 * Base class for implementing webhook handlers with common functionality
 */
export abstract class BaseWebhookHandler {
  protected config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * Handle incoming webhook
   */
  async handle(
    headers: Record<string, string>,
    body: any,
    source: string
  ): Promise<WebhookEvent[]> {
    const startTime = Date.now();

    try {
      // Verify webhook signature
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const verification = WebhookVerifier.verify(bodyString, headers, this.config);

      if (!verification.isValid) {
        logger.warn('Webhook verification failed', { source, headers });
        throw new Error('Invalid webhook signature');
      }

      // Process events
      const events = WebhookEventProcessor.processEvents(body, source);
      
      // Validate events
      const validEvents = events.filter(WebhookEventProcessor.validateEvent);
      
      if (validEvents.length !== events.length) {
        logger.warn('Some webhook events were invalid', {
          total: events.length,
          valid: validEvents.length,
        });
      }

      const duration = Date.now() - startTime;
      logger.info('Webhook processed successfully', {
        source,
        eventCount: validEvents.length,
        duration,
      });

      return validEvents;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Webhook processing failed', {
        source,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }

  /**
   * Get webhook configuration
   */
  getConfig(): WebhookConfig {
    return this.config;
  }
}

/**
 * Provider-specific webhook handlers
 */
export class HubSpotWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.HUBSPOT_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-HubSpot-Signature',
      tolerance: 300,
    });
  }
}

export class SlackWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.SLACK_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Slack-Signature',
      tolerance: 300,
    });
  }
}

export class SalesforceWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.SALESFORCE_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Salesforce-Signature',
      tolerance: 300,
    });
  }
}

export class Microsoft365WebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.MICROSOFT_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Microsoft-Signature',
      tolerance: 300,
    });
  }
}

export class StripeWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.STRIPE_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'Stripe-Signature',
      tolerance: 300,
    });
  }
}


export class NotionWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.NOTION_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Notion-Signature',
      tolerance: 300,
    });
  }
}


export class QuickBooksWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.QUICKBOOKS_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Intuit-Signature',
      tolerance: 300,
    });
  }
}


export class GitHubWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Hub-Signature-256',
      tolerance: 300,
    });
  }
}

export class ShopifyWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.SHOPIFY_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Shopify-Hmac-Sha256',
      tolerance: 300,
    });
  }
}

export class ZoomWebhookHandler extends BaseWebhookHandler {
  constructor() {
    super({
      secret: process.env.ZOOM_WEBHOOK_SECRET,
      algorithm: 'sha256',
      headerName: 'X-Zoom-Signature',
      tolerance: 300,
    });
  }
}
