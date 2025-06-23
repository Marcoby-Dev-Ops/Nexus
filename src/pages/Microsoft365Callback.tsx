import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function Microsoft365Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Don't process callback until auth is loaded
    if (authLoading) {
      setMessage('Loading user authentication...');
      return;
    }

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Microsoft 365 callback received:', { code: !!code, state, error, user: !!user });

        if (error) {
          throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        if (!user) {
          throw new Error('User not authenticated - please log in and try again');
        }

        // Parse state to get user ID - handle both pipe and hyphen formats
        let userId, timestamp;
        
        if (state.includes('|')) {
          // New format: userId|timestamp
          const stateParts = state.split('|');
          userId = stateParts[0];
          timestamp = stateParts[1];
        } else if (state.includes('-')) {
          // Handle UUID with hyphens
          const stateParts = state.split('-');
          
          if (stateParts.length >= 6) {
            // UUID format: 8-4-4-4-12 + timestamp
            const uuidParts = stateParts.slice(0, 5);
            userId = uuidParts.join('-');
            timestamp = stateParts[5];
          } else {
            // Simple format
            userId = stateParts[0];
            timestamp = stateParts[1];
          }
        } else {
          throw new Error('Invalid state parameter format');
        }
        
        console.log('State validation:', { 
          state,
          userId, 
          userActual: user.id, 
          timestamp
        });
        
        if (!userId || userId !== user.id) {
          throw new Error(`State parameter mismatch: expected ${user.id}, got ${userId}`);
        }
        
        // Validate timestamp is reasonable (within last hour)
        if (timestamp) {
          const stateTimestamp = parseInt(timestamp);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          
          if (isNaN(stateTimestamp) || (now - stateTimestamp) > oneHour) {
            throw new Error('State parameter expired or invalid');
          }
        }

        setMessage('Exchanging authorization code for access token...');

        // Call the edge function to complete the OAuth flow
        const { data, error: functionError } = await supabase.functions.invoke('microsoft-graph-oauth-callback', {
          body: {
            code,
            state,
            userId: user.id
          }
        });

        if (functionError) {
          throw new Error(functionError.message || 'Failed to complete OAuth flow');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setStatus('success');
        setMessage('Microsoft 365 integration connected successfully!');

        // Redirect back to integrations page after a short delay
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);

      } catch (error) {
        console.error('Microsoft 365 OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    // Only run callback when auth is loaded and we have the necessary parameters
    if (!authLoading && searchParams.get('code')) {
      handleCallback();
    }
  }, [searchParams, user, navigate, authLoading]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Connecting Microsoft 365
              </h1>
              <p className="text-gray-600 mb-4">
                {message || 'Processing your Microsoft 365 connection...'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Successful!
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you back to the integrations page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Failed
              </h1>
              <Alert variant="error" className="mb-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/integrations')}
                className="w-full"
              >
                Return to Integrations
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 