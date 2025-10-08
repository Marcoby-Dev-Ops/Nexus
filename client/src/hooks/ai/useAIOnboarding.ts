import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/index';

export interface AIOnboardingState {
  completedModules: Set<string>;
  currentModule: string | null;
  isVisible: boolean;
  showProgress: boolean;
}

export interface AIOnboardingActions {
  startModule: (moduleId: string) => void;
  completeModule: (moduleId: string) => void;
  skipModule: (moduleId: string) => void;
  closeModule: () => void;
  showProgress: () => void;
  hideProgress: () => void;
  resetOnboarding: () => void;
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  isCompleted: boolean;
  isRecommended: boolean;
}

export const useAIOnboarding = (): AIOnboardingState & AIOnboardingActions => {
  const { user } = useAuth();
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Available AI features for onboarding
  const aiFeatures: AIFeature[] = [
    {
      id: 'chat-assistant',
      name: 'AI Chat Assistant',
      description: 'Learn to use the AI chat for business conversations and problem-solving',
      difficulty: 'beginner',
      estimatedTime: '5 min',
      isCompleted: false,
      isRecommended: true
    },
    {
      id: 'agents',
      name: 'AI Agents',
      description: 'Understand how to create and manage specialized AI agents',
      difficulty: 'intermediate',
      estimatedTime: '10 min',
      isCompleted: false,
      isRecommended: true
    },
    {
      id: 'models',
      name: 'AI Model Management',
      description: 'Configure and optimize AI models for your specific needs',
      difficulty: 'advanced',
      estimatedTime: '15 min',
      isCompleted: false,
      isRecommended: false
    },
    {
      id: 'performance',
      name: 'AI Performance Analytics',
      description: 'Track and optimize your AI system performance',
      difficulty: 'intermediate',
      estimatedTime: '8 min',
      isCompleted: false,
      isRecommended: false
    },
    {
      id: 'capabilities',
      name: 'Advanced AI Capabilities',
      description: 'Explore cutting-edge AI features for business transformation',
      difficulty: 'advanced',
      estimatedTime: '12 min',
      isCompleted: false,
      isRecommended: false
    }
  ];

  const startModule = useCallback((moduleId: string) => {
    setCurrentModule(moduleId);
    setIsVisible(true);
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    setCompletedModules(prev => new Set([...prev, moduleId]));
    setCurrentModule(null);
    setIsVisible(false);
    
    // Save to localStorage for persistence
    const stored = localStorage.getItem('nexus_ai_onboarding_completed');
    const completed = stored ? JSON.parse(stored) : [];
    if (!completed.includes(moduleId)) {
      localStorage.setItem('nexus_ai_onboarding_completed', JSON.stringify([...completed, moduleId]));
    }
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
    localStorage.removeItem('nexus_ai_onboarding_completed');
  }, []);

  // Load completed modules from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('nexus_ai_onboarding_completed');
    if (stored) {
      const completed = JSON.parse(stored);
      setCompletedModules(new Set(completed));
    }
  }, []);

  // Update features with completion status
  const getFeaturesWithStatus = useCallback((): AIFeature[] => {
    return aiFeatures.map(feature => ({
      ...feature,
      isCompleted: completedModules.has(feature.id)
    }));
  }, [completedModules]);

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
    features: getFeaturesWithStatus(),
    completionPercentage: (completedModules.size / aiFeatures.length) * 100,
    recommendedModules: getFeaturesWithStatus().filter(f => f.isRecommended && !f.isCompleted),
    nextRecommendedModule: getFeaturesWithStatus().find(f => f.isRecommended && !f.isCompleted)
  };
};

export default useAIOnboarding; 
