import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { microsoftGraphService } from '@/lib/services/microsoftGraphService';
import { Button } from '@/components/ui';
import { useOrganizationStore } from '@/lib/stores/organizationStore';
import { ProviderState } from '@microsoft/mgt-element';

const Microsoft365Callback: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [error, setError] = useState<string | null>(null);
  const activeOrgId = useOrganizationStore((state) => state.activeOrgId);
  const [authState, setAuthState] = useState<ProviderState>(ProviderState.Loading);

  useEffect(() => {
    // Just initializing the service is enough.
    // The Msal2Provider will automatically handle the redirect flow.
    microsoftGraphService.initialize();

    const onStateChange = () => {
      setAuthState(microsoftGraphService.getProviderState());
    };

    microsoftGraphService.onStateChange(onStateChange);
    return () => microsoftGraphService.removeStateChange(onStateChange);
  }, []);

  useEffect(() => {
    const setupAccount = async () => {
      if (authState === ProviderState.SignedIn) {
        if (!activeOrgId) {
          const msg = 'No active organization found. Please select one and retry.';
          setError(msg);
          addNotification({ type: 'error', message: msg });
          return;
        }

        try {
          addNotification({ type: 'info', message: 'Finalizing connection...' });
          await microsoftGraphService.saveIntegrationToken(activeOrgId);

          addNotification({
            type: 'success',
            message: 'Microsoft 365 account connected successfully.',
          });

          const returnUrl = sessionStorage.getItem('microsoft_auth_return_url');
          sessionStorage.removeItem('microsoft_auth_return_url');
          navigate(returnUrl || '/unified-inbox');
        } catch (err: any) {
          const msg = err.message || 'Failed to set up your Microsoft 365 account.';
          setError(msg);
          addNotification({ type: 'error', message: msg });
        }
      } else if (authState === ProviderState.SignedOut) {
        const msg = 'Authentication failed. The sign-in process was not completed. Please try again.';
        setError(msg);
        addNotification({ type: 'error', message: msg });
      }
    };

    if (authState !== ProviderState.Loading) {
      setupAccount();
    }
  }, [authState, activeOrgId, navigate, addNotification]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      {error ? (
        <div className="text-center text-destructive">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="max-w-md">{error}</p>
          <Button variant="link" onClick={() => navigate('/unified-inbox')} className="mt-4">
            Return to Inbox
          </Button>
        </div>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">
            Connecting your Microsoft 365 account, please wait...
          </p>
        </>
      )}
    </div>
  );
};

export default Microsoft365Callback; 