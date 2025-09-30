/**
 * MVP Onboarding Journey Template
 * 
 * Defines the journey template for the MVP onboarding flow.
 * This converts the standalone MVPOnboardingFlow into a proper journey.
 */

import type { JourneyTemplate, JourneyItem } from './JourneyTypes';

/**
 * MVP Onboarding Journey Template
 */
export const MVP_JOURNEY_TEMPLATE: JourneyTemplate = {
  id: 'mvp-onboarding',
  title: 'MVP Business Setup',
  description: 'Quick setup to get your business running with Nexus in under 10 minutes',
  version: '1.0.0',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  playbook_id: 'mvp-business-setup',
  estimated_duration_minutes: 10,
  complexity: 'beginner',
  prerequisites: [],
  success_metrics: ['Business profile complete', 'Core integrations setup', 'First automation configured']
};

/**
 * Generate journey items for the MVP onboarding journey
 */
export function generateMVPJourneyItems(): JourneyItem[] {
  const items: JourneyItem[] = [
    // Welcome step
    {
      id: 'mvp-welcome',
      title: 'Welcome to MVP Setup',
      description: 'Quick setup to get your business running with Nexus',
      type: 'step',
      order: 1,
      is_required: true,
      estimated_duration_minutes: 2,
      component_name: 'MVPWelcomeStep',
      metadata: {
        step_type: 'introduction',
        show_progress: true
      }
    },
    
    // Business units step
    {
      id: 'mvp-business-units',
      title: 'Configure Business Units',
      description: 'Select the core business units that apply to your business',
      type: 'step',
      order: 2,
      is_required: true,
      estimated_duration_minutes: 5,
      component_name: 'BusinessUnitsStep',
      validation_schema: {
        businessUnits: { type: 'array', required: true, minItems: 1 }
      },
      metadata: {
        step_type: 'business_units',
        show_progress: true
      }
    },
    
    // Integrations step
    {
      id: 'mvp-integrations',
      title: 'Set Up Core Integrations',
      description: 'Connect essential tools and services for your business',
      type: 'step',
      order: 3,
      is_required: true,
      estimated_duration_minutes: 8,
      component_name: 'IntegrationsStep',
      validation_schema: {
        integrations: { type: 'array', required: false }
      },
      metadata: {
        step_type: 'integrations',
        show_progress: true
      }
    },
    
    // Maturity Assessment step
    {
      id: 'mvp-maturity-assessment',
      title: 'Business Maturity Assessment',
      description: 'Assess your current business maturity level for personalized recommendations',
      type: 'step',
      order: 4,
      is_required: true,
      estimated_duration_minutes: 10,
      component_name: 'MaturityAssessmentStep',
      validation_schema: {
        maturityAssessment: { type: 'object', required: true }
      },
      metadata: {
        step_type: 'maturity_assessment',
        show_progress: true
      }
    },
    
    // Summary step
    {
      id: 'mvp-summary',
      title: 'MVP Setup Summary',
      description: 'Review your setup and get personalized next steps',
      type: 'milestone',
      order: 5,
      is_required: true,
      estimated_duration_minutes: 3,
      component_name: 'MVPSummaryStep',
      metadata: {
        step_type: 'summary',
        show_progress: true,
        is_completion_step: true
      }
    }
  ];

  return items;
}

/**
 * Get the complete MVP journey template with items
 */
export function getMVPJourneyTemplate() {
  return {
    template: MVP_JOURNEY_TEMPLATE,
    items: generateMVPJourneyItems()
  };
}
