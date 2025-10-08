import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { useBackendConnector } from '@/shared/hooks/useBackendConnector';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const BackendHealthTest: React.FC = () => {
  const { services, isSystemHealthy, isLoading, error, refreshHealth } = useBackendConnector();
  const [testing, setTesting] = useState(false);

  const handleTestHealth = async () => {
    setTesting(true);
    try {
      await refreshHealth();
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isLoading || testing ? 'animate-spin' : ''}`} />
          Backend Health Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>System Health:</span>
          <span className={`font-semibold ${isSystemHealthy ? 'text-green-600' : 'text-red-600'}`}>
            {isSystemHealthy ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            Error: {error.message}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">Service Status: </h4>
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.health.status)}
                <span>{service.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {service.health.status} ({service.health.latency}ms)
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleTestHealth} 
          disabled={isLoading || testing}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || testing ? 'animate-spin' : ''}`} />
          {isLoading || testing ? 'Testing...' : 'Test Health'}
        </Button>
      </CardContent>
    </Card>
  );
}; 
