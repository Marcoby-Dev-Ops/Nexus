import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import { performSignOut } from '@/shared/utils/signOut';
import { useAuthentikVerification } from '@/shared/hooks/useAuthentikVerification';
import { logger } from '@/shared/utils/logger';

export default function EmailNotVerified() {
  const { signOut } = useAuth();
  const { requestEmailVerification, loading, error } = useAuthentikVerification();

  const handleRequestVerification = async () => {
    try {
      const result = await requestEmailVerification();
      
      if (result.success && result.url) {
        // Redirect to Authentik for verification
        window.location.href = result.url;
      } else {
        logger.error('Failed to request email verification', { error: result.error });
        // Show error message to user
        alert('Failed to request verification. Please try again or contact support.');
      }
    } catch (err) {
      logger.error('Error requesting email verification', { error: err });
      alert('An error occurred. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      performSignOut();
    } catch (error) {
      logger.error('Error signing out', { error });
      // Force sign out even if there's an error
      performSignOut();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-primary mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Verify Your Email</h2>
        <p className="text-muted-foreground mb-6">
          Your email address needs to be verified through Authentik to complete your registration.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Click the button below to be redirected to Authentik for email verification.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleRequestVerification}
            disabled={loading}
            className="bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Verify Email via Authentik'}
          </Button>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </Button>
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground">
          <p>Having trouble? Contact your administrator or support team.</p>
        </div>
      </div>
    </div>
  );
} 
