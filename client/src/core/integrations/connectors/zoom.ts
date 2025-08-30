/**
 * Zoom Connector
 * 
 * Implementation of the contract-first connector interface for Zoom API
 * Provides access to meetings, webinars, users, and video conferencing data
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { ZoomWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Zoom API types
interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  use_pmi: boolean;
  personal_meeting_url: string;
  timezone: string;
  dept: string;
  created_at: string;
  last_login_time: string;
  last_client_version: string;
  pic_url: string;
  host_key: string;
  jid: string;
  group_ids: string[];
  im_group_ids: string[];
  account_id: string;
  language: string;
  phone_country: string;
  phone_number: string;
  status: string;
  job_title: string;
  location: string;
  login_types: number[];
  role_id: string;
  account_number: number;
  cluster: string;
  manager: string;
  pronouns: string;
  pronouns_option: number;
}

interface ZoomMeeting {
  id: number;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  schedule_for: string;
  timezone: string;
  password: string;
  host_email: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    waiting_room: boolean;
    meeting_authentication: boolean;
    encryption_type: string;
    alternative_hosts: string;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room_settings: {
      participants_to_place_in_waiting_room: number;
      users_who_can_admit_participants_from_waiting_room: number;
      whitelisted_domains_for_waiting_room: string;
    };
    global_dial_in_countries: string[];
    global_dial_in_numbers: Array<{
      country: string;
      country_name: string;
      city: string;
      number: string;
      type: string;
    }>;
    contact_name: string;
    contact_email: string;
    registrants_email_notification: boolean;
    meeting_authentication_option: number;
    authentication_option: string;
    authentication_domains: string;
    authentication_name: string;
    additional_data_center_regions: string[];
  };
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  status: string;
  tracking_fields: Array<{
    field: string;
    value: string;
  }>;
  occurrences: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status: string;
  }>;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    waiting_room: boolean;
    meeting_authentication: boolean;
    encryption_type: string;
    alternative_hosts: string;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room_settings: {
      participants_to_place_in_waiting_room: number;
      users_who_can_admit_participants_from_waiting_room: number;
      whitelisted_domains_for_waiting_room: string;
    };
    global_dial_in_countries: string[];
    global_dial_in_numbers: Array<{
      country: string;
      country_name: string;
      city: string;
      number: string;
      type: string;
    }>;
    contact_name: string;
    contact_email: string;
    registrants_email_notification: boolean;
    meeting_authentication_option: number;
    authentication_option: string;
    authentication_domains: string;
    authentication_name: string;
    additional_data_center_regions: string[];
  };
}

interface ZoomWebinar {
  id: number;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  password: string;
  host_email: string;
  settings: {
    host_video: boolean;
    panelists_video: boolean;
    practice_session: boolean;
    hd_video: boolean;
    audio: string;
    auto_recording: string;
    alternative_hosts: string;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    on_demand: boolean;
    global_dial_in: boolean;
    contact_name: string;
    contact_email: string;
    registrants_restrict_number: number;
    post_webinar_survey: boolean;
    survey_url: string;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    authentication_option: string;
    authentication_domains: string;
    authentication_name: string;
    webinar_chat: number;
    webinar_practice: boolean;
    hd_video_for_attendees: boolean;
    audio_type: string;
    registration_type: number;
    approval_type: number;
    registration_url: string;
    branding: boolean;
    room_pass: string;
    watermark: boolean;
    alert_guest_join: boolean;
    on_demand_privacy: boolean;
    global_dial_in_countries: string[];
    auto_close: number;
    alternative_hosts: string;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    on_demand: boolean;
    global_dial_in: boolean;
    contact_name: string;
    contact_email: string;
    registrants_restrict_number: number;
    post_webinar_survey: boolean;
    survey_url: string;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    authentication_option: string;
    authentication_domains: string;
    authentication_name: string;
    webinar_chat: number;
    webinar_practice: boolean;
    hd_video_for_attendees: boolean;
    audio_type: string;
    registration_type: number;
    approval_type: number;
    registration_url: string;
    brand: boolean;
    room_pass: string;
    watermark: boolean;
    alert_guest_join: boolean;
    on_demand_privacy: boolean;
    global_dial_in_countries: string[];
    auto_close: number;
  };
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  status: string;
  tracking_fields: Array<{
    field: string;
    value: string;
  }>;
  occurrences: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status: string;
  }>;
}

interface ZoomRecording {
  id: string;
  meeting_id: string;
  meeting_uuid: string;
  host_id: string;
  account_id: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  recording_files: Array<{
    id: string;
    meeting_id: string;
    recording_start: string;
    recording_end: string;
    file_type: string;
    file_extension: string;
    file_size: number;
    file_path: string;
    status: string;
    deleted_time: string;
    recording_type: string;
    play_url: string;
    download_url: string;
    file_path_v2: string;
  }>;
  share_url: string;
  password: string;
  recording_play_passcode: string;
  recording_fragments: Array<{
    id: string;
    recording_start: string;
    recording_end: string;
    file_type: string;
    file_extension: string;
    file_size: number;
    file_path: string;
    status: string;
    deleted_time: string;
    recording_type: string;
    play_url: string;
    download_url: string;
    file_path_v2: string;
  }>;
}

interface ZoomOAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface ZoomAPIResponse<T> {
  [key: string]: T[];
}

// Configuration schema
const ZoomConfigSchema = z.object({
  syncUsers: z.boolean().default(true),
  syncMeetings: z.boolean().default(true),
  syncWebinars: z.boolean().default(true),
  syncRecordings: z.boolean().default(true),
  userLimit: z.number().min(1).max(300).default(50),
  meetingLimit: z.number().min(1).max(300).default(50),
  webinarLimit: z.number().min(1).max(300).default(50),
  includeDeleted: z.boolean().default(false),
  syncFromDate: z.string().optional(),
  batchSize: z.number().min(1).max(300).default(50),
  webhookEvents: z.array(z.string()).default([
    'meeting.created',
    'meeting.updated',
    'meeting.deleted',
    'meeting.started',
    'meeting.ended',
    'webinar.created',
    'webinar.updated',
    'webinar.deleted',
    'webinar.started',
    'webinar.ended',
    'recording.completed'
  ]),
  scopes: z.array(z.string()).default([
    'meeting:read',
    'meeting:write',
    'webinar:read',
    'webinar:write',
    'user:read',
    'user:write',
    'recording:read',
    'recording:write'
  ]),
});

export class ZoomConnector extends BaseConnector {
  private webhookHandler: ZoomWebhookHandler;
  private readonly zoomApiBase = 'https://api.zoom.us/v2';

  constructor() {
    super(
      'zoom',
      'Zoom',
      '1.0.0',
      PROVIDER_CONFIGS.zoom
    );
    
    this.webhookHandler = new ZoomWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return ZoomConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Zoom OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<ZoomOAuthResponse>(
        'https://zoom.us/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.ZOOM_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
          expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
        },
        metadata: {
          ...ctx.metadata,
          scope: tokenResponse.data.scope,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('Zoom authorization successful', {
        tenantId: ctx.tenantId,
        scope: tokenResponse.data.scope,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Zoom authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Zoom authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    if (!ctx.auth.refreshToken) {
      throw new Error('No refresh token available for Zoom');
    }

    try {
      const tokenResponse = await this.httpClient.post<ZoomOAuthResponse>(
        'https://zoom.us/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: ctx.auth.refreshToken,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token || ctx.auth.refreshToken,
          expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
        },
        metadata: {
          ...ctx.metadata,
          lastRefresh: new Date().toISOString(),
        },
      };

      logger.info('Zoom token refresh successful', {
        tenantId: ctx.tenantId,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Zoom token refresh failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Zoom token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  async backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const results: SyncResult = {
      success: true,
      recordsProcessed: 0,
      cursor: cursor,
      data: [],
      errors: [],
      duration: 0,
      hasMore: false,
    };

    try {
      // Sync users
      if (ctx.config.syncUsers !== false) {
        const usersResult = await this.syncUsers(ctx, cursor);
        results.recordsProcessed += usersResult.recordsProcessed;
        results.data.push(...usersResult.data);
        results.errors.push(...usersResult.errors);
      }

      // Sync meetings
      if (ctx.config.syncMeetings !== false) {
        const meetingsResult = await this.syncMeetings(ctx, cursor);
        results.recordsProcessed += meetingsResult.recordsProcessed;
        results.data.push(...meetingsResult.data);
        results.errors.push(...meetingsResult.errors);
      }

      // Sync webinars
      if (ctx.config.syncWebinars !== false) {
        const webinarsResult = await this.syncWebinars(ctx, cursor);
        results.recordsProcessed += webinarsResult.recordsProcessed;
        results.data.push(...webinarsResult.data);
        results.errors.push(...webinarsResult.errors);
      }

      // Sync recordings
      if (ctx.config.syncRecordings !== false) {
        const recordingsResult = await this.syncRecordings(ctx, cursor);
        results.recordsProcessed += recordingsResult.recordsProcessed;
        results.data.push(...recordingsResult.data);
        results.errors.push(...recordingsResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Zoom backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Zoom backfill failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        recordsProcessed: results.recordsProcessed,
        cursor: cursor,
        data: results.data,
        errors: [...results.errors, error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
        hasMore: false,
      };
    }
  }

  async delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    // For Zoom, we can use cursor-based pagination for delta syncs
    const deltaCtx = {
      ...ctx,
      config: {
        ...ctx.config,
        batchSize: Math.min(ctx.config.batchSize || 50, 25), // Smaller batches for delta
      },
    };

    return await this.backfill(deltaCtx, cursor);
  }

  // ============================================================================
  // SPECIFIC SYNC METHODS
  // ============================================================================

  private async syncUsers(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.userLimit || 50).toString(),
        status: 'active',
      });
      
      if (cursor) {
        params.append('next_page_token', cursor);
      }

      const response = await this.httpClient.get<ZoomAPIResponse<ZoomUser>>(
        `${this.zoomApiBase}/users?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Content-Type': 'application/json',
        }
      );

      const users = response.data.users || [];
      const nextPageToken = response.data.next_page_token;

      return {
        success: true,
        recordsProcessed: users.length,
        cursor: nextPageToken,
        data: users,
        errors: [],
        duration: 0,
        hasMore: !!nextPageToken,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncMeetings(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.meetingLimit || 50).toString(),
        type: 'scheduled',
      });
      
      if (cursor) {
        params.append('next_page_token', cursor);
      }

      const response = await this.httpClient.get<ZoomAPIResponse<ZoomMeeting>>(
        `${this.zoomApiBase}/users/me/meetings?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Content-Type': 'application/json',
        }
      );

      const meetings = response.data.meetings || [];
      const nextPageToken = response.data.next_page_token;

      return {
        success: true,
        recordsProcessed: meetings.length,
        cursor: nextPageToken,
        data: meetings,
        errors: [],
        duration: 0,
        hasMore: !!nextPageToken,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncWebinars(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.webinarLimit || 50).toString(),
      });
      
      if (cursor) {
        params.append('next_page_token', cursor);
      }

      const response = await this.httpClient.get<ZoomAPIResponse<ZoomWebinar>>(
        `${this.zoomApiBase}/users/me/webinars?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Content-Type': 'application/json',
        }
      );

      const webinars = response.data.webinars || [];
      const nextPageToken = response.data.next_page_token;

      return {
        success: true,
        recordsProcessed: webinars.length,
        cursor: nextPageToken,
        data: webinars,
        errors: [],
        duration: 0,
        hasMore: !!nextPageToken,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncRecordings(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.batchSize || 50).toString(),
        from: ctx.config.syncFromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      });
      
      if (cursor) {
        params.append('next_page_token', cursor);
      }

      const response = await this.httpClient.get<ZoomAPIResponse<ZoomRecording>>(
        `${this.zoomApiBase}/users/me/recordings?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Content-Type': 'application/json',
        }
      );

      const recordings = response.data.meetings || [];
      const nextPageToken = response.data.next_page_token;

      return {
        success: true,
        recordsProcessed: recordings.length,
        cursor: nextPageToken,
        data: recordings,
        errors: [],
        duration: 0,
        hasMore: !!nextPageToken,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  async handleWebhook(
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    return await this.webhookHandler.handle(headers, body, 'zoom');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<{ id: string; first_name: string; last_name: string; email: string }>(
        `${this.zoomApiBase}/users/me`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Content-Type': 'application/json',
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncMeetings !== false) {
        try {
          await this.httpClient.get(
            `${this.zoomApiBase}/users/me/meetings?page_size=1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'meetings', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'meetings', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncWebinars !== false) {
        try {
          await this.httpClient.get(
            `${this.zoomApiBase}/users/me/webinars?page_size=1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'webinars', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'webinars', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          user: response.data,
          scopeTests,
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastCheck: new Date().toISOString(),
        },
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected isTokenExpiredError(error: any): boolean {
    return error?.response?.status === 401 || 
           error?.message?.includes('unauthorized') ||
           error?.message?.includes('invalid_token') ||
           error?.message?.includes('expired');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limited') ||
           error?.message?.includes('too many requests');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
