/**
 * Journey Types
 * 
 * Type definitions for the journey system to avoid circular dependencies.
 */

export interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Playbook integration
  playbook_id?: string;
  building_blocks?: any[]; // Will be typed properly in the service
  maturity_framework_id?: string;
  estimated_duration_minutes?: number;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  success_metrics?: string[];
}

export interface JourneyItem {
  id: string;
  title: string;
  description: string;
  type: 'step' | 'task' | 'milestone' | 'checklist' | 'building_block';
  order: number;
  is_required: boolean;
  estimated_duration_minutes?: number;
  component_name?: string;
  validation_schema?: Record<string, any>;
  metadata?: Record<string, any>;
  // Playbook integration
  playbook_item_id?: string;
  building_block_id?: string;
  dependencies?: string[];
  maturity_criteria?: string[];
}

export interface UserJourneyProgress {
  id: string;
  user_id: string;
  organization_id: string;
  journey_id: string;
  template_id: string;
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  started_at: string;
  completed_at?: string;
  // Playbook integration
  playbook_progress_id?: string;
  maturity_assessment?: {
    level: number;
    score: number;
    recommendations: string[];
  };
  metadata?: Record<string, any>;
}

export interface JourneyResponse {
  id: string;
  user_id: string;
  organization_id: string;
  journey_id: string;
  step_id: string;
  response_data: Record<string, any>;
  completed_at: string;
  // Playbook integration
  playbook_response_id?: string;
  building_block_data?: Record<string, any>;
}
