/**
 * Integration Examples
 * 
 * Examples of how to use the reusable IntegrationConnector component
 * for different integrations
 */

import React from 'react';
import { 
  Database, 
  Activity, 
  Shield, 
  Zap, 
  DollarSign, 
  BarChart3,
  MessageSquare,
  Building2
} from 'lucide-react';
import IntegrationConnector from './IntegrationConnector';
import type { ConnectorType } from '@/core/integrations/registry';

// Example: HubSpot Integration
export const HubSpotIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="hubspot"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<Database className="h-8 w-8 text-orange-500" />}
      customTitle="HubSpot"
      customDescription="Connect to CRM, Marketing, and Sales tools"
    />
  );
};

// Example: Slack Integration
export const SlackIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="slack"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<MessageSquare className="h-8 w-8 text-purple-500" />}
      customTitle="Slack"
      customDescription="Connect to team communication and collaboration"
    />
  );
};

// Example: Google Workspace Integration
export const GoogleWorkspaceIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="google_workspace"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<Shield className="h-8 w-8 text-green-500" />}
      customTitle="Google Workspace"
      customDescription="Connect to Gmail, Calendar, Drive, and Docs"
    />
  );
};

// Example: Stripe Integration
export const StripeIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="stripe"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<Zap className="h-8 w-8 text-purple-500" />}
      customTitle="Stripe"
      customDescription="Connect to payment processing and billing"
    />
  );
};

// Example: PayPal Integration
export const PayPalIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="paypal"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<DollarSign className="h-8 w-8 text-blue-500" />}
      customTitle="PayPal"
      customDescription="Connect to payment processing and invoicing"
    />
  );
};

// Example: QuickBooks Integration
export const QuickBooksIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="quickbooks"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<BarChart3 className="h-8 w-8 text-green-500" />}
      customTitle="QuickBooks"
      customDescription="Connect to accounting and financial management"
    />
  );
};

// Example: Salesforce Integration
export const SalesforceIntegration: React.FC<{
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
}> = ({ onComplete, onCancel, existingConfig }) => {
  return (
    <IntegrationConnector
      connectorId="salesforce"
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
      customIcon={<Building2 className="h-8 w-8 text-blue-600" />}
      customTitle="Salesforce"
      customDescription="Connect to CRM and sales automation"
    />
  );
};

// Generic Integration Factory
export const createIntegrationComponent = (connectorId: ConnectorType) => {
  return ({ onComplete, onCancel, existingConfig }: {
    onComplete?: (data: any) => void;
    onCancel?: () => void;
    existingConfig?: Record<string, any>;
  }) => (
    <IntegrationConnector
      connectorId={connectorId}
      onComplete={onComplete}
      onCancel={onCancel}
      existingConfig={existingConfig}
    />
  );
};

// Usage example:
// const ZendeskIntegration = createIntegrationComponent('zendesk');
// const NotionIntegration = createIntegrationComponent('notion');
// const AsanaIntegration = createIntegrationComponent('asana');
