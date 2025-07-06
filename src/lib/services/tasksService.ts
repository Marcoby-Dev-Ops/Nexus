/**
 * @file tasksService.ts
 * @description Service for managing tasks.
 * 
 * This service acts as a dedicated interface for all task-related operations,
 * serving as a wrapper around the more general thoughtsService. It ensures that
 * all interactions with the backend for tasks are handled consistently and that
 * components remain decoupled from the underlying data structure of "thoughts".
 */

import { thoughtsService } from './thoughtsService';
import { supabase } from '../core/supabase';
import type { Thought } from '../types/thoughts';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low' | 'None';
}

const mapThoughtToTask = (thought: Thought): Task => ({
  id: thought.id,
  title: thought.content,
  completed: thought.status === 'completed',
  priority: thought.main_sub_categories?.includes('high_priority')
    ? 'High'
    : thought.main_sub_categories?.includes('medium_priority')
    ? 'Medium'
    : thought.main_sub_categories?.includes('low_priority')
    ? 'Low'
    : 'None',
});

class TasksService {
  /**
   * Fetches all thoughts that are categorized as tasks.
   * 
   * @returns {Promise<Task[]>} A promise that resolves to an array of tasks.
   */
  async getTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Leveraging thoughtsService to get all thoughts and then filtering for tasks.
    const { thoughts: allThoughts } = await thoughtsService.getThoughts();
    if (!allThoughts) {
      return [];
    }
    const taskThoughts = allThoughts.filter((t: Thought) => t.category === 'task' && t.user_id === user.id);
    
    return taskThoughts.map(mapThoughtToTask);
  }

   /**
   * Toggles the completion status of a task.
   * 
   * @param {string} taskId - The ID of the task to update.
   * @param {boolean} completed - The new completion status.
   * @returns {Promise<Task>} A promise that resolves to the updated task.
   */
  async toggleTaskCompletion(taskId: string, completed: boolean): Promise<Task> {
    const updatedThought = await thoughtsService.updateThought({
      id: taskId,
      status: completed ? 'completed' : 'not_started',
    });
    return mapThoughtToTask(updatedThought);
  }
}

export const tasksService = new TasksService(); 