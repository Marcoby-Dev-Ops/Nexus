import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Integration,
  SetupStep,
  SetupData,
  SetupAnalytics,
  IntegrationError,
  ValidationResult,
  UseIntegrationSetupReturn,
  WorkflowConfig,
  ConnectionStatus
} from '@/shared/lib/types/integrations';

/**
 * Default workflow configuration based on best practices
 */
const DEFAULT_CONFIG: WorkflowConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  enableAnalytics: true,
  enableUserFeedback: true,
  skipOptionalSteps: false,
  theme: 'auto',
  locale: 'en-US'
};

/**
 * Custom hook for managing integration setup workflows
 * Implements the 6-step progressive workflow strategy with comprehensive analytics
 */
export const useIntegrationSetup = (
  integration: Integration,
  config: Partial<WorkflowConfig> = {}
): UseIntegrationSetupReturn => {
  const workflowConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Core State
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    integrationId: integration.id,
    stepData: {},
    permissions: {},
    configuration: integration.defaultConfig || {},
    metadata: {
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      retryCount: 0,
      errors: []
    }
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errors, setErrors] = useState<IntegrationError[]>([]);
  
  // Analytics State
  const [analytics, setAnalytics] = useState<SetupAnalytics>({
    sessionId: `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    integrationId: integration.id,
    stepMetrics: [],
    completionStatus: 'abandoned',
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      isMobile: window.innerWidth < 768
    }
  });
  
  // Refs for tracking
  const stepStartTime = useRef<number>(Date.now());
  const retryCount = useRef<number>(0);

  /**
   * Generate setup steps based on integration configuration
   * Implements the 6-step progressive workflow
   */
  const generateSetupSteps = useCallback((): SetupStep[] => {
    const steps: SetupStep[] = [
      {
        id: 'welcome',
        title: 'Getting Started',
        description: `Welcome! Let's connect your ${integration.name} account`,
        type: 'welcome',
        completed: false,
        estimatedTime: '1 min',
        helpText: 'This wizard will guide you through a secure connection process',
        validation: { required: false }
      }
    ];

    // Prerequisites (if defined)
    if (integration.prerequisites && integration.prerequisites.length > 0) {
      steps.push({
        id: 'prerequisites',
        title: 'Prerequisites Check',
        description: 'Verify you have everything needed for setup',
        type: 'prerequisites',
        completed: false,
        estimatedTime: '2 min',
        helpText: 'Make sure you have the required access and information',
        validation: { required: true }
      });
    }

    // Authentication
    steps.push({
      id: 'auth',
      title: integration.authType === 'oauth' ? 'Authorization' : 'Credentials',
      description: integration.authType === 'oauth' 
        ? 'Authorize Nexus to access your account securely'
        : 'Enter your API credentials or connection details',
      type: 'auth',
      completed: false,
      estimatedTime: '3 min',
      helpText: 'Your credentials are encrypted and stored securely',
      troubleshootingUrl: integration.documentation,
      validation: { required: true }
    });

    // Permissions
    steps.push({
      id: 'permissions',
      title: 'Data Permissions',
      description: 'Configure what data to sync and access levels',
      type: 'permissions',
      completed: false,
      estimatedTime: '2 min',
      helpText: 'You can change these settings anytime after setup',
      validation: { required: true }
    });

    // Configuration (optional for easy integrations)
    if (integration.difficulty !== 'easy') {
      steps.push({
        id: 'configuration',
        title: 'Advanced Settings',
        description: 'Customize sync frequency and data mapping',
        type: 'configuration',
        completed: false,
        optional: true,
        canSkip: true,
        estimatedTime: '3 min',
        helpText: 'Optional: Use defaults for quick setup',
        validation: { required: false }
      });
    }

    // Testing
    steps.push({
      id: 'testing',
      title: 'Connection Test',
      description: 'Verify everything is working correctly',
      type: 'testing',
      completed: false,
      estimatedTime: '1 min',
      helpText: 'We\'ll test the connection and fetch sample data',
      validation: { required: true }
    });

    // Success
    steps.push({
      id: 'success',
      title: 'All Set!',
      description: 'Your integration is ready to use',
      type: 'success',
      completed: false,
      estimatedTime: '1 min',
      validation: { required: false }
    });

    return steps;
  }, [integration]);

  const steps = generateSetupSteps();

  /**
   * Track step completion analytics
   */
  const trackStepCompletion = useCallback((stepId: string, success: boolean) => {
    const endTime = Date.now();
    
    setAnalytics(prev => ({
      ...prev,
      stepMetrics: [
        ...prev.stepMetrics.filter(m => m.stepId !== stepId),
        {
          stepId,
          startTime: stepStartTime.current,
          endTime,
          completionRate: success ? 1 : 0,
          errorCount: success ? 0 : 1,
          retryCount: retryCount.current
        }
      ]
    }));
    
    // Reset for next step
    stepStartTime.current = Date.now();
    retryCount.current = 0;
  }, []);

  /**
   * Validate current step
   */
  const validateStep = useCallback(async (stepId: string): Promise<ValidationResult> => {
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      return { isValid: false, errors: ['Step not found'] };
    }

    const stepData = setupData.stepData[stepId] || {};
    
    // Basic validation based on step type
    switch (step.type) {
      case 'prerequisites':
         
        const missingPrereqs = integration.prerequisites?.filter(
          prereq => !stepData[prereq]
        ) || [];
        return {
          isValid: missingPrereqs.length === 0,
          errors: missingPrereqs.map(p => `Missing prerequisite: ${p}`)
        };
        
      case 'auth':
        if (integration.authType === 'api_key') {
           
          const apiKey = stepData.apiKey || '';
          const errors: string[] = [];
          
          if (!apiKey) errors.push('API key is required');
          else if (apiKey.length < 10) errors.push('API key appears too short');
          
          return { isValid: errors.length === 0, errors };
        }
        return { isValid: !!stepData.authorized, errors: [] };
        
      case 'permissions':
         
        const selectedPermissions = Object.values(setupData.permissions).filter(Boolean);
        return {
          isValid: selectedPermissions.length > 0,
          errors: selectedPermissions.length === 0 ? ['Select at least one permission'] : []
        };
        
      default:
        return { isValid: true, errors: [] };
    }
  }, [steps, setupData, integration]);

  /**
   * Move to next step with validation
   */
  const nextStep = useCallback(async () => {
    const currentStepData = steps[currentStep];
    
    if (currentStepData.validation?.required) {
      const validation = await validateStep(currentStepData.id);
      if (!validation.isValid) {
        const error: IntegrationError = {
          code: 'VALIDATION_FAILED',
          message: validation.errors.join(', '),
          category: 'validation',
          severity: 'medium',
          retryable: true,
          timestamp: new Date().toISOString()
        };
        setErrors(prev => [...prev, error]);
        return;
      }
    }
    
    // Mark current step as completed and track analytics
    trackStepCompletion(currentStepData.id, true);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps, validateStep, trackStepCompletion]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  /**
   * Skip optional step
   */
  const skipStep = useCallback(() => {
    const currentStepData = steps[currentStep];
    if (currentStepData.canSkip) {
      trackStepCompletion(currentStepData.id, true);
      nextStep();
    }
  }, [currentStep, steps, nextStep, trackStepCompletion]);

  /**
   * Retry current step
   */
  const retryStep = useCallback(() => {
    retryCount.current += 1;
    setErrors([]);
    setConnectionStatus('idle');
    
    // Track retry in setup data
    setSetupData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        retryCount: prev.metadata.retryCount + 1
      }
    }));
  }, []);

  /**
   * Reset entire setup
   */
  const resetSetup = useCallback(() => {
    setCurrentStep(0);
    setSetupData({
      integrationId: integration.id,
      stepData: {},
      permissions: {},
      configuration: integration.defaultConfig || {},
      metadata: {
        startTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        retryCount: 0,
        errors: []
      }
    });
    setErrors([]);
    setConnectionStatus('idle');
    stepStartTime.current = Date.now();
    retryCount.current = 0;
  }, [integration]);

  /**
   * Complete setup process
   */
  const completeSetup = useCallback(async () => {
    setIsConnecting(true);
    setConnectionStatus('testing');
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus('success');
      setAnalytics(prev => ({
        ...prev,
        completionStatus: 'completed',
        totalDuration: Date.now() - new Date(setupData.metadata.startTime).getTime()
      }));
      
      trackStepCompletion('success', true);
      
    } catch (error) {
      const integrationError: IntegrationError = {
        code: 'SETUP_FAILED',
        message: error instanceof Error ? error.message : 'Setup failed',
        category: 'server',
        severity: 'high',
        retryable: true,
        timestamp: new Date().toISOString()
      };
      
      setErrors(prev => [...prev, integrationError]);
      setConnectionStatus('error');
      setAnalytics(prev => ({ ...prev, completionStatus: 'error' }));
    } finally {
      setIsConnecting(false);
    }
  }, [setupData, trackStepCompletion]);

  /**
   * Calculate progress percentage
   */
  const getStepProgress = useCallback((): number => {
    return Math.round(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

  /**
   * Calculate estimated time remaining
   */
  const getEstimatedTimeRemaining = useCallback((): string => {
    const remainingSteps = steps.slice(currentStep + 1);
    const totalMinutes = remainingSteps.reduce((acc, step) => {
      const minutes = parseInt(step.estimatedTime?.match(/\d+/)?.[0] || '0');
      return acc + minutes;
    }, 0);
    
    if (totalMinutes === 0) return '0 min';
    if (totalMinutes === 1) return '1 min';
    return `${totalMinutes} min`;
  }, [currentStep, steps]);

  /**
   * Check if can proceed to next step
   */
  const canProceed = useCallback((): boolean => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return false;
    
    // For required steps, we need validation
    if (currentStepData.validation?.required) {
      // This would need to be async in real implementation
      return errors.length === 0;
    }
    
    return true;
  }, [currentStep, steps, errors]);

  // Track step changes
  useEffect(() => {
    stepStartTime.current = Date.now();
  }, [currentStep]);

  return {
    currentStep,
    steps,
    setupData,
    isConnecting,
    connectionStatus,
    errors,
    analytics,
    
    // Actions
    nextStep,
    previousStep,
    skipStep,
    retryStep,
    validateStep,
    resetSetup,
    completeSetup,
    
    // Utilities
    getStepProgress,
    getEstimatedTimeRemaining,
    canProceed
  };
}; 