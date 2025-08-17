import { selectOne, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export const ensureUserProfile = async (userId: string, email: string) => {
  try {
    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.error('ensureUserProfile called with invalid userId', { userId });
      return null;
    }

    // Try to fetch the user profile
    const { data, error } = await selectOne('user_profiles', userId);
    if (error) {
      logger.error({ error }, 'Failed to fetch user profile');
      return null;
    }
    if (data) {
      return data;
    }
    // If not found, create a new profile
    const { data: newProfile, error: insertError } = await insertOne('user_profiles', {
      id: userId,
      email,
    });
    if (insertError) {
      logger.error({ error: insertError }, 'Failed to create user profile');
      return null;
    }
    return newProfile;
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