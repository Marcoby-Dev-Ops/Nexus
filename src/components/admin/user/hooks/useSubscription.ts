import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';

interface UseSubscriptionReturn {
  plan: 'free' | 'pro' | 'enterprise';
  isLoading: boolean;
  error: string | null;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Replace with actual subscription API call
        // For now, return free plan as default
        setPlan('free');
      } catch (err) {
        setError('Failed to fetch subscription data');
        console.error('Error fetching subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchSubscription();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    plan,
    isLoading,
    error,
  };
}; 