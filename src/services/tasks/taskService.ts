import { supabase } from '@/lib/supabase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  createdby: string;
  createdat: string;
  updatedat: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
  subtasks?: Task[];
}

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

class TaskService {
  private tableName = 'tasks';

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...task,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to create task: ', error);
      throw error;
    }
  }

  async getTasks(userId: string, filter?: TaskFilter): Promise<Task[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });

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

      return filteredData;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get tasks: ', error);
      throw error;
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get task: ', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updatedat: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to update task: ', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to delete task: ', error);
      throw error;
    }
  }

  async getTaskMetrics(userId: string): Promise<TaskMetrics> {
    try {
      const tasks = await this.getTasks(userId);
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const overdueTasks = tasks.filter(task => {
        if (task.status === 'completed' || !task.due_date) return false;
        return new Date(task.due_date) < new Date();
      }).length;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100: 0;

      // Calculate average completion time (simplified)
      const completedTaskTimes = tasks
        .filter(task => task.status === 'completed')
        .map(task => {
          const created = new Date(task.created_at);
          const updated = new Date(task.updated_at);
          return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
        });

      const averageCompletionTime = completedTaskTimes.length > 0 
        ? completedTaskTimes.reduce((sum, time) => sum + time, 0) / completedTaskTimes.length: 0;

      return {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get task metrics: ', error);
      throw error;
    }
  }

  async getTasksByPriority(userId: string): Promise<{
    urgent: Task[];
    high: Task[];
    medium: Task[];
    low: Task[];
  }> {
    try {
      const tasks = await this.getTasks(userId);
      
      return {
        urgent: tasks.filter(task => task.priority === 'urgent'),
        high: tasks.filter(task => task.priority === 'high'),
        medium: tasks.filter(task => task.priority === 'medium'),
        low: tasks.filter(task => task.priority === 'low')
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get tasks by priority: ', error);
      throw error;
    }
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const tasks = await this.getTasks(userId);
      
      return tasks.filter(task => {
        if (task.status === 'completed' || !task.due_date) return false;
        return new Date(task.due_date) < new Date();
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get overdue tasks: ', error);
      throw error;
    }
  }

  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    try {
      const tasks = await this.getTasks(userId);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return tasks.filter(task => {
        if (task.status === 'completed' || !task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate <= futureDate && dueDate >= new Date();
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get upcoming tasks: ', error);
      throw error;
    }
  }

  async createSubtask(parentTaskId: string, subtask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'parent_task_id'>): Promise<Task> {
    try {
      return await this.createTask({
        ...subtask,
        parenttask_id: parentTaskId
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to create subtask: ', error);
      throw error;
    }
  }

  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get subtasks: ', error);
      throw error;
    }
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updatedat: new Date().toISOString()
        })
        .in('id', taskIds);

      if (error) throw error;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to bulk update tasks: ', error);
      throw error;
    }
  }
}

export const taskService = new TaskService(); 