import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  CreditCard,
  BarChart3,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';
import { PayPalAnalyticsSimple } from './PayPalAnalyticsSimple';
import { PayPalRestAPI } from '@/services/integrations/paypal/PayPalRestAPI';

interface PayPalSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const PayPalSetup: React.FC<PayPalSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paypalIntegration, setPaypalIntegration] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  const [activeTab, setActiveTab] = useState('setup');
  const [restApiTest, setRestApiTest] = useState<{success: boolean; message: string} | null>(null);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    checkExistingIntegration();
  }, [user]);

  const checkExistingIntegration = async () => {
    if (!user) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('No user found, skipping integration check');
      return;
    }

    setIsChecking(true);
    
    try {
      // Debug authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Current session: ', session ? 'Authenticated' : 'Not authenticated', sessionError);
      
      if (!session) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('User not authenticated, cannot check integrations');
        setConnectionStatus('disconnected');
        return;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Checking PayPal integration for user: ', user.id);
      
      // First try to find PayPal integration by slug
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'paypal')
        .single();

      let integrationId: string | null = null;

      if (integrationError) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('PayPal integration not found by slug: ', integrationError);
        
        // Fallback 1: try to find by name instead of slug
        const { data: integrationByName, error: nameError } = await supabase
          .from('integrations')
          .select('id')
          .eq('name', 'PayPal')
          .single();
          
        if (nameError || !integrationByName) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('PayPal integration not found by name either');
          
          // Fallback 2: try to find any PayPal-related integration
          const { data: paypalIntegrations, error: searchError } = await supabase
            .from('integrations')
            .select('id')
            .ilike('name', '%paypal%')
            .limit(1);
            
          if (searchError || !paypalIntegrations || paypalIntegrations.length === 0) {
            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('No PayPal integration found in database');
            setConnectionStatus('disconnected');
            return;
          }
          
          integrationId = paypalIntegrations[0].id;
        } else {
          integrationId = integrationByName.id;
        }
      } else {
        integrationId = integration.id;
      }

      if (!integrationId) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('No PayPal integration ID found');
        setConnectionStatus('disconnected');
        return;
      }

      // Check if user has this integration connected
      const { data: userIntegration, error: userIntegrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_id', integrationId)
        .eq('status', 'active')
        .maybeSingle();

      if (userIntegrationError) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking PayPal integration: ', userIntegrationError);
        setConnectionStatus('error');
        return;
      }

      if (userIntegration) {
        setPaypalIntegration(userIntegration);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking PayPal integration: ', error);
      // Don't set error status for database access issues, just assume disconnected
      setConnectionStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      addNotification({
        type: 'error',
        message: 'Please log in to connect PayPal'
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!clientId || clientId === 'your_paypal_client_id_here') {
        throw new Error('PayPal OAuth credentials not configured. Please set up PayPal Developer credentials in the environment variables. See docs/PAYPAL_OAUTH_SETUP.md for setup instructions.');
      }
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured. Please check your environment variables.');
      }

      // Create state parameter with user ID and timestamp for security
      const state = `${user.id}-${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('paypal_oauth_state', state);
      
      const redirectUri = `${supabaseUrl}/functions/v1/paypal_oauth_callback`;
      const scopes = encodeURIComponent('openid profile https: //uri.paypal.com/services/paypalattributes');
      const baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live' 
        ? 'https: //www.paypal.com' 
        : 'https://www.sandbox.paypal.com';

      const authUrl = `${baseUrl}/signin/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

      // Open PayPal OAuth in popup
      const popup = window.open(authUrl, 'paypal-oauth', 'width=600,height=800,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Poll for popup closure (indicates OAuth completion)
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            // Check if integration was successful
            setTimeout(() => {
              checkExistingIntegration();
            }, 1000);
          }
        } catch {
          // Cross-origin access errors are expected
        }
      }, 1000);

      addNotification({
        type: 'info',
        message: 'Complete the PayPal authorization in the popup window...'
      });

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('PayPal connection error: ', error);
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect PayPal. Please try again.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Fallback function to handle PayPal connection without database lookup
  const handleConnectFallback = async () => {
    if (!user) {
      addNotification({
        type: 'error',
        message: 'Please log in to connect PayPal'
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!clientId || clientId === 'your_paypal_client_id_here') {
        throw new Error('PayPal OAuth credentials not configured. Please set up PayPal Developer credentials in the environment variables. See docs/PAYPAL_OAUTH_SETUP.md for setup instructions.');
      }
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured. Please check your environment variables.');
      }

      // Create state parameter with user ID and timestamp for security
      const state = `${user.id}-${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('paypal_oauth_state', state);
      
      const redirectUri = `${supabaseUrl}/functions/v1/paypal_oauth_callback`;
      const scopes = encodeURIComponent('openid profile https: //uri.paypal.com/services/paypalattributes');
      const baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live' 
        ? 'https: //www.paypal.com' 
        : 'https://www.sandbox.paypal.com';

      const authUrl = `${baseUrl}/signin/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

      // Open PayPal OAuth in popup
      const popup = window.open(authUrl, 'paypal-oauth', 'width=600,height=800,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Poll for popup closure (indicates OAuth completion)
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            // Check if integration was successful
            setTimeout(() => {
              checkExistingIntegration();
            }, 1000);
          }
        } catch {
          // Cross-origin access errors are expected
        }
      }, 1000);

      addNotification({
        type: 'info',
        message: 'Complete the PayPal authorization in the popup window...'
      });

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('PayPal connection error: ', error);
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect PayPal. Please try again.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!paypalIntegration) return;
    
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({ status: 'inactive' })
        .eq('id', paypalIntegration.id);

      if (error) throw error;

      setPaypalIntegration(null);
      setConnectionStatus('disconnected');
      
      addNotification({
        type: 'success',
        message: 'PayPal integration disconnected successfully'
      });
      
      onComplete?.();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error disconnecting PayPal: ', error);
      addNotification({
        type: 'error',
        message: 'Failed to disconnect PayPal. Please try again.'
      });
    }
  };

  const handleRefreshToken = async () => {
    if (!paypalIntegration) return;
    
    try {
      const { error } = await supabase.functions.invoke('paypal_refresh_token', {
        body: { orgId: user?.company_id }
      });

      if (error) throw error;

      addNotification({
        type: 'success',
        message: 'PayPal tokens refreshed successfully'
      });
      
      // Refresh integration status
      await checkExistingIntegration();
      
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Token refresh error: ', error);
      addNotification({
        type: 'error',
        message: 'Failed to refresh PayPal tokens. Please try reconnecting.'
      });
    }
  };

  const testRestApiConnection = async () => {
    try {
      const api = new PayPalRestAPI();
      const result = await api.testConnection();
      
      const testResult = {
        success: result,
        message: result 
          ? 'PayPal REST API connection successful! You can access transaction data for analytics.'
          : 'PayPal REST API connection failed. Check your credentials.'
      };
      
      setRestApiTest(testResult);
      
      addNotification({
        type: result ? 'success' : 'error',
        message: testResult.message
      });
    } catch (error) {
      const testResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test PayPal REST API connection.'
      };
      
      setRestApiTest(testResult);
      
      addNotification({
        type: 'error',
        message: testResult.message
      });
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Checking PayPal connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                PayPal Integration
                {connectionStatus === 'connected' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </Badge>
                )}
                {connectionStatus === 'error' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your PayPal account to track transactions and revenue
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Test API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4 mt-4">
            {connectionStatus === 'disconnected' && (
              <>
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Connecting PayPal will allow Nexus to automatically track your payment transactions, 
                    revenue metrics, and financial performance data.
                  </AlertDescription>
                </Alert>



                <div className="space-y-2">
                  <h4 className="font-medium">What you'll get: </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatic transaction tracking</li>
                    <li>• Revenue and payment analytics</li>
                    <li>• Financial performance insights</li>
                    <li>• Real-time payment notifications</li>
                    <li>• Transaction history and reporting</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect PayPal
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleConnectFallback} 
                    disabled={isConnecting}
                    variant="secondary"
                    title="Use fallback method if database access fails"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Fallback'
                    )}
                  </Button>
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}

            {connectionStatus === 'connected' && paypalIntegration && (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    PayPal is successfully connected. Your transaction data is being synced automatically.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connected on: {new Date(paypalIntegration.created_at || paypalIntegration.updated_at).toLocaleDateString()}
                  </p>
                  {paypalIntegration.credentials?.expires_at && (
                    <p className="text-sm text-muted-foreground">
                      Token expires: {new Date(paypalIntegration.credentials.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshToken}
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Token
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect}
                    size="sm"
                  >
                    Disconnect
                  </Button>
                  {onComplete && (
                    <Button variant="outline" onClick={onComplete} size="sm">
                      Done
                    </Button>
                  )}
                </div>
              </>
            )}

            {connectionStatus === 'error' && (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    There was an error checking your PayPal connection. You can still connect PayPal using the fallback method.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect PayPal'
                    )}
                  </Button>
                  <Button onClick={handleConnectFallback} disabled={isConnecting} variant="secondary">
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect (Fallback)'
                    )}
                  </Button>
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <PayPalAnalyticsSimple />
          </TabsContent>

          <TabsContent value="test" className="mt-4 space-y-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Test your PayPal REST API connection to ensure you can access transaction data for analytics.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button 
                onClick={testRestApiConnection}
                className="w-full"
                variant="outline"
              >
                Test PayPal REST API Connection
              </Button>

              {restApiTest && (
                <Alert variant={restApiTest.success ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {restApiTest.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">What this tests: </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PayPal client credentials authentication</li>
                  <li>• Access to transaction data APIs</li>
                  <li>• Environment configuration (live/sandbox)</li>
                  <li>• API rate limits and permissions</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PayPalSetup; 