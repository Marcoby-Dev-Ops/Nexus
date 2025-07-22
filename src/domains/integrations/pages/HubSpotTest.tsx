/**
 * HubSpot OAuth Test Page
 * 
 * This page is for testing and debugging HubSpot OAuth popup authentication.
 * It provides detailed logging and error handling to identify issues.
 */

import React, { useState } from 'react';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react';

export default function HubSpotTest() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testHubSpotOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);

    try {
      console.log('🧪 [HubSpotTest] Starting OAuth test...');
      
      // Check environment variables
      const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
      const appUrl = import.meta.env.VITE_NEXT_PUBLIC_APP_URL || window.location.origin;
      
      console.log('🧪 [HubSpotTest] Environment check:', {
        hasClientId: !!clientId,
        appUrl,
        userId: user?.id
      });

      if (!clientId) {
        throw new Error('HubSpot Client ID not configured');
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create OAuth URL manually for testing
      const redirectUri = `${window.location.origin}/integrations/hubspot/callback`;
      const state = btoa(JSON.stringify({ 
        timestamp: Date.now(),
        service: 'hubspot',
        userId: user.id
      }));

      // HubSpot OAuth URL with proper formatting
      const scopes = [
        'oauth',
        'crm.lists.read',
        'crm.lists.write',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write'
      ].join(',');

      const authUrl = `https://app.hubspot.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `state=${encodeURIComponent(state)}`;

      console.log('🧪 [HubSpotTest] Generated auth URL:', authUrl);

      // Store debug info
      setDebugInfo({
        clientId: clientId ? '***' : 'missing',
        redirectUri,
        scopes,
        state: state ? '***' : 'missing',
        authUrl
      });

      // Open popup with specific settings
      const authWindow = window.open(
        authUrl,
        'hubspot-test-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes,location=yes,status=yes'
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      console.log('🧪 [HubSpotTest] Popup opened successfully');

      // Listen for OAuth completion
      const handleMessage = (event: MessageEvent) => {
        console.log('🧪 [HubSpotTest] Received message:', event.data);
        
        if (event.origin !== window.location.origin) {
          console.log('🧪 [HubSpotTest] Ignoring message from different origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'hubspot-oauth-success') {
          console.log('✅ [HubSpotTest] OAuth success received');
          authWindow?.close();
          setLoading(false);
          setSuccess('HubSpot OAuth completed successfully!');
          setDebugInfo(prev => ({
            ...prev,
            success: true,
            receivedData: event.data
          }));
        } else if (event.data.type === 'hubspot-oauth-error') {
          console.log('❌ [HubSpotTest] OAuth error received:', event.data.error);
          authWindow?.close();
          setLoading(false);
          setError(event.data.error || 'Authentication failed');
          setDebugInfo(prev => ({
            ...prev,
            success: false,
            error: event.data.error
          }));
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup and timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
          setLoading(false);
          setError('Authentication timed out. Please try again.');
        }
      }, 300000); // 5 minutes

    } catch (error: any) {
      console.error('❌ [HubSpotTest] OAuth test failed:', error);
      setError(error.message || 'Failed to start OAuth test');
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    const env = {
      VITE_HUBSPOT_CLIENT_ID: import.meta.env.VITE_HUBSPOT_CLIENT_ID,
      VITE_HUBSPOT_CLIENT_SECRET: import.meta.env.VITE_HUBSPOT_CLIENT_SECRET ? '***' : 'missing',
      VITE_NEXT_PUBLIC_APP_URL: import.meta.env.VITE_NEXT_PUBLIC_APP_URL,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      currentOrigin: window.location.origin,
      userAuthenticated: !!user?.id
    };

    console.log('🔍 [HubSpotTest] Environment check:', env);
    setDebugInfo(prev => ({ ...prev, environment: env }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HubSpot OAuth Test</h1>
          <p className="text-muted-foreground">
            Test and debug HubSpot OAuth popup authentication
          </p>
        </div>
        <Badge variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Debug Mode
        </Badge>
      </div>

      {/* Status Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              OAuth Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testHubSpotOAuth}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing OAuth...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test HubSpot OAuth
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={checkEnvironment}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Check Environment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <Badge variant={user?.id ? "default" : "secondary"}>
                  {user?.id ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="text-sm text-muted-foreground">
                  {user?.id || "Not available"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-sm text-muted-foreground">
                  {user?.email || "Not available"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Check Environment" to verify configuration</li>
            <li>Click "Test HubSpot OAuth" to start the OAuth flow</li>
            <li>Allow popups if prompted by your browser</li>
            <li>Complete the HubSpot authorization in the popup</li>
            <li>Check the debug information below for details</li>
            <li>Monitor browser console for detailed logs</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 