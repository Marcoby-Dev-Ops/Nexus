/**
 * Google Analytics Service
 * Handles Google Analytics integration via Edge Functions
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Google Analytics data types
interface GoogleAnalyticsTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiry_time: number;
}

interface GoogleAnalyticsProperty {
  name: string;
  displayName: string;
  propertyId: string;
  accountId: string;
  currencyCode: string;
  timeZone: string;
  industryCategory: string;
  serviceLevel: string;
  deleteTime?: string;
  expireTime?: string;
}

interface GoogleAnalyticsAccount {
  name: string;
  displayName: string;
  accountId: string;
  properties: GoogleAnalyticsProperty[];
}

interface GoogleAnalyticsReportData {
  reportType: string;
  data: any[];
  metadata: {
    totalRows: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    propertyId: string;
  };
}

interface GoogleAnalyticsIntegrationData {
  accounts: GoogleAnalyticsAccount[];
  properties: GoogleAnalyticsProperty[];
  reports: {
    trafficOverview: GoogleAnalyticsReportData;
    trafficSources: GoogleAnalyticsReportData;
    pagePerformance: GoogleAnalyticsReportData;
    ecommercePerformance?: GoogleAnalyticsReportData;
  };
  lastSync: string;
  totalProperties: number;
  totalAccounts: number;
}

export class GoogleAnalyticsService extends BaseService {
  /**
   * Get valid tokens for a user via Edge Function
   */
  async getValidTokens(userId: string): Promise<ServiceResponse<GoogleAnalyticsTokens>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/get-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to get tokens');
      }

      const { data: tokenData } = await response.json();
      return this.createSuccessResponse(tokenData);
    } catch (error) {
      return this.handleError(error, 'get valid Google Analytics tokens');
    }
  }

  /**
   * Refresh Google Analytics tokens via Edge Function
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse<GoogleAnalyticsTokens>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/refresh-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, refreshToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to refresh tokens');
      }

      const { data: tokenData } = await response.json();
      return this.createSuccessResponse(tokenData);
    } catch (error) {
      return this.handleError(error, 'refresh Google Analytics tokens');
    }
  }

  /**
   * Check if user has valid Google Analytics connection via Edge Function
   */
  async hasValidConnection(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        return this.createSuccessResponse(false);
      }

      const { data } = await response.json();
      return this.createSuccessResponse(data.connected);
    } catch (error) {
      return this.handleError(error, 'check Google Analytics connection');
    }
  }

  /**
   * Get connection status via Edge Function
   */
  async getConnectionStatus(userId: string): Promise<ServiceResponse<{
    connected: boolean;
    status: string;
    lastSync?: string;
    expiresAt?: string;
  }>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/connection-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to get connection status');
      }

      const { data } = await response.json();
      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'get Google Analytics connection status');
    }
  }

  /**
   * Sync Google Analytics data via Edge Function
   */
  async syncGoogleAnalyticsDataWithIntelligence(userId: string): Promise<ServiceResponse<{
    accountsSynced: number;
    propertiesSynced: number;
    reportsSynced: number;
    lastSync: string;
  }>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to sync data');
      }

      const { data } = await response.json();
      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'sync Google Analytics data');
    }
  }

  /**
   * Get Google Analytics data via Edge Function
   */
  async getGoogleAnalyticsData(userId: string): Promise<ServiceResponse<GoogleAnalyticsIntegrationData>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/get-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to get data');
      }

      const { data } = await response.json();
      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'get Google Analytics data');
    }
  }

  /**
   * Create OAuth authorization URL
   */
  createAuthUrl(userId: string): string {
    const clientId = import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_ID;
    const redirectUri = `${window.location.origin}/integrations/google-analytics/callback`;
    
    if (!clientId) {
      throw new Error('Google Analytics client ID not configured');
    }

    const state = btoa(JSON.stringify({ 
      timestamp: Date.now(),
      service: 'google-analytics',
      userId
    }));

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email',
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Disconnect Google Analytics integration via Edge Function
   */
  async disconnectIntegration(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_API_URL}/api/google/analytics/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(errorData.error || 'Failed to disconnect');
      }

      const { data } = await response.json();
      return this.createSuccessResponse(data.success);
    } catch (error) {
      return this.handleError(error, 'disconnect Google Analytics integration');
    }
  }
}
