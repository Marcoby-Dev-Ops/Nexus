import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { useCompanyContext } from '@/shared/contexts/CompanyContext';
import { logger } from '@/shared/utils/logger';
import { Button } from '@/shared/components/ui/Button';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const CompanySelector: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { company, loadingCompany } = useCompanyContext();
  const [isOpen, setIsOpen] = useState(false);

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

  // Show loading state while auth is initializing
  if (authLoading || loadingCompany) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading company...</span>
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

  // Show message if no company found
  if (!company) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No Company</span>
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
          {company.name || 'Select Company'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg z-dropdown">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Company
            </div>
            <button
              className="w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors bg-accent text-accent-foreground"
            >
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="truncate font-medium">{company.name}</span>
                  {company.industry && (
                    <span className="text-xs text-muted-foreground">{company.industry}</span>
                  )}
                </div>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </button>
            
            {/* Company details */}
            {company.description && (
              <div className="px-2 py-2 text-xs text-muted-foreground border-t mt-2 pt-2">
                <p className="truncate">{company.description}</p>
              </div>
            )}
            
            {company.website && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary underline"
                >
                  {company.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


