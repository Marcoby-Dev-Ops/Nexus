/**
 * Single source of truth for user ID management
 * Handles both external (Authentik) and internal (database) user IDs
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './index';
import { callRPC } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface UserIdState {
  externalUserId: string | null;
  internalUserId: string | null;
  ready: boolean;
  error: string | null;
}

export function useCurrentUserId() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [state, setState] = useState<UserIdState>({
    externalUserId: null,
    internalUserId: null,
    ready: false,
    error: null
  });
  
  // Track if we've already resolved the user ID to prevent infinite loops
  const hasResolvedRef = useRef(false);

  // Extract external user ID from auth context
  const externalUserId = useMemo(() => {
    if (!user?.id) return null;
    const userId = String(user.id);
    return userId && userId !== 'undefined' && userId !== 'null' ? userId : null;
  }, [user?.id]);

  // Resolve internal user ID from database
  useEffect(() => {
    if (!externalUserId || authLoading || !isAuthenticated) {
      setState(prev => ({
        ...prev,
        externalUserId: null,
        internalUserId: null,
        ready: !authLoading,
        error: null
      }));
      hasResolvedRef.current = false; // Reset when user changes
      return;
    }

    // Prevent infinite loops by checking if we've already resolved for this user
    if (hasResolvedRef.current && state.externalUserId === externalUserId) {
      return;
    }

    const resolveInternalUserId = async () => {
      try {
        setState(prev => ({ ...prev, ready: false, error: null }));

        // Use the ensure_user_profile RPC function which handles mapping and profile creation
        const { data: profile, error } = await callRPC('ensure_user_profile', { external_user_id: externalUserId });
        
        if (error) {
          logger.warn('Failed to ensure user profile, using external ID as fallback', { externalUserId, error });
          setState({
            externalUserId,
            internalUserId: externalUserId,
            ready: true,
            error: null
          });
          hasResolvedRef.current = true;
          return;
        }

        if (profile && profile.length > 0) {
          // The RPC function returns the profile, and the profile.id is the internal user ID
          const userProfile = profile[0];
          setState({
            externalUserId,
            internalUserId: String(userProfile.id),
            ready: true,
            error: null
          });
          hasResolvedRef.current = true;
        } else {
          logger.warn('No profile returned from ensure_user_profile, using external ID as fallback', { externalUserId });
          setState({
            externalUserId,
            internalUserId: externalUserId,
            ready: true,
            error: null
          });
          hasResolvedRef.current = true;
        }
      } catch (err) {
        logger.error('Error resolving internal user ID', { externalUserId, error: err });
        setState({
          externalUserId,
          internalUserId: null,
          ready: true,
          error: 'Failed to resolve user ID'
        });
        hasResolvedRef.current = true;
      }
    };

    resolveInternalUserId();
  }, [externalUserId, authLoading, isAuthenticated]);

  return {
    ...state,
    // Convenience getters
    userId: state.internalUserId || state.externalUserId,
    hasValidUserId: !!(state.internalUserId || state.externalUserId),
    isLoading: !state.ready || authLoading
  };
}
