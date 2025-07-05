/**
 * Microsoft Graph Service
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * Provides a unified interface for Microsoft Graph API operations
 * Handles authentication, token management, and API requests
 */

import { Providers, ProviderState, LoginType } from '@microsoft/mgt-element';
import { Msal2Provider } from '@microsoft/mgt-msal2-provider';
import { logger } from '@/lib/security/logger';
import { supabase } from '@/lib/core/supabase';
import type { IProvider, IProviderAccount } from '@microsoft/mgt-element';
import type { AccountInfo } from '@azure/msal-browser';

// Types
export interface GraphEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    }
  };
  receivedDateTime: string;
  isRead: boolean;
}

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  businessPhones?: string[];
  officeLocation?: string;
}

class MicrosoftGraphService {
  private initialized = false;
  private providerStateChangeHandlers: Set<() => void> = new Set();

  /**
   * Initialize Microsoft Graph provider
   */
  public initialize(): boolean {
    if (this.initialized) return true;
    
    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      
      if (!clientId) {
        logger.error({}, 'Microsoft Graph initialization failed: VITE_MICROSOFT_CLIENT_ID not found');
        return false;
      }
      
      if (!Providers.globalProvider) {
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
            'Sites.Read.All',
            'offline_access'
          ],
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: `${window.location.origin.replace('127.0.0.1', 'localhost')}/microsoft365/callback`,
          loginType: LoginType.Redirect
        });

        Providers.globalProvider.onStateChanged(() => {
          this.providerStateChangeHandlers.forEach(handler => handler());
        });
        
        logger.info({}, 'Microsoft Graph provider initialized successfully');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Microsoft Graph provider');
      return false;
    }
  }

  /**
   * Check if user is connected to Microsoft Graph
   */
  public isConnected(): boolean {
    this.initialize();
    return Providers.globalProvider?.state === ProviderState.SignedIn;
  }

  /**
   * Get the current provider state.
   */
  public getProviderState(): ProviderState {
    this.initialize();
    return Providers.globalProvider?.state || ProviderState.Loading;
  }

  /**
   * Register a handler for provider state changes.
   */
  public onStateChange(handler: () => void): void {
    this.providerStateChangeHandlers.add(handler);
  }

  /**
   * Unregister a handler for provider state changes.
   */
  public removeStateChange(handler: () => void): void {
    this.providerStateChangeHandlers.delete(handler);
  }

  /**
   * Sign in to Microsoft Graph. MGT handles the redirect.
   */
  public async signIn(): Promise<void> {
    try {
      if (!this.initialize() || !Providers.globalProvider) {
        throw new Error('Microsoft Graph provider not initialized.');
      }
      // Store current location to return after auth
      sessionStorage.setItem('microsoft_auth_return_url', window.location.href);
      if (Providers.globalProvider.login) {
        await Providers.globalProvider.login();
      }
    } catch (error) {
      logger.error({ err: error }, 'Microsoft Graph sign-in failed');
      throw error;
    }
  }

  /**
   * Sign out from Microsoft Graph
   */
  public async signOut(): Promise<boolean> {
    try {
      if (!this.initialize() || !this.isConnected()) {
        return true;
      }
      
      const provider = Providers.globalProvider;
      if (provider && provider.logout) {
        await provider.logout();
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Microsoft Graph sign-out failed');
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(): Promise<GraphUser | null> {
    try {
      if (!this.initialize() || !this.isConnected()) {
        throw new Error('Not connected to Microsoft Graph');
      }
      
      const response = await Providers.globalProvider?.graph.client.api('/me')
        .select('id,displayName,mail,userPrincipalName,jobTitle,businessPhones,officeLocation')
        .get();
      
      return response as GraphUser;
    } catch (error) {
      logger.error({ err: error }, 'Failed to get Microsoft Graph user profile');
      throw error;
    }
  }

  /**
   * Get emails from inbox
   */
  public async getEmails(top = 10, skip = 0): Promise<GraphEmail[]> {
    try {
      if (!this.initialize() || !this.isConnected()) {
        throw new Error('Not connected to Microsoft Graph');
      }
      
      const response = await Providers.globalProvider?.graph.client.api('/me/messages')
        .select('id,subject,bodyPreview,from,receivedDateTime,isRead')
        .top(top)
        .skip(skip)
        .orderby('receivedDateTime desc')
        .get();
      
      return response?.value || [];
    } catch (error) {
      logger.error({ err: error }, 'Failed to get Microsoft Graph emails');
      throw error;
    }
  }

  /**
   * Save access token to Supabase for server-side operations
   */
  public async saveIntegrationToken(orgId: string): Promise<void> {
    try {
      if (!this.initialize() || !this.isConnected() || !Providers.globalProvider) {
        throw new Error('Not connected to Microsoft Graph');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const provider = Providers.globalProvider as Msal2Provider;
      const account = provider.getActiveAccount() as unknown as AccountInfo;
      if (!account) {
        throw new Error('No active Microsoft account found.');
      }

      // This is a simplified way to get the token.
      // In a real scenario, you would use MSAL's acquireTokenSilent.
      // MGT's provider doesn't expose the raw tokens easily.
      // For this reason, we will just store a marker that the user has connected.
      const credentials = {
        // Storing the account identifier is enough for our use case
        homeAccountId: account.homeAccountId,
        environment: account.environment,
        tenantId: account.tenantId,
        username: account.username,
        localAccountId: account.localAccountId,
      };

      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'office-365')
        .single();
      
      if (!integration) {
        throw new Error('Microsoft 365 integration not found in integrations table.');
      }

      const integrationData = {
        user_id: user.id,
        company_id: orgId,
        integration_id: integration.id,
        credentials,
        config: { graph_enabled: true },
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_integrations')
        .upsert(integrationData);

      if (error) {
        logger.error({ err: error }, 'Failed to save Microsoft Graph integration token');
        throw error;
      }

      logger.info({ orgId }, 'Successfully saved Microsoft Graph integration token');
    } catch (error) {
      logger.error({ err: error }, 'Error in saveIntegrationToken');
      throw error;
    }
  }

  /**
   * Triggers the setup and initial sync of an Office 365 account.
   */
  public async setupAndSyncAccount(orgId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Microsoft Graph service is not connected.');
    }
    if (!orgId) {
      throw new Error('Organization ID is required to set up and sync account.');
    }
    try {
      const { unifiedInboxService } = await import('./unifiedInboxService');
      await unifiedInboxService.autoSetupOffice365Account(orgId);
    } catch (error) {
      logger.error({ err: error, orgId }, 'Failed to set up and sync Office 365 account');
      throw error;
    }
  }
}

export const microsoftGraphService = new MicrosoftGraphService();
export default microsoftGraphService; 