/**
 * Entrepreneur Domain - Main Index
 * Consolidates all entrepreneur-specific functionality including tools, resources, and community features
 */

// Entrepreneur Components
export { InnovatorWelcome } from './components/InnovatorWelcome';
export { VisualBusinessBuilder } from './components/VisualBusinessBuilder';

// Entrepreneur Types
export interface EntrepreneurProfile {
  id: string;
  userId: string;
  businessStage: 'idea' | 'mvp' | 'launch' | 'growth' | 'scale';
  industry: string;
  experience: number;
  goals: string[];
  challenges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessResource {
  id: string;
  title: string;
  description: string;
  type: 'tool' | 'template' | 'guide' | 'community';
  category: string;
  url: string;
  rating: number;
  usageCount: number;
} 