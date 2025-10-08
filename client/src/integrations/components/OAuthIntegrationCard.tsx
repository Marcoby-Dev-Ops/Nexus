import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Mail, 
  Building2,
  Users,
  X,
  Settings
} from 'lucide-react';
import type { OAuthIntegration } from '@/core/types/integrations';

interface OAuthIntegrationCardProps {
  integration: OAuthIntegration;
  onDisconnect: (integrationId: string) => Promise<void>;
  onManualSync: (integrationId: string) => Promise<void>;
  onTestConnection: (integrationId: string) => Promise<void>;
}

export const OAuthIntegrationCard: React.FC<OAuthIntegrationCardProps> = ({
  integration,
  onDisconnect,
  onManualSync,
  onTestConnection
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = () => {
    switch (integration.provider) {
      case 'hubspot':
        return <Building2 className="h-5 w-5" />;
      case 'microsoft':
        return <Mail className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getProviderName = () => {
    switch (integration.provider) {
      case 'hubspot':
        return 'HubSpot CRM';
      case 'microsoft':
        return 'Microsoft 365';
      default:
        return integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm(`Are you sure you want to disconnect ${integration.integrationName}?`)) {
      setIsLoading(true);
      try {
        await onDisconnect(integration.id);
      } catch (error) {
        console.error('Failed to disconnect integration:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    try {
      await onManualSync(integration.id);
    } catch (error) {
      console.error('Failed to sync integration:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      await onTestConnection(integration.id);
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = integration.expiresAt ? new Date(integration.expiresAt) < new Date() : false;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getProviderIcon()}
            <div>
              <CardTitle className="text-lg">{integration.integrationName}</CardTitle>
              <p className="text-sm text-gray-600">{getProviderName()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {integration.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon()}
              <span className="capitalize">{integration.status}</span>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Last Sync:</span>
            <div className="mt-1">
              {integration.lastSyncAt ? (
                formatDate(integration.lastSyncAt)
              ) : (
                <span className="text-gray-500">Never</span>
              )}
            </div>
          </div>
        </div>

        {/* OAuth Information */}
        {integration.status === 'connected' && (
          <div className="space-y-2">
            {integration.externalAccountId && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Account ID:</span>
                <span className="ml-2 font-mono text-gray-600">{integration.externalAccountId}</span>
              </div>
            )}
            
            {integration.tenantId && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Tenant ID:</span>
                <span className="ml-2 font-mono text-gray-600">{integration.tenantId}</span>
              </div>
            )}
            
            {integration.expiresAt && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Token Expires:</span>
                <span className={`ml-2 ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatDate(integration.expiresAt)}
                  {isExpired && <span className="ml-1 text-red-500">(Expired)</span>}
                </span>
              </div>
            )}
            
            {integration.mailSyncEnabled && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Mail Sync:</span>
                <span className="ml-2 text-green-600">Enabled</span>
              </div>
            )}
          </div>
        )}

        {/* Error Information */}
        {integration.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-800">Last Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{integration.lastError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {integration.status === 'connected' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'Syncing...' : 'Sync Now'}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Test Connection</span>
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
