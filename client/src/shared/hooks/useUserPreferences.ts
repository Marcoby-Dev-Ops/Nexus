import { useContext } from 'react';
import { UserPreferencesContext } from '@/shared/contexts/UserPreferencesContextObject';

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
