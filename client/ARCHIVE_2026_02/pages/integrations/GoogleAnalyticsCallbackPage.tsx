import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

const GoogleAnalyticsCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  const handleCallback = async (): Promise<void> => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      logger.info('Google Analytics callback already processed, skipping...');
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

      logger.info('🔧 [Google Analytics Callback] Received parameters:', {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!errorParam,
        url: window.location.href,
        code: code ? `${code.substring(0, 10)}...` : null,
        state: state ? `${state.substring(0, 20)}...` : null,
        errorParam,
        errorDescription
      });

      // Check for OAuth errors
      if (errorParam) {
        logger.error('Google Analytics OAuth error', { error: errorParam, description: errorDescription });
        setError(errorDescription || errorParam);
        setStatus('error');
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        const errorMsg = 'Missing required OAuth parameters';
        logger.error(errorMsg, { code: !!code, state: !!state, codeLength: code?.length, stateLength: state?.length });
        setError(errorMsg);
        setStatus('error');
        return;
      }

      // Get user session for authentication
      const result = await authentikAuthService.getSession();
      const session = result.data;
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the Edge Function to handle the complete OAuth flow
      logger.info('🔧 [Google Analytics Callback] Calling Edge Function for OAuth processing');

      const requestBody = {
        code,
        state,
        error: errorParam,
        error_description: errorDescription
      };

      logger.info('🔧 [Google Analytics Callback] Sending request body:', {
        hasCode: !!requestBody.code,
        hasState: !!requestBody.state,
        hasError: !!requestBody.error,
        hasErrorDescription: !!requestBody.error_description,
        bodyKeys: Object.keys(requestBody)
      });

      const response = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          provider: 'google-analytics',
          ...requestBody
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('🔧 [Google Analytics Callback] Edge Function error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `OAuth processing failed: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'OAuth processing failed');
      }

      logger.info('🔧 [Google Analytics Callback] OAuth flow completed successfully:', responseData.data);
      setStatus('success');

    } catch (err) {
      logger.error('Unhandled Google Analytics callback error', { error: err });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleContinue = () => navigate('/integrations');

  useEffect(() => {
    handleCallback();
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Connecting Google Analytics...</h2>
            <p className="text-muted-foreground">Please wait while we complete the connection.</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Google Analytics Connected!</h2>
            <p className="text-muted-foreground mb-6">
              Your Google Analytics account has been successfully connected to Nexus.
            </p>
            <Button onClick={handleContinue} className="w-full">
              Continue to Integrations
            </Button>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'An error occurred while connecting Google Analytics.'}
            </p>
            <div className="space-y-2">
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Return to Integrations
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="ghost" 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Google Analytics Integration</CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAnalyticsCallbackPage;
