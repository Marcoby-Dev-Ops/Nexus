import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 OAuth callback - Starting debug...');
        console.log('📍 Current URL:', window.location.href);
        console.log('📋 URL parameters:', Object.fromEntries(searchParams.entries()));

        // Check for OAuth errors first
        const oauthError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (oauthError) {
          console.error('❌ OAuth error detected:', oauthError, errorDescription);
          setError(`OAuth Error: ${oauthError} - ${errorDescription || 'No description provided'}`);
          setIsProcessing(false);
          return;
        }

        // Check for authorization code
        const code = searchParams.get('code');
        console.log('🔐 Authorization code:', code ? `Present (${code.substring(0, 10)}...)` : 'Missing');
        
        if (!code) {
          console.error('❌ No authorization code found in URL parameters');
          
          // Wait a moment to see if session appears (sometimes OAuth completes without code)
          console.log('⏳ Waiting for potential session update...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('✅ Session found without code, OAuth successful');
            setIsProcessing(false);
            // Let SupabaseProvider handle the redirect
            return;
          }
          
          setError('No authorization code received from Microsoft. The OAuth flow may have failed.');
          setIsProcessing(false);
          return;
        }

        console.log('✅ Authorization code found, attempting exchange...');

        // Use Supabase's built-in method to exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('❌ Code exchange failed:', exchangeError);
          setError(`Code Exchange Failed: ${exchangeError.message}`);
          setIsProcessing(false);
          return;
        }

        console.log('✅ Code exchange successful');
        
        if (data.session) {
          console.log('✅ Session established for user:', data.session.user?.email);
          setIsProcessing(false);
          // Let SupabaseProvider handle the redirect via onAuthStateChange
          // Don't redirect here to avoid race conditions
        } else {
          console.error('❌ No session in exchange response');
          setError('Authentication succeeded but no session was created');
          setIsProcessing(false);
        }

      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
          <div className="text-center space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary hover:text-primary underline"
            >
              Return to login
            </button>
            <div className="text-xs text-muted-foreground">
              <p>Debug info:</p>
              <p>URL: {window.location.href}</p>
              <p>Params: {Array.from(searchParams.keys()).join(', ') || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size={32} />
        <p className="mt-4 text-muted-foreground">
          {isProcessing ? 'Processing authentication...' : 'Authentication successful! Redirecting...'}
        </p>
      </div>
    </div>
  );
}; 