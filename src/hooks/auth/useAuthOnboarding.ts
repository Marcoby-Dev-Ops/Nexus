import React, { useState, useCallback, useEffect } from 'react';

interface AuthFeature {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  isCompleted: boolean;
  isRecommended: boolean;
}

interface UseAuthOnboardingReturn {
  completedModules: string[];
  currentModule: string | null;
  isVisible: boolean;
  showProgress: boolean;
  features: AuthFeature[];
  completionPercentage: number;
  recommendedModules: AuthFeature[];
  nextRecommendedModule: AuthFeature | null;
  startModule: (moduleId: string) => void;
  completeModule: (moduleId: string) => void;
  skipModule: (moduleId: string) => void;
  closeModule: () => void;
  showProgress: () => void;
  hideProgress: () => void;
  resetOnboarding: () => void;
}

const authFeatures: AuthFeature[] = [
  {
    id: 'account-setup',
    name: 'Account Setup',
    description: 'Learn how to create and configure your account',
    difficulty: 'beginner',
    estimatedTime: 5,
    isCompleted: false,
    isRecommended: true,
  },
  {
    id: 'profile-management',
    name: 'Profile Management',
    description: 'Set up your profile and personal information',
    difficulty: 'beginner',
    estimatedTime: 10,
    isCompleted: false,
    isRecommended: true,
  },
  {
    id: 'security-settings',
    name: 'Security Settings',
    description: 'Configure password, 2FA, and security preferences',
    difficulty: 'intermediate',
    estimatedTime: 15,
    isCompleted: false,
    isRecommended: true,
  },
  {
    id: 'notification-preferences',
    name: 'Notification Preferences',
    description: 'Customize your notification settings',
    difficulty: 'beginner',
    estimatedTime: 8,
    isCompleted: false,
    isRecommended: false,
  },
  {
    id: 'privacy-settings',
    name: 'Privacy Settings',
    description: 'Control your data and privacy preferences',
    difficulty: 'intermediate',
    estimatedTime: 12,
    isCompleted: false,
    isRecommended: false,
  },
  {
    id: 'data-management',
    name: 'Data Management',
    description: 'Learn about data export and account deletion',
    difficulty: 'advanced',
    estimatedTime: 20,
    isCompleted: false,
    isRecommended: false,
  },
];

export function useAuthOnboarding(): UseAuthOnboardingReturn {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Load completed modules from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('auth-onboarding-completed');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedModules(parsed);
      } catch (error) {
        console.error('Failed to parse saved onboarding data:', error);
      }
    }
  }, []);

  const startModule = useCallback((moduleId: string) => {
    setCurrentModule(moduleId);
    setIsVisible(true);
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    setCompletedModules(prev => {
      const updated = [...prev, moduleId];
      localStorage.setItem('auth-onboarding-completed', JSON.stringify(updated));
      return updated;
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

  const showProgress = useCallback(() => {
    setShowProgress(true);
  }, []);

  const hideProgress = useCallback(() => {
    setShowProgress(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedModules([]);
    localStorage.removeItem('auth-onboarding-completed');
  }, []);

  // Computed properties
  const features = authFeatures.map(feature => ({
    ...feature,
    isCompleted: completedModules.includes(feature.id),
  }));

  const completionPercentage = features.length > 0 
    ? (features.filter(f => f.isCompleted).length / features.length) * 100 
    : 0;

  const recommendedModules = features.filter(f => f.isRecommended && !f.isCompleted);
  const nextRecommendedModule = recommendedModules[0] || null;

  return {
    completedModules,
    currentModule,
    isVisible,
    showProgress,
    features,
    completionPercentage,
    recommendedModules,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    closeModule,
    showProgress,
    hideProgress,
    resetOnboarding,
  };
} 