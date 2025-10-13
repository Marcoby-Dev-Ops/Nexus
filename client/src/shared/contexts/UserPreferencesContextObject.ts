import { createContext } from 'react';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { UserPreferences } from '@/services/user/UserPreferencesService';

export interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<ServiceResponse<UserPreferences>>;
  refreshPreferences: () => Promise<void>;
}

export const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);
