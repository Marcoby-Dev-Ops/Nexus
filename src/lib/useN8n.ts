/**
 * useN8n.ts
 * React hook for integrating n8n workflows into Nexus components
 * Provides easy access to department assistants and workflow triggers
 */
import { useState, useCallback, useEffect } from 'react';
import { 
  n8nService, 
  chatWithDepartment, 
  generateWorkflow, 
  createContent 
} from './n8nService';
import type { N8nResponse, Department } from './n8nService';

export interface UseN8nOptions {
  department?: Department;
  autoHealthCheck?: boolean;
}

export interface UseN8nReturn {
  // State
  isLoading: boolean;
  isConnected: boolean;
  lastResponse: N8nResponse | null;
  error: string | null;
  
  // Actions
  chat: (message: string, context?: Record<string, any>) => Promise<N8nResponse>;
  triggerWorkflow: (webhookId: string, data: Record<string, any>) => Promise<N8nResponse>;
  generateWorkflow: (requirements: string) => Promise<N8nResponse>;
  createContent: (type: 'blog' | 'social' | 'email', prompt: string, options?: Record<string, any>) => Promise<N8nResponse>;
  salesAction: (action: 'pipeline' | 'lead' | 'forecast', data: Record<string, any>) => Promise<N8nResponse>;
  financeAction: (action: 'invoice' | 'report' | 'payment', data: Record<string, any>) => Promise<N8nResponse>;
  operationsAction: (action: 'automate' | 'monitor' | 'deploy', data: Record<string, any>) => Promise<N8nResponse>;
  
  // Utilities
  clearError: () => void;
  checkHealth: () => Promise<boolean>;
}

/**
 * Main hook for n8n integration
 */
export function useN8n(options: UseN8nOptions = {}): UseN8nReturn {
  const { department = 'general', autoHealthCheck = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<N8nResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Health check on mount
  useEffect(() => {
    if (autoHealthCheck) {
      checkHealth();
    }
  }, [autoHealthCheck]);

  const handleResponse = useCallback((response: N8nResponse) => {
    setLastResponse(response);
    if (!response.success) {
      setError(response.error || 'Unknown error occurred');
    } else {
      setError(null);
    }
    setIsLoading(false);
    return response;
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const healthy = await n8nService.healthCheck();
      setIsConnected(healthy);
      return healthy;
    } catch (err) {
      setIsConnected(false);
      setError('Failed to connect to n8n service');
      return false;
    }
  }, []);

  const chat = useCallback(async (message: string, context?: Record<string, any>): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatWithDepartment(department, message, context);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Chat failed'
      };
      return handleResponse(errorResponse);
    }
  }, [department, handleResponse]);

  const triggerWorkflow = useCallback(async (webhookId: string, data: Record<string, any>): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await n8nService.triggerWorkflow(webhookId, data);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Workflow trigger failed'
      };
      return handleResponse(errorResponse);
    }
  }, [handleResponse]);

  const generateWorkflowAction = useCallback(async (requirements: string): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateWorkflow(requirements, department);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Workflow generation failed'
      };
      return handleResponse(errorResponse);
    }
  }, [department, handleResponse]);

  const createContentAction = useCallback(async (
    type: 'blog' | 'social' | 'email',
    prompt: string,
    options?: Record<string, any>
  ): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await createContent(type, prompt, options);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Content creation failed'
      };
      return handleResponse(errorResponse);
    }
  }, [handleResponse]);

  const salesAction = useCallback(async (
    action: 'pipeline' | 'lead' | 'forecast',
    data: Record<string, any>
  ): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await n8nService.salesAction(action, data);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Sales action failed'
      };
      return handleResponse(errorResponse);
    }
  }, [handleResponse]);

  const financeAction = useCallback(async (
    action: 'invoice' | 'report' | 'payment',
    data: Record<string, any>
  ): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await n8nService.financeAction(action, data);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Finance action failed'
      };
      return handleResponse(errorResponse);
    }
  }, [handleResponse]);

  const operationsAction = useCallback(async (
    action: 'automate' | 'monitor' | 'deploy',
    data: Record<string, any>
  ): Promise<N8nResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await n8nService.operationsAction(action, data);
      return handleResponse(response);
    } catch (err) {
      const errorResponse: N8nResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Operations action failed'
      };
      return handleResponse(errorResponse);
    }
  }, [handleResponse]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    isConnected,
    lastResponse,
    error,
    
    // Actions
    chat,
    triggerWorkflow,
    generateWorkflow: generateWorkflowAction,
    createContent: createContentAction,
    salesAction,
    financeAction,
    operationsAction,
    
    // Utilities
    clearError,
    checkHealth
  };
}

/**
 * Specialized hook for department-specific assistants
 */
export function useDepartmentAssistant(department: Department) {
  const n8n = useN8n({ department });
  
  return {
    ...n8n,
    askAssistant: n8n.chat,
    department
  };
}

/**
 * Hook for Pulse Marketplace integration
 */
export function usePulseIntegration() {
  const n8n = useN8n({ department: 'operations' });
  
  const installApp = useCallback(async (appId: string, config: Record<string, any>): Promise<N8nResponse> => {
    const response = await n8nService.installPulseApp(appId, config);
    return response;
  }, []);
  
  return {
    ...n8n,
    installApp
  };
}

/**
 * Hook for content creation workflows
 */
export function useContentCreation() {
  const n8n = useN8n({ department: 'marketing' });
  
  return {
    isLoading: n8n.isLoading,
    error: n8n.error,
    createBlogPost: (prompt: string, options?: Record<string, any>) => 
      n8n.createContent('blog', prompt, options),
    createSocialPost: (prompt: string, options?: Record<string, any>) => 
      n8n.createContent('social', prompt, options),
    createEmail: (prompt: string, options?: Record<string, any>) => 
      n8n.createContent('email', prompt, options),
    clearError: n8n.clearError
  };
}

/**
 * Hook for workflow generation
 */
export function useWorkflowBuilder() {
  const n8n = useN8n({ department: 'operations' });
  
  return {
    isLoading: n8n.isLoading,
    error: n8n.error,
    buildWorkflow: n8n.generateWorkflow,
    clearError: n8n.clearError
  };
} 