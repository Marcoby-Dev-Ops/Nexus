/**
 * Microsoft Graph Toolkit Provider
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * Implements Microsoft Graph Toolkit using MSAL2 Provider
 * Following Microsoft's official best practices for React integration
 */

import React, { useEffect, type ReactNode } from 'react';
import { Providers } from '@microsoft/mgt-element';
import { Msal2Provider } from '@microsoft/mgt-msal2-provider';
import { useAuth } from '@/contexts/AuthContext';
import { LoginType } from '@microsoft/mgt-element';

// Import and register MGT components
import '@microsoft/mgt-components';

interface MicrosoftGraphProviderProps {
  children: ReactNode;
}

export const MicrosoftGraphProvider: React.FC<MicrosoftGraphProviderProps> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Wait for DOM to be ready before initializing MGT
    const initializeMGT = () => {
      // Initialize Microsoft Graph Toolkit with MSAL2 Provider
      if (!Providers.globalProvider) {
        const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
        
        if (clientId) {
          try {
            Providers.globalProvider = new Msal2Provider({
              clientId,
              scopes: [
                'User.Read',
                'Mail.Read',
                'Mail.ReadWrite',
                'Mail.Send',
                'Calendars.Read',
                'Calendars.ReadWrite',
                'People.Read',
                'Files.Read.All',
                'Sites.Read.All'
              ],
              authority: 'https://login.microsoftonline.com/common',
              redirectUri: `${window.location.origin.replace('127.0.0.1', 'localhost')}/microsoft365/callback`,
              loginType: LoginType.Redirect
            });

            console.log('✅ Microsoft Graph Toolkit initialized with MSAL2 Provider');
          } catch (error) {
            console.error('❌ Failed to initialize Microsoft Graph Toolkit:', error);
          }
        } else {
          console.warn('⚠️ Microsoft Graph Toolkit not initialized: VITE_MICROSOFT_CLIENT_ID not found');
        }
      }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeMGT, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      // Note: We don't clean up the global provider as it should persist across component mounts
    };
  }, []);

  return <>{children}</>;
};

export default MicrosoftGraphProvider; 