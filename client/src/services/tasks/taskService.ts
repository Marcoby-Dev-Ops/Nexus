import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/database';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class TaskService extends BaseService {
  /**
   * Get all tasks for a user
   */
  async getTasks(userId: string): Promise<ServiceResponse<Task[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('tasks', '*', { created_by: userId });
        return { data: data as Task[], error };
      },
      'getTasks'
    );
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(taskId: string): Promise<ServiceResponse<Task>> {
    const validation = this.validateIdParam(taskId, 'taskId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await selectOne('tasks', taskId);
        return { data: data as Task, error };
      },
      'getTaskById'
    );
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Task>> {
    const validation = this.validateRequiredParam(taskData.title, 'title');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    const userIdValidation = this.validateIdParam(taskData.created_by, 'created_by');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await insertOne('tasks', taskData);
        return { data: data as Task, error };
      },
      'createTask'
    );
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<ServiceResponse<Task>> {
    const validation = this.validateIdParam(taskId, 'taskId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await updateOne('tasks', taskId, updates);
        return { data: data as Task, error };
      },
      'updateTask'
    );
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(taskId, 'taskId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { error } = await deleteOne('tasks', taskId);
        return { data: !error, error };
      },
      'deleteTask'
    );
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(userId: string, status: Task['status']): Promise<ServiceResponse<Task[]>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const statusValidation = this.validateRequiredParam(status, 'status');
    if (statusValidation) {
      return this.createErrorResponse(statusValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('tasks', '*', { 
          created_by: userId, 
          status 
        });
        return { data: data as Task[], error };
      },
      'getTasksByStatus'
    );
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(userId: string, priority: Task['priority']): Promise<ServiceResponse<Task[]>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const priorityValidation = this.validateRequiredParam(priority, 'priority');
    if (priorityValidation) {
      return this.createErrorResponse(priorityValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('tasks', '*', { 
          created_by: userId, 
          priority 
        });
        return { data: data as Task[], error };
      },
      'getTasksByPriority'
    );
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<ServiceResponse<Task[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const now = new Date().toISOString();
        const { data, error } = await select('tasks', '*', { 
          created_by: userId,
          status: 'pending',
          due_date: { lt: now }
        });
        return { data: data as Task[], error };
      },
      'getOverdueTasks'
    );
  }

  /**
   * Assign a task to a user
   */
  async assignTask(taskId: string, assignedTo: string): Promise<ServiceResponse<Task>> {
    const taskIdValidation = this.validateIdParam(taskId, 'taskId');
    if (taskIdValidation) {
      return this.createErrorResponse(taskIdValidation);
    }

    const assignedToValidation = this.validateIdParam(assignedTo, 'assignedTo');
    if (assignedToValidation) {
      return this.createErrorResponse(assignedToValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await updateOne('tasks', taskId, { assigned_to: assignedTo });
        return { data: data as Task, error };
      },
      'assignTask'
    );
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<ServiceResponse<Task>> {
    const validation = this.validateIdParam(taskId, 'taskId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await updateOne('tasks', taskId, { 
          status: 'completed',
          updated_at: new Date().toISOString()
        });
        return { data: data as Task, error };
      },
      'completeTask'
    );
  }
}

// Export singleton instance
export const taskService = new TaskService(); 
