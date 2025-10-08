/**
 * Execution Dashboard Component
 * Demonstrates usage of the hybrid execution layer
 */

import React, { useState } from 'react';
import { useExecutionService } from '@/shared/hooks/useExecutionService';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Loader2, Play, Square, RefreshCw } from 'lucide-react';

interface ExecutionDashboardProps {
  userId: string;
  companyId: string;
}

export function ExecutionDashboard({ userId, companyId }: ExecutionDashboardProps) {
  const [selectedProcess, setSelectedProcess] = useState<string>('lead-to-cash');
  const { 
    isExecuting, 
    currentExecution, 
    error, 
    executeProcess, 
    getExecutionStatus, 
    cancelExecution,
    clearError 
  } = useExecutionService();

  const availableProcesses = [
    {
      id: 'lead-to-cash',
      name: 'Lead to Cash',
      description: 'Complete lead processing from capture to revenue',
      type: 'hybrid'
    },
    {
      id: 'customer-onboarding',
      name: 'Customer Onboarding',
      description: 'Automated customer onboarding workflow',
      type: 'hybrid'
    }
  ];

  const handleExecuteProcess = async () => {
    const request = {
      processId: selectedProcess,
      processType: 'hybrid' as const,
      data: {
        // Example data for lead-to-cash process
        lead: {
          id: 'lead_123',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          value: 50000
        },
        user: {
          id: userId,
          name: 'Current User'
        },
        company: {
          id: companyId,
          name: 'Your Company'
        }
      },
      userId,
      companyId,
      metadata: {
        source: 'dashboard',
        triggeredBy: 'user'
      }
    };

    await executeProcess(request);
  };

  const handleCancelExecution = async () => {
    if (currentExecution) {
      await cancelExecution(currentExecution.executionId);
    }
  };

  const handleRefreshStatus = async () => {
    if (currentExecution) {
      await getExecutionStatus(currentExecution.executionId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Execution Dashboard</h1>
          <p className="text-muted-foreground">
            Hybrid execution layer combining Nexus services with n8n workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={!currentExecution}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Process Selection</CardTitle>
            <CardDescription>
              Choose a process to execute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {availableProcesses.map((process) => (
                <div
                  key={process.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProcess === process.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedProcess(process.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{process.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {process.description}
                      </p>
                    </div>
                    <Badge variant="secondary">{process.type}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleExecuteProcess}
              disabled={isExecuting}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Execution Status */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
            <CardDescription>
              Current execution details and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentExecution ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Process: {currentExecution.processId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Execution ID: {currentExecution.executionId}
                    </p>
                  </div>
                  <Badge className={getStatusColor(currentExecution.status)}>
                    {currentExecution.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>
                      {currentExecution.stepsCompleted} / {currentExecution.totalSteps} steps
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentExecution.stepsCompleted / currentExecution.totalSteps) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Started:</span>
                    <span>{new Date(currentExecution.startedAt).toLocaleTimeString()}</span>
                  </div>
                  {currentExecution.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span>{new Date(currentExecution.completedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span>{currentExecution.totalExecutionTime}ms</span>
                  </div>
                </div>

                {currentExecution.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-red-600">Errors:</h4>
                    <div className="space-y-1">
                      {currentExecution.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {currentExecution.status === 'running' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelExecution}
                    className="w-full"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Cancel Execution
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active execution</p>
                <p className="text-sm">Select a process and click execute to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Data */}
      {currentExecution?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Data</CardTitle>
            <CardDescription>
              Output data from the executed process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-64">
              {JSON.stringify(currentExecution.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
