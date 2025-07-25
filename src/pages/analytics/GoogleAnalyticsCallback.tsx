import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  BarChart3 
} from 'lucide-react';
import { googleAnalyticsService } from '@/services/analytics/googleAnalyticsService';

const GoogleAnalyticsCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        // Exchange code for tokens
        await googleAnalyticsService.exchangeCodeForTokens(code);
        
        setStatus('success');
        setMessage('Google Analytics connected successfully!');

        // Close popup if this is in a popup window
        if (window.opener) {
          // Signal parent window that auth is complete
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_SUCCESS',
            authenticated: true
          }, window.location.origin);
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // If not in popup, redirect to integrations page after delay
        setTimeout(() => {
          navigate('/integrations?connected=google-analytics');
        }, 2000);

      } catch (err: any) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('OAuth callback error: ', err);
        setStatus('error');
        setMessage(err.message || 'Failed to complete authorization');

        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_ERROR',
            error: err.message
          }, window.location.origin);
          
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/integrations');
    }
  };

  const handleContinue = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/integrations');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-success" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-12 h-12 text-destructive" />
            )}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant={status === 'error' ? 'error' : 'default'}>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>

          {status === 'success' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {window.opener 
                  ? 'This window will close automatically...' 
                  : 'Redirecting to integrations page...'
                }
              </p>
              <Button onClick={handleContinue} variant="outline" size="sm">
                Continue to Integrations
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <Button onClick={handleRetry} size="sm">
                Back to Integrations
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please wait while we complete the connection...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAnalyticsCallback; 