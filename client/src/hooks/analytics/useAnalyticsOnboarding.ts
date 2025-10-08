import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/index';

export interface AnalyticsOnboardingState {
  completedModules: Set<string>;
  currentModule: string | null;
  isVisible: boolean;
  showProgress: boolean;
}

export interface AnalyticsFeature {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  isCompleted: boolean;
  isRecommended: boolean;
}

export interface AnalyticsOnboardingActions {
  startModule: (moduleId: string) => void;
  completeModule: (moduleId: string) => void;
  skipModule: (moduleId: string) => void;
  closeModule: () => void;
  showProgress: () => void;
  hideProgress: () => void;
  resetOnboarding: () => void;
}

export const useAnalyticsOnboarding = (): AnalyticsOnboardingState & AnalyticsOnboardingActions => {
  const { user } = useAuth();
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const analyticsFeatures: AnalyticsFeature[] = [
    {
      id: 'data-warehouse',
      name: 'Data Warehouse',
      description: 'Centralized data storage and management',
      difficulty: 'beginner',
      estimatedTime: '5-10 minutes',
      isCompleted: false,
      isRecommended: true
    },
    {
      id: 'unified-analytics',
      name: 'Unified Analytics',
      description: 'Cross-platform insights and business intelligence',
      difficulty: 'intermediate',
      estimatedTime: '10-15 minutes',
      isCompleted: false,
      isRecommended: true
    },
    {
      id: 'fire-cycle-analytics',
      name: 'Fire Cycle Analytics',
      description: 'Monitor and optimize business cycles',
      difficulty: 'intermediate',
      estimatedTime: '8-12 minutes',
      isCompleted: false,
      isRecommended: false
    },
    {
      id: 'integration-tracking',
      name: 'Integration Tracking',
      description: 'Monitor integration health and performance',
      difficulty: 'beginner',
      estimatedTime: '5-8 minutes',
      isCompleted: false,
      isRecommended: false
    }
  ];

  const startModule = useCallback((moduleId: string) => {
    setCurrentModule(moduleId);
    setIsVisible(true);
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    setCompletedModules(prev => {
      const newSet = new Set(prev);
      newSet.add(moduleId);
      
      // Save to localStorage
      const completedArray = Array.from(newSet);
      localStorage.setItem('nexus_analytics_onboarding_completed', JSON.stringify(completedArray));
      
      return newSet;
    });
    setCurrentModule(null);
    setIsVisible(false);
  }, []);

  const skipModule = useCallback((moduleId: string) => {
    setCurrentModule(null);
    setIsVisible(false);
  }, []);

  const closeModule = useCallback(() => {
    setCurrentModule(null);
    setIsVisible(false);
  }, []);

  const showProgressHandler = useCallback(() => {
    setShowProgress(true);
  }, []);

  const hideProgress = useCallback(() => {
    setShowProgress(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedModules(new Set());
    setCurrentModule(null);
    setIsVisible(false);
    setShowProgress(false);
    localStorage.removeItem('nexus_analytics_onboarding_completed');
  }, []);

  // Load completed modules from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('nexus_analytics_onboarding_completed');
    if (stored) {
      const completed = JSON.parse(stored);
      setCompletedModules(new Set(completed));
    }
  }, []);

  // Computed properties
  const features = analyticsFeatures.map(feature => ({
    ...feature,
    isCompleted: completedModules.has(feature.id)
  }));

  const completionPercentage = (completedModules.size / analyticsFeatures.length) * 100;

  const recommendedModules = features.filter(f => f.isRecommended && !f.isCompleted);
  const nextRecommendedModule = recommendedModules[0];

  return {
    // State
    completedModules,
    currentModule,
    isVisible,
    showProgress,
    
    // Actions
    startModule,
    completeModule,
    skipModule,
    closeModule,
    showProgressHandler,
    hideProgress,
    resetOnboarding,
    
    // Computed
    features,
    completionPercentage,
    recommendedModules,
    nextRecommendedModule
  };
};

export default useAnalyticsOnboarding; 
