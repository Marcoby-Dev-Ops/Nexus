import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { GoogleAnalyticsService } from '@/services/integrations/google-analytics/GoogleAnalyticsService';

// Google Analytics OAuth scopes
const GOOGLE_ANALYTICS_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics'
];

interface ConnectionStatus {
  connected: boolean;
  lastSync?: string;
  accountInfo?: {
    accountId?: string;
    propertyId?: string;
    viewId?: string;
  };
  error?: string;
}

const GoogleAnalyticsSetup: React.FC = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'setup' | 'sync'>('setup');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Use the GoogleAnalyticsService to check connection status
      const googleAnalyticsService = new GoogleAnalyticsService();
      const result = await googleAnalyticsService.getConnectionStatus(user.id);

      if (result.success && result.data) {
        const status = {
          connected: result.data.connected,
          lastSync: result.data.lastSync,
          accountInfo: {
            accountId: undefined,
            propertyId: undefined,
            viewId: undefined,
          },
          error: result.data.status === 'error' ? 'Connection error' : undefined,
        };
        
        setConnectionStatus(status);
        
        if (status.connected) {
          setCurrentStep('sync');
        }
      } else {
        setConnectionStatus({ 
          connected: false, 
          error: result.error || 'Failed to check connection status' 
        });
      }
    } catch (error) {
      logger.error('Error checking Google Analytics connection status', { error });
      setConnectionStatus({ connected: false, error: 'Failed to check connection status' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      setError('Please log in to connect Google Analytics');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Use the Google client ID from environment (like Microsoft/HubSpot)
      // Get client ID from server (public info only)
  const [clientId, setClientId] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/oauth/config/google_analytics')
      .then(res => res.json())
      .then(config => setClientId(config.clientId))
      .catch(err => console.error('Failed to get Google Analytics config:', err));
  }, []);
      
      if (!clientId) {
        setError('Google client ID not configured. Please check your environment variables.');
        setConnecting(false);
        return;
      }

      // Configure OAuth settings - redirect to frontend callback page
      const redirectUri = `${window.location.origin}/integrations/google-analytics/callback`;
      
      // Create state parameter with user ID and timestamp for security (like HubSpot)
      const state = btoa(JSON.stringify({ 
        timestamp: Date.now(),
        service: 'google_analytics',
        userId: user?.id || null
      }));
      
      logger.info('🔧 [GoogleAnalyticsSetup] Creating OAuth URL with: ', {
        clientId: clientId ? '***' : 'missing',
        redirectUri,
        windowOrigin: window.location.origin,
        scopes: GOOGLE_ANALYTICS_REQUIRED_SCOPES,
        state: state ? '***' : 'missing',
        userId: user?.id || 'missing'
      });
      
      // Build Google OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GOOGLE_ANALYTICS_REQUIRED_SCOPES.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      logger.info('🔧 [GoogleAnalyticsSetup] Redirecting to Google OAuth');
      
      // Redirect to Google OAuth (like Microsoft/HubSpot)
      window.location.href = authUrl.toString();
      
    } catch (error) {
      logger.error('Failed to initiate Google Analytics OAuth', { error });
      setError('Failed to start Google Analytics connection. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      // Use the consolidated integration service to disconnect
      const { consolidatedIntegrationService } = await import('@/services/integrations/consolidatedIntegrationService');
      const result = await consolidatedIntegrationService.disconnectIntegration(user.id, 'google-analytics');

      if (result.success) {
        setConnectionStatus({ connected: false });
        setCurrentStep('setup');
        logger.info('Google Analytics disconnected successfully');
      } else {
        setError(result.error || 'Failed to disconnect Google Analytics');
      }
    } catch (error) {
      logger.error('Error disconnecting Google Analytics', { error });
      setError('Failed to disconnect Google Analytics');
    }
  };

  const handleSync = async () => {
    if (!user?.id) return;

    try {
      // Use the GoogleAnalyticsService to sync data
      const googleAnalyticsService = new GoogleAnalyticsService();
      const result = await googleAnalyticsService.syncGoogleAnalyticsDataWithIntelligence(user.id);

      if (result.success) {
        await checkConnectionStatus();
        logger.info('Google Analytics sync completed');
      } else {
        setError(result.error || 'Failed to sync Google Analytics data');
      }
    } catch (error) {
      logger.error('Error syncing Google Analytics', { error });
      setError('Failed to sync Google Analytics data');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking Google Analytics connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="flex items-center space-x-2">
              Google Analytics
              {connectionStatus?.connected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect your Google Analytics account to track website performance and marketing metrics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {connectionStatus?.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Account ID</p>
                <p className="text-sm">{connectionStatus.accountInfo?.accountId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Property ID</p>
                <p className="text-sm">{connectionStatus.accountInfo?.propertyId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Last Sync</p>
                <p className="text-sm">{connectionStatus.lastSync ? new Date(connectionStatus.lastSync).toLocaleString() : 'Never'}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSync} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Data
              </Button>
              <Button onClick={handleDisconnect} variant="outline" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Website traffic and visitor analytics</li>
                <li>• Marketing campaign performance data</li>
                <li>• Conversion tracking and goal completion</li>
                <li>• Real-time user behavior insights</li>
                <li>• Automated reporting and alerts</li>
              </ul>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Connect Google Analytics
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to Google to authorize access to your Analytics data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleAnalyticsSetup; 
