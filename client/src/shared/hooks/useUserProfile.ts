/**
 * @deprecated Use useUserProfile from '@/shared/contexts/UserContext' instead
 * This file is kept for backward compatibility but will be removed in a future version
 */

import { useUserProfile as useUserProfileFromContext } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';

export const useUserProfile = (userId?: string) => {
  logger.warn(
    'useUserProfile from @/shared/hooks is deprecated. ' +
    'Please use useUserProfile from @/shared/contexts/UserContext instead.'
  );
  
  return useUserProfileFromContext();
}; 
