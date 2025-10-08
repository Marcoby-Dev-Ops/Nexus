/**
 * Connection Status Indicator
 * Shows real-time health status of backend services
 */

import React from 'react';
import { useBackendConnector } from '@/shared/hooks/useBackendConnector';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/Tooltip';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Activity 
} from 'lucide-react';

interface ConnectionStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { services, isSystemHealthy, isLoading, error, refreshHealth } = useBackendConnector();

  const getStatusIcon = () => {
    if (isLoading) {
      return <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />;
    }
    
    if (isSystemHealthy) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    
    if (error) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (isSystemHealthy) return 'Connected';
    if (error) return 'Error';
    return 'Degraded';
  };

  const getStatusVariant = () => {
    if (isLoading) return 'secondary';
    if (isSystemHealthy) return 'default';
    if (error) return 'destructive';
    return 'secondary';
  };

  const healthyServices = services.filter(s => s.isConnected).length;
  const totalServices = services.length;

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshHealth}
              disabled={isLoading}
              className={`p-1 h-auto ${className}`}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="text-xs">{getStatusText()}</span>
                {!isLoading && (
                  <span className="text-xs text-muted-foreground">
                    ({healthyServices}/{totalServices})
                  </span>
                )}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <div className="font-medium">Backend Services</div>
              {services.map(service => (
                <div key={service.name} className="flex items-center justify-between text-xs">
                  <span>{service.name}</span>
                  <Badge 
                    variant={service.isConnected ? 'default' : 'destructive'} 
                    className="ml-2"
                  >
                    {service.isConnected ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium">Backend Services</span>
        </div>
        <Badge variant={getStatusVariant()}>
          {getStatusText()}
        </Badge>
      </div>

      <div className="space-y-2">
        {services.map(service => (
          <div key={service.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="flex items-center space-x-2">
              {service.isConnected ? (
                <Wifi className="h-3 w-3 text-success" />
              ) : (
                <WifiOff className="h-3 w-3 text-destructive" />
              )}
              <span className="text-sm">{service.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={service.isConnected ? 'default' : 'destructive'} 
                className="text-xs"
              >
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

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-xs text-destructive">{error.message}</p>
        </div>
      )}

      <Button
        onClick={refreshHealth}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="w-full"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh Status
          </>
        )}
      </Button>
    </div>
  );
}; 
