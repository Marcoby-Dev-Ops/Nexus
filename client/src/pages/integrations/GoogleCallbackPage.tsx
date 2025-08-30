import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Database, CheckCircle2, AlertTriangle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async (): Promise<void> => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    setStatus('processing');

    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        logger.error('Google OAuth error', { error: errorParam, description: errorDescription });
        setError(errorDescription || errorParam);
        setStatus('error');
        return;
      }

      if (!code || !state) {
        const msg = 'Missing required OAuth parameters';
        logger.error(msg, { hasCode: !!code, hasState: !!state });
        setError(msg);
        setStatus('error');
        return;
      }

      const result = await authentikAuthService.getSession();
      const session = result.data;

      if (!session?.access_token) {
        setError('No valid session found');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          provider: 'google',
          code, 
          state 
        }),
      });

      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        logger.error('Google callback failed', { status: res.status, details });
        setError(details?.error || 'Failed to complete Google OAuth');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (err) {
      logger.error('Unhandled Google callback error', { error: err });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleContinue = () => navigate('/integrations');
  const handleRetry = () => navigate('/integrations/marketplace');

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Connecting Google
            </CardTitle>
            <CardDescription>Completing your Google connection…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">Please wait…</p>
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
            <CardDescription>Failed to connect Google</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error || 'An unknown error occurred.'}</AlertDescription>
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
          <CardDescription>Google has been connected successfully!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleContinue} className="w-full">
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Integrations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallbackPage;


