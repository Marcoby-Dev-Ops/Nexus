/**
 * Development Domain - Main Index
 * Consolidates all development functionality including tools, resources, and technical guidance
 */

// Development Components
export { ProjectProgressDashboard } from './components/ProjectProgressDashboard';

// Development Types
export interface DevelopmentProject {
  id: string;
  name: string;
  description: string;
  technology: string[];
  status: 'planning' | 'development' | 'testing' | 'deployed';
  progress: number;
  teamSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalResource {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'documentation' | 'tool' | 'template';
  technology: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  usageCount: number;
} 