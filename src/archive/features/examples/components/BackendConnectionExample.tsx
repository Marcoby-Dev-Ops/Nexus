/**
 * Example Component: Backend Connection Usage
 * Demonstrates proper usage of the new backend connection services
 */

import React from 'react';
import { useBackendConnector } from '@/shared/hooks/useBackendConnector';
import { useDataService, useNotifications, useInboxItems, useDashboardMetrics } from '@/shared/hooks/useDataService';
import { ConnectionStatusIndicator } from '@/shared/components/ui/ConnectionStatusIndicator';
import { BackendErrorBoundary } from '@/shared/components/ui/BackendErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  Activity, 
  Bell, 
  Inbox, 
  BarChart3, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const BackendConnectionExample: React.FC = () => {
  const { services, isSystemHealthy, isLoading, error, refreshHealth } = useBackendConnector();
  
  // Example of using specific data hooks
  const { data: notifications, loading: notificationsLoading, error: notificationsError, refetch: refetchNotifications } = useNotifications(5);
  const { data: inboxItems, loading: inboxLoading, error: inboxError, refetch: refetchInbox } = useInboxItems({ is_read: false }, 10);
  const { data: dashboardMetrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useDashboardMetrics();

  // Example of using the generic data service hook
  const { data: customData, loading: customLoading, error: customError, refetch: refetchCustom } = useDataService(
    async () => {
      // This would be your custom data fetching logic
      return { message: 'Custom data fetched successfully' };
    },
    { 
      enabled: isSystemHealthy,
      refetchInterval: 30000 
    }
  );

  const handleRefreshAll = async () => {
    await Promise.all([
      refreshHealth(),
      refetchNotifications(),
      refetchInbox(),
      refetchMetrics(),
      refetchCustom()
    ]);
  };

  return (
    <BackendErrorBoundary>
      <div className="space-y-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Backend Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Health:</span>
                <ConnectionStatusIndicator showDetails={false} />
              </div>

              {/* Service Status Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Service Status:</h4>
                {services.map(service => (
                  <div key={service.name} className="flex items-center justify-between text-sm">
                    <span>{service.name}</span>
                    <div className="flex items-center space-x-2">
                      {service.isConnected ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant={service.isConnected ? 'default' : 'destructive'}>
                        {service.isConnected ? 'Online' : 'Offline'}
                      </Badge>
                      {service.health.latency > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {service.health.latency}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Connection error: {error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleRefreshAll}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {notificationsLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load notifications: {notificationsError.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(notifications) && notifications.slice(0, 3).map((notification: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {notification.message}
                    </div>
                  ))}
                  {(!notifications || (Array.isArray(notifications) && notifications.length === 0)) && (
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inbox Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Inbox className="h-5 w-5" />
                <span>Inbox Items</span>
                {inboxLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inboxError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load inbox: {inboxError.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(inboxItems) && inboxItems.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {item.title || item.subject}
                    </div>
                  ))}
                  {(!inboxItems || (Array.isArray(inboxItems) && inboxItems.length === 0)) && (
                    <p className="text-sm text-muted-foreground">No inbox items</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dashboard Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard Metrics</span>
                {metricsLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load metrics: {metricsError.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {dashboardMetrics && typeof dashboardMetrics === 'object' ? (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Total Activities:</span>
                        <span>{(dashboardMetrics as any).totalActivities || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Projects:</span>
                        <span>{(dashboardMetrics as any).activeProjects || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No metrics available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Custom Data Example */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Data Service</CardTitle>
          </CardHeader>
          <CardContent>
            {customError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Custom data error: {customError.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {customLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading custom data...</span>
                  </div>
                ) : (
                  <div className="text-sm">
                    <pre className="bg-muted p-2 rounded">
                      {JSON.stringify(customData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BackendErrorBoundary>
  );
}; 