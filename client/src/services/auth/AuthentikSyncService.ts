/**
 * Authentik User Sync Utilities
 * 
 * Provides utility functions for handling Authentik user data synchronization.
 * The actual sync happens server-side during authentication - these utilities
 * help the frontend understand and display sync status.
 */

import { logger } from '@/shared/utils/logger';

export interface AuthentikUserData {
  // Basic profile info
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  
  // Business info  
  businessName?: string;
  industry?: string;
  companySize?: string;
  businessType?: string;
  fundingStage?: string;
  revenueRange?: string;
  
  // Completion status
  signupCompleted?: boolean;
  enrollmentCompleted?: boolean;
  businessProfileCompleted?: boolean;
  
  // Metadata
  signupCompletionDate?: string;
}

/**
 * Extract Authentik user data from JWT payload or user attributes
 * This mirrors the server-side extraction logic for client-side display
 */
export function extractAuthentikUserData(payload: any): AuthentikUserData {
  if (!payload) return {};
  
  const attrs = payload.attributes || {};
  
  return {
    email: payload.email,
    firstName: attrs.first_name,
    lastName: attrs.last_name,
    displayName: payload.name,
    phone: attrs.phone,
    businessName: attrs.business_name,
    industry: attrs.industry,
    companySize: attrs.company_size,
    businessType: attrs.business_type,
    fundingStage: attrs.funding_stage,
    revenueRange: attrs.revenue_range,
    signupCompleted: attrs.signup_completed === true,
    enrollmentCompleted: attrs.enrollment_flow_completed === true,
    businessProfileCompleted: attrs.business_profile_completed === true,
    signupCompletionDate: attrs.signup_completion_date
  };
}

/**
 * Calculate profile completion percentage based on available Authentik data
 */
export function calculateProfileCompletion(data: AuthentikUserData): number {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone', 'businessName',
    'industry', 'companySize', 'businessType'
  ];
  
  const completedFields = requiredFields.filter(field => 
    data[field as keyof AuthentikUserData]
  ).length;
  
  return Math.round((completedFields / requiredFields.length) * 100);
}

/**
 * Get a user-friendly display of sync status
 */
export function getProfileSyncStatus(profile: any): {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  lastSync?: string;
} {
  const requiredFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company_name', label: 'Company Name' }
  ];
  
  const missingFields = requiredFields
    .filter(field => !profile?.[field.key])
    .map(field => field.label);
  
  const completionPercentage = profile?.profile_completion_percentage || 0;
  const isComplete = completionPercentage >= 80;
  
  return {
    isComplete,
    completionPercentage,
    missingFields,
    lastSync: profile?.updated_at
  };
}

/**
 * Log Authentik sync information for debugging
 */
export function logAuthentikSyncInfo(userId: string, profile: any, authentikData: AuthentikUserData) {
  const syncStatus = getProfileSyncStatus(profile);
  const completion = calculateProfileCompletion(authentikData);
  
  logger.info('Authentik user data sync status', {
    userId,
    profileCompletion: syncStatus.completionPercentage,
    authentikCompletion: completion,
    signupCompleted: authentikData.signupCompleted,
    businessProfileCompleted: authentikData.businessProfileCompleted,
    missingFields: syncStatus.missingFields,
    lastSync: syncStatus.lastSync
  });
}

/**
 * Trigger Authentik user data sync via RPC call
 * This calls the server to sync the latest Authentik data
 */
export async function triggerAuthentikSync(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Make RPC call to sync_authentik_user_data
    const response = await fetch('/api/rpc/sync_authentik_user_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header will be added by auth middleware
      },
      body: JSON.stringify({ user_id: userId }),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      logger.error('Failed to trigger Authentik sync', { userId, error: result.error });
      return {
        success: false,
        error: result.error || 'Failed to sync Authentik data'
      };
    }
    
    logger.info('Authentik sync completed successfully', { userId, data: result.data });
    return {
      success: true,
      data: result.data
    };
    
  } catch (error) {
    logger.error('Error triggering Authentik sync', { userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
}

/**
 * Force refresh user profile from Authentik
 */
export async function forceAuthentikRefresh(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/rpc/force_sync_authentik_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to force refresh Authentik data'
      };
    }
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error) {
    logger.error('Error forcing Authentik refresh', { userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown refresh error'
    };
  }
}

/**
 * Get Authentik sync status for a user
 */
export async function getAuthentikSyncStatus(userId: string): Promise<{
  success: boolean;
  data?: {
    lastSync?: string;
    syncedFields?: string[];
    completionPercentage?: number;
    profileCompletionPercentage?: number;
    signupCompleted?: boolean;
    businessProfileCompleted?: boolean;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/rpc/get_authentik_sync_status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to get sync status'
      };
    }
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error) {
    logger.error('Error getting Authentik sync status', { userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown status error'
    };
  }
}