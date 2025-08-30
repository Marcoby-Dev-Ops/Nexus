/**
 * Execution Service Hook
 * Provides easy access to execution service functionality in React components
 */

import { useState, useCallback } from 'react';
import { executionService } from '@/core/services/ExecutionService';
import type { 
  ExecutionRequest, 
  ExecutionResult, 
  ProcessDefinition 
} from '@/core/services/ExecutionService';
import { useNotification } from './useNotification';

export interface UseExecutionServiceReturn {
  // State
  isExecuting: boolean;
  currentExecution: ExecutionResult | null;
  error: string | null;
  
  // Actions
  executeProcess: (request: ExecutionRequest) => Promise<ExecutionResult | null>;
  getExecutionStatus: (executionId: string) => Promise<ExecutionResult | null>;
  cancelExecution: (executionId: string) => Promise<boolean>;
  registerProcess: (definition: ProcessDefinition) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for using the execution service
 */
export function useExecutionService(): UseExecutionServiceReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  /**
   * Execute a business process
   */
  const executeProcess = useCallback(async (request: ExecutionRequest): Promise<ExecutionResult | null> => {
    try {
      setIsExecuting(true);
      setError(null);
      
      const result = await executionService.executeProcess(request);
      
      if (result.error) {
        setError(result.error);
        showNotification({
          type: 'error',
          title: 'Execution Failed',
          message: result.error
        });
        return null;
      }
      
      setCurrentExecution(result.data);
      showNotification({
        type: 'success',
        title: 'Process Executed',
        message: `Process ${request.processId} completed successfully`
      });
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Execution Error',
        message: errorMessage
      });
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [showNotification]);

  /**
   * Get execution status
   */
  const getExecutionStatus = useCallback(async (executionId: string): Promise<ExecutionResult | null> => {
    try {
      setError(null);
      
      const result = await executionService.getExecutionStatus(executionId);
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      if (result.data) {
        setCurrentExecution(result.data);
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Cancel an execution
   */
  const cancelExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await executionService.cancelExecution(executionId);
      
      if (result.error) {
        setError(result.error);
        showNotification({
          type: 'error',
          title: 'Cancel Failed',
          message: result.error
        });
        return false;
      }
      
      showNotification({
        type: 'success',
        title: 'Execution Cancelled',
        message: 'Process execution has been cancelled'
      });
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Cancel Error',
        message: errorMessage
      });
      return false;
    }
  }, [showNotification]);

  /**
   * Register a process definition
   */
  const registerProcess = useCallback(async (definition: ProcessDefinition): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await executionService.registerProcess(definition);
      
      if (result.error) {
        setError(result.error);
        showNotification({
          type: 'error',
          title: 'Registration Failed',
          message: result.error
        });
        return false;
      }
      
      showNotification({
        type: 'success',
        title: 'Process Registered',
        message: `Process ${definition.name} has been registered successfully`
      });
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Registration Error',
        message: errorMessage
      });
      return false;
    }
  }, [showNotification]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setIsExecuting(false);
    setCurrentExecution(null);
    setError(null);
  }, []);

  return {
    // State
    isExecuting,
    currentExecution,
    error,
    
    // Actions
    executeProcess,
    getExecutionStatus,
    cancelExecution,
    registerProcess,
    
    // Utilities
    clearError,
    reset
  };
}

/**
 * Hook for executing a specific process with automatic status polling
 */
export function useProcessExecution(processId: string) {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const executionService = useExecutionService();

  /**
   * Start execution with automatic polling
   */
  const startExecution = useCallback(async (request: Omit<ExecutionRequest, 'processId'>) => {
    const fullRequest: ExecutionRequest = {
      ...request,
      processId
    };

    const result = await executionService.executeProcess(fullRequest);
    
    if (result) {
      setExecutionId(result.executionId);
      
      // Start polling for status updates
      const interval = setInterval(async () => {
        const status = await executionService.getExecutionStatus(result.executionId);
        if (status && ['completed', 'failed', 'cancelled'].includes(status.status)) {
          clearInterval(interval);
          setPollingInterval(null);
        }
      }, 2000); // Poll every 2 seconds
      
      setPollingInterval(interval);
    }
    
    return result;
  }, [processId, executionService]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  /**
   * Cancel execution and stop polling
   */
  const cancelExecution = useCallback(async () => {
    if (executionId) {
      await executionService.cancelExecution(executionId);
      stopPolling();
    }
  }, [executionId, executionService, stopPolling]);

  return {
    ...executionService,
    executionId,
    startExecution,
    stopPolling,
    cancelExecution
  };
}
