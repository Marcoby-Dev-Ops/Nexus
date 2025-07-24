// Base integration classes
export { BaseIntegration } from './baseIntegration';
export type { SyncResult } from './baseIntegration';

// Authentication types and services
export * from './authTypes';
// export { unifiedAuthService } from './unifiedAuthService';

// OAuth and authentication
export { OAuthTokenService } from './oauthTokenService';
export type { OAuthToken, TokenResponse } from './oauthTokenService';

// Integration implementations
export { Microsoft365Integration } from './Microsoft365Integration';
export { GoogleWorkspaceIntegration } from './GoogleWorkspaceIntegration';
export { SlackIntegration } from './SlackIntegration';
export { ZendeskIntegration } from './ZendeskIntegration';
export { NotionIntegration } from './NotionIntegration';
export { DropboxIntegration } from './DropboxIntegration';
export { AsanaIntegration } from './AsanaIntegration';
export { TrelloIntegration } from './TrelloIntegration';
export { GitHubIntegration } from './GitHubIntegration';
export { HubSpotIntegration } from './hubspotIntegration';
export { HubSpotIntegrationV2 } from './HubSpotIntegrationV2';
export { PayPalIntegration } from './PayPalIntegration';
export { GoogleAnalyticsIntegration } from './GoogleAnalyticsIntegration';
export { ExampleApiKeyIntegration } from './ExampleApiKeyIntegration';

// Services
export { integrationService } from './integrationService';
export { syncIntegration } from './syncService';
export { MicrosoftGraphService } from './MicrosoftGraphService';

// Mapping utilities
export { mapToStandard } from './mapToStandard';
export { mapToExternal } from './mapToExternal';
export { getIntegrationMappings } from './mappingRegistry';

// Data processing
export { integrationDataAggregator } from './integrationDataAggregator';
export { generateDataTableSQL } from './generateDataTable';
export { apiDocAnalyzer } from './apiDocAnalyzer';
export { CentralizedAppsOrchestrator } from './centralizedAppsOrchestrator';

// Intelligence and automation
export { IntegrationIntelligenceService } from './integrationIntelligence';

// Types
export type * from './types'; 