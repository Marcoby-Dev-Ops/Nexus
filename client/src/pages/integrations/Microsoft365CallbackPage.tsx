import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useToast } from '@/shared/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { microsoft365Service } from '@/services/integrations/Microsoft365Service';
import { logger } from '@/shared/utils/logger';
import { msalInstance, msalReady } from '@/shared/auth/msal';
import Microsoft365ServiceDiscovery from '@/components/integrations/Microsoft365ServiceDiscovery';

const Microsoft365CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'discovery'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const { user, loading } = useAuth();
  
  // Add a ref to track if the component has been initialized
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) {
      logger.info('Microsoft365CallbackPage already initialized, skipping...');
      return;
    }
    
    isInitialized.current = true;
    
    logger.info('Microsoft365CallbackPage mounted', {
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer
    });
    
    // Only proceed if authentication is not loading
    if (!loading) {
      handleCallback();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      logger.info('Microsoft365CallbackPage unmounting');
    };
  }, [navigate, loading]);

  const handleCallback = useCallback(async () => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      logger.info('Microsoft callback already processed, skipping...');
      return;
    }
    
    hasProcessed.current = true;
    setStatus('processing');
    
    // Add a small delay to ensure the component is fully mounted
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if user is authenticated
    logger.info('Checking user authentication', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      loading 
    });
    
    // Wait for authentication to load
    if (loading) {
      logger.info('Authentication still loading, waiting...');
      return;
    }
    
    if (!user?.id) {
      logger.error('User not authenticated');
      setStatus('error');
      setError('Please log in to connect Microsoft 365');
      return;
    }

    try {
      // Handle MSAL response and get tokens
      logger.info('Processing MSAL response');

      // Wait for MSAL to be initialized before using it
      await msalReady;
      
      // Use MSAL to handle the response and get tokens
      const response = await msalInstance.handleRedirectPromise();
      
      if (response) {
        logger.info('MSAL response received', {
          hasAccessToken: !!response.accessToken,
          hasIdToken: !!response.idToken,
          scopes: response.scopes,
          account: response.account
        });

        // Set the active account if it's not already set
        if (response.account) {
          msalInstance.setActiveAccount(response.account);
          logger.info('Set active account in MSAL', { 
            username: response.account.username,
            homeAccountId: response.account.homeAccountId
          });
        }

        // Get the account from MSAL (use response account as fallback)
        let account = msalInstance.getActiveAccount();
        if (!account) {
          logger.warn('No active account found in MSAL, using response account', {
            responseAccount: response.account,
            allAccounts: msalInstance.getAllAccounts()
          });
          account = response.account;
        }
        
        if (!account) {
          logger.error('No account available for token acquisition', {
            responseAccount: response.account,
            activeAccount: msalInstance.getActiveAccount(),
            allAccounts: msalInstance.getAllAccounts()
          });
          throw new Error('No account available for token acquisition');
        }

        logger.info('Using account for token acquisition', {
          username: account.username,
          homeAccountId: account.homeAccountId
        });

        // Get access token with offline_access scope to enable refresh tokens
        const silentRequest = {
          account: account,
          scopes: [
            'User.Read',
            'Mail.Read',
            'Mail.ReadWrite', 
            'Calendars.Read',
            'Files.Read.All',
            'Contacts.Read',
            'offline_access'
          ]
        };

        const silentResult = await msalInstance.acquireTokenSilent(silentRequest);
        
        logger.info('MSAL silent token acquisition', {
          hasAccessToken: !!silentResult.accessToken,
          expiresOn: silentResult.expiresOn
        });

        // Note: MSAL handles refresh tokens internally and doesn't expose them
        // The refresh token is stored securely in MSAL's cache and will be used
        // automatically when calling acquireTokenSilent() for token refresh
        logger.info('MSAL will handle token refresh automatically using internal cache');

        // Persist connection in our DB via service layer
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        const expiresAtIso = silentResult.expiresOn ? silentResult.expiresOn.toISOString() : new Date(Date.now() + (3600 * 1000)).toISOString();

        logger.info('Attempting to save Microsoft connection via MSAL', { 
          userId: user.id, 
          hasAccessToken: !!silentResult.accessToken,
          expiresAt: expiresAtIso
        });

        const result = await microsoft365Service.connect(
          user.id,
          {
            access_token: silentResult.accessToken,
            refresh_token: '', // MSAL handles refresh tokens internally
            scope: 'User.Read Mail.Read Mail.ReadWrite Calendars.Read Files.Read.All Contacts.Read offline_access',
            expires_at: expiresAtIso,
          }
        );

        logger.info('MSAL connection result', { success: !result.error, error: result.error });

        if (result.error) {
          throw new Error(result.error || 'Failed to save Microsoft connection');
        }

        setStatus('discovery');
        toast({
          title: 'Connection Successful',
          description: 'Microsoft 365 has been connected successfully! Now let\'s discover your available services.',
        });
        return;
      } else {
        // No MSAL response - this might be a direct navigation
        logger.warn('No MSAL response found - redirecting to Microsoft 365 setup');
        // Redirect to the integration marketplace instead of showing an error
        navigate('/integrations/marketplace', { replace: true });
        return;
      }
    } catch (error) {
      logger.error('Microsoft 365 callback failed', { 
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        debugInfo 
      });
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
    }
  }, [navigate, user?.id, loading]);

  const handleContinue = () => {
    navigate('/integrations/marketplace');
  };

  const handleDiscoveryComplete = () => {
    setStatus('success');
  };

  const handleDiscoverySkip = () => {
    setStatus('success');
  };

  const handleRetry = () => {
    // Clear Microsoft and MSAL session storage
    const allKeys = Object.keys(sessionStorage);
    const microsoftKeys = allKeys.filter(key => key.includes('microsoft') || key.includes('msal'));
    
    microsoftKeys.forEach(key => {
      sessionStorage.removeItem(key);
      logger.info('Cleared session storage key', { key });
    });
    
    logger.info('Cleared Microsoft and MSAL session storage', { 
      clearedKeys: microsoftKeys,
      remainingKeys: Object.keys(sessionStorage)
    });
    
    navigate('/integrations/marketplace');
  };

  // Show loading state while authentication is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Loading Authentication
            </CardTitle>
            <CardDescription>
              Verifying your authentication...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we verify your authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Connecting Microsoft 365
            </CardTitle>
            <CardDescription>
              Completing your Microsoft 365 connection...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we complete your Microsoft 365 connection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Connection Failed
            </CardTitle>
            <CardDescription>
              Failed to connect Microsoft 365
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An unknown error occurred while connecting Microsoft 365.'}
              </AlertDescription>
            </Alert>
            {debugInfo && (
              <Alert>
                <AlertDescription>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {debugInfo}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'discovery') {
    return (
      <Microsoft365ServiceDiscovery
        onComplete={handleDiscoveryComplete}
        onSkip={handleDiscoverySkip}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-600" />
            Connection Successful
          </CardTitle>
          <CardDescription>
            Microsoft 365 has been connected successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Your Microsoft 365 account is now connected and ready to use.
          </p>
          <Button onClick={handleContinue} className="w-full">
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Integrations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Microsoft365CallbackPage; 
