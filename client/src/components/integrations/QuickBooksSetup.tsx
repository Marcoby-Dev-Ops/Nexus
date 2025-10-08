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
  FileText,
  Calculator,
  Shield,
  Zap
} from 'lucide-react';

interface QuickBooksSetupProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}

interface QuickBooksMetrics {
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  recentTransactions: number;
  invoicesOutstanding: number;
}

const QuickBooksSetup: React.FC<QuickBooksSetupProps> = ({ onComplete, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionData, setConnectionData] = useState<any>(null);
  const [quickBooksData, setQuickBooksData] = useState<QuickBooksMetrics | null>(null);
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
      
      // Check if user has QuickBooks integration
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
        .eq('integrations.slug', 'quickbooks')
        .single();

      if (integrationError && integrationError.code !== 'PGRST116') {
        throw integrationError;
      }

      if (userIntegration) {
        setIsConnected(true);
        setConnectionData(userIntegration);
        setCurrentStep('complete');
        
        // Fetch QuickBooks data
        await fetchQuickBooksData();
      } else {
        setCurrentStep('connect');
      }
    } catch (err) {
      console.error('Error checking QuickBooks integration:', err);
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
        message: 'Please log in to connect QuickBooks'
      });
      return;
    }

    setIsConnecting(true);
    
    try {
          const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
    const apiUrl = import.meta.env.VITE_API_URL;
      
      if (!clientId || clientId === 'your_quickbooks_client_id_here') {
        throw new Error('QuickBooks OAuth credentials not configured. Please set up QuickBooks Developer credentials in the environment variables.');
      }
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured. Please check your environment variables.');
      }

      // Create state parameter with user ID and timestamp for security
      const state = `${user.id}-${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('quickbooks_oauth_state', state);
      
      const redirectUri = `${supabaseUrl}/functions/v1/quickbooks_oauth_callback`;
      const scopes = encodeURIComponent('com.intuit.quickbooks.accounting');
      const baseUrl = import.meta.env.VITE_QUICKBOOKS_ENV === 'production' 
        ? 'https://appcenter.intuit.com' 
        : 'https://sandbox-accounts.platform.intuit.com';

      const authUrl = `${baseUrl}/connect/oauth2?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

      // Open QuickBooks OAuth in popup
      const popup = window.open(authUrl, 'quickbooks-oauth', 'width=600,height=800,scrollbars=yes,resizable=yes');
      
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
                title: 'QuickBooks Connected!',
                message: 'Your QuickBooks account has been successfully connected.'
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
      setError(err.message || 'Failed to start QuickBooks connection');
      setIsConnecting(false);
    }
  };

  const fetchQuickBooksData = async () => {
    if (!user?.id) return;
    
    try {
      // Simulate QuickBooks data fetch
      // In real implementation, this would call QuickBooks API
      const mockData: QuickBooksMetrics = {
        totalRevenue: 125000,
        totalExpenses: 85000,
        profitMargin: 32,
        accountsReceivable: 15000,
        accountsPayable: 8000,
        recentTransactions: 45,
        invoicesOutstanding: 12
      };
      
      setQuickBooksData(mockData);
    } catch (err) {
      console.error('Error fetching QuickBooks data:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Remove QuickBooks integration
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('integrations.slug', 'quickbooks');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setConnectionData(null);
      setQuickBooksData(null);
      setCurrentStep('connect');
      
      addNotification({
        type: 'success',
        title: 'QuickBooks Disconnected',
        message: 'Your QuickBooks account has been disconnected.'
      });
    } catch (err) {
      console.error('Error disconnecting QuickBooks:', err);
      setError('Failed to disconnect QuickBooks');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback from URL parameters
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'quickbooks') {
      addNotification({
        type: 'success',
        message: 'QuickBooks connected successfully!'
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh connection status
      setTimeout(() => checkExistingIntegration(), 1000);
    } else if (error) {
      addNotification({
        type: 'error',
        message: `QuickBooks connection failed: ${decodeURIComponent(error)}`
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
            <Calculator className="h-5 w-5" />
            QuickBooks
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
          <Calculator className="h-5 w-5" />
          QuickBooks Integration
        </CardTitle>
        <CardDescription>
          Connect your QuickBooks account to sync financial data, invoices, and accounting information.
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
                    Nexus uses industry-standard OAuth 2.0 authentication. We never store your QuickBooks password.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Revenue Tracking</p>
                  <p className="text-sm text-muted-foreground">Sync income and sales data</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Invoice Management</p>
                  <p className="text-sm text-muted-foreground">Track outstanding invoices</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">Financial Analytics</p>
                  <p className="text-sm text-muted-foreground">Profit margins and cash flow</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium">Real-time Sync</p>
                  <p className="text-sm text-muted-foreground">Automatic data updates</p>
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
                  Connecting to QuickBooks...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Connect QuickBooks Account
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
                <span className="font-medium">Connected to QuickBooks</span>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            {quickBooksData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    ${(quickBooksData.totalRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {quickBooksData.profitMargin}%
                  </p>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    ${(quickBooksData.accountsReceivable / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {quickBooksData.invoicesOutstanding}
                  </p>
                  <p className="text-sm text-muted-foreground">Outstanding Invoices</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={() => fetchQuickBooksData()} 
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

export default QuickBooksSetup;
