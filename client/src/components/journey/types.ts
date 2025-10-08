/**
 * Journey Step Types
 * 
 * Common interfaces for journey step components.
 */

export interface JourneyStepProps {
  // Common props that all journey steps should have
  stepId: string;
  stepIndex: number;
  totalSteps: number;
  isActive: boolean;
  isCompleted: boolean;
  onStepComplete: (data: any) => void;
  onStepBack: () => void;
  journeyData?: Record<string, any>;
}
