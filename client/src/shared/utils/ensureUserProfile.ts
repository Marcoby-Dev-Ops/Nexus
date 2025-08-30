import { callRPC } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export const ensureUserProfile = async (userId: string, email: string) => {
  try {
    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.error('ensureUserProfile called with invalid userId', { userId });
      return null;
    }

    // Use the ensure_user_profile RPC function which handles mapping and profile creation
    const { data, error } = await callRPC('ensure_user_profile', { user_id: userId });
    if (error) {
      logger.error({ error }, 'Failed to ensure user profile');
      return null;
    }
    
    // RPC returns an array, but we want a single record
    if (!data || data.length === 0) {
      logger.error('No user profile returned from ensure_user_profile RPC');
      return null;
    }
    
    return data[0];
  } catch (err) {
    logger.error({ err }, 'Error ensuring user profile');
    return null;
  }
};

/**
 * Hook to ensure user profile exists when component mounts
 * Useful for components that need to guarantee a profile exists
 */
export function useEnsureUserProfile() {
  const ensureProfile = async (userId?: string) => {
    return await ensureUserProfile(userId, ''); // Placeholder for email, as it's not directly available here
  };

  return { ensureProfile };
} 
