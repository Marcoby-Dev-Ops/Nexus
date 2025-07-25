import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * AuthCallback - Handles auth redirects from Supabase (magic links, password reset, etc.)
 * This component waits for the auth state to settle and then redirects appropriately.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the next parameter from URL
        const next = searchParams.get('next');
        
        // Check for error parameters
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          navigate('/login', { replace: true });
          return;
        }

        // Wait for auth state to settle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Failed to get session:', sessionError);
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          console.log('Auth callback successful, redirecting to:', next || '/home');
          navigate(next || '/home', { replace: true });
        } else {
          console.log('No session found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Finalizing Authentication</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
} 