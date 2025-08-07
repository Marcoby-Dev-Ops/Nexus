import React, { useState } from 'react';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { Button } from '@/shared/components/ui/Button';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const OrganizationSelector: React.FC = () => {
  const { orgs, activeOrgId, setActiveOrg, getActiveOrg } = useOrganizationStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeOrg = getActiveOrg();

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
