import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/DropdownMenu';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { MoreVertical, Play, TestTube, Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Integration } from '../types/integration';
import { integrationRuntime } from '@/lib/integrationRuntime';

interface IntegrationCardProps {
  integration: Integration;
  onTest?: (integration: Integration) => void;
  onEdit?: (integration: Integration) => void;
  onDelete?: (integration: Integration) => void;
  onActivate?: (integration: Integration) => void;
  onDeactivate?: (integration: Integration) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onTest,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ status: string; responseTime?: number } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'setup':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
      case 'setup':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleTest = async () => {
    if (!integration.id) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      // Try to load and test the integration
      const instance = await integrationRuntime.loadIntegration(integration.id);
      const isConnected = await instance.testConnection();
      
      setTestResult({
        success: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed'
      });

      // Get health status
      const status = await instance.getStatus();
      setHealthStatus({
        status: status.status,
        responseTime: 0 // Would be calculated in real implementation
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async (methodName: string) => {
    if (!integration.id) return;

    setIsLoading(true);
    try {
      const instance = await integrationRuntime.loadIntegration(integration.id);
      
      // For demo purposes, execute a simple method
      if (Object.keys(instance.methods).length > 0) {
        const firstMethod = Object.keys(instance.methods)[0];
        const result = await instance.methods[firstMethod]();
        console.log(`Executed ${firstMethod}:`, result);
      }
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isGenerated = integration.metadata?.generated === true;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {integration.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isGenerated && (
              <Badge variant="secondary" className="text-xs">
                Auto-Generated
              </Badge>
            )}
            <Badge className={`text-xs ${getStatusColor(integration.status)}`}>
              <span className="flex items-center space-x-1">
                {getStatusIcon(integration.status)}
                <span>{integration.status}</span>
              </span>
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTest()}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </DropdownMenuItem>
                {isGenerated && (
                  <DropdownMenuItem onClick={() => handleExecute('demo')}>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Method
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit?.(integration)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                {integration.status === 'active' ? (
                  <DropdownMenuItem onClick={() => onDeactivate?.(integration)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onActivate?.(integration)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete?.(integration)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Results */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Health Status */}
        {healthStatus && (
          <div className="flex items-center justify-between text-sm">
            <span>Health Status:</span>
            <div className="flex items-center space-x-2">
              <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.status}
              </Badge>
              {healthStatus.responseTime && (
                <span className="text-gray-500">{healthStatus.responseTime}ms</span>
              )}
            </div>
          </div>
        )}

        {/* Integration Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium">{integration.type}</span>
          </div>
          <div>
            <span className="text-gray-500">Provider:</span>
            <span className="ml-2 font-medium">{integration.provider}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium">
              {new Date(integration.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Updated:</span>
            <span className="ml-2 font-medium">
              {new Date(integration.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Generated Integration Info */}
        {isGenerated && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Generated Integration</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Auto-generated from API documentation</div>
              <div>• Type-safe methods available</div>
              <div>• Built-in error handling and retry logic</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Testing connection...</span>
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <Progress value={undefined} className="h-1" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTest}
            disabled={isLoading}
            className="flex-1"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </Button>
          
          {isGenerated && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExecute('demo')}
              disabled={isLoading}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
