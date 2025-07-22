/**
 * Automation Domain - Main Index
 * Consolidates all automation functionality including workflows, triggers, and monitoring
 */

// Automation Components
export * from './components';

// Automation Services
export { n8nService } from './services/n8nService';
export { AutomationTemplateImporter } from './services/templateImporter';
export { automationRecipeEngine } from './services/automationRecipeEngine';
export { intelligentSystemEvolution } from './services/intelligentSystemEvolution';
export { businessProcessMining } from './services/businessProcessMining';
export { N8nWorkflowBuilder } from './services/n8nWorkflowBuilder';

// Automation Hooks
export * from './hooks';

// Automation Pages
export * from './pages';

// Automation Types
export interface AutomationConfig {
  enableWorkflows: boolean;
  enableTriggers: boolean;
  enableMonitoring: boolean;
  maxWorkflows: number;
} 