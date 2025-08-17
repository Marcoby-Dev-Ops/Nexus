import React, { useEffect, useRef, useState } from 'react';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { Button } from '@/shared/components/ui/Button';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const OrganizationSelector: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { orgs, activeOrgId, setActiveOrg, getActiveOrg, loadMemberships, loading } = useOrganizationStore();
  const [isOpen, setIsOpen] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);

  const activeOrg = getActiveOrg();

  // Check if user has valid authentication session
  const hasValidSession = () => {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      return !!(session?.accessToken);
    } catch {
      return false;
    }
  };

  // Ensure organization memberships are loaded when authenticated
  useEffect(() => {
    // Wait for auth to be fully loaded and user to be authenticated
    if (authLoading) return;
    if (!user?.id) return;
    if (!isAuthenticated) return;
    if (!hasValidSession()) return;
    if (orgs.length === 0 && !loading) {
      loadMemberships(user.id).catch((error) => {
        logger.error('Failed to load organization memberships', { error, userId: user.id });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, isAuthenticated]);

  // Lightweight retry to recover after policy changes or first-load race
  useEffect(() => {
    // Wait for auth to be fully loaded and user to be authenticated
    if (authLoading) return;
    if (!user?.id) return;
    if (!isAuthenticated) return;
    if (!hasValidSession()) return;
    if (orgs.length > 0) return;
    if (loading) return;
    if (retryCountRef.current >= 3) return;

    retryTimerRef.current = window.setTimeout(() => {
      retryCountRef.current += 1;
      loadMemberships(user.id).catch((error) => {
        logger.warn('Retry loadMemberships failed', { attempt: retryCountRef.current, error, userId: user.id });
      });
    }, 2000);

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // Include orgs.length and loading to re-evaluate
  }, [user?.id, authLoading, isAuthenticated, orgs.length, loading, loadMemberships]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading authentication...</span>
      </div>
    );
  }

  // Show loading state while organizations are loading
  if (loading && orgs.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading organizations…</span>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated || !hasValidSession()) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Not authenticated</span>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No Organizations</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Building2 className="h-4 w-4" />
        <span className="truncate max-w-32">
          {activeOrg?.name || 'Select Organization'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-md shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Organizations
            </div>
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrg(org.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-accent ${
                  org.id === activeOrgId ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org.id === activeOrgId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
