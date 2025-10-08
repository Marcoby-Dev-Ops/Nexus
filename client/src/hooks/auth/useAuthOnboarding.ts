import React, { useState, useCallback, useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

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
    try {
      const saved = localStorage.getItem('auth-onboarding-completed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedModules(parsed);
          logger.info('Loaded auth onboarding data from localStorage', { completedModules: parsed });
        } else {
          logger.warn('Invalid auth onboarding data format in localStorage', { saved });
        }
      }
    } catch (error) {
      logger.error('Failed to parse saved auth onboarding data:', error);
    }
  }, []);

  const startModule = useCallback((moduleId: string) => {
    // Validate required parameters
    if (!moduleId || typeof moduleId !== 'string') {
      logger.error('Module ID is required and must be a string');
      return;
    }

    // Validate module exists
    const moduleExists = authFeatures.some(feature => feature.id === moduleId);
    if (!moduleExists) {
      logger.error('Invalid module ID', { moduleId });
      return;
    }

    setCurrentModule(moduleId);
    setIsVisible(true);
    logger.info('Started auth onboarding module', { moduleId });
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    // Validate required parameters
    if (!moduleId || typeof moduleId !== 'string') {
      logger.error('Module ID is required and must be a string');
      return;
    }

    // Validate module exists
    const moduleExists = authFeatures.some(feature => feature.id === moduleId);
    if (!moduleExists) {
      logger.error('Invalid module ID', { moduleId });
      return;
    }

    setCompletedModules(prev => {
      const updated = [...prev, moduleId];
      try {
        localStorage.setItem('auth-onboarding-completed', JSON.stringify(updated));
        logger.info('Completed auth onboarding module', { moduleId, totalCompleted: updated.length });
      } catch (error) {
        logger.error('Failed to save auth onboarding completion to localStorage:', error);
      }
      return updated;
    });
    setCurrentModule(null);
    setIsVisible(false);
  }, []);

  const skipModule = useCallback((moduleId: string) => {
    // Validate required parameters
    if (!moduleId || typeof moduleId !== 'string') {
      logger.error('Module ID is required and must be a string');
      return;
    }

    setCurrentModule(null);
    setIsVisible(false);
    logger.info('Skipped auth onboarding module', { moduleId });
  }, []);

  const closeModule = useCallback(() => {
    setCurrentModule(null);
    setIsVisible(false);
    logger.info('Closed auth onboarding module');
  }, []);

  const showProgress = useCallback(() => {
    setShowProgress(true);
    logger.info('Showing auth onboarding progress');
  }, []);

  const hideProgress = useCallback(() => {
    setShowProgress(false);
    logger.info('Hiding auth onboarding progress');
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedModules([]);
    try {
      localStorage.removeItem('auth-onboarding-completed');
      logger.info('Reset auth onboarding data');
    } catch (error) {
      logger.error('Failed to remove auth onboarding data from localStorage:', error);
    }
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
