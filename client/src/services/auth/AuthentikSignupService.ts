export interface AuthentikUserData {
  username: string;
  email: string;
  name: string;
  password: string;
  is_active?: boolean;
  attributes?: Record<string, any>;
}

export interface BusinessSignupData {
  businessName: string;
  businessType: string;
  industry: string;
  companySize: string;
  website?: string;
  domain?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  fundingStage?: string | undefined;
  revenueRange?: string | undefined;
  username?: string;
}

export interface SignupResult {
  success: boolean;
  userId?: string;
  enrollmentUrl?: string;
  error?: string;
}

export interface UpdateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

import { buildApiUrl } from '@/lib/api-url';
import { logger } from '@/shared/utils/logger';

export class AuthentikSignupService {
  /**
   * Create new user in Authentik
   */
  static async createUser(signupData: BusinessSignupData): Promise<SignupResult> {
    try {
      // Create new user via backend endpoint
      const response = await fetch(buildApiUrl('/api/auth/create-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
  const errorData = await response.json();
  logger.error('User creation failed', errorData);
        return {
          success: false,
          error: errorData.error || `Failed to create user: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        userId: result.userId
      };

    } catch (error) {
  logger.error('Error creating user', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update existing user with business information after enrollment
   */
  static async updateBusinessInfo(signupData: BusinessSignupData): Promise<SignupResult> {
    try {
      // Update user business information via backend endpoint
      const response = await fetch(buildApiUrl('/api/auth/update-business-info'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
  const errorData = await response.json();
  logger.error('Business info update failed', errorData);
        return {
          success: false,
          error: errorData.error || `Failed to update business information: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        userId: result.userId
      };

    } catch (error) {
  logger.error('Error updating business information', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if a user already exists
   */
  static async checkUserExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl(`/api/auth/check-user/${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
  logger.error('Failed to check user existence');
        return false;
      }

      const data = await response.json();
      return data.exists;

    } catch (error) {
  logger.error('Error checking user existence', error);
      return false;
    }
  }

  /**
   * Get user details by email
   */
  static async getUserByEmail(email: string): Promise<any | null> {
    try {
      const response = await fetch(buildApiUrl(`/api/auth/check-user/${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.exists ? { email } : null;

    } catch (error) {
  logger.error('Error fetching user by email', error);
      return null;
    }
  }

  /**
   * Update existing user with business information after enrollment
   */
  static async updateUserFromSignup(signupData: BusinessSignupData): Promise<UpdateUserResult> {
    try {
      // Update user via backend endpoint
      const response = await fetch(buildApiUrl('/api/auth/update-user'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
  const errorData = await response.json();
  logger.error('User update failed', errorData);
        return {
          success: false,
          error: errorData.error || `Failed to update user: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        userId: result.userId
      };

    } catch (error) {
  logger.error('Error updating user', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
