import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/hooks/index';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  DollarSign,
  TrendingUp,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  Activity
} from 'lucide-react';

interface StripeFinancialSetupProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}

interface StripeFinancialMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  activeCustomers: number;
  churnRate: number;
}

const StripeFinancialSetup: React.FC<StripeFinancialSetupProps> = ({ onComplete, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionData, setConnectionData] = useState<any>(null);
  const [stripeData, setStripeData] = useState<StripeFinancialMetrics | null>(null);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'check' | 'connect' | 'complete'>('check');

  useEffect(() => {
    if (user?.id) {
      checkExistingIntegration();
      handleOAuthCallback();
    }
  }, [user?.id]);

  const checkExistingIntegration = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check if user has Stripe integration (for financial data, not just billing)
      const { data: userIntegration, error: integrationError } = await supabase
        .from('user_integrations')
        .select(`
          *,
          integrations (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('integrations.slug', 'stripe')
        .single();

      if (integrationError && integrationError.code !== 'PGRST116') {
        throw integrationError;
      }

      if (userIntegration) {
        setIsConnected(true);
        setConnectionData(userIntegration);
        setCurrentStep('complete');
        
        // Fetch Stripe financial data
        await fetchStripeFinancialData();
      } else {
        setCurrentStep('connect');
      }
    } catch (err) {
      console.error('Error checking Stripe integration:', err);
      setError('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to connect Stripe'
      });
      return;
    }

    setIsConnecting(true);
    
    try {
          const clientId = import.meta.env.VITE_STRIPE_CLIENT_ID;
    const apiUrl = import.meta.env.VITE_API_URL;
      
      if (!clientId || clientId === 'your_stripe_client_id_here') {
        throw new Error('Stripe OAuth credentials not configured. Please set up Stripe Connect credentials in the environment variables.');
      }
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured. Please check your environment variables.');
      }

      // Create state parameter with user ID and timestamp for security
      const state = `${user.id}-${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('stripe_oauth_state', state);
      
      const redirectUri = `${supabaseUrl}/functions/v1/stripe_oauth_callback`;
      const scopes = encodeURIComponent('read_write');
      const baseUrl = import.meta.env.VITE_STRIPE_ENV === 'live' 
        ? 'https://connect.stripe.com' 
        : 'https://connect.stripe.com';

      const authUrl = `${baseUrl}/oauth/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

      // Open Stripe OAuth in popup
      const popup = window.open(authUrl, 'stripe-oauth', 'width=600,height=800,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for OAuth completion
      const checkOAuth = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(checkOAuth);
            
            // Check if integration was created
            await checkExistingIntegration();
            
            if (isConnected) {
              addNotification({
                type: 'success',
                title: 'Stripe Connected!',
                message: 'Your Stripe account has been successfully connected for financial data.'
              });
              onComplete?.(connectionData);
            } else {
              setError('Connection was cancelled or failed. Please try again.');
            }
            setIsConnecting(false);
          }
        } catch (err) {
          clearInterval(checkOAuth);
          console.error('Error checking OAuth status:', err);
          setError('Connection failed. Please try again.');
          setIsConnecting(false);
        }
      }, 1000);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkOAuth);
        if (isConnecting) {
          setIsConnecting(false);
          setError('Connection timed out. Please try again.');
        }
      }, 300000); // 5 minutes

    } catch (err: any) {
      setError(err.message || 'Failed to start Stripe connection');
      setIsConnecting(false);
    }
  };

  const fetchStripeFinancialData = async () => {
    if (!user?.id) return;
    
    try {
      // Simulate Stripe financial data fetch
      // In real implementation, this would call Stripe API for transaction data
      const mockData: StripeFinancialMetrics = {
        totalRevenue: 85000,
        monthlyRecurringRevenue: 12500,
        transactionCount: 342,
        averageTransactionValue: 248.54,
        successRate: 98.5,
        refundRate: 2.1,
        activeCustomers: 156,
        churnRate: 3.2
      };
      
      setStripeData(mockData);
    } catch (err) {
      console.error('Error fetching Stripe financial data:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Remove Stripe integration
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('integrations.slug', 'stripe');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setConnectionData(null);
      setStripeData(null);
      setCurrentStep('connect');
      
      addNotification({
        type: 'success',
        title: 'Stripe Disconnected',
        message: 'Your Stripe account has been disconnected.'
      });
    } catch (err) {
      console.error('Error disconnecting Stripe:', err);
      setError('Failed to disconnect Stripe');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback from URL parameters
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'stripe') {
      addNotification({
        type: 'success',
        title: 'Stripe Connected',
        message: 'Stripe connected successfully!'
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh connection status
      setTimeout(() => checkExistingIntegration(), 1000);
    } else if (error) {
      addNotification({
        type: 'error',
        title: 'Stripe Connection Failed',
        message: `Stripe connection failed: ${decodeURIComponent(error)}`
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  if (isLoading && !isConnecting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Financial Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Financial Data Integration
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to sync transaction data, revenue analytics, and payment insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 'connect' && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Secure Connection</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nexus uses Stripe Connect OAuth for secure access to your transaction data. We never store your Stripe credentials.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Revenue Analytics</p>
                  <p className="text-sm text-muted-foreground">Track income and transaction data</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Payment Insights</p>
                  <p className="text-sm text-muted-foreground">Success rates and refund analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">Customer Analytics</p>
                  <p className="text-sm text-muted-foreground">Customer behavior and churn rates</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium">Real-time Monitoring</p>
                  <p className="text-sm text-muted-foreground">Live transaction monitoring</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </div>
        )}

        {currentStep === 'complete' && isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Connected to Stripe</span>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            {stripeData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    ${(stripeData.totalRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    ${(stripeData.monthlyRecurringRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-muted-foreground">MRR</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {stripeData.successRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {stripeData.activeCustomers}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={() => fetchStripeFinancialData()} 
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button 
                onClick={handleDisconnect} 
                variant="destructive"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeFinancialSetup;
