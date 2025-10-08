import { useState, useEffect, useCallback } from 'react';
import { initializeModule, initializeModules, getAvailableModuleIds, isModuleAvailable } from '@/services/ai/modules/moduleRegistry';
import type { ModuleMetadata } from '@/services/ai/modules/moduleRegistry';

interface ModuleLoaderState {
  loadedModules: ModuleMetadata[];
  loadingModules: string[];
  error: string | null;
  isInitialized: boolean;
}

/**
 * Hook for lazy loading modules on-demand
 * Only loads modules when they're actually needed
 */
export const useModuleLoader = () => {
  const [state, setState] = useState<ModuleLoaderState>({
    loadedModules: [],
    loadingModules: [],
    error: null,
    isInitialized: false
  });

  // Load a single module
  const loadModule = useCallback(async (moduleId: string): Promise<ModuleMetadata | null> => {
    if (!isModuleAvailable(moduleId)) {
      setState(prev => ({
        ...prev,
        error: `Module ${moduleId} is not available`
      }));
      return null;
    }

    // Check if already loaded
    const existingModule = state.loadedModules.find(m => m.id === moduleId);
    if (existingModule) {
      return existingModule;
    }

    // Add to loading state
    setState(prev => ({
      ...prev,
      loadingModules: [...prev.loadingModules, moduleId],
      error: null
    }));

    try {
      const module = await initializeModule(moduleId);
      
      if (module) {
        setState(prev => ({
          ...prev,
          loadedModules: [...prev.loadedModules, module],
          loadingModules: prev.loadingModules.filter(id => id !== moduleId),
          isInitialized: true
        }));
        return module;
      } else {
        setState(prev => ({
          ...prev,
          loadingModules: prev.loadingModules.filter(id => id !== moduleId),
          error: `Failed to load module ${moduleId}`
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingModules: prev.loadingModules.filter(id => id !== moduleId),
        error: `Error loading module ${moduleId}: ${error}`
      }));
      return null;
    }
  }, [state.loadedModules]);

  // Load multiple modules
  const loadModules = useCallback(async (moduleIds: string[]): Promise<ModuleMetadata[]> => {
    const availableModules = moduleIds.filter(id => isModuleAvailable(id));
    
    if (availableModules.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No available modules to load'
      }));
      return [];
    }

    // Add to loading state
    setState(prev => ({
      ...prev,
      loadingModules: [...prev.loadingModules, ...availableModules],
      error: null
    }));

    try {
      const modules = await initializeModules(availableModules);
      
      setState(prev => ({
        ...prev,
        loadedModules: [...prev.loadedModules, ...modules],
        loadingModules: prev.loadingModules.filter(id => !availableModules.includes(id)),
        isInitialized: true
      }));
      
      return modules;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingModules: prev.loadingModules.filter(id => !availableModules.includes(id)),
        error: `Error loading modules: ${error}`
      }));
      return [];
    }
  }, [state.loadedModules]);

  // Get available module IDs
  const getAvailableModules = useCallback(() => {
    return getAvailableModuleIds();
  }, []);

  // Check if module is loaded
  const isModuleLoaded = useCallback((moduleId: string) => {
    return state.loadedModules.some(m => m.id === moduleId);
  }, [state.loadedModules]);

  // Check if module is loading
  const isModuleLoading = useCallback((moduleId: string) => {
    return state.loadingModules.includes(moduleId);
  }, [state.loadingModules]);

  // Get loaded module
  const getLoadedModule = useCallback((moduleId: string) => {
    return state.loadedModules.find(m => m.id === moduleId);
  }, [state.loadedModules]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    loadedModules: state.loadedModules,
    loadingModules: state.loadingModules,
    error: state.error,
    isInitialized: state.isInitialized,
    
    // Actions
    loadModule,
    loadModules,
    getAvailableModules,
    isModuleLoaded,
    isModuleLoading,
    getLoadedModule,
    clearError
  };
};

/**
 * Hook for loading modules based on user role/department
 */
export const useDepartmentModules = (department?: string) => {
  const { loadModules, loadedModules, loadingModules, error } = useModuleLoader();

  useEffect(() => {
    if (!department) return;

    // Load modules based on department
    const departmentModules: Record<string, string[]> = {
      'sales': ['sales-module'],
      'product': ['product-development-module'],
      'marketing': ['marketing-module'],
      'engineering': ['product-development-module'],
      'finance': ['sales-module'], // Finance might need sales data
      'operations': ['sales-module', 'product-development-module']
    };

    const modulesToLoad = departmentModules[department] || [];
    if (modulesToLoad.length > 0) {
      loadModules(modulesToLoad);
    }
  }, [department, loadModules]);

  return {
    loadedModules,
    loadingModules,
    error
  };
}; 
