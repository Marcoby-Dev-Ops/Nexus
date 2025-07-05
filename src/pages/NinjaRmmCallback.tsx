import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Button } from '@/components/ui';
import { supabase } from '../lib/core/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function NinjaRmmCallback() {
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

        console.log('Callback received:', { code: !!code, state, error, user: !!user });

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        if (!user) {
          throw new Error('User not authenticated - please log in and try again');
        }

        // Parse state to get region - handle both old and new formats
        // Try pipe separator first (new format), then fallback to hyphen (old format)
        let userId, timestamp, region;
        
        if (state.includes('|')) {
          // New format: userId|timestamp|region
          const stateParts = state.split('|');
          userId = stateParts[0];
          timestamp = stateParts[1];
          region = stateParts.length >= 3 ? stateParts[2] : 'us';
        } else {
          // Old format with hyphens - need to be more careful with UUID parsing
          const stateParts = state.split('-');
          
          if (stateParts.length >= 6) {
            // UUID format: 8-4-4-4-12 + timestamp + optional region
            // Reconstruct UUID from first 5 parts, then get timestamp and region
            const uuidParts = stateParts.slice(0, 5); // Standard UUID has 5 parts
            userId = uuidParts.join('-');
            timestamp = stateParts[5];
            region = stateParts.length > 6 ? stateParts[6] : 'us';
          } else if (stateParts.length === 2) {
            // Simple format: userId-timestamp (no region)
            userId = stateParts[0];
            timestamp = stateParts[1];
            region = 'us';
          } else {
            // Fallback: treat as old format
            userId = stateParts[0];
            timestamp = stateParts[1];
            region = stateParts.length >= 3 ? stateParts[2] : 'us';
          }
        }
        
        console.log('State validation:', { 
          state,
          userId, 
          userActual: user.id, 
          timestamp, 
          region
        });
        
        if (!userId || userId !== user.id) {
          throw new Error(`State parameter mismatch: expected ${user.id}, got ${userId}`);
        }
        
        // Validate timestamp is reasonable (within last hour)
        const stateTimestamp = parseInt(timestamp);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (isNaN(stateTimestamp) || (now - stateTimestamp) > oneHour) {
          throw new Error('State parameter expired or invalid');
        }

        setMessage('Exchanging authorization code for access token...');

        // Call the edge function to complete the OAuth flow
        const { data, error: functionError } = await supabase.functions.invoke('ninjarmm-oauth-callback', {
          body: {
            code,
            state,
            region,
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
        setMessage('NinjaRMM integration connected successfully!');

        // Redirect back to integrations page after a short delay
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);

      } catch (error) {
        console.error('NinjaRMM OAuth callback error:', error);
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
                Connecting NinjaRMM
              </h1>
              <p className="text-gray-600 mb-4">
                {message || 'Processing your NinjaRMM connection...'}
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