/**
 * Journey Management Hook
 * 
 * Provides easy access to journey management functionality with
 * loading states, error handling, and caching.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/shared/hooks/useOrganization';
import { 
  journeyManagementService, 
  type JourneyType, 
  type JourneyInstance, 
  type JourneyPreferences, 
  type JourneyUpdate, 
  type JourneyCompletion 
} from '@/services/journey/JourneyManagementService';

interface UseJourneyManagementReturn {
  // Journey Types
  journeyTypes: JourneyType[];
  loadingJourneyTypes: boolean;
  errorJourneyTypes: string | null;
  getJourneyTypes: () => Promise<void>;
  
  // Journey Recommendations
  journeyRecommendations: JourneyType[];
  loadingRecommendations: boolean;
  errorRecommendations: string | null;
  getJourneyRecommendations: (preferences: JourneyPreferences) => Promise<void>;
  
  // User Journeys
  userJourneys: JourneyInstance[];
  loadingUserJourneys: boolean;
  errorUserJourneys: string | null;
  getUserJourneys: (status?: JourneyInstance['status']) => Promise<void>;
  
  // Single Journey
  currentJourney: JourneyInstance | null;
  loadingCurrentJourney: boolean;
  errorCurrentJourney: string | null;
  getJourney: (journeyId: string) => Promise<void>;
  
  // Journey Actions
  creatingJourney: boolean;
  updatingJourney: boolean;
  completingJourney: boolean;
  pausingJourney: boolean;
  resumingJourney: boolean;
  abandoningJourney: boolean;
  
  createJourney: (typeId: string, preferences: JourneyPreferences, customName?: string) => Promise<ServiceResponse<JourneyInstance>>;
  updateJourney: (journeyId: string, updates: JourneyUpdate) => Promise<ServiceResponse<JourneyInstance>>;
  completeJourney: (journeyId: string, completion: JourneyCompletion) => Promise<ServiceResponse<JourneyInstance>>;
  pauseJourney: (journeyId: string, reason?: string) => Promise<ServiceResponse<JourneyInstance>>;
  resumeJourney: (journeyId: string) => Promise<ServiceResponse<JourneyInstance>>;
  abandonJourney: (journeyId: string, reason?: string) => Promise<ServiceResponse<JourneyInstance>>;
  
  // Utilities
  refreshJourney: (journeyId: string) => Promise<void>;
  clearErrors: () => void;
}

export function useJourneyManagement(): UseJourneyManagementReturn {
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  
  // Journey Types State
  const [journeyTypes, setJourneyTypes] = useState<JourneyType[]>([]);
  const [loadingJourneyTypes, setLoadingJourneyTypes] = useState(false);
  const [errorJourneyTypes, setErrorJourneyTypes] = useState<string | null>(null);
  
  // Journey Recommendations State
  const [journeyRecommendations, setJourneyRecommendations] = useState<JourneyType[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [errorRecommendations, setErrorRecommendations] = useState<string | null>(null);
  
  // User Journeys State
  const [userJourneys, setUserJourneys] = useState<JourneyInstance[]>([]);
  const [loadingUserJourneys, setLoadingUserJourneys] = useState(false);
  const [errorUserJourneys, setErrorUserJourneys] = useState<string | null>(null);
  
  // Current Journey State
  const [currentJourney, setCurrentJourney] = useState<JourneyInstance | null>(null);
  const [loadingCurrentJourney, setLoadingCurrentJourney] = useState(false);
  const [errorCurrentJourney, setErrorCurrentJourney] = useState<string | null>(null);
  
  // Action Loading States
  const [creatingJourney, setCreatingJourney] = useState(false);
  const [updatingJourney, setUpdatingJourney] = useState(false);
  const [completingJourney, setCompletingJourney] = useState(false);
  const [pausingJourney, setPausingJourney] = useState(false);
  const [resumingJourney, setResumingJourney] = useState(false);
  const [abandoningJourney, setAbandoningJourney] = useState(false);

  // Get Journey Types
  const getJourneyTypes = useCallback(async () => {
    setLoadingJourneyTypes(true);
    setErrorJourneyTypes(null);
    
    try {
      const result = await journeyManagementService.getJourneyTypes();
      
      if (result.success) {
        setJourneyTypes(result.data || []);
      } else {
        setErrorJourneyTypes(result.error || 'Failed to fetch journey types');
      }
    } catch (error) {
      setErrorJourneyTypes('Error fetching journey types');
    } finally {
      setLoadingJourneyTypes(false);
    }
  }, []);

  // Get Journey Recommendations
  const getJourneyRecommendations = useCallback(async (preferences: JourneyPreferences) => {
    setLoadingRecommendations(true);
    setErrorRecommendations(null);
    
    try {
      const result = await journeyManagementService.getJourneyRecommendations(preferences);
      
      if (result.success) {
        setJourneyRecommendations(result.data || []);
      } else {
        setErrorRecommendations(result.error || 'Failed to get journey recommendations');
      }
    } catch (error) {
      setErrorRecommendations('Error getting journey recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  // Get User Journeys
  const getUserJourneys = useCallback(async (status?: JourneyInstance['status']) => {
    if (!user?.id) return;
    
    setLoadingUserJourneys(true);
    setErrorUserJourneys(null);
    
    try {
      const result = await journeyManagementService.getUserJourneys(user.id, status);
      
      if (result.success) {
        setUserJourneys(result.data || []);
      } else {
        setErrorUserJourneys(result.error || 'Failed to fetch user journeys');
      }
    } catch (error) {
      setErrorUserJourneys('Error fetching user journeys');
    } finally {
      setLoadingUserJourneys(false);
    }
  }, [user?.id]);

  // Get Single Journey
  const getJourney = useCallback(async (journeyId: string) => {
    setLoadingCurrentJourney(true);
    setErrorCurrentJourney(null);
    
    try {
      const result = await journeyManagementService.getJourney(journeyId);
      
      if (result.success) {
        setCurrentJourney(result.data);
      } else {
        setErrorCurrentJourney(result.error || 'Failed to fetch journey');
      }
    } catch (error) {
      setErrorCurrentJourney('Error fetching journey');
    } finally {
      setLoadingCurrentJourney(false);
    }
  }, []);

  // Create Journey
  const createJourney = useCallback(async (
    typeId: string, 
    preferences: JourneyPreferences, 
    customName?: string
  ) => {
    setCreatingJourney(true);
    
    try {
      const result = await journeyManagementService.createJourney(typeId, preferences, customName);
      
      if (result.success) {
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setCreatingJourney(false);
    }
  }, [getUserJourneys]);

  // Update Journey
  const updateJourney = useCallback(async (journeyId: string, updates: JourneyUpdate) => {
    setUpdatingJourney(true);
    
    try {
      const result = await journeyManagementService.updateJourney(journeyId, updates);
      
      if (result.success) {
        // Update current journey if it's the one being updated
        if (currentJourney?.id === journeyId) {
          setCurrentJourney(result.data);
        }
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setUpdatingJourney(false);
    }
  }, [currentJourney?.id, getUserJourneys]);

  // Complete Journey
  const completeJourney = useCallback(async (journeyId: string, completion: JourneyCompletion) => {
    setCompletingJourney(true);
    
    try {
      const result = await journeyManagementService.completeJourney(journeyId, completion);
      
      if (result.success) {
        // Update current journey if it's the one being completed
        if (currentJourney?.id === journeyId) {
          setCurrentJourney(result.data);
        }
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setCompletingJourney(false);
    }
  }, [currentJourney?.id, getUserJourneys]);

  // Pause Journey
  const pauseJourney = useCallback(async (journeyId: string, reason?: string) => {
    setPausingJourney(true);
    
    try {
      const result = await journeyManagementService.pauseJourney(journeyId, reason);
      
      if (result.success) {
        // Update current journey if it's the one being paused
        if (currentJourney?.id === journeyId) {
          setCurrentJourney(result.data);
        }
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setPausingJourney(false);
    }
  }, [currentJourney?.id, getUserJourneys]);

  // Resume Journey
  const resumeJourney = useCallback(async (journeyId: string) => {
    setResumingJourney(true);
    
    try {
      const result = await journeyManagementService.resumeJourney(journeyId);
      
      if (result.success) {
        // Update current journey if it's the one being resumed
        if (currentJourney?.id === journeyId) {
          setCurrentJourney(result.data);
        }
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setResumingJourney(false);
    }
  }, [currentJourney?.id, getUserJourneys]);

  // Abandon Journey
  const abandonJourney = useCallback(async (journeyId: string, reason?: string) => {
    setAbandoningJourney(true);
    
    try {
      const result = await journeyManagementService.abandonJourney(journeyId, reason);
      
      if (result.success) {
        // Update current journey if it's the one being abandoned
        if (currentJourney?.id === journeyId) {
          setCurrentJourney(result.data);
        }
        // Refresh user journeys list
        await getUserJourneys();
      }
      
      return result;
    } finally {
      setAbandoningJourney(false);
    }
  }, [currentJourney?.id, getUserJourneys]);

  // Refresh Journey
  const refreshJourney = useCallback(async (journeyId: string) => {
    await getJourney(journeyId);
  }, [getJourney]);

  // Clear Errors
  const clearErrors = useCallback(() => {
    setErrorJourneyTypes(null);
    setErrorRecommendations(null);
    setErrorUserJourneys(null);
    setErrorCurrentJourney(null);
  }, []);

  // Auto-load journey types on mount
  useEffect(() => {
    getJourneyTypes();
  }, [getJourneyTypes]);

  // Auto-load user journeys when user changes
  useEffect(() => {
    if (user?.id) {
      getUserJourneys();
    }
  }, [user?.id, getUserJourneys]);

  return {
    // Journey Types
    journeyTypes,
    loadingJourneyTypes,
    errorJourneyTypes,
    getJourneyTypes,
    
    // Journey Recommendations
    journeyRecommendations,
    loadingRecommendations,
    errorRecommendations,
    getJourneyRecommendations,
    
    // User Journeys
    userJourneys,
    loadingUserJourneys,
    errorUserJourneys,
    getUserJourneys,
    
    // Single Journey
    currentJourney,
    loadingCurrentJourney,
    errorCurrentJourney,
    getJourney,
    
    // Journey Actions
    creatingJourney,
    updatingJourney,
    completingJourney,
    pausingJourney,
    resumingJourney,
    abandoningJourney,
    
    createJourney,
    updateJourney,
    completeJourney,
    pauseJourney,
    resumeJourney,
    abandonJourney,
    
    // Utilities
    refreshJourney,
    clearErrors,
  };
}
