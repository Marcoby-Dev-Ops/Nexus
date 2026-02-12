import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/shared/contexts/UserContext';

interface SubscriptionPayload {
  plan_name?: string;
  tier?: string;
}

export interface CurrentUser {
  id: string | null;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  planName: string;
  tier: string;
  isAuthenticated: boolean;
}

function normalizeHandle(input?: string | null): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  return raw.startsWith('@') ? raw.slice(1) : raw;
}

export function useCurrentUser() {
  const { user, session, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [plan, setPlan] = useState<SubscriptionPayload | null>(null);

  useEffect(() => {
    const accessToken = session?.session?.accessToken;

    if (!isAuthenticated || !accessToken) {
      setPlan(null);
      return;
    }

    let isCancelled = false;

    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/me/subscription', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });

        if (!response.ok) return;
        const result = await response.json();
        if (!isCancelled && result?.success && result?.data) {
          setPlan(result.data as SubscriptionPayload);
        }
      } catch {
        // Non-critical: menu falls back to Free.
      }
    };

    fetchSubscription();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, session?.session?.accessToken]);

  const currentUser = useMemo<CurrentUser>(() => {
    const profileData = (profile || {}) as Record<string, unknown>;
    const firstName = String((profileData.first_name as string) || user?.firstName || '').trim();
    const lastName = String((profileData.last_name as string) || user?.lastName || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const email = String((profileData.email as string) || user?.email || '').trim();
    const fallbackName = email.includes('@') ? email.split('@')[0] : '';

    const name = String(
      (profileData.display_name as string)
      || (profileData.full_name as string)
      || fullName
      || user?.name
      || fallbackName
      || 'User'
    ).trim();

    const explicitHandle = normalizeHandle(
      (profileData.username as string)
      || (profileData.handle as string)
      || (user as any)?.preferred_username
    );
    const emailHandle = normalizeHandle(email.includes('@') ? email.split('@')[0] : '');
    const handle = explicitHandle || emailHandle;

    const avatarUrl = String((profileData.avatar_url as string) || '').trim() || undefined;
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.trim() || (name[0] || 'U').toUpperCase();

    const planName = String(
      plan?.plan_name
      || (profileData.subscription_tier as string)
      || 'Free'
    );

    return {
      id: user?.id || null,
      name,
      handle,
      email,
      avatarUrl,
      initials,
      planName,
      tier: String(plan?.tier || 'basic'),
      isAuthenticated,
    };
  }, [isAuthenticated, plan?.plan_name, plan?.tier, profile, user]);

  return {
    currentUser,
    loading: authLoading || profileLoading,
  };
}
