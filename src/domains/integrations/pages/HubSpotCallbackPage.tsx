import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  XCircle
} from 'lucide-react';
import { supabase } from '@/core/supabase';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/core/auth/logger';

const HubSpotCallbackPage: React.FC = () => {
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

      console.log('🔧 [HubSpot Callback] Received parameters:', {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!errorParam,
        url: window.location.href
      });

      // Note: Unlike Microsoft, HubSpot's OAuth endpoint doesn't support CORS
      // So we must use our backend function for token exchange

      // Check for OAuth errors
      if (errorParam) {
        logger.error({ error: errorParam }, 'HubSpot OAuth error');
        setError(errorParam);
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

      // Parse state parameter to get user ID
      let userId: string | null = null;
      try {
        const stateData = JSON.parse(atob(state));
        console.log('🔧 [HubSpot Callback] State data:', {
          service: stateData.service,
          hasUserId: !!stateData.userId,
          timestamp: stateData.timestamp
        });
        
        if (stateData.service !== 'hubspot') {
          throw new Error('Invalid state parameter');
        }
        userId = stateData.userId;
      } catch (e) {
        console.error('Failed to parse state parameter:', e);
        setError('Invalid state parameter');
        setStatus('error');
        return;
      }

      if (!userId) {
        setError('No user ID found in state parameter');
        setStatus('error');
        return;
      }

      // Exchange code for tokens via backend to avoid CORS issues
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession?.access_token) {
        throw new Error('No valid session found');
      }

      console.log('🔧 [HubSpot Callback] Exchanging code for tokens via backend');

      const exchangeResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-exchange-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/integrations/hubspot/callback`
        })
      });

      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json();
        throw new Error(errorData.error || `Token exchange failed: ${exchangeResponse.status}`);
      }

      const { tokens, portalInfo: exchangePortalInfo } = await exchangeResponse.json();
      console.log('🔧 [HubSpot Callback] Token exchange successful');

      // Store tokens and integration data via authenticated Supabase function
      const { data: { session: storeSession } } = await supabase.auth.getSession();
      if (!storeSession?.access_token) {
        throw new Error('No valid session found');
      }

      console.log('🔧 [HubSpot Callback] Storing integration data...');

      // Call the authenticated Supabase function to store the integration
                   const storeResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-store-integration-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storeSession.access_token}`
        },
        body: JSON.stringify({
          userId,
          tokens,
          portalInfo: exchangePortalInfo
        })
      });

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.error || 'Failed to store integration');
      }

      console.log('🔧 [HubSpot Callback] Integration stored successfully');
      setStatus('success');

      // Show success toast
      toast({
        title: 'HubSpot Connected Successfully!',
        description: 'Your HubSpot integration is now active.',
        variant: 'default'
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/integrations?success=hubspot');
      }, 2000);

    } catch (error) {
      console.error('HubSpot callback error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setStatus('error');
    }
  };

  const handleContinue = () => {
    navigate('/integrations');
  };

  const handleRetry = () => {
    hasProcessed.current = false;
    setStatus('processing');
    setError(null);
    handleCallback();
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle>Connecting HubSpot</CardTitle>
            <CardDescription>
              Processing your HubSpot authorization...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Please wait while we complete your HubSpot integration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>HubSpot Connected Successfully!</CardTitle>
            <CardDescription>
              Your HubSpot integration is now active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                HubSpot has been successfully connected to your account. You can now sync your HubSpot data.
              </AlertDescription>
            </Alert>
            <Button onClick={handleContinue} className="w-full">
              Continue to Integrations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle>Connection Failed</CardTitle>
          <CardDescription>
            Unable to connect HubSpot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'An unexpected error occurred while connecting HubSpot.'}
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2">
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              Try Again
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotCallbackPage; 