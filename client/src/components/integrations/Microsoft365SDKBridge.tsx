/**
 * Microsoft 365 SDK Bridge
 * 
 * Connects the existing Microsoft 365 UI components to the new Integration SDK
 * Uses the reusable IntegrationConnector component for consistent functionality
 */

import React from 'react';
import { Settings } from 'lucide-react';
import { msalInstance, msalReady } from '@/shared/auth/msal';
import { logger } from '@/shared/utils/logger';
import IntegrationConnector from './IntegrationConnector';

interface Microsoft365SDKBridgeProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}

export const Microsoft365SDKBridge: React.FC<Microsoft365SDKBridgeProps> = ({
  onComplete,
  onCancel,
  existingConfig
}) => {
  // Custom auth flow for Microsoft 365 using MSAL
  const handleMicrosoftAuth = async () => {
    try {
      await msalReady;
      
      // Use MSAL's built-in flow with proper scopes for refresh tokens
      await msalInstance.loginRedirect({
        scopes: [
          'User.Read',
          'Mail.Read',
          'Mail.ReadWrite', 
          'Calendars.Read',
          'Files.Read.All',
          'Contacts.Read',
          'Team.ReadBasic.All',
          'offline_access'
        ],
        redirectStartPage: `${window.location.origin}/integrations/microsoft365/callback`
      });
    } catch (error) {
      logger.error('Microsoft 365 SDK Bridge: Auth redirect failed', { 
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  };

  return (
    <IntegrationConnector
      connectorId="microsoft365"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customAuthFlow={handleMicrosoftAuth}
      customIcon={<Settings className="h-8 w-8 text-blue-500" />}
      customTitle="Microsoft 365"
      customDescription="Connect to Teams, Outlook, OneDrive, and SharePoint"
    />
  );
};

export default Microsoft365SDKBridge;
