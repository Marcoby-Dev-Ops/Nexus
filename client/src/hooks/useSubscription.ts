import { useState, useEffect } from 'react';
import { useAuthenticatedApi } from './useAuthenticatedApi';

export interface SubscriptionState {
  planName: string;
  balanceCents: number;
  monthlyAllowance: number;
  capabilities: string[];
  tier: 'basic' | 'standard' | 'premium' | 'unlimited';
  canInference: boolean;
  loading: boolean;
}

export function useSubscription() {
  const { fetchWithAuth } = useAuthenticatedApi();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    planName: 'Loading...',
    balanceCents: 0,
    monthlyAllowance: 0,
    capabilities: [],
    tier: 'basic',
    canInference: false,
    loading: true
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetchWithAuth('/api/me/subscription');
        if (response.ok) {
          const json = await response.json();
          if (mounted && json.success) {
            setSubscription({
              planName: json.data.plan_name,
              balanceCents: json.data.balance_cents,
              monthlyAllowance: json.data.monthly_allowance,
              capabilities: json.data.capabilities,
              tier: json.data.tier,
              canInference: json.data.can_inference,
              loading: false
            });
          }
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
        if (mounted) setSubscription(s => ({ ...s, loading: false }));
      }
    }

    load();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  const hasCapability = (cap: string) => {
    if (subscription.loading) return false;
    return subscription.capabilities.includes('all') || subscription.capabilities.includes(cap);
  };

  return { ...subscription, hasCapability };
}
