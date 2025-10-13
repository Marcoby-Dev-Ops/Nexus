import type { ReactNode } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { userPreferencesService, type UserPreferences } from '@/services/user/UserPreferencesService';
import { type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { UserPreferencesContext } from '@/shared/contexts/UserPreferencesContextObject';

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<ServiceResponse<UserPreferences>>;
  refreshPreferences: () => Promise<void>;
}

// Context is defined in UserPreferencesContextObject to keep this file component-only for fast-refresh.

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('Fetching user preferences', { userId: user.id });

  const result = await userPreferencesService.get(user.id, user.email || undefined);
      
      if (result.success && result.data) {
        setPreferences(result.data);
        logger.info('User preferences loaded successfully', { 
          userId: user.id, 
          preferencesId: result.data.id 
        });
      } else {
        const fallbackPreferences = userPreferencesService.getDefaultPreferencesForUser(user.id);
        setPreferences(fallbackPreferences);
        logger.warn('Failed to load user preferences, using defaults', { 
          userId: user.id, 
          error: result.error 
        });
      }
    } catch (error) {
      logger.error('Exception while fetching user preferences', { 
        userId: user.id, 
        error 
      });
      if (user?.id) {
        const fallbackPreferences = userPreferencesService.getDefaultPreferencesForUser(user.id);
        setPreferences(fallbackPreferences);
        logger.warn('Using default preferences after exception', { userId: user.id });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available', data: null };
    }

    try {
      logger.info('Updating user preferences', { userId: user.id, updates });

  const result = await userPreferencesService.update(user.id, updates, user.email || undefined);
      
      if (result.success && result.data) {
        setPreferences(result.data);
        logger.info('User preferences updated successfully', { 
          userId: user.id, 
          preferencesId: result.data.id 
        });
      }

      return result;
    } catch (error) {
      logger.error('Exception while updating user preferences', { 
        userId: user.id, 
        error 
      });
      return { success: false, error: 'Failed to update preferences', data: null };
    }
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  // Fetch preferences when user changes
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const value: UserPreferencesContextType = {
    preferences,
    loading,
    updatePreferences,
    refreshPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
