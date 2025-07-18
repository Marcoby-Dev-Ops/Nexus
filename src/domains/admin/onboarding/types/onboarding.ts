/**
 * Onboarding types for the Nexus onboarding system
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  totalSteps: number;
  currentStep: number;
  isComplete: boolean;
}

export interface UserN8nConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  isActive: boolean;
  userId: string;
} 