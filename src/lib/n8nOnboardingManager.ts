/**
 * n8nOnboardingManager.ts
 * Manages the n8n onboarding flow and user configuration setup
 * Coordinates between onboarding UI and configuration services
 */
import { userN8nConfigService } from './userN8nConfig';
import type { UserN8nConfig } from './userN8nConfig';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  isComplete: boolean;
  n8nConfigured: boolean;
}

class N8nOnboardingManager {
  private steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Nexus',
      description: 'Get started with AI-powered business automation',
      completed: false,
      required: true
    },
    {
      id: 'n8n-connection',
      title: 'Connect n8n',
      description: 'Connect your n8n instance for powerful workflow automation',
      completed: false,
      required: false
    },
    {
      id: 'department-setup',
      title: 'Configure Departments',
      description: 'Set up your business departments and assistants',
      completed: false,
      required: true
    },
    {
      id: 'complete',
      title: 'Ready to Go!',
      description: 'Your Nexus workspace is configured and ready',
      completed: false,
      required: true
    }
  ];

  private listeners: Array<(state: OnboardingState) => void> = [];

  /**
   * Get current onboarding state
   */
  async getOnboardingState(): Promise<OnboardingState> {
    // Check if n8n is configured
    const hasN8nConfig = await userN8nConfigService.hasConfiguration();
    
    // Update n8n step completion
    const n8nStep = this.steps.find(s => s.id === 'n8n-connection');
    if (n8nStep) {
      n8nStep.completed = hasN8nConfig;
    }

    // Check if onboarding is complete
    const requiredSteps = this.steps.filter(s => s.required);
    const completedRequiredSteps = requiredSteps.filter(s => s.completed);
    const isComplete = completedRequiredSteps.length === requiredSteps.length;

    return {
      currentStep: this.getCurrentStepIndex(),
      totalSteps: this.steps.length,
      steps: [...this.steps],
      isComplete,
      n8nConfigured: hasN8nConfig
    };
  }

  /**
   * Complete a specific step
   */
  async completeStep(stepId: string): Promise<void> {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
      await this.saveOnboardingState();
      this.notifyListeners();
    }
  }

  /**
   * Start n8n configuration flow
   */
  async startN8nConfiguration(): Promise<void> {
    // Mark n8n step as current
    await this.setCurrentStep('n8n-connection');
  }

  /**
   * Complete n8n configuration
   */
  async completeN8nConfiguration(config: UserN8nConfig): Promise<boolean> {
    try {
      // Save the configuration
      const saved = await userN8nConfigService.saveUserConfig({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        instanceName: config.instanceName || 'My n8n Instance',
        isActive: true
      });

      if (saved) {
        await this.completeStep('n8n-connection');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to complete n8n configuration:', error);
      return false;
    }
  }

  /**
   * Skip n8n configuration
   */
  async skipN8nConfiguration(): Promise<void> {
    // Since n8n is optional, we can proceed to next step
    await this.setCurrentStep('department-setup');
  }

  /**
   * Check if user needs onboarding
   */
  async needsOnboarding(): Promise<boolean> {
    const state = await this.getOnboardingState();
    return !state.isComplete;
  }

  /**
   * Reset onboarding (for testing or re-setup)
   */
  async resetOnboarding(): Promise<void> {
    this.steps.forEach(step => {
      step.completed = false;
    });
    await this.saveOnboardingState();
    this.notifyListeners();
  }

  /**
   * Set current step
   */
  private async setCurrentStep(stepId: string): Promise<void> {
    // Implementation would mark the current step
    this.notifyListeners();
  }

  /**
   * Get current step index
   */
  private getCurrentStepIndex(): number {
    const currentStep = this.steps.find(s => !s.completed);
    return currentStep ? this.steps.indexOf(currentStep) : this.steps.length - 1;
  }

  /**
   * Save onboarding state to localStorage
   */
  private async saveOnboardingState(): Promise<void> {
    try {
      const state = {
        steps: this.steps,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('nexus_onboarding_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }

  /**
   * Load onboarding state from localStorage
   */
  private async loadOnboardingState(): Promise<void> {
    try {
      const stored = localStorage.getItem('nexus_onboarding_state');
      if (stored) {
        const state = JSON.parse(stored);
        if (state.steps) {
          // Merge with current steps (in case we've added new steps)
          state.steps.forEach((storedStep: OnboardingStep) => {
            const currentStep = this.steps.find(s => s.id === storedStep.id);
            if (currentStep) {
              currentStep.completed = storedStep.completed;
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  }

  /**
   * Subscribe to onboarding state changes
   */
  subscribe(listener: (state: OnboardingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private async notifyListeners(): Promise<void> {
    const state = await this.getOnboardingState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Initialize the onboarding manager
   */
  async initialize(): Promise<void> {
    await this.loadOnboardingState();
    this.notifyListeners();
  }
}

// Export singleton instance
export const n8nOnboardingManager = new N8nOnboardingManager();

export default n8nOnboardingManager; 