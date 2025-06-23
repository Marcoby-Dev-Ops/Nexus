/**
 * Google Workspace OAuth Callback Handler
 * Handles OAuth flow completion for Google Workspace integration
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Button } from '@/components/ui';
import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { CheckCircle, AlertCircle, Loader2, HardDrive, Calendar } from 'lucide-react';

const GoogleWorkspaceCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google Workspace connection...');

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
        await googleWorkspaceService.exchangeCodeForTokens(code);
        
        setStatus('success');
        setMessage('Google Workspace connected successfully!');

        // Close popup if this is in a popup window
        if (window.opener) {
          // Signal parent window that auth is complete
          window.opener.postMessage({
            type: 'GOOGLE_WORKSPACE_AUTH_SUCCESS',
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
          navigate('/integrations?connected=google-workspace');
        }, 2000);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to complete authorization');

        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_WORKSPACE_AUTH_ERROR',
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <HardDrive className="w-8 h-8 text-blue-600" />
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold">Google Workspace</h2>
            
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">{message}</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                {!window.opener && (
                  <p className="text-sm text-muted-foreground">
                    Redirecting to integrations page...
                  </p>
                )}
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
                <Alert variant="error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  {window.opener ? 'Close' : 'Back to Integrations'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleWorkspaceCallback; 