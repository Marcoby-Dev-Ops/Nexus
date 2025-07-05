import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/core/supabase';

/**
 * AuthCallback - Handles auth redirects from Supabase.
 * It waits for the AuthContext to finish loading and then redirects.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Directly finish Supabase OAuth and navigate
    const finish = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error('AuthCallback: no session or error', error);
        navigate('/login', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    };
    finish();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center">
        <Spinner size={40} className="mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Finalizing Authentication</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
} 