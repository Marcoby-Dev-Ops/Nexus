/**
 * Authentik User Verification Service
 * 
 * This service handles user verification using Authentik's built-in verification system.
 * Replaces the old Supabase-based email verification system.
 */

import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from './authentikAuthServiceInstance';
import type { AuthentikUserInfo } from '@/lib/authentik';

// Verification status interface
export interface UserVerificationStatus {
  emailVerified: boolean;
  accountActive: boolean;
  profileComplete: boolean;
  verificationLevel: 'none' | 'basic' | 'full';
  lastVerifiedAt?: string;
  verificationMethod: 'authentik' | 'manual' | 'pending';
}

// Verification request interface
export interface VerificationRequest {
  userId: string;
  verificationType: 'email' | 'profile' | 'account';
  metadata?: Record<string, any>;
}

// Verification result interface
export interface VerificationResult {
  success: boolean;
  status: UserVerificationStatus;
  message?: string;
  requiresAction?: boolean;
  actionType?: 'email_verification' | 'profile_completion' | 'admin_approval';
}

/**
 * Authentik User Verification Service
 */
export class AuthentikUserVerificationService extends BaseService {
  constructor() {
    super('AuthentikUserVerificationService');
  }

  /**
   * Get user verification status from Authentik
   */
  async getUserVerificationStatus(userId: string): Promise<ServiceResponse<UserVerificationStatus>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current session to access Authentik user info
        const sessionResult = await authentikAuthService.getSession();
        if (!sessionResult.success || !sessionResult.data) {
          return { 
            data: null, 
            error: 'No active session found' 
          };
        }

        const session = sessionResult.data;
        const authentikUser = session.session.user as AuthentikUserInfo;

        // Check if the requested user matches the authenticated user
        if (authentikUser.sub !== userId) {
          return { 
            data: null, 
            error: 'User ID mismatch - can only verify current user' 
          };
        }

        // Build verification status from Authentik user info
        const verificationStatus: UserVerificationStatus = {
          emailVerified: authentikUser.email_verified || false,
          accountActive: true, // Authentik handles account status
          profileComplete: this.isProfileComplete(authentikUser),
          verificationLevel: this.getVerificationLevel(authentikUser),
          lastVerifiedAt: new Date().toISOString(),
          verificationMethod: 'authentik'
        };

        this.logger.info('User verification status retrieved', { 
          userId, 
          emailVerified: verificationStatus.emailVerified,
          verificationLevel: verificationStatus.verificationLevel 
        });

        return { data: verificationStatus, error: null };
      } catch (error) {
        this.logger.error('Failed to get user verification status', { userId, error });
        return { data: null, error: 'Failed to get verification status' };
      }
    }, `get verification status for user ${userId}`);
  }

  /**
   * Check if user is fully verified
   */
  async isUserVerified(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const statusResult = await this.getUserVerificationStatus(userId);
        if (!statusResult.success || !statusResult.data) {
          return { data: false, error: statusResult.error };
        }

        const status = statusResult.data;
        const isVerified = status.emailVerified && status.accountActive && status.profileComplete;

        this.logger.info('User verification check completed', { 
          userId, 
          isVerified,
          emailVerified: status.emailVerified,
          profileComplete: status.profileComplete 
        });

        return { data: isVerified, error: null };
      } catch (error) {
        this.logger.error('Failed to check user verification', { userId, error });
        return { data: false, error: 'Failed to check verification' };
      }
    }, `check verification for user ${userId}`);
  }

  /**
   * Request email verification (redirects to Authentik)
   */
  async requestEmailVerification(userId: string): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      try {
        // Check current verification status
        const statusResult = await this.getUserVerificationStatus(userId);
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: statusResult.error };
        }

        const status = statusResult.data;

        // If already verified, return success
        if (status.emailVerified) {
          return { 
            data: 'Email already verified', 
            error: null 
          };
        }

        // Redirect to Authentik for email verification
        const authUrl = await authentikAuthService.initiateOAuthFlow();
        if (!authUrl.success || !authUrl.data) {
          return { data: null, error: 'Failed to initiate verification flow' };
        }

        this.logger.info('Email verification requested', { userId });
        return { data: authUrl.data, error: null };
      } catch (error) {
        this.logger.error('Failed to request email verification', { userId, error });
        return { data: null, error: 'Failed to request verification' };
      }
    }, `request email verification for user ${userId}`);
  }

  /**
   * Complete verification process
   */
  async completeVerification(userId: string, verificationData: any): Promise<ServiceResponse<VerificationResult>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current verification status
        const statusResult = await this.getUserVerificationStatus(userId);
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: statusResult.error };
        }

        const currentStatus = statusResult.data;

        // Check if verification is already complete
        if (currentStatus.emailVerified && currentStatus.profileComplete) {
          return {
            data: {
              success: true,
              status: currentStatus,
              message: 'User already fully verified'
            },
            error: null
          };
        }

        // Update verification status based on Authentik data
        const updatedStatus: UserVerificationStatus = {
          ...currentStatus,
          lastVerifiedAt: new Date().toISOString()
        };

        const result: VerificationResult = {
          success: updatedStatus.emailVerified && updatedStatus.profileComplete,
          status: updatedStatus,
          message: 'Verification completed successfully'
        };

        this.logger.info('Verification completed', { 
          userId, 
          success: result.success,
          emailVerified: updatedStatus.emailVerified 
        });

        return { data: result, error: null };
      } catch (error) {
        this.logger.error('Failed to complete verification', { userId, error });
        return { data: null, error: 'Failed to complete verification' };
      }
    }, `complete verification for user ${userId}`);
  }

  /**
   * Get verification requirements for a user
   */
  async getVerificationRequirements(userId: string): Promise<ServiceResponse<{
    requirements: string[];
    missingFields: string[];
    nextSteps: string[];
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const statusResult = await this.getUserVerificationStatus(userId);
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: statusResult.error };
        }

        const status = statusResult.data;
        const requirements: string[] = [];
        const missingFields: string[] = [];
        const nextSteps: string[] = [];

        // Check email verification
        if (!status.emailVerified) {
          requirements.push('Email verification required');
          missingFields.push('email_verified');
          nextSteps.push('Complete email verification through Authentik');
        }

        // Check profile completion
        if (!status.profileComplete) {
          requirements.push('Profile completion required');
          missingFields.push('profile_complete');
          nextSteps.push('Complete your profile information');
        }

        // Check account status
        if (!status.accountActive) {
          requirements.push('Account activation required');
          missingFields.push('account_active');
          nextSteps.push('Contact administrator for account activation');
        }

        const result = {
          requirements,
          missingFields,
          nextSteps
        };

        this.logger.info('Verification requirements retrieved', { 
          userId, 
          requirementCount: requirements.length 
        });

        return { data: result, error: null };
      } catch (error) {
        this.logger.error('Failed to get verification requirements', { userId, error });
        return { data: null, error: 'Failed to get requirements' };
      }
    }, `get verification requirements for user ${userId}`);
  }

  /**
   * Check if user profile is complete based on Authentik data
   */
  private isProfileComplete(user: AuthentikUserInfo): boolean {
    const requiredFields = ['email', 'name'];
    const optionalFields = ['given_name', 'family_name'];

    // Check required fields
    const hasRequiredFields = requiredFields.every(field => 
      user[field as keyof AuthentikUserInfo] && 
      String(user[field as keyof AuthentikUserInfo]).trim() !== ''
    );

    // Check if at least one optional field is present
    const hasOptionalFields = optionalFields.some(field => 
      user[field as keyof AuthentikUserInfo] && 
      String(user[field as keyof AuthentikUserInfo]).trim() !== ''
    );

    return hasRequiredFields && hasOptionalFields;
  }

  /**
   * Determine verification level based on Authentik user data
   */
  private getVerificationLevel(user: AuthentikUserInfo): 'none' | 'basic' | 'full' {
    if (!user.email_verified) {
      return 'none';
    }

    if (this.isProfileComplete(user)) {
      return 'full';
    }

    return 'basic';
  }
}

// Export singleton instance
export const authentikUserVerificationService = new AuthentikUserVerificationService();
