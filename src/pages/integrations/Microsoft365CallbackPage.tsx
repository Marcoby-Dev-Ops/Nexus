import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger.ts';

const Microsoft365CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Callback already processed, skipping...');
      return;
    }
    
    hasProcessed.current = true;
    setStatus('processing');
    
    try {
      // Get OAuth parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (errorParam) {
        logger.error({ error: errorParam, description: errorDescription }, 'Microsoft OAuth error');
        setError(errorDescription || errorParam);
        setStatus('error');
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        const errorMsg = 'Missing required OAuth parameters';
        logger.error({ code: !!code, state: !!state }, errorMsg);
        setError(errorMsg);
        setStatus('error');
        return;
      }

      // Get code verifier from session storage
      const codeVerifier = sessionStorage.getItem('microsoft_code_verifier');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Retrieved code verifier: ', { 
        hasCodeVerifier: !!codeVerifier, 
        codeVerifierLength: codeVerifier?.length,
        currentUrl: window.location.href,
        currentOrigin: window.location.origin,
        sessionStorageKeys: Object.keys(sessionStorage)
      });
      
      if (!codeVerifier) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Code verifier not found in session storage!');
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Available session storage keys: ', Object.keys(sessionStorage));
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('This will cause the OAuth flow to fail with code_verifier mismatch');
        throw new Error('Code verifier not found. Please try connecting again.');
      }

      // Clear code verifier from session storage (only if it exists)
      if (codeVerifier) {
        sessionStorage.removeItem('microsoft_code_verifier');
      }

      // Exchange code for tokens directly in the browser (SPA requirement)
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_NEXT_PUBLIC_APP_URL 
        ? `${import.meta.env.VITE_NEXT_PUBLIC_APP_URL}/integrations/microsoft/callback`
        : `${window.location.origin}/integrations/microsoft/callback`;
      
      const params = new URLSearchParams({
        clientid: clientId,
        scope: 'User.Read Organization.Read.All openid profile email offline_access',
        code,
        redirecturi: redirectUri,
        granttype: 'authorization_code',
        ...(codeVerifier && { codeverifier: codeVerifier }),
      });

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Token exchange parameters: ', {
        clientid: clientId,
        scope: 'User.Read Organization.Read.All openid profile email offline_access',
        codelength: code?.length,
        redirecturi: redirectUri,
        granttype: 'authorization_code',
        hascode_verifier: !!codeVerifier,
        codeverifier_length: codeVerifier?.length,
        paramsstring: params.toString()
      });

      const tokenResponse = await fetch('https: //login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Token exchange failed: ', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorData
        });
        throw new Error(errorData.error_description || `Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

                      // Now call the Edge Function with the tokens
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                  throw new Error('No valid session found');
                }

                // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Calling edge function with session token: ', {
                  hasSessionToken: !!session.access_token,
                  tokenLength: session.access_token?.length,
                  supabaseUrl: import.meta.env.VITE_SUPABASE_URL
                });

                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-graph-oauth-callback`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    accesstoken: tokenData.access_token,
                    refreshtoken: tokenData.refresh_token,
                    expiresin: tokenData.expires_in,
                    scope: tokenData.scope,
                    tokentype: tokenData.token_type,
                  }),
                });

                // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Edge function response: ', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok
                });

      if (!response.ok) {
        const errorData = await response.json();
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Edge function error response: ', errorData);
        throw new Error(errorData.error_description || errorData.error || `Failed to complete OAuth flow: ${response.status}`);
      }

      const result = await response.json();
      const success = result.success;
      
      if (success) {
        setStatus('success');
        toast({
          title: 'Connection Successful',
          description: 'Microsoft 365 has been connected successfully!',
        });
      } else {
        throw new Error('Failed to complete OAuth flow');
      }
    } catch (error) {
      logger.error({ error }, 'Microsoft 365 callback failed');
      setError(error instanceof Error ? error.message: 'Unknown error occurred');
      setStatus('error');
    }
  };

  const handleContinue = () => {
    navigate('/integrations');
  };

  const handleRetry = () => {
    navigate('/integrations');
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-success" />
            Connection Successful
          </CardTitle>
          <CardDescription>
            Microsoft 365 has been connected successfully!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Your Microsoft 365 account is now connected and ready to sync data.
            </AlertDescription>
          </Alert>
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