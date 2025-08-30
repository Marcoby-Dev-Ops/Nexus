import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { microsoft365Service } from '@/services/integrations/Microsoft365Service';
import { logger } from '@/lib/logger';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface Microsoft365SetupSimpleProps {
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const Microsoft365SetupSimple: React.FC<Microsoft365SetupSimpleProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [connection, setConnection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingConnection();
  }, [user?.id]);

  const checkExistingConnection = async () => {
    if (!user?.id) return;

    try {
      const result = await microsoft365Service.getConnection(user.id);
      if (result.data) {
        setConnection(result.data);
        setStatus('connected');
      }
    } catch (err) {
      logger.error('Failed to check existing connection', { error: err });
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please log in to connect Microsoft 365',
        variant: 'destructive'
      });
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      // Redirect to Microsoft OAuth
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/microsoft365/callback`;
      const scopes = [
        'User.Read',
        'Mail.Read',
        'Mail.ReadWrite',
        'Calendars.Read',
        'Files.Read.All',
        'Contacts.Read',
        'Team.ReadBasic.All',
        'Channel.ReadBasic.All',
        'Tasks.Read',
        'Notes.Read.All',
        'offline_access'
      ].join(' ');

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_mode=query&` +
        `prompt=consent`;

      // Store state for callback
      sessionStorage.setItem('microsoft365_auth_state', JSON.stringify({
        userId: user.id,
        timestamp: Date.now()
      }));

      window.location.href = authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start authentication';
      setError(errorMessage);
      setStatus('error');
      logger.error('Microsoft 365 connection failed', { error: err });
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      setStatus('connecting');
      const result = await microsoft365Service.disconnect(user.id);
      
      if (result.data) {
        setConnection(null);
        setStatus('idle');
        toast({
          title: 'Disconnected',
          description: 'Microsoft 365 has been disconnected successfully',
        });
        onComplete?.();
      } else {
        throw new Error(result.error || 'Failed to disconnect');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      setStatus('error');
      logger.error('Microsoft 365 disconnection failed', { error: err });
    }
  };

  const handleTestConnection = async () => {
    if (!user?.id) return;

    try {
      setStatus('connecting');
      const result = await microsoft365Service.testConnection(user.id);
      
      if (result.data) {
        toast({
          title: 'Connection Tested',
          description: 'Microsoft 365 connection is working properly',
        });
        setStatus('connected');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      setStatus('error');
      logger.error('Microsoft 365 connection test failed', { error: err });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="/Nexus/microsoft365-icon.png" 
            alt="Microsoft 365" 
            className="w-6 h-6"
          />
          Microsoft 365 Integration
        </CardTitle>
        <CardDescription>
          Connect your Microsoft 365 account to access emails, calendar, files, and Teams data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status:</span>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          {connection && (
            <span className="text-sm text-gray-500">
              Connected {new Date(connection.created_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Connection Info */}
        {connection && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Connection Details</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p>• Access to: {connection.scope.split(' ').slice(0, 3).join(', ')}...</p>
              <p>• Last updated: {new Date(connection.updated_at).toLocaleString()}</p>
              {connection.last_sync_at && (
                <p>• Last sync: {new Date(connection.last_sync_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!connection ? (
            <Button 
              onClick={handleConnect} 
              disabled={status === 'connecting'}
              className="flex-1"
            >
              {status === 'connecting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Microsoft 365
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleTestConnection} 
                disabled={status === 'connecting'}
                variant="outline"
                className="flex-1"
              >
                {status === 'connecting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button 
                onClick={handleDisconnect} 
                disabled={status === 'connecting'}
                variant="destructive"
                className="flex-1"
              >
                Disconnect
              </Button>
            </>
          )}
          
          {onCancel && (
            <Button 
              onClick={onCancel} 
              variant="outline"
              disabled={status === 'connecting'}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Permissions Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Required Permissions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Read your profile and email address</li>
            <li>Read and send emails</li>
            <li>Read calendar events</li>
            <li>Read files and documents</li>
            <li>Read Teams information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
