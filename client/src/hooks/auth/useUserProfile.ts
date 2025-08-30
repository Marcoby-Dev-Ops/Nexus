/**
 * @deprecated Use useUserProfile from '@/shared/contexts/UserContext' instead
 * This file is kept for backward compatibility but will be removed in a future version
 */

import { useUserProfile as useUserProfileFromContext } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';

export function useUserProfile() {
  logger.warn(
    'useUserProfile from @/hooks/auth is deprecated. ' +
    'Please use useUserProfile from @/shared/contexts/UserContext instead.'
  );
  
  return useUserProfileFromContext();
} 
