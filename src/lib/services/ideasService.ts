/**
 * @file ideasService.ts
 * @description Service for managing ideas.
 * 
 * This service acts as a dedicated interface for all idea-related operations,
 * serving as a wrapper around the more general thoughtsService. It ensures that
 * all interactions with the backend for ideas are handled consistently.
 */

import { thoughtsService } from './thoughtsService';
import type { Thought, CreateThoughtRequest } from '../types/thoughts';

export interface Idea {
  id: string;
  text: string;
  date: string; // This will be a formatted string for display
}

const mapThoughtToIdea = (thought: Thought): Idea => ({
  id: thought.id,
  text: thought.content,
  // A simple date formatting for now. Can be improved with a library like date-fns.
  date: new Date(thought.created_at).toLocaleDateString(),
});

class IdeasService {
  /**
   * Fetches all thoughts that are categorized as ideas.
   * 
   * @returns {Promise<Idea[]>} A promise that resolves to an array of ideas.
   */
  async getIdeas(): Promise<Idea[]> {
    const { data: { user } } = await import('../core/supabase').then(m => m.supabase.auth.getUser());
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: thoughts, error } = await import('../core/supabase').then(m => m.supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'idea')
        .order('created_at', { ascending: false })
    );
    
    if (error) {
      throw new Error(`Failed to get ideas: ${error.message}`);
    }

    return thoughts.map(mapThoughtToIdea);
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