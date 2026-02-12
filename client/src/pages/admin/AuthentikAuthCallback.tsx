import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const hasProcessed = useRef(false);
  const { refreshAuth } = useAuthentikAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing (React.StrictMode can cause double-mount)
      if (hasProcessed.current) {
        logger.info('OAuth callback already processed, skipping...');
        return;
      }
      hasProcessed.current = true;

      logger.info('🔍 [MarcobyIAMCallback] Processing OAuth callback...', {
        url: window.location.href,
        params: Object.fromEntries(searchParams.entries()),
      });

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
          userId: result.data.user?.id,
          groups: result.data.user?.groups,
        });

        // Refresh the authentication context (only once)
        logger.info('🔍 [MarcobyIAMCallback] Calling refreshAuth...');
        await refreshAuth();
        logger.info('🔍 [MarcobyIAMCallback] refreshAuth completed');

        // CHECK FOR INSTANCE REDIRECTION (Authentik-Managed)
        try {
          const attributes = result.data.user?.attributes;
          const userInstanceUrl = attributes?.instance_url || attributes?.nexus_instance_url;

          if (userInstanceUrl) {
            const currentOrigin = window.location.origin;
            // Ensure instanceUrl is a full URL or at least has a protocol
            const normalizedInstanceUrl = userInstanceUrl.startsWith('http') ? userInstanceUrl : `https://${userInstanceUrl}`;

            if (!normalizedInstanceUrl.includes(currentOrigin)) {
              logger.info('🔍 [MarcobyIAMCallback] Authentik-managed instance mismatch detected, redirecting...', {
                currentOrigin,
                targetInstance: normalizedInstanceUrl
              });

              window.location.href = normalizedInstanceUrl;
              return; // Stop further processing
            }
          }
        } catch (instanceError) {
          logger.error('Error checking Authentik instance redirection:', instanceError);
          // Continue with normal redirect if instance check fails
        }

        // Check if this is a new user (you can implement your own logic here)
        // For now, we'll check if the user came from the signup flow
        const isFromSignup = searchParams.get('signup') === 'true';

        if (isFromSignup) {
          logger.info('🔍 [MarcobyIAMCallback] New user detected, showing completion flow');
          setIsNewUser(true);
          setShowCompletion(true);
          setProcessing(false);
        } else {
          // Determine redirect destination
          // Priority: 1) URL next param, 2) location state from, 3) default to chat (Single Purpose)
          const urlNext = searchParams.get('next');
          const stateFrom = location.state?.from?.pathname;
          // FORCE CHAT DEFAULT: replace '/dashboard' with '/chat'
          const redirectDestination = (urlNext || stateFrom || '/chat').replace('/dashboard', '/chat');

          logger.info('🔍 [MarcobyIAMCallback] Redirecting to:', {
            urlNext,
            stateFrom,
            finalDestination: redirectDestination
          });

          // Add a small delay to ensure authentication state is properly updated
          setTimeout(() => {
            logger.info('🔍 [MarcobyIAMCallback] Executing navigation to:', redirectDestination);
            navigate(redirectDestination, { replace: true });
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
