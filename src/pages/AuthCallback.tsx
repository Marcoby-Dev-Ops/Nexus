import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';

/**
 * AuthCallback - Handles auth redirects from Supabase for:
 * - Email confirmation
 * - OAuth providers
 * - Password reset
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Parse hash params from URL for password resets or OAuth logins
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);
    
    // Get the next path from query params, if provided
    const next = queryParams.get('next') || '/dashboard';
    
    // Handle Supabase auth callback
    const handleAuthCallback = async () => {
      try {
        // If this is a password reset, we need to set a new password
        if (next === '/reset-password') {
          // We'll navigate to a password reset form
          navigate('/reset-password', { replace: true });
          return;
        }
        
        // Get session to ensure auth worked
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          // Auth successful, redirect to dashboard or specified next page
          navigate(next, { replace: true });
        } else {
          // No session found, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {error ? (
        <div className="max-w-md p-6 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <Spinner size={40} className="mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Finalizing Authentication</h2>
          <p className="text-muted-foreground">Please wait while we log you in...</p>
        </div>
      )}
    </div>
  );
} 