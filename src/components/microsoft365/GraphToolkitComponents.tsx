/**
 * Microsoft Graph Toolkit React Components
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * Wrapper components for Microsoft Graph Toolkit elements
 * Following official Microsoft documentation patterns
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Login,
  Person,
  Agenda,
  PeoplePicker,
  FileList,
  Get
} from '@microsoft/mgt-react';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Loader2, RefreshCw, Mail, AlertCircle } from 'lucide-react';

interface GraphComponentProps {
  className?: string;
}

// Error boundary component for MGT components
const MGTErrorBoundary: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <div className="p-4 text-muted-foreground">Component temporarily unavailable</div> 
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return <>{fallback}</>;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.warn('MGT Component Error:', error);
    setHasError(true);
    return <>{fallback}</>;
  }
};

// Hook to check if MGT is ready
const useMGTReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkReady = () => {
      const provider = Providers.globalProvider;
      setIsReady(!!provider);
    };

    checkReady();
    
    // Listen for provider updates
    const unsubscribe = Providers.onProviderUpdated(checkReady);
    
    return unsubscribe;
  }, []);

  return isReady;
};

/**
 * Microsoft Graph Login Component
 * Handles authentication with Microsoft 365
 */
export const GraphLogin: React.FC<GraphComponentProps> = ({ className }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-blue-50 text-blue-700">
          Initializing Microsoft Graph authentication...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <Login />
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Microsoft Graph Person Component
 * Displays user profile information
 */
export const GraphPerson: React.FC<GraphComponentProps & { 
  userId?: string;
  view?: 'oneline' | 'twolines' | 'threelines' | 'image' | 'fourlines';
}> = ({ className, userId, view = 'twolines' }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          Loading user profile...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <Person userId={userId} view={view} />
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Microsoft Graph Agenda Component
 * Shows calendar events
 */
export const GraphAgenda: React.FC<GraphComponentProps & {
  days?: number;
  eventQuery?: string;
}> = ({ className, days = 7, eventQuery }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-purple-50 text-purple-700">
          Loading calendar events...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <Agenda days={days} eventQuery={eventQuery} />
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Microsoft Graph People Picker Component
 * Search and select people from organization
 */
export const GraphPeoplePicker: React.FC<GraphComponentProps & {
  selectionMode?: 'single' | 'multiple';
  onSelectionChanged?: (e: any) => void;
}> = ({ className, selectionMode = 'single', onSelectionChanged }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-orange-50 text-orange-700">
          Loading people directory...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <PeoplePicker 
          selectionMode={selectionMode}
          selectionChanged={onSelectionChanged}
        />
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Microsoft Graph File List Component
 * Browse OneDrive/SharePoint files
 */
export const GraphFileList: React.FC<GraphComponentProps & {
  siteId?: string;
  driveId?: string;
}> = ({ className, siteId, driveId }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-indigo-50 text-indigo-700">
          Loading file browser...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <FileList 
          siteId={siteId}
          driveId={driveId}
        />
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Microsoft Graph Get Component
 * Generic component for Graph API calls
 */
export const GraphGet: React.FC<GraphComponentProps & {
  resource: string;
  version?: 'v1.0' | 'beta';
  scopes?: string[];
  children?: React.ReactNode;
}> = ({ className, resource, version = 'v1.0', scopes, children }) => {
  const isReady = useMGTReady();

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          Preparing Graph API connection...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MGTErrorBoundary>
        <Get 
          resource={resource}
          version={version}
          scopes={scopes}
        >
          <template data-type="default">
            {children}
          </template>
        </Get>
      </MGTErrorBoundary>
    </div>
  );
};

/**
 * Email Integration Component
 * Custom component for email functionality using Graph API
 */
export const GraphEmailIntegration: React.FC<GraphComponentProps> = ({ className }) => {
  const isReady = useMGTReady();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import the microsoftGraphService
  const graphService = React.useMemo(() => {
    // We need to use dynamic import to avoid SSR issues
    return import('@/lib/services/microsoftGraphService').then(module => module.default);
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!isReady) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = await graphService;
      if (!service.isConnected()) {
        await service.signIn();
      }
      
      const emailsData = await service.getEmails(10, 0);
      setEmails(emailsData);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to fetch emails from Microsoft Graph');
    } finally {
      setLoading(false);
    }
  }, [isReady, graphService]);

  useEffect(() => {
    if (isReady) {
      fetchEmails();
    }
  }, [isReady, fetchEmails]);

  const handleMarkAsRead = useCallback(async (emailId: string) => {
    try {
      const service = await graphService;
      await service.markEmailAsRead(emailId);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId ? { ...email, isRead: true } : email
        )
      );
    } catch (err) {
      console.error('Error marking email as read:', err);
      setError('Failed to mark email as read');
    }
  }, [graphService]);

  if (!isReady) {
    return (
      <div className={className}>
        <div className="p-4 border rounded bg-blue-50 text-blue-700">
          Connecting to Microsoft Graph for email access...
        </div>
      </div>
    );
  }

  if (loading) {
  return (
      <div className={`${className} space-y-4`}>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border rounded-md animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`${className} p-4 border rounded bg-red-50`}>
        <div className="flex items-center text-red-600 mb-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          <div className="font-medium">Error loading emails</div>
        </div>
        <div className="text-red-600 text-sm">{error}</div>
        <Button 
          className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 border-red-200"
          size="sm"
          onClick={() => fetchEmails()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  if (emails.length === 0) {
    return (
      <div className={`${className} p-6 text-center border rounded-md`}>
        <Mail className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
        <h3 className="text-lg font-medium mb-1">No Emails Found</h3>
        <p className="text-muted-foreground text-sm mb-4">
          We couldn't find any emails in your Microsoft 365 account.
        </p>
        <Button size="sm" onClick={() => fetchEmails()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Recent Emails</h3>
        <Button size="sm" variant="outline" onClick={() => fetchEmails()}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {emails.map((email) => (
          <div 
            key={email.id} 
            className={`p-4 border rounded-md ${!email.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={() => !email.isRead && handleMarkAsRead(email.id)}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-base">
                {email.subject || '(No Subject)'}
              </h4>
              <div className="text-xs text-muted-foreground">
                {new Date(email.receivedDateTime).toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              From: {email.from?.emailAddress?.name || email.from?.emailAddress?.address}
            </div>
            <p className="text-sm">
              {email.bodyPreview || 'No preview available'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  GraphLogin,
  GraphPerson,
  GraphAgenda,
  GraphPeoplePicker,
  GraphFileList,
  GraphGet,
  GraphEmailIntegration
}; 