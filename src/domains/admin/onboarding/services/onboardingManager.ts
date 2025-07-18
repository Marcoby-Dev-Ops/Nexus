/**
 * Onboarding Manager Service
 * Manages the onboarding flow state and progression
 */

import type { OnboardingState, OnboardingStep, UserN8nConfig } from '../types/onboarding';

class OnboardingManager {
  private subscribers: ((state: OnboardingState) => void)[] = [];
  private state: OnboardingState = {
    steps: [
      {
        id: 'welcome',
        title: 'Welcome',
        description: 'Welcome to Nexus',
        completed: false,
        required: true
      },
      {
        id: 'organization-setup',
        title: 'Organization Setup',
        description: 'Set up your organization',
        completed: false,
        required: true
      },
      {
        id: 'integrations-setup',
        title: 'Integrations Setup',
        description: 'Connect your tools',
        completed: false,
        required: false
      },
      {
        id: 'user-context',
        title: 'User Context',
        description: 'Tell us about yourself',
        completed: false,
        required: true
      },
      {
        id: 'business-context',
        title: 'Business Context',
        description: 'Tell us about your business',
        completed: false,
        required: true
      },
      {
        id: 'business-snapshot',
        title: 'Business Snapshot',
        description: 'Current state assessment',
        completed: false,
        required: true
      },
      {
        id: 'success-criteria',
        title: 'Success Criteria',
        description: 'Define your goals',
        completed: false,
        required: true
      },
      {
        id: 'n8n-connection',
        title: 'n8n Connection',
        description: 'Connect your n8n instance',
        completed: false,
        required: false
      },
      {
        id: 'department-setup',
        title: 'Department Setup',
        description: 'Configure departments',
        completed: false,
        required: true
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Finish setup',
        completed: false,
        required: true
      }
    ],
    totalSteps: 10,
    currentStep: 0,
    isComplete: false
  };

  async initialize(): Promise<void> {
    // Load state from localStorage or database
    const savedState = localStorage.getItem('nexus_onboarding_state');
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
      } catch {
        // Use default state if parsing fails
      }
    }
  }

  async getOnboardingState(): Promise<OnboardingState> {
    return this.state;
  }

  async completeStep(stepId: string): Promise<void> {
    this.state.steps = this.state.steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    // Check if all required steps are complete
    const requiredSteps = this.state.steps.filter(step => step.required);
    this.state.isComplete = requiredSteps.every(step => step.completed);
    
    // Save to localStorage
    localStorage.setItem('nexus_onboarding_state', JSON.stringify(this.state));
    
    // Notify subscribers
    this.subscribers.forEach(subscriber => subscriber(this.state));
  }

  async completeN8nConfiguration(config: UserN8nConfig): Promise<boolean> {
    // Save n8n configuration
    localStorage.setItem('nexus_n8n_config', JSON.stringify(config));
    return true;
  }

  async skipN8nConfiguration(): Promise<void> {
    // Mark n8n step as completed without configuration
    await this.completeStep('n8n-connection');
  }

  subscribe(callback: (state: OnboardingState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  resetOnboarding(): void {
    this.state.steps = this.state.steps.map(step => ({ ...step, completed: false }));
    this.state.isComplete = false;
    this.state.currentStep = 0;
    localStorage.removeItem('nexus_onboarding_state');
    localStorage.removeItem('nexus_n8n_config');
  }
}

export const onboardingManager = new OnboardingManager(); 