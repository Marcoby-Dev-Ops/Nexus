import { supabase } from '@/lib/supabase';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { z } from 'zod';

// Task Schema
export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
  createdby: z.string(),
  createdat: z.string().optional(),
  updatedat: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimated_hours: z.number().optional(),
  actual_hours: z.number().optional(),
  parent_task_id: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface TaskFilter {
  status?: string[];
  priority?: string[];
  assigned_to?: string;
  tags?: string[];
  due_date_from?: string;
  due_date_to?: string;
}

/**
 * Task Service
 * Provides task management functionality with CRUD operations
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class TaskService extends BaseService implements CrudServiceInterface<Task> {
  private tableName = 'tasks';

  /**
   * Get a single task by ID
   */
  async get(id: string): Promise<ServiceResponse<Task>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: TaskSchema.parse(data), error: null };
    }, `get task ${id}`);
  }

  /**
   * Create a new task
   */
  async create(data: Partial<Task>): Promise<ServiceResponse<Task>> {
    return this.executeDbOperation(async () => {
      const taskData = {
        ...data,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return { data: TaskSchema.parse(result), error: null };
    }, `create task`);
  }

  /**
   * Update an existing task
   */
  async update(id: string, data: Partial<Task>): Promise<ServiceResponse<Task>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        ...data,
        updatedat: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: TaskSchema.parse(result), error: null };
    }, `update task ${id}`);
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    }, `delete task ${id}`);
  }

  /**
   * List tasks with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<Task[]>> {
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('createdat', { ascending: false });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      const validatedData = data?.map(item => TaskSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `list tasks`);
  }

  /**
   * Get tasks for a specific user with filters
   */
  async getTasks(userId: string, filter?: TaskFilter): Promise<ServiceResponse<Task[]>> {
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .or(`createdby.eq.${userId},assigned_to.eq.${userId}`)
        .order('createdat', { ascending: false });

      // Apply filters
      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.priority && filter.priority.length > 0) {
        query = query.in('priority', filter.priority);
      }

      if (filter?.assigned_to) {
        query = query.eq('assigned_to', filter.assigned_to);
      }

      if (filter?.due_date_from) {
        query = query.gte('due_date', filter.due_date_from);
      }

      if (filter?.due_date_to) {
        query = query.lte('due_date', filter.due_date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by tags if specified
      let filteredData = data || [];
      if (filter?.tags && filter.tags.length > 0) {
        filteredData = filteredData.filter(task => 
          task.tags && filter.tags!.some(tag => task.tags!.includes(tag))
        );
      }

      const validatedData = filteredData.map(item => TaskSchema.parse(item));
      return { data: validatedData, error: null };
    }, `get tasks for user ${userId}`);
  }

  /**
   * Get task metrics for a user
   */
  async getTaskMetrics(userId: string): Promise<ServiceResponse<TaskMetrics>> {
    return this.executeDbOperation(async () => {
      const { data: tasks, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`createdby.eq.${userId},assigned_to.eq.${userId}`);

      if (error) throw error;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(task => {
        if (!task.due_date || task.status === 'completed') return false;
        return new Date(task.due_date) < new Date();
      }).length || 0;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time
      const completedTaskTimes = tasks
        ?.filter(task => task.status === 'completed' && task.createdat && task.updatedat)
        .map(task => {
          const created = new Date(task.createdat);
          const updated = new Date(task.updatedat);
          return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
        }) || [];

      const averageCompletionTime = completedTaskTimes.length > 0 
        ? completedTaskTimes.reduce((sum, time) => sum + time, 0) / completedTaskTimes.length 
        : 0;

      const metrics: TaskMetrics = {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime
      };

      return { data: metrics, error: null };
    }, `get task metrics for user ${userId}`);
  }

  /**
   * Get tasks grouped by priority
   */
  async getTasksByPriority(userId: string): Promise<ServiceResponse<{
    urgent: Task[];
    high: Task[];
    medium: Task[];
    low: Task[];
  }>> {
    return this.executeDbOperation(async () => {
      const { data: tasks, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`createdby.eq.${userId},assigned_to.eq.${userId}`)
        .order('createdat', { ascending: false });

      if (error) throw error;

      const validatedTasks = tasks?.map(item => TaskSchema.parse(item)) || [];
      
      const grouped = {
        urgent: validatedTasks.filter(task => task.priority === 'urgent'),
        high: validatedTasks.filter(task => task.priority === 'high'),
        medium: validatedTasks.filter(task => task.priority === 'medium'),
        low: validatedTasks.filter(task => task.priority === 'low')
      };

      return { data: grouped, error: null };
    }, `get tasks by priority for user ${userId}`);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<ServiceResponse<Task[]>> {
    return this.executeDbOperation(async () => {
      const { data: tasks, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`createdby.eq.${userId},assigned_to.eq.${userId}`)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const validatedTasks = tasks?.map(item => TaskSchema.parse(item)) || [];
      return { data: validatedTasks, error: null };
    }, `get overdue tasks for user ${userId}`);
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<ServiceResponse<Task[]>> {
    return this.executeDbOperation(async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data: tasks, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`createdby.eq.${userId},assigned_to.eq.${userId}`)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', endDate.toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const validatedTasks = tasks?.map(item => TaskSchema.parse(item)) || [];
      return { data: validatedTasks, error: null };
    }, `get upcoming tasks for user ${userId}`);
  }

  /**
   * Create a subtask
   */
  async createSubtask(parentTaskId: string, subtask: Omit<Task, 'id' | 'createdat' | 'updatedat' | 'parent_task_id'>): Promise<ServiceResponse<Task>> {
    return this.executeDbOperation(async () => {
      const subtaskData = {
        ...subtask,
        parent_task_id: parentTaskId,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(subtaskData)
        .select()
        .single();

      if (error) throw error;
      return { data: TaskSchema.parse(result), error: null };
    }, `create subtask for task ${parentTaskId}`);
  }

  /**
   * Get subtasks for a parent task
   */
  async getSubtasks(parentTaskId: string): Promise<ServiceResponse<Task[]>> {
    return this.executeDbOperation(async () => {
      const { data: tasks, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('createdat', { ascending: true });

      if (error) throw error;

      const validatedTasks = tasks?.map(item => TaskSchema.parse(item)) || [];
      return { data: validatedTasks, error: null };
    }, `get subtasks for task ${parentTaskId}`);
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        ...updates,
        updatedat: new Date().toISOString()
      };

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .in('id', taskIds);

      if (error) throw error;
      return { data: true, error: null };
    }, `bulk update ${taskIds.length} tasks`);
  }
}

export const taskService = new TaskService(); 
