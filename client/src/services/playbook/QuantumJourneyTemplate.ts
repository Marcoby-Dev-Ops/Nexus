/**
 * Quantum Building Blocks Journey Template
 * 
 * Defines the journey template for the quantum building blocks setup process.
 * This converts the standalone QuantumOnboardingFlow into a proper journey.
 */

import { JourneyTemplate, JourneyItem } from './JourneyTypes';
import { getAllQuantumBlocks } from '@/core/config/quantumBusinessModel';

/**
 * Quantum Building Blocks Journey Template
 */
export const QUANTUM_JOURNEY_TEMPLATE: JourneyTemplate = {
  id: 'quantum-building-blocks',
  title: 'Quantum Building Blocks Setup',
  description: 'Configure the 7 fundamental building blocks that compose your business',
  version: '1.0.0',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  playbook_id: 'quantum-business-model',
  estimated_duration_minutes: 60,
  complexity: 'beginner',
  prerequisites: [],
  success_metrics: ['All 7 blocks configured', 'Business identity defined', 'Health scores calculated']
};

/**
 * Generate journey items for the quantum building blocks journey
 */
export function generateQuantumJourneyItems(): JourneyItem[] {
  const quantumBlocks = getAllQuantumBlocks();
  
  const items: JourneyItem[] = [
    // Introduction step
    {
      id: 'quantum-intro',
      title: 'Welcome to Your Business Foundation',
      description: 'Introduction to the 7 quantum building blocks approach',
      type: 'step',
      order: 1,
      is_required: true,
      estimated_duration_minutes: 5,
      component_name: 'QuantumIntroStep',
      validation_schema: {},
      metadata: {
        step_type: 'introduction',
        show_progress: true
      }
    },
    
    // Business Identity step
    {
      id: 'business-identity',
      title: 'Define Your Business Identity',
      description: 'Establish your vision, mission, and unique value proposition',
      type: 'step',
      order: 2,
      is_required: true,
      estimated_duration_minutes: 15,
      component_name: 'IdentitySetupChat',
      validation_schema: {
        mission: { type: 'string', required: true, minLength: 10 },
        vision: { type: 'string', required: true, minLength: 10 },
        values: { type: 'array', required: true, minItems: 1 }
      },
      metadata: {
        step_type: 'identity',
        chat_interface: true,
        show_progress: true
      }
    }
  ];

  // Add quantum blocks as individual steps
  quantumBlocks.forEach((block, index) => {
    items.push({
      id: `block-${block.id}`,
      title: `Configure ${block.name}`,
      description: block.description,
      type: 'step',
      order: index + 3, // +3 because we have intro and identity first
      is_required: true,
      estimated_duration_minutes: 10,
      component_name: 'QuantumBlockStep',
      validation_schema: {
        properties: { type: 'object', required: true },
        strength: { type: 'number', required: true, min: 1, max: 100 },
        health: { type: 'number', required: true, min: 1, max: 100 }
      },
      metadata: {
        step_type: 'block_configuration',
        block_id: block.id,
        block_name: block.name,
        block_description: block.description,
        block_icon: block.icon.name,
        block_properties: block.properties,
        block_ai_capabilities: block.aiCapabilities,
        show_progress: true
      }
    });
  });

  // Summary step
  items.push({
    id: 'quantum-summary',
    title: 'Your Business Snapshot',
    description: 'Review your business configuration and get recommendations',
    type: 'milestone',
    order: quantumBlocks.length + 3,
    is_required: true,
    estimated_duration_minutes: 10,
    component_name: 'QuantumSummaryStep',
    validation_schema: {},
    metadata: {
      step_type: 'summary',
      show_progress: true,
      is_completion_step: true
    }
  });

  return items;
}

/**
 * Get the complete quantum journey template with items
 */
export function getQuantumJourneyTemplate() {
  return {
    template: QUANTUM_JOURNEY_TEMPLATE,
    items: generateQuantumJourneyItems()
  };
}
