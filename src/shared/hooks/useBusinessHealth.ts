import React from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth.ts';

async function fetchHealth() {
  // The useAuth hook now ensures we have a valid session,
  // and supabase-js automatically attaches the token.
  // The manual token management can be removed for simplicity.
  const { data, error } = await supabase.functions.invoke('business_health');

  if (error) throw error;
  return data;
}

export function useBusinessHealth() {
  const { session } = useAuth();
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [initialLoadDone, setInitialLoadDone] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!session) {
      // Don't start loading if there's no session.
      // When auth is done loading and there's still no session, stop loading.
      if (!loading) {
        setLoading(false);
        setData(null);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const json = await fetchHealth();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      if ((err as any)?.status !== 401 && !(err as any)?.message?.includes('Auth session missing')) {
        setError(err as Error);
      } else {
        setData(null);
      }
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to fetch business health: ', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, loading]); // Only depend on session token, not entire session object

  React.useEffect(() => {
    // Only run the effect if auth has initialized and the initial load hasn't been triggered.
    if (!loading && !initialLoadDone) {
      load();
      setInitialLoadDone(true);
    }

    // Set up polling, but only if there is a session.
    if (session) {
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [load, loading, initialLoadDone, session?.access_token]); // Only depend on session token

  // The hook is loading if auth is loading or if data is being fetched.
  return { health: data, isLoading: loading || loading, error };
} 