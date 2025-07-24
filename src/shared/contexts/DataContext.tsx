import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { BusinessLogicLayer } from '@/core/data/BusinessLogicLayer';
import { useAuth } from '@/core/auth/AuthProvider';
import { logger } from '@/shared/utils/logger';

// Types
interface DataState {
  profile: any | null;
  businessData: any | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  lastUpdated: Date | null;
}

interface DataAction {
  type: 'SET_LOADING' | 'SET_PROFILE' | 'SET_BUSINESS_DATA' | 'SET_ERROR' | 'SET_WARNINGS' | 'CLEAR_DATA';
  payload?: any;
}

// Initial state
const initialState: DataState = {
  profile: null,
  businessData: null,
  loading: false,
  error: null,
  warnings: [],
  lastUpdated: null
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PROFILE':
      return { 
        ...state, 
        profile: action.payload.data,
        error: action.payload.error,
        warnings: action.payload.warnings || [],
        lastUpdated: new Date()
      };
    case 'SET_BUSINESS_DATA':
      return { 
        ...state, 
        businessData: action.payload.data,
        error: action.payload.error,
        warnings: action.payload.warnings || [],
        lastUpdated: new Date()
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_WARNINGS':
      return { ...state, warnings: action.payload };
    case 'CLEAR_DATA':
      return { ...initialState };
    default:
      return state;
  }
}

// Context
interface DataContextType {
  // State
  profile: any | null;
  businessData: any | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  lastUpdated: Date | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  fetchBusinessData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearData: () => void;
  clearError: () => void;
  clearWarnings: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider
interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useAuth();
  const businessLogic = new BusinessLogicLayer();

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await businessLogic.getUserProfile(user.id);
      
      dispatch({
        type: 'SET_PROFILE',
        payload: result
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to fetch profile'
      });
    }
  }, [user?.id]);

  // Fetch business data
  const fetchBusinessData = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await businessLogic.getUserBusinessData(user.id);
      
      dispatch({
        type: 'SET_BUSINESS_DATA',
        payload: result
      });
    } catch (error) {
      logger.error('Error fetching business data:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to fetch business data'
      });
    }
  }, [user?.id]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Fetch all data in parallel
      const [profileResult, businessResult] = await Promise.all([
        businessLogic.getUserProfile(user.id),
        businessLogic.getUserBusinessData(user.id)
      ]);

      dispatch({
        type: 'SET_PROFILE',
        payload: profileResult
      });

      dispatch({
        type: 'SET_BUSINESS_DATA',
        payload: businessResult
      });
    } catch (error) {
      logger.error('Error refreshing data:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to refresh data'
      });
    }
  }, [user?.id]);

  // Clear data
  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    dispatch({ type: 'SET_WARNINGS', payload: [] });
  }, []);

  // Auto-fetch data when user changes
  useEffect(() => {
    if (user?.id) {
      logger.debug('User authenticated, fetching data for:', user.id);
      refreshAll();
    } else {
      logger.debug('User not authenticated, clearing data');
      clearData();
    }
  }, [user?.id, refreshAll, clearData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      logger.debug('Auto-refreshing data for user:', user.id);
      refreshAll();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.id, refreshAll]);

  const value: DataContextType = {
    // State
    profile: state.profile,
    businessData: state.businessData,
    loading: state.loading,
    error: state.error,
    warnings: state.warnings,
    lastUpdated: state.lastUpdated,
    
    // Actions
    fetchProfile,
    fetchBusinessData,
    refreshAll,
    clearData,
    clearError,
    clearWarnings
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 