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
    username?: string;
}

export interface SignupResult {
    success: boolean;
    userId?: string;
    error?: string;
}

import { buildApiUrl } from '../../lib/api-url';
import { logger } from '../../shared/utils/logger';

export class AuthentikSignupService {
    /**
     * Create new user in Authentik
     */
    static async createUser(signupData: BusinessSignupData): Promise<SignupResult> {
        try {
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
}
