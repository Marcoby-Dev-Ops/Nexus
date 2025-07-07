import React from 'react';
import { useOrganizationStore } from '@/lib/stores/organizationStore';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

export const OrgSwitcher: React.FC = () => {
  const { user } = useAuth();
  const { orgs, activeOrgId, setActiveOrg, loadMemberships } = useOrganizationStore();

  React.useEffect(() => {
    if (user) {
      loadMemberships(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [open, setOpen] = React.useState(false);

  const active = orgs.find((o) => o.id === activeOrgId);

  if (!activeOrgId) return null;

  return (
    <div className="relative" onBlur={() => setOpen(false)} tabIndex={0}>
      <button
        className="flex items-center gap-1 px-4 py-2 rounded-md bg-muted text-sm hover:bg-muted/80"
        title="Switch organisation"
        onClick={() => setOpen((p) => !p)}
      >
        <span>{active?.name ?? 'Org'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-[70]">
          {orgs.map((org) => (
            <button
              key={org.id}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-accent ${org.id === activeOrgId ? 'bg-muted' : ''}`}
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