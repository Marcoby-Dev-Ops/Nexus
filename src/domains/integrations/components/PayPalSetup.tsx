import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { useNotifications } from '@/shared/core/hooks/NotificationContext';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';

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
  const { addNotification } = useNotifications();
  const { user } = useAuthContext();

  useEffect(() => {
    checkExistingIntegration();
  }, [user]);

  const checkExistingIntegration = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      // Get PayPal integration ID
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'paypal')
        .single();

      if (integrationError || !integration) {
        console.warn('PayPal integration not found in database');
        setConnectionStatus('disconnected');
        return;
      }

      // Check if user has this integration connected
      const { data: userIntegration, error: userIntegrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_id', integration.id)
        .eq('status', 'active')
        .maybeSingle();

      if (userIntegrationError) {
        console.error('Error checking PayPal integration:', userIntegrationError);
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
      console.error('Error checking PayPal integration:', error);
      setConnectionStatus('error');
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
      
      if (!clientId || !supabaseUrl) {
        throw new Error('PayPal configuration missing. Please contact support.');
      }

      // Create state parameter with user ID and timestamp for security
      const state = `${user.id}-${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('paypal_oauth_state', state);
      
      const redirectUri = `${supabaseUrl}/functions/v1/paypal_oauth_callback`;
      const scopes = encodeURIComponent('openid profile https://uri.paypal.com/services/paypalattributes');
      const baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live' 
        ? 'https://www.paypal.com' 
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
        } catch (error) {
          // Cross-origin access errors are expected
        }
      }, 1000);

      addNotification({
        type: 'info',
        message: 'Complete the PayPal authorization in the popup window...'
      });

    } catch (error) {
      console.error('PayPal connection error:', error);
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
      console.error('Error disconnecting PayPal:', error);
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
      console.error('Token refresh error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to refresh PayPal tokens. Please try reconnecting.'
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
      
      <CardContent className="space-y-4">
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
              <h4 className="font-medium">What you'll get:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic transaction tracking</li>
                <li>• Revenue and payment analytics</li>
                <li>• Financial performance insights</li>
                <li>• Real-time payment notifications</li>
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
              {paypalIntegration.config?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Token expires: {new Date(paypalIntegration.config.expires_at).toLocaleDateString()}
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
                There was an error checking your PayPal connection. Please try reconnecting.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  'Reconnect PayPal'
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
      </CardContent>
    </Card>
  );
};

export default PayPalSetup; 