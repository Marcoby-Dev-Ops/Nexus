import React, { useState, useEffect } from 'react';
import { backendConnector } from '@/core/backendConnector';
import type { BackendService } from '@/core/backendConnector';

interface BackendHealthMonitorProps {
  showDetails?: boolean;
  refreshInterval?: number;
}

export const BackendHealthMonitor: React.FC<BackendHealthMonitorProps> = ({
  showDetails = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [services, setServices] = useState<BackendService[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initial load
    const initialServices = backendConnector.getServices();
    setServices(initialServices);
    setLastUpdate(new Date());

    // Subscribe to updates
    const unsubscribe = backendConnector.subscribe((updatedServices) => {
      setServices(updatedServices);
      setLastUpdate(new Date());
    });

    // Set up refresh interval
    const interval = setInterval(() => {
      const updatedServices = backendConnector.getServices();
      setServices(updatedServices);
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'unhealthy':
        return '🔴';
      default: return '⚪';
    }
  };

  const systemHealth = backendConnector.getSystemHealth();

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Backend Health Monitor
        </h3>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="grid grid-cols-2 md: grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{systemHealth.total}</div>
          <div className="text-xs text-gray-500">Total Services</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{systemHealth.healthy}</div>
          <div className="text-xs text-gray-500">Healthy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{systemHealth.degraded}</div>
          <div className="text-xs text-gray-500">Degraded</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{systemHealth.unhealthy}</div>
          <div className="text-xs text-gray-500">Unhealthy</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${systemHealth.criticalHealthy ? 'text-green-600' : 'text-red-600'}`}>
            {systemHealth.criticalHealthy ? '✓' : '✗'}
          </div>
          <div className="text-xs text-gray-500">Critical OK</div>
        </div>
      </div>

      {/* Service Details */}
      {showDetails && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Service Details</h4>
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getStatusIcon(service.health.status)}</span>
                <div>
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-500">
                    {service.type} • {service.critical ? 'Critical' : 'Non-critical'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.health.status)}`}>
                  {service.health.status}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {service.health.latency}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => {
            const updatedServices = backendConnector.getServices();
            setServices(updatedServices);
            setLastUpdate(new Date());
          }}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover: bg-blue-200 transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => {
            const health = backendConnector.getDetailedHealthStatus();
            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Backend Health Status: ', health);
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover: bg-gray-200 transition-colors"
        >
          Debug
        </button>
      </div>
    </div>
  );
}; 