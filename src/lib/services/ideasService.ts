/**
 * @file ideasService.ts
 * @description Service for managing ideas.
 * 
 * This service acts as a dedicated interface for all idea-related operations,
 * serving as a wrapper around the more general thoughtsService. It ensures that
 * all interactions with the backend for ideas are handled consistently.
 */

import { thoughtsService } from './thoughtsService';
import { supabase } from '../core/supabase';
import type { Thought, CreateThoughtRequest } from '../types/thoughts';

export interface Idea {
  id: string;
  text: string;
  date: string; // This will be a formatted string for display
  category?: string; // New property for categorizing ideas
  priority?: 'high' | 'medium' | 'low'; // New property for priority
  estimatedImpact?: string; // New property for estimated impact
}

const mapThoughtToIdea = (thought: Thought): Idea => ({
  id: thought.id,
  text: thought.content,
  // A simple date formatting for now. Can be improved with a library like date-fns.
  date: new Date(thought.created_at).toLocaleDateString(),
  category: thought.main_sub_categories?.[0] || 'general',
  priority: thought.main_sub_categories?.includes('high_priority') ? 'high' : 
           thought.main_sub_categories?.includes('medium_priority') ? 'medium' : 'low',
  estimatedImpact: thought.ai_insights?.estimatedImpact as string || undefined,
});

class IdeasService {
  /**
   * Fetches all thoughts that are categorized as ideas.
   * 
   * @returns {Promise<Idea[]>} A promise that resolves to an array of ideas.
   */
  async getIdeas(): Promise<Idea[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const { thoughts: allThoughts } = await thoughtsService.getThoughts({ category: ['idea'] });
    if (!allThoughts) {
      return [];
    }

    const userIdeas = allThoughts.filter(t => t.user_id === user?.id);

    return userIdeas.map(mapThoughtToIdea);
  }

  /**
   * Creates a new idea.
   * 
   * @param {string} ideaText - The content of the new idea.
   * @returns {Promise<Idea>} A promise that resolves to the newly created idea.
   */
  async createIdea(ideaText: string): Promise<Idea> {
    const request: CreateThoughtRequest = {
      content: ideaText,
      category: 'idea',
      status: 'concept',
      personal_or_professional: 'personal', // Defaulting, could be made dynamic
    };
    const newThought = await thoughtsService.createThought(request);
    return mapThoughtToIdea(newThought);
  }
}

export const ideasService = new IdeasService(); 