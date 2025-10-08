import React from 'react';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import type { Organization } from '@/shared/stores/organizationStore';
import { shallow } from 'zustand/shallow';
import { useAuth } from '@/hooks/index';
import { ChevronDown } from 'lucide-react';

export const OrgSwitcher: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  // select only the values we need and use shallow to avoid re-renders when other store fields change
  const [orgs, activeOrgId, setActiveOrg, loadMemberships] = (useOrganizationStore as any)((s: any) => [s.orgs as Organization[], s.activeOrgId as string | null, s.setActiveOrg as (id: string) => void, s.loadMemberships as (id: string) => Promise<void>], shallow) as [Organization[], string | null, (id: string) => void, (id: string) => Promise<void>];

  // Check if user has valid authentication session
  const hasValidSession = () => {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      // Check both possible locations for the access token
      return !!(session?.accessToken || session?.session?.accessToken);
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    // Wait for auth to be fully loaded and user to be authenticated
    if (authLoading) return;
    if (!user?.id) return;
    if (!isAuthenticated) return;
    if (!hasValidSession()) return;
    
    loadMemberships(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, isAuthenticated]);

  const [open, setOpen] = React.useState(false);

  const active = orgs.find((o: Organization) => o.id === activeOrgId);

  // Don't render if not authenticated or no active org
  if (!isAuthenticated || !hasValidSession() || !activeOrgId) return null;

  return (
    <div
      className="relative"
      role="button"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'Enter' || e.key === ' ') setOpen((p) => !p);
      }}
    >
      <button
        className="flex items-center gap-1 px-4 py-2 rounded-md bg-muted text-sm hover: bg-muted/80"
        title="Switch organisation"
        onClick={() => setOpen((p) => !p)}
      >
        <span>{active?.name ?? 'Org'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-dropdown">
          {orgs.map((org) => (
            <button
              key={org.id}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                org.id === activeOrgId ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => {
                setActiveOrg(org.id);
                setOpen(false);
              }}
            >
              {org.name} {org.role === 'owner' ? '⭐' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 
