/**
 * Database Status Component
 * 
 * Demonstrates how to use the new PostgreSQL integration in React components.
 * Shows database health, connection status, and configuration information.
 */

import React from 'react';
import { 
  useDatabaseHealth, 
  useDatabaseConfig, 
  useDatabaseConnection, 
  useVectorOperations 
} from '@/hooks/useDatabase';
import { databaseService } from '@/core/services/DatabaseService';

interface DatabaseStatusProps {
  showDetails?: boolean;
  onStatusChange?: (status: 'healthy' | 'unhealthy' | 'unknown') => void;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ 
  showDetails = true, 
  onStatusChange 
}) => {
  const { health, loading: healthLoading, error: healthError, refetch: refetchHealth } = useDatabaseHealth();
  const { config, isSupabase, isPostgres, databaseType } = useDatabaseConfig();
  const { connected, testing: connectionTesting, error: connectionError, testConnection } = useDatabaseConnection();
  const { vectorSupport, testing: vectorTesting, error: vectorError, testVectorSupport } = useVectorOperations();

  // Notify parent component of status changes
  React.useEffect(() => {
    if (health && onStatusChange) {
      onStatusChange(health.status);
    }
  }, [health, onStatusChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'unhealthy':
        return '❌';
      default:
        return '⚠️';
    }
  };

  // Handle case where no database is configured
  if (databaseType === 'unknown') {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900">No Database Configured</h3>
            <p className="text-sm text-yellow-700">
              No database configuration is available for this environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (healthLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking database status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon(health?.status || 'unknown')}</span>
            <div>
              <h3 className="font-semibold text-gray-900">Database Status</h3>
              <p className="text-sm text-gray-600">
                {databaseType === 'postgres' ? 'PostgreSQL' : 'Supabase'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health?.status || 'unknown')}`}>
              {health?.status || 'Unknown'}
            </span>
            <button
              onClick={refetchHealth}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh status"
            >
              🔄
            </button>
          </div>
        </div>

        {healthError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {healthError}
          </div>
        )}
      </div>

      {/* Connection Details */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Connection</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {isPostgres ? 'PostgreSQL' : 'Supabase'}
                </span>
              </div>
              {connectionError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {connectionError}
                </div>
              )}
              <button
                onClick={testConnection}
                disabled={connectionTesting}
                className="w-full mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {connectionTesting ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Vector Support */}
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Vector Operations</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Support:</span>
                <span className={`text-sm font-medium ${vectorSupport ? 'text-green-600' : 'text-red-600'}`}>
                  {vectorSupport ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Extension:</span>
                <span className="text-sm font-medium text-gray-900">
                  {vectorSupport ? 'pgvector' : 'N/A'}
                </span>
              </div>
              {vectorError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {vectorError}
                </div>
              )}
              <button
                onClick={testVectorSupport}
                disabled={vectorTesting}
                className="w-full mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {vectorTesting ? 'Testing...' : 'Test Vector Support'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Details */}
      {showDetails && (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Database Type:</span>
              <span className="ml-2 font-medium text-gray-900">{databaseType}</span>
            </div>
            <div>
              <span className="text-gray-600">Connection URL:</span>
              <span className="ml-2 font-medium text-gray-900 font-mono text-xs">
                {config.url ? `${config.url.substring(0, 30)}...` : 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              refetchHealth();
              testConnection();
              testVectorSupport();
            }}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh All
          </button>
          <button
            onClick={() => {
              console.log('Database Config:', config);
            }}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Log Config
          </button>
          <button
            onClick={async () => {
              try {
                const result = await databaseService.query('SELECT version()');
                console.log('Database Version:', result.data);
              } catch (error) {
                console.error('Query failed:', error);
              }
            }}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Query
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatus;
