import React, { useState, useCallback, useEffect } from 'react';

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  isCompleted: boolean;
  isRecommended: boolean;
}

interface UseAutomationOnboardingReturn {
  completedModules: string[];
  currentModule: string | null;
  isVisible: boolean;
  showProgress: boolean;
  features: AutomationFeature[];
  completionPercentage: number;
  recommendedModules: AutomationFeature[];
  nextRecommendedModule: AutomationFeature | null;
  startModule: (moduleId: string) => void;
  completeModule: (moduleId: string) => void;
  skipModule: (moduleId: string) => void;
  closeModule: () => void;
  showProgress: () => void;
  hideProgress: () => void;
  resetOnboarding: () => void;
}

const automationFeatures: AutomationFeature[] = [
  {
    id: 'workflow-basics',
    name: 'Workflow Basics',
    description: 'Learn the fundamentals of creating and managing automation workflows',
    difficulty: 'beginner',
    estimatedTime: 15,
    isCompleted: false,
    isRecommended: true
  },
  {
    id: 'recipe-deployment',
    name: 'Recipe Deployment',
    description: 'Deploy pre-built automation recipes and customize them for your needs',
    difficulty: 'beginner',
    estimatedTime: 20,
    isCompleted: false,
    isRecommended: true
  },
  {
    id: 'advanced-workflows',
    name: 'Advanced Workflows',
    description: 'Build complex multi-step workflows with conditional logic',
    difficulty: 'intermediate',
    estimatedTime: 30,
    isCompleted: false,
    isRecommended: false
  },
  {
    id: 'workflow-monitoring',
    name: 'Workflow Monitoring',
    description: 'Monitor, debug, and optimize your automation workflows',
    difficulty: 'intermediate',
    estimatedTime: 25,
    isCompleted: false,
    isRecommended: false
  },
  {
    id: 'integration-setup',
    name: 'Integration Setup',
    description: 'Connect and configure external services for your automations',
    difficulty: 'intermediate',
    estimatedTime: 20,
    isCompleted: false,
    isRecommended: false
  },
  {
    id: 'workflow-optimization',
    name: 'Workflow Optimization',
    description: 'Optimize your workflows for performance and efficiency',
    difficulty: 'advanced',
    estimatedTime: 35,
    isCompleted: false,
    isRecommended: false
  }
];

export function useAutomationOnboarding(): UseAutomationOnboardingReturn {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Load completed modules from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('automation-onboarding-completed');
    if (saved) {
      try {
        const completed = JSON.parse(saved);
        setCompletedModules(completed);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse saved automation onboarding data:', error);
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
      localStorage.setItem('automation-onboarding-completed', JSON.stringify(updated));
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

  const showProgressHandler = useCallback(() => {
    setShowProgress(true);
  }, []);

  const hideProgress = useCallback(() => {
    setShowProgress(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedModules([]);
    setCurrentModule(null);
    setIsVisible(false);
    setShowProgress(false);
    localStorage.removeItem('automation-onboarding-completed');
  }, []);

  // Computed properties
  const features = automationFeatures.map(feature => ({
    ...feature,
    isCompleted: completedModules.includes(feature.id)
  }));

  const completionPercentage = features.length > 0 
    ? (features.filter(f => f.isCompleted).length / features.length) * 100 
    : 0;

  const recommendedModules = features.filter(f => f.isRecommended && !f.isCompleted);
  const nextRecommendedModule = recommendedModules.length > 0 ? recommendedModules[0] : null;

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
    showProgressHandler,
    hideProgress,
    resetOnboarding
  };
} 
