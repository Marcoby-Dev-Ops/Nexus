import React from 'react';
import { useModuleLoader, useDepartmentModules } from '@/domains/ai/hooks/useModuleLoader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, Zap, Users, TrendingUp } from 'lucide-react';

/**
 * Example component showing lazy module loading
 * Only loads modules when they're actually needed
 */
export const LazyModuleExample: React.FC = () => {
  const { 
    loadModule, 
    loadModules, 
    loadedModules, 
    loadingModules, 
    error, 
    isModuleLoaded, 
    isModuleLoading,
    getAvailableModules 
  } = useModuleLoader();

  const availableModules = getAvailableModules();

  const handleLoadSalesModule = async () => {
    await loadModule('sales-module');
  };

  const handleLoadProductModule = async () => {
    await loadModule('product-development-module');
  };

  const handleLoadMarketingModule = async () => {
    await loadModule('marketing-module');
  };

  const handleLoadAllModules = async () => {
    await loadModules(['sales-module', 'product-development-module', 'marketing-module']);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Lazy Module Loading Demo
          </CardTitle>
          <CardDescription>
            Modules are only loaded when needed, improving initial page load performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Modules */}
          <div>
            <h3 className="text-sm font-medium mb-2">Available Modules: </h3>
            <div className="flex flex-wrap gap-2">
              {availableModules.map(moduleId => (
                <Badge key={moduleId} variant="outline">
                  {moduleId}
                </Badge>
              ))}
            </div>
          </div>

          {/* Load Individual Modules */}
          <div>
            <h3 className="text-sm font-medium mb-2">Load Individual Modules: </h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleLoadSalesModule}
                disabled={isModuleLoading('sales-module') || isModuleLoaded('sales-module')}
                size="sm"
              >
                {isModuleLoading('sales-module') && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isModuleLoaded('sales-module') ? '✅ Sales' : 'Load Sales'}
              </Button>
              
              <Button 
                onClick={handleLoadProductModule}
                disabled={isModuleLoading('product-development-module') || isModuleLoaded('product-development-module')}
                size="sm"
              >
                {isModuleLoading('product-development-module') && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isModuleLoaded('product-development-module') ? '✅ Product' : 'Load Product'}
              </Button>
              
              <Button 
                onClick={handleLoadMarketingModule}
                disabled={isModuleLoading('marketing-module') || isModuleLoaded('marketing-module')}
                size="sm"
              >
                {isModuleLoading('marketing-module') && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isModuleLoaded('marketing-module') ? '✅ Marketing' : 'Load Marketing'}
              </Button>
            </div>
          </div>

          {/* Load All Modules */}
          <div>
            <Button 
              onClick={handleLoadAllModules}
              disabled={loadingModules.length > 0}
              variant="outline"
            >
              {loadingModules.length > 0 && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Load All Modules
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Loaded Modules Display */}
          {loadedModules.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Loaded Modules: </h3>
              <div className="grid gap-3">
                {loadedModules.map(module => (
                  <Card key={module.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{module.name}</h4>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{module.department}</Badge>
                          <Badge variant="outline">{module.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {module.capabilities.length} capabilities
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {module.performanceMetrics.averageResponseTime}ms avg
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Example component showing department-based module loading
 */
export const DepartmentModuleExample: React.FC<{ department?: string }> = ({ department }) => {
  const { loadedModules, loadingModules, error } = useDepartmentModules(department);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Department Modules: {department || 'None'}
        </CardTitle>
        <CardDescription>
          Automatically loads modules based on user department
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingModules.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading modules for {department}...
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        {loadedModules.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Loaded for {department}:</h4>
            {loadedModules.map(module => (
              <div key={module.id} className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {module.name}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 