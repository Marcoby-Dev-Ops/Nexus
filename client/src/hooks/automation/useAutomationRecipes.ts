import { useState, useEffect, useCallback } from 'react';
import { automationRecipeEngine } from '@/services/automation/automationRecipeEngine';
import type { AutomationRecipe, RecipeDeployment, RecipeExecutionResult } from '@/services/automation/automationRecipeEngine';
import { useAuth } from '@/hooks/index';
import { toast } from 'sonner';

export interface UseAutomationRecipesOptions {
  category?: 'sales' | 'marketing' | 'finance' | 'operations' | 'customer_success';
  autoLoad?: boolean;
}

export interface UseAutomationRecipesReturn {
  // Data
  recipes: AutomationRecipe[];
  deployments: RecipeDeployment[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadRecipes: () => Promise<void>;
  loadDeployments: () => Promise<void>;
  deployRecipe: (recipeId: string, customizations?: Record<string, unknown>) => Promise<RecipeExecutionResult>;
  toggleDeployment: (deploymentId: string, action: 'pause' | 'resume') => Promise<boolean>;
  getRecipesByCategory: (category: string) => AutomationRecipe[];
  getRecipe: (recipeId: string) => AutomationRecipe | null;
  
  // Utilities
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export function useAutomationRecipes(options: UseAutomationRecipesOptions = {}): UseAutomationRecipesReturn {
  const { user } = useAuth();
  const { category } = options;
  
  const [recipes, setRecipes] = useState<AutomationRecipe[]>([]);
  const [deployments, setDeployments] = useState<RecipeDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedRecipes = category 
        ? await automationRecipeEngine.getRecipesByCategory(category)
        : await automationRecipeEngine.getAvailableRecipes();
      
      setRecipes(loadedRecipes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to load recipes';
      setError(errorMessage);
       
     
    // eslint-disable-next-line no-console
    console.error('Error loading recipes: ', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const loadDeployments = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userDeployments = await automationRecipeEngine.getUserDeployments(user.id);
      setDeployments(userDeployments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to load deployments';
      setError(errorMessage);
       
     
    // eslint-disable-next-line no-console
    console.error('Error loading deployments: ', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deployRecipe = useCallback(async (
    recipeId: string, 
    customizations: Record<string, unknown> = {}
  ): Promise<RecipeExecutionResult> => {
    if (!user) {
      const result = { success: false, error: 'User not authenticated' };
      setError(result.error);
      return result;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await automationRecipeEngine.deployRecipe(recipeId, customizations, user.id);
      
      if (result.success) {
        // Refresh deployments to show the new one
        await loadDeployments();
        
        toast.success('Recipe Deployed', {
          description: 'Your automation recipe has been successfully deployed!'
        });
      } else {
        setError(result.error || 'Deployment failed');
        toast.error('Deployment Failed', {
          description: result.error || 'Failed to deploy recipe'
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Deployment error';
      setError(errorMessage);
       
     
    // eslint-disable-next-line no-console
    console.error('Error deploying recipe: ', err);
      
      toast.error('Deployment Error', {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, loadDeployments]);

  const toggleDeployment = useCallback(async (
    deploymentId: string, 
    action: 'pause' | 'resume'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await automationRecipeEngine.toggleDeployment(deploymentId, action);
      
      if (success) {
        // Refresh deployments to show updated status
        await loadDeployments();
        
        toast.success(`Deployment ${action}d`, {
          description: `Automation has been ${action}d successfully.`
        });
      } else {
        setError(`Failed to ${action} deployment`);
        toast.error(`${action} Failed`, {
          description: `Failed to ${action} the deployment.`
        });
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: `Failed to ${action} deployment`;
      setError(errorMessage);
       
     
    // eslint-disable-next-line no-console
    console.error(`Error ${action}ing deployment: `, err);
      
      toast.error(`${action} Error`, {
        description: errorMessage
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadDeployments]);

  const getRecipesByCategory = useCallback((categoryFilter: string): AutomationRecipe[] => {
    if (categoryFilter === 'all') {
      return recipes;
    }
    return recipes.filter(recipe => recipe.category === categoryFilter);
  }, [recipes]);

  const getRecipe = useCallback((recipeId: string): AutomationRecipe | null => {
    return recipes.find(recipe => recipe.id === recipeId) || null;
  }, [recipes]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadRecipes(),
      loadDeployments()
    ]);
  }, [loadRecipes, loadDeployments]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadRecipes();
    }
  }, [autoLoad, loadRecipes]);

  // Load deployments when user changes
  useEffect(() => {
    if (user && autoLoad) {
      loadDeployments();
    }
  }, [user, autoLoad, loadDeployments]);

  return {
    // Data
    recipes,
    deployments,
    loading,
    error,
    
    // Actions
    loadRecipes,
    loadDeployments,
    deployRecipe,
    toggleDeployment,
    getRecipesByCategory,
    getRecipe,
    
    // Utilities
    clearError,
    refreshAll
  };
} 
