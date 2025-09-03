import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { logger } from '@/shared/utils/logger';
import SignupCompletion from '@/components/auth/SignupCompletion';

/**
 * AuthentikAuthCallback - Handles OAuth2 redirects from Authentik
 * This component processes the authorization code and exchanges it for tokens.
 */
export default function AuthentikAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const hasProcessed = useRef(false);
  const { refreshAuth } = useAuthentikAuth();

  // Immediate logging to confirm component is mounted
  console.log('🔍 [MarcobyIAMCallback] Component mounted');
  console.log('🔍 [MarcobyIAMCallback] URL:', window.location.href);
  console.log('🔍 [MarcobyIAMCallback] Search params:', Object.fromEntries(searchParams.entries()));

  useEffect(() => {
    const handleCallback = async () => {
      // Add immediate logging to see if callback is reached
      logger.info('🔍 [MarcobyIAMCallback] Callback component mounted, processing...');
      logger.info('🔍 [MarcobyIAMCallback] Current URL:', window.location.href);
      logger.info('🔍 [MarcobyIAMCallback] Search params:', Object.fromEntries(searchParams.entries()));
      
      // Prevent multiple processing
      if (hasProcessed.current) {
        logger.info('OAuth callback already processed, skipping...');
        return;
      }
      
      hasProcessed.current = true;
      
      try {
        logger.info('Processing Marcoby IAM OAuth callback...');

        // Get parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (error) {
          const errorMessage = errorDescription || error;
          logger.error('OAuth callback error:', { error, errorDescription });
          setError(errorMessage);
          setProcessing(false);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          const errorMessage = 'Missing required OAuth parameters';
          logger.error(errorMessage, { code: !!code, state: !!state });
          setError(errorMessage);
          setProcessing(false);
          return;
        }

                 // Handle OAuth callback
         logger.info('🔍 [MarcobyIAMCallback] Calling handleOAuthCallback with code and state');
         const result = await authentikAuthService.handleOAuthCallback(code, state);
         
         logger.info('🔍 [MarcobyIAMCallback] handleOAuthCallback result:', { 
           success: result.success, 
           hasData: !!result.data, 
           error: result.error 
         });
         
         if (!result.success || !result.data) {
           const errorMessage = result.error || 'Authentication failed';
           logger.error('OAuth callback failed:', errorMessage);
           setError(errorMessage);
           setProcessing(false);
           return;
         }

         // Success! Refresh authentication state
         logger.info('🔍 [MarcobyIAMCallback] OAuth callback successful, refreshing auth state', { 
           userId: result.data.id 
         });
         
         // Refresh the authentication context (only once)
         logger.info('🔍 [MarcobyIAMCallback] Calling refreshAuth...');
         await refreshAuth();
         logger.info('🔍 [MarcobyIAMCallback] refreshAuth completed');
         
         // Check if this is a new user (you can implement your own logic here)
         // For now, we'll check if the user came from the signup flow
         const isFromSignup = searchParams.get('signup') === 'true';
         
         if (isFromSignup) {
           logger.info('🔍 [MarcobyIAMCallback] New user detected, showing completion flow');
           setIsNewUser(true);
           setShowCompletion(true);
           setProcessing(false);
         } else {
           // Get the next parameter from URL or default to dashboard
           const next = searchParams.get('next') || '/dashboard';
           logger.info('🔍 [MarcobyIAMCallback] Redirecting to:', next);
           
           // Add a small delay to ensure authentication state is properly updated
           setTimeout(() => {
             logger.info('🔍 [MarcobyIAMCallback] Executing navigation to:', next);
             navigate(next, { replace: true });
           }, 500);
         }
        
      } catch (error) {
        logger.error('Unexpected error during OAuth callback:', error);
        setError('An unexpected error occurred during authentication');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, refreshAuth, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Finalizing Authentication</h2>
          <p className="text-muted-foreground">Please wait while we complete your login...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show signup completion flow for new users
  if (showCompletion && isNewUser) {
    return (
      <SignupCompletion 
        onComplete={() => {
          setShowCompletion(false);
          navigate('/dashboard', { replace: true });
        }}
      />
    );
  }

  return null;
}
