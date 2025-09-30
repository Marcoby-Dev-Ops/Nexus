import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { userPreferencesService, type UserPreferences } from '@/services/user/UserPreferencesService';
import { type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<ServiceResponse<UserPreferences>>;
  refreshPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('Fetching user preferences', { userId: user.id });

      const result = await userPreferencesService.get(user.id);
      
      if (result.success && result.data) {
        setPreferences(result.data);
        logger.info('User preferences loaded successfully', { 
          userId: user.id, 
          preferencesId: result.data.id 
        });
      } else {
        logger.error('Failed to load user preferences', { 
          userId: user.id, 
          error: result.error 
        });
      }
    } catch (error) {
      logger.error('Exception while fetching user preferences', { 
        userId: user.id, 
        error 
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    try {
      logger.info('Updating user preferences', { userId: user.id, updates });

      const result = await userPreferencesService.update(user.id, updates);
      
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
      return { success: false, error: 'Failed to update preferences' };
    }
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  // Fetch preferences when user changes
  useEffect(() => {
    fetchPreferences();
  }, [user?.id]);

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

