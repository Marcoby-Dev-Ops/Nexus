// ============================================================================
// CONSOLIDATED INTEGRATION SERVICE (RECOMMENDED)
// ============================================================================
// This is the main integration service that consolidates all functionality
export {
  consolidatedIntegrationService,
  ConsolidatedIntegrationService,
  type IntegrationPlatform,
  type UserIntegration,
  type DataPointAnalytics,
  type IntegrationDataSummary,
  type ApiIntegrationData,
  type ConnectionResult,
  type SyncResult,
  type IntegrationCredentials,
  type IntegrationConfig,
  type IntegrationUpdates,
  type DataPoint,
} from './consolidatedIntegrationService';

// ============================================================================
// LEGACY SERVICES (DEPRECATED - Use consolidatedIntegrationService instead)
// ============================================================================

// Core Integration Services
export { IntegrationBaseService } from './core/IntegrationBaseService';
export { IntegrationRegistryService } from './core/IntegrationRegistryService';
export { DataMappingService } from './core/DataMappingService';

// Specific Integration Services
export { HubSpotIntegrationService } from './hubspot/HubSpotIntegrationService';
export { PayPalIntegrationService } from './paypal/PayPalIntegrationService';

// Legacy Services (for backward compatibility)
export { UniversalIntegrationService } from './universalIntegrationService';
export { IntegrationDataService } from './integrationDataService';
export { DataPointMappingService } from './dataPointMappingService';

// DEPRECATED: Legacy Salesforce Service (will be replaced with SalesforceIntegrationService)
export { SalesforceStyleDataService } from './SalesforceStyleDataService';

// NEW: Migrated Data Point Dictionary Service
export { DataPointDictionaryService } from './DataPointDictionaryService';

// NEW: Real-Time Cross-Departmental Sync Service
export { RealTimeCrossDepartmentalSync } from './realTimeCrossDepartmentalSync';
