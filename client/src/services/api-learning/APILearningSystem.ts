/**
 * API Learning System
 * Automatically discovers, analyzes, and generates integrations for any compliant API
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData, selectOne, upsertOne } from '@/lib/api-client';
import { APIDiscoveryEngine } from './APIDiscoveryEngine';
import { ComplianceAnalyzer } from './ComplianceAnalyzer';
import { TemplateGenerator } from './TemplateGenerator';
import { IntegrationDeployer } from './IntegrationDeployer';

// Core interfaces for API Learning System
export interface APIDiscoveryResult {
  serviceName: string;
  baseUrl: string;
  version: string;
  authType: 'oauth2' | 'api_key' | 'bearer';
  endpoints: APIEndpoint[];
  dataTypes: DataType[];
  rateLimiting: RateLimitInfo;
  pagination: PaginationInfo;
  complianceScore: number; // 0-100
  integrationFeasibility: 'high' | 'medium' | 'low';
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: Parameter[];
  responseSchema: any;
  rateLimit?: string;
}

export interface DataType {
  name: string;
  schema: any;
  endpoints: string[];
  sampleData: any[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface RateLimitInfo {
  headers?: string[];
  limits?: Record<string, string>;
  documentation?: string;
}

export interface PaginationInfo {
  type: 'cursor' | 'offset' | 'page' | 'none';
  parameters?: string[];
  responseFields?: string[];
}

export interface TemplateVariables {
  INTEGRATION_NAME: string;
  INTEGRATION_DISPLAY_NAME: string;
  PROVIDER_TYPE: string;
  API_BASE_URL: string;
  API_VERSION: string;
  AUTH_TYPE: string;
  OAUTH_ENDPOINTS?: Record<string, string>;
  REQUIRED_SCOPES?: string[];
  DATA_TYPES: string;
  API_ENDPOINTS: Record<string, string>;
  RATE_LIMIT_HEADERS?: string[];
  PAGINATION_TYPE: string;
}

export interface CodeGenerationResult {
  serviceClass: string;
  utilsFile: string;
  indexFile: string;
  uiComponent: string;
  environmentVars: string[];
  databaseMigrations: string[];
  testFiles: string[];
  documentation: string;
}

export interface ComplianceReport {
  score: number;
  requirements: RequirementStatus[];
  recommendations: string[];
  integrationFeasibility: 'high' | 'medium' | 'low';
  missingRequirements: string[];
}

export interface RequirementStatus {
  requirement: string;
  status: 'pass' | 'fail' | 'partial';
  details: string;
  impact: 'critical' | 'important' | 'minor';
}

export interface DeploymentResult {
  success: boolean;
  integrationId?: string;
  errors?: string[];
  warnings?: string[];
  nextSteps?: string[];
  integrationSetup?: IntegrationSetupGuide;
}

export interface IntegrationSetupGuide {
  serviceName: string;
  displayName: string;
  setupSteps: SetupStep[];
  environmentVariables: EnvironmentVariable[];
  oauthConfiguration?: OAuthConfiguration;
  testingInstructions: string[];
  troubleshootingTips: string[];
}

export interface SetupStep {
  stepNumber: number;
  title: string;
  description: string;
  action: string;
  codeExample?: string;
  verificationMethod?: string;
}

export interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
  source?: string;
}

export interface OAuthConfiguration {
  clientIdSource: string;
  clientSecretSource: string;
  redirectUri: string;
  requiredScopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface APILearningRequest {
  serviceName: string;
  documentationUrl?: string;
  apiSpecUrl?: string;
  manualConfig?: ManualAPIConfig;
  targetDataTypes?: string[];
}

export interface ManualAPIConfig {
  baseUrl: string;
  version: string;
  authType: 'oauth2' | 'api_key' | 'bearer';
  endpoints: Partial<APIEndpoint>[];
  oauthEndpoints?: Record<string, string>;
  scopes?: string[];
}

/**
 * Main API Learning System
 * Orchestrates the entire process from discovery to deployment
 */
export class APILearningSystem extends BaseService {
  private discoveryEngine: APIDiscoveryEngine;
  private complianceAnalyzer: ComplianceAnalyzer;
  private templateGenerator: TemplateGenerator;
  private integrationDeployer: IntegrationDeployer;

  constructor() {
    super('APILearningSystem');
    this.discoveryEngine = new APIDiscoveryEngine();
    this.complianceAnalyzer = new ComplianceAnalyzer();
    this.templateGenerator = new TemplateGenerator();
    this.integrationDeployer = new IntegrationDeployer();
  }

  /**
   * Main entry point for API Learning
   * Discovers, analyzes, and generates integration for any compliant API
   */
  async learnAndIntegrateAPI(request: APILearningRequest): Promise<ServiceResponse<{
    discovery: APIDiscoveryResult;
    compliance: ComplianceReport;
    generated: CodeGenerationResult;
    deployed: DeploymentResult;
  }>> {
    try {
      this.logger.info('Starting API Learning process', { serviceName: request.serviceName });

      // Phase 1: Discovery
      const discoveryResult = await this.discoveryEngine.discoverAPI(request);
      if (!discoveryResult.success || !discoveryResult.data) {
        return this.createErrorResponse(`Discovery failed: ${discoveryResult.error}`);
      }

      // Phase 2: Compliance Analysis
      const complianceResult = this.complianceAnalyzer.analyzeCompliance(discoveryResult.data);
      if (complianceResult.integrationFeasibility === 'low') {
        return this.createErrorResponse(
          `API does not meet minimum requirements. Score: ${complianceResult.score}/100. ` +
          `Missing: ${complianceResult.missingRequirements.join(', ')}`
        );
      }

      // Phase 3: Template Variable Extraction
      const templateVariables = this.extractTemplateVariables(discoveryResult.data, request);

      // Phase 4: Code Generation
      const generatedResult = this.templateGenerator.generateIntegration(templateVariables);
      if (!generatedResult.success || !generatedResult.data) {
        return this.createErrorResponse(`Code generation failed: ${generatedResult.error}`);
      }

      // Phase 5: Deployment
      const deploymentResult = await this.integrationDeployer.deployIntegration(generatedResult.data);
      if (!deploymentResult.success) {
        return this.createErrorResponse(
          `Deployment failed: ${deploymentResult.errors?.join(', ')}`
        );
      }

      // Phase 6: Generate Integration Setup Guide
      const integrationSetup = this.generateIntegrationSetupGuide(
        discoveryResult.data,
        templateVariables,
        deploymentResult
      );

      // Add setup guide to deployment result
      deploymentResult.integrationSetup = integrationSetup;

      this.logger.info('API Learning completed successfully', {
        serviceName: request.serviceName,
        integrationId: deploymentResult.integrationId,
        complianceScore: complianceResult.score
      });

      return this.createSuccessResponse({
        discovery: discoveryResult.data,
        compliance: complianceResult,
        generated: generatedResult.data,
        deployed: deploymentResult
      });

    } catch (error) {
      return this.handleError(error, 'learn and integrate API');
    }
  }

  /**
   * Extract template variables from discovery result
   */
  private extractTemplateVariables(discovery: APIDiscoveryResult, request: APILearningRequest): TemplateVariables {
    const integrationName = discovery.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const integrationDisplayName = discovery.serviceName.charAt(0).toUpperCase() + discovery.serviceName.slice(1);

    // Extract API endpoints
    const apiEndpoints: Record<string, string> = {};
    discovery.endpoints.forEach(endpoint => {
      const key = endpoint.path.split('/').pop() || 'default';
      apiEndpoints[key] = endpoint.path;
    });

    // Extract OAuth endpoints if applicable
    let oauthEndpoints: Record<string, string> | undefined;
    if (discovery.authType === 'oauth2') {
      oauthEndpoints = {
        auth: `${discovery.baseUrl}/oauth/authorize`,
        token: `${discovery.baseUrl}/oauth/token`,
        userinfo: `${discovery.baseUrl}/user`
      };
    }

    // Determine pagination type
    let paginationType = 'none';
    if (discovery.pagination.type !== 'none') {
      paginationType = discovery.pagination.type;
    }

    // Extract rate limit headers
    const rateLimitHeaders = discovery.rateLimiting.headers || [];

    // Determine data types
    const dataTypes = discovery.dataTypes
      .map(dt => dt.name)
      .filter(name => !request.targetDataTypes || request.targetDataTypes.includes(name))
      .join(',');

    return {
      INTEGRATION_NAME: integrationName,
      INTEGRATION_DISPLAY_NAME: integrationDisplayName,
      PROVIDER_TYPE: discovery.authType,
      API_BASE_URL: discovery.baseUrl,
      API_VERSION: discovery.version,
      AUTH_TYPE: discovery.authType,
      OAUTH_ENDPOINTS: oauthEndpoints,
      REQUIRED_SCOPES: request.manualConfig?.scopes || [],
      DATA_TYPES: dataTypes,
      API_ENDPOINTS: apiEndpoints,
      RATE_LIMIT_HEADERS: rateLimitHeaders,
      PAGINATION_TYPE: paginationType
    };
  }

  /**
   * Get learning status for a specific service
   */
  async getLearningStatus(serviceName: string): Promise<ServiceResponse<{
    phase: 'discovery' | 'analysis' | 'generation' | 'deployment' | 'complete';
    progress: number;
    details: any;
  }>> {
    try {
      this.logger.info('Getting learning status', { serviceName });

      const { data, error, success } = await selectOne<any>('api_learning_status', { service_name: serviceName });

      if (!success) {
        this.logger.error('Error getting learning status', { error, serviceName });
        return this.createErrorResponse('Failed to get learning status');
      }

      if (!data) {
        return this.createSuccessResponse({
          phase: 'discovery',
          progress: 0,
          details: null
        });
      }

      const status = data;
      return this.createSuccessResponse({
        phase: status.phase,
        progress: status.progress,
        details: status.details
      });
    } catch (error) {
      this.logger.error('Unexpected error getting learning status', { error, serviceName });
      return this.handleError(error, 'Failed to get learning status');
    }
  }

  /**
   * List all learned integrations
   */
  async listLearnedIntegrations(): Promise<ServiceResponse<{
    integrations: Array<{
      id: string;
      serviceName: string;
      displayName: string;
      status: string;
      complianceScore: number;
      createdAt: string;
      lastSync?: string;
    }>;
  }>> {
    try {
      this.logger.info('Listing learned integrations');

      const { data, error, success } = await selectData<any>({
        table: 'api_learning_integrations',
        orderBy: [{ column: 'created_at', ascending: false }]
      });

      if (!success) {
        this.logger.error('Error listing learned integrations', { error });
        return this.createErrorResponse('Failed to list integrations');
      }

      const integrations = (data || []).map(integration => ({
        id: integration.id,
        serviceName: integration.service_name,
        displayName: integration.display_name,
        status: integration.status,
        complianceScore: integration.compliance_score,
        createdAt: integration.created_at,
        lastSync: integration.last_sync
      }));

      return this.createSuccessResponse({ integrations });
    } catch (error) {
      this.logger.error('Unexpected error listing learned integrations', { error });
      return this.handleError(error, 'Failed to list integrations');
    }
  }

  /**
   * Generate integration setup guide
   */
  private generateIntegrationSetupGuide(
    discovery: APIDiscoveryResult,
    templateVars: TemplateVariables,
    deployment: DeploymentResult
  ): IntegrationSetupGuide {
    const setupSteps: SetupStep[] = [
      {
        stepNumber: 1,
        title: 'Configure Environment Variables',
        description: 'Set up the required environment variables for the integration',
        action: 'Add the following environment variables to your .env file',
        codeExample: this.generateEnvironmentVariablesCode(templateVars),
        verificationMethod: 'Verify variables are loaded by checking the application logs'
      },
      {
        stepNumber: 2,
        title: 'Configure OAuth (if applicable)',
        description: 'Set up OAuth credentials in the provider\'s developer console',
        action: 'Create OAuth application and configure redirect URIs',
        codeExample: this.generateOAuthConfigurationCode(templateVars),
        verificationMethod: 'Test OAuth flow by attempting to connect the integration'
      },
      {
        stepNumber: 3,
        title: 'Test the Integration',
        description: 'Verify the integration is working correctly',
        action: 'Run the integration tests and check connection status',
        codeExample: this.generateTestingCode(templateVars),
        verificationMethod: 'Check integration status in the Nexus dashboard'
      },
      {
        stepNumber: 4,
        title: 'Monitor and Maintain',
        description: 'Set up monitoring and regular maintenance',
        action: 'Configure alerts and schedule regular syncs',
        codeExample: this.generateMonitoringCode(templateVars),
        verificationMethod: 'Verify data is syncing regularly and alerts are working'
      }
    ];

    const environmentVariables: EnvironmentVariable[] = this.generateEnvironmentVariables(templateVars);
    const oauthConfiguration = discovery.authType === 'oauth2'
      ? this.generateOAuthConfiguration(templateVars)
      : undefined;

    return {
      serviceName: templateVars.INTEGRATION_NAME,
      displayName: templateVars.INTEGRATION_DISPLAY_NAME,
      setupSteps,
      environmentVariables,
      oauthConfiguration,
      testingInstructions: this.generateTestingInstructions(templateVars),
      troubleshootingTips: this.generateTroubleshootingTips(templateVars, discovery)
    };
  }

  /**
   * Generate environment variables for the integration
   */
  private generateEnvironmentVariables(templateVars: TemplateVariables): EnvironmentVariable[] {
    const baseVars: EnvironmentVariable[] = [
      {
        name: `VITE_${templateVars.INTEGRATION_NAME.toUpperCase()}_CLIENT_ID`,
        description: `OAuth Client ID for ${templateVars.INTEGRATION_DISPLAY_NAME}`,
        required: true,
        example: 'your-client-id-here',
        source: `${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console`
      },
      {
        name: `VITE_${templateVars.INTEGRATION_NAME.toUpperCase()}_CLIENT_SECRET`,
        description: `OAuth Client Secret for ${templateVars.INTEGRATION_DISPLAY_NAME}`,
        required: true,
        example: 'your-client-secret-here',
        source: `${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console`
      }
    ];

    // Add API-specific variables
    if (templateVars.AUTH_TYPE === 'api_key') {
      baseVars.push({
        name: `VITE_${templateVars.INTEGRATION_NAME.toUpperCase()}_API_KEY`,
        description: `API Key for ${templateVars.INTEGRATION_DISPLAY_NAME}`,
        required: true,
        example: 'your-api-key-here',
        source: `${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console`
      });
    }

    return baseVars;
  }

  /**
   * Generate OAuth configuration
   */
  private generateOAuthConfiguration(templateVars: TemplateVariables): OAuthConfiguration {
    return {
      clientIdSource: `${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console`,
      clientSecretSource: `${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console`,
      redirectUri: `${window.location.origin}/integrations/${templateVars.INTEGRATION_NAME}/callback`,
      requiredScopes: templateVars.REQUIRED_SCOPES || [],
      authorizationUrl: templateVars.OAUTH_ENDPOINTS?.auth || '',
      tokenUrl: templateVars.OAUTH_ENDPOINTS?.token || ''
    };
  }

  /**
   * Generate environment variables code example
   */
  private generateEnvironmentVariablesCode(templateVars: TemplateVariables): string {
    const vars = this.generateEnvironmentVariables(templateVars);
    return vars.map(v => `${v.name}=${v.example || 'your-value-here'}`).join('\n');
  }

  /**
   * Generate OAuth configuration code example
   */
  private generateOAuthConfigurationCode(templateVars: TemplateVariables): string {
    if (templateVars.AUTH_TYPE !== 'oauth2') {
      return 'OAuth not required for this integration';
    }

    return `// Configure in ${templateVars.INTEGRATION_DISPLAY_NAME} Developer Console:
// 1. Create new OAuth application
// 2. Set redirect URI: ${window.location.origin}/integrations/${templateVars.INTEGRATION_NAME}/callback
// 3. Add required scopes: ${templateVars.REQUIRED_SCOPES?.join(', ')}
// 4. Copy Client ID and Client Secret to environment variables`;
  }

  /**
   * Generate testing code example
   */
  private generateTestingCode(templateVars: TemplateVariables): string {
    return `// Test the integration
import { ${templateVars.INTEGRATION_DISPLAY_NAME.replace(/\s+/g, '')}Service } from '@/services/integrations/${templateVars.INTEGRATION_NAME}';

const service = new ${templateVars.INTEGRATION_DISPLAY_NAME.replace(/\s+/g, '')}Service();
const status = await service.getConnectionStatus(userId);
console.log('Connection status:', status);`;
  }

  /**
   * Generate monitoring code example
   */
  private generateMonitoringCode(templateVars: TemplateVariables): string {
    return `// Set up monitoring
// 1. Configure alerts for failed syncs
// 2. Monitor token expiration
// 3. Set up regular data sync schedules
// 4. Monitor API rate limits`;
  }

  /**
   * Generate testing instructions
   */
  private generateTestingInstructions(templateVars: TemplateVariables): string[] {
    return [
      `Test OAuth flow by attempting to connect ${templateVars.INTEGRATION_DISPLAY_NAME}`,
      'Verify tokens are stored correctly in the database',
      'Test data syncing functionality',
      'Verify error handling and retry logic',
      'Test token refresh mechanism',
      'Validate data transformation and storage'
    ];
  }

  /**
   * Generate troubleshooting tips
   */
  private generateTroubleshootingTips(templateVars: TemplateVariables, discovery: APIDiscoveryResult): string[] {
    const tips = [
      'Check environment variables are correctly set',
      'Verify OAuth credentials are valid',
      'Ensure redirect URI matches exactly',
      'Check network connectivity to the API',
      'Review application logs for detailed error messages'
    ];

    if (discovery.authType === 'oauth2') {
      tips.push('Verify OAuth scopes are correctly configured');
      tips.push('Check token expiration and refresh logic');
    }

    if (discovery.rateLimiting.headers && discovery.rateLimiting.headers.length > 0) {
      tips.push('Monitor API rate limits and implement backoff strategies');
    }

    return tips;
  }

  /**
   * Update learning status
   */
  private async updateLearningStatus(
    serviceName: string,
    phase: string,
    progress: number,
    details?: any
  ): Promise<void> {
    try {
      this.logger.info('Updating learning status', { serviceName, phase, progress });

      const { error, success } = await upsertOne('api_learning_status', {
        service_name: serviceName,
        phase,
        progress,
        details,
        updated_at: new Date().toISOString()
      }, 'service_name');

      if (!success) {
        this.logger.error('Error updating learning status', { error, serviceName });
      }
    } catch (error) {
      this.logger.error('Unexpected error updating learning status', { error, serviceName });
    }
  }
}

export const apiLearningSystem = new APILearningSystem();
