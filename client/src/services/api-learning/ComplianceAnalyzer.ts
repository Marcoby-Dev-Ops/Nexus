/**
 * Compliance Analyzer
 * Analyzes APIs against Nexus's minimum requirements and provides development guidance
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import type { 
  APIDiscoveryResult, 
  ComplianceReport, 
  RequirementStatus 
} from './APILearningSystem';

export class ComplianceAnalyzer extends BaseService {
  private readonly minimumRequirements = {
    oauth2: {
      critical: [
        'oauth2_authorization_code_flow',
        'refresh_token_support',
        'standard_oauth_endpoints',
        'json_response_format'
      ],
      important: [
        'standard_error_responses',
        'scope_management',
        'token_expiration'
      ],
      minor: [
        'oauth_extensions',
        'advanced_scopes'
      ]
    },
    api_key: {
      critical: [
        'restful_api',
        'json_responses',
        'standard_http_codes',
        'bearer_token_auth'
      ],
      important: [
        'rate_limiting',
        'pagination_support',
        'error_handling'
      ],
      minor: [
        'webhook_support',
        'advanced_features'
      ]
    },
    data_structure: {
      critical: [
        'unique_resource_ids',
        'timestamp_fields',
        'consistent_data_format'
      ],
      important: [
        'standardized_fields',
        'data_validation'
      ],
      minor: [
        'rich_metadata',
        'extended_properties'
      ]
    }
  };

  /**
   * Analyze API compliance with Nexus standards
   */
  analyzeCompliance(discovery: APIDiscoveryResult): ComplianceReport {
    try {
      this.logger.info('Starting compliance analysis', { serviceName: discovery.serviceName });

      const requirements: RequirementStatus[] = [];
      let totalScore = 0;
      let totalRequirements = 0;

      // Analyze OAuth 2.0 compliance
      if (discovery.authType === 'oauth2') {
        const oauthResults = this.analyzeOAuth2Compliance(discovery);
        requirements.push(...oauthResults);
        totalScore += oauthResults.reduce((sum, req) => sum + this.getScoreForStatus(req.status), 0);
        totalRequirements += oauthResults.length;
      }

      // Analyze API structure compliance
      const apiResults = this.analyzeAPIStructureCompliance(discovery);
      requirements.push(...apiResults);
      totalScore += apiResults.reduce((sum, req) => sum + this.getScoreForStatus(req.status), 0);
      totalRequirements += apiResults.length;

      // Analyze data structure compliance
      const dataResults = this.analyzeDataStructureCompliance(discovery);
      requirements.push(...dataResults);
      totalScore += dataResults.reduce((sum, req) => sum + this.getScoreForStatus(req.status), 0);
      totalRequirements += dataResults.length;

      // Calculate overall score
      const complianceScore = totalRequirements > 0 ? Math.round((totalScore / totalRequirements) * 100) : 0;

      // Determine integration feasibility
      const integrationFeasibility = this.determineFeasibility(complianceScore, requirements);

      // Generate recommendations
      const recommendations = this.generateRecommendations(requirements, discovery);

      // Identify missing critical requirements
      const missingRequirements = requirements
        .filter(req => req.status === 'fail' && req.impact === 'critical')
        .map(req => req.requirement);

      this.logger.info('Compliance analysis completed', { 
        serviceName: discovery.serviceName, 
        score: complianceScore,
        feasibility: integrationFeasibility
      });

      return {
        score: complianceScore,
        requirements,
        recommendations,
        integrationFeasibility,
        missingRequirements
      };
    } catch (error) {
      this.logger.error('Error analyzing compliance', { error, serviceName: discovery.serviceName });
      return {
        score: 0,
        requirements: [],
        recommendations: ['Error analyzing compliance'],
        integrationFeasibility: 'low',
        missingRequirements: ['Compliance analysis failed']
      };
    }
  }

  /**
   * Analyze OAuth 2.0 compliance
   */
  private analyzeOAuth2Compliance(discovery: APIDiscoveryResult): RequirementStatus[] {
    const requirements: RequirementStatus[] = [];

    // Check OAuth 2.0 Authorization Code Flow
    requirements.push({
      requirement: 'oauth2_authorization_code_flow',
      status: 'pass', // Assuming OAuth2 type means this is supported
      details: 'OAuth 2.0 Authorization Code Flow is supported',
      impact: 'critical'
    });

    // Check Refresh Token Support
    requirements.push({
      requirement: 'refresh_token_support',
      status: 'pass', // Most OAuth2 implementations support this
      details: 'Refresh token support is available',
      impact: 'critical'
    });

    // Check Standard OAuth Endpoints
    const hasStandardEndpoints = discovery.endpoints.some(endpoint => 
      endpoint.path.includes('/oauth/') || 
      endpoint.path.includes('/auth/') ||
      endpoint.path.includes('/token')
    );
    requirements.push({
      requirement: 'standard_oauth_endpoints',
      status: hasStandardEndpoints ? 'pass' : 'partial',
      details: hasStandardEndpoints 
        ? 'Standard OAuth endpoints found' 
        : 'OAuth endpoints may be custom or non-standard',
      impact: 'critical'
    });

    // Check JSON Response Format
    const hasJsonResponses = discovery.endpoints.some(endpoint => 
      endpoint.responseSchema && 
      Object.keys(endpoint.responseSchema).length > 0
    );
    requirements.push({
      requirement: 'json_response_format',
      status: hasJsonResponses ? 'pass' : 'fail',
      details: hasJsonResponses 
        ? 'JSON response format is supported' 
        : 'JSON response format not confirmed',
      impact: 'critical'
    });

    // Check Standard Error Responses
    requirements.push({
      requirement: 'standard_error_responses',
      status: 'pass', // Most APIs follow standard error patterns
      details: 'Standard error response patterns are expected',
      impact: 'important'
    });

    return requirements;
  }

  /**
   * Analyze API structure compliance
   */
  private analyzeAPIStructureCompliance(discovery: APIDiscoveryResult): RequirementStatus[] {
    const requirements: RequirementStatus[] = [];

    // Check RESTful API
    const hasRestfulPatterns = discovery.endpoints.some(endpoint => 
      ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(endpoint.method) &&
      endpoint.path.startsWith('/')
    );
    requirements.push({
      requirement: 'restful_api',
      status: hasRestfulPatterns ? 'pass' : 'fail',
      details: hasRestfulPatterns 
        ? 'RESTful API patterns detected' 
        : 'API may not follow RESTful conventions',
      impact: 'critical'
    });

    // Check JSON Responses
    const hasJsonResponses = discovery.endpoints.some(endpoint => 
      endpoint.responseSchema && 
      Object.keys(endpoint.responseSchema).length > 0
    );
    requirements.push({
      requirement: 'json_responses',
      status: hasJsonResponses ? 'pass' : 'fail',
      details: hasJsonResponses 
        ? 'JSON responses are supported' 
        : 'JSON response format not confirmed',
      impact: 'critical'
    });

    // Check Standard HTTP Codes
    requirements.push({
      requirement: 'standard_http_codes',
      status: 'pass', // Most APIs use standard HTTP codes
      details: 'Standard HTTP status codes are expected',
      impact: 'critical'
    });

    // Check Authentication
    const authRequirement = discovery.authType === 'oauth2' ? 'oauth2_authentication' : 'api_key_authentication';
    requirements.push({
      requirement: authRequirement,
      status: 'pass',
      details: `${discovery.authType.toUpperCase()} authentication is supported`,
      impact: 'critical'
    });

    // Check Rate Limiting
    const hasRateLimiting = discovery.rateLimiting.headers && discovery.rateLimiting.headers.length > 0;
    requirements.push({
      requirement: 'rate_limiting',
      status: hasRateLimiting ? 'pass' : 'partial',
      details: hasRateLimiting 
        ? 'Rate limiting headers detected' 
        : 'Rate limiting may be implemented differently',
      impact: 'important'
    });

    // Check Pagination
    const hasPagination = discovery.pagination.type !== 'none';
    requirements.push({
      requirement: 'pagination_support',
      status: hasPagination ? 'pass' : 'partial',
      details: hasPagination 
        ? `${discovery.pagination.type} pagination detected` 
        : 'Pagination support not confirmed',
      impact: 'important'
    });

    return requirements;
  }

  /**
   * Analyze data structure compliance
   */
  private analyzeDataStructureCompliance(discovery: APIDiscoveryResult): RequirementStatus[] {
    const requirements: RequirementStatus[] = [];

    // Check Unique Resource IDs
    const hasUniqueIds = discovery.dataTypes.some(dataType => 
      dataType.schema && 
      (dataType.schema.properties?.id || dataType.schema.properties?._id)
    );
    requirements.push({
      requirement: 'unique_resource_ids',
      status: hasUniqueIds ? 'pass' : 'partial',
      details: hasUniqueIds 
        ? 'Unique resource IDs detected in schemas' 
        : 'Unique resource IDs not confirmed in all data types',
      impact: 'critical'
    });

    // Check Timestamp Fields
    const hasTimestamps = discovery.dataTypes.some(dataType => 
      dataType.schema && 
      (dataType.schema.properties?.created_at || 
       dataType.schema.properties?.updated_at ||
       dataType.schema.properties?.timestamp)
    );
    requirements.push({
      requirement: 'timestamp_fields',
      status: hasTimestamps ? 'pass' : 'partial',
      details: hasTimestamps 
        ? 'Timestamp fields detected in schemas' 
        : 'Timestamp fields not confirmed in all data types',
      impact: 'critical'
    });

    // Check Consistent Data Format
    const hasConsistentFormat = discovery.dataTypes.length > 0;
    requirements.push({
      requirement: 'consistent_data_format',
      status: hasConsistentFormat ? 'pass' : 'fail',
      details: hasConsistentFormat 
        ? 'Data schemas are defined and consistent' 
        : 'Data schemas are not defined',
      impact: 'critical'
    });

    // Check Standardized Fields
    const hasStandardizedFields = discovery.dataTypes.some(dataType => 
      dataType.schema && 
      Object.keys(dataType.schema.properties || {}).length > 2
    );
    requirements.push({
      requirement: 'standardized_fields',
      status: hasStandardizedFields ? 'pass' : 'partial',
      details: hasStandardizedFields 
        ? 'Standardized field patterns detected' 
        : 'Field standardization may vary',
      impact: 'important'
    });

    return requirements;
  }

  /**
   * Get score for requirement status
   */
  private getScoreForStatus(status: 'pass' | 'fail' | 'partial'): number {
    switch (status) {
      case 'pass': return 1;
      case 'partial': return 0.5;
      case 'fail': return 0;
      default: return 0;
    }
  }

  /**
   * Determine integration feasibility based on score and requirements
   */
  private determineFeasibility(score: number, requirements: RequirementStatus[]): 'high' | 'medium' | 'low' {
    const criticalFailures = requirements.filter(req => 
      req.status === 'fail' && req.impact === 'critical'
    ).length;

    if (criticalFailures === 0 && score >= 80) {
      return 'high';
    } else if (criticalFailures <= 1 && score >= 60) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate development recommendations
   */
  private generateRecommendations(requirements: RequirementStatus[], discovery: APIDiscoveryResult): string[] {
    const recommendations: string[] = [];

    // Add general recommendations
    recommendations.push('Ensure all integrations extend BaseService for consistent error handling and logging');
    recommendations.push('Use ServiceResponse<T> pattern for all service method returns');
    recommendations.push('Implement proper token refresh logic for OAuth integrations');
    recommendations.push('Add comprehensive error handling with user-friendly messages');

    // Add specific recommendations based on failures
    const failedRequirements = requirements.filter(req => req.status === 'fail');
    
    failedRequirements.forEach(req => {
      switch (req.requirement) {
        case 'oauth2_authorization_code_flow':
          recommendations.push('Implement OAuth 2.0 Authorization Code Flow with proper state parameter');
          break;
        case 'refresh_token_support':
          recommendations.push('Add refresh token support to handle token expiration');
          break;
        case 'json_response_format':
          recommendations.push('Ensure all API responses are in JSON format');
          break;
        case 'restful_api':
          recommendations.push('Follow RESTful API conventions for endpoint design');
          break;
        case 'unique_resource_ids':
          recommendations.push('Ensure all resources have unique identifiers (id or _id fields)');
          break;
        case 'timestamp_fields':
          recommendations.push('Include created_at and updated_at timestamp fields in data schemas');
          break;
      }
    });

    // Add architecture recommendations
    recommendations.push('Create service class in src/services/integrations/[service-name]/[ServiceName]Service.ts');
    recommendations.push('Create utils file for OAuth and API utilities');
    recommendations.push('Create index.ts file for clean exports');
    recommendations.push('Create UI component for insights and data display');
    recommendations.push('Add proper TypeScript interfaces for all data types');
    recommendations.push('Implement retry logic using retryFetch utility');
    recommendations.push('Use logger from @/shared/utils/logger instead of console.log');

    // Add testing recommendations
    recommendations.push('Write Jest tests with ≥90% coverage for new integrations');
    recommendations.push('Test OAuth flow end-to-end including token refresh');
    recommendations.push('Test error scenarios and edge cases');
    recommendations.push('Validate data transformation and storage');

    return recommendations;
  }

  /**
   * Get development checklist for a specific integration
   */
  getDevelopmentChecklist(discovery: APIDiscoveryResult): string[] {
    const checklist: string[] = [
      '✅ Extend BaseService class',
      '✅ Implement ServiceResponse<T> pattern',
      '✅ Add proper TypeScript interfaces',
      '✅ Create service class in correct directory structure',
      '✅ Implement OAuth utilities (if applicable)',
      '✅ Add token refresh logic',
      '✅ Implement retry logic with retryFetch',
      '✅ Add comprehensive error handling',
      '✅ Use logger instead of console.log',
      '✅ Create utils file for API utilities',
      '✅ Create index.ts for clean exports',
      '✅ Create UI component for insights',
      '✅ Add environment variable configuration',
      '✅ Write comprehensive tests',
      '✅ Test OAuth flow end-to-end',
      '✅ Validate data transformation',
      '✅ Test error scenarios',
      '✅ Add proper documentation',
      '✅ Follow Nexus coding standards',
      '✅ Use consistent naming conventions'
    ];

    // Add specific checklist items based on auth type
    if (discovery.authType === 'oauth2') {
      checklist.push('✅ Implement OAuth 2.0 Authorization Code Flow');
      checklist.push('✅ Add state parameter for security');
      checklist.push('✅ Handle OAuth callback validation');
      checklist.push('✅ Implement token refresh mechanism');
      checklist.push('✅ Store tokens securely in database');
    } else {
      checklist.push('✅ Configure API key authentication');
      checklist.push('✅ Store API keys securely');
      checklist.push('✅ Implement proper API key rotation');
    }

    // Add data-specific checklist items
    if (discovery.dataTypes.length > 0) {
      checklist.push('✅ Define TypeScript interfaces for all data types');
      checklist.push('✅ Implement data transformation utilities');
      checklist.push('✅ Add data validation');
      checklist.push('✅ Handle pagination properly');
      checklist.push('✅ Implement rate limiting');
    }

    return checklist;
  }

  /**
   * Get template variables for integration creation
   */
  getTemplateVariables(discovery: APIDiscoveryResult): Record<string, string> {
    const integrationName = discovery.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const integrationDisplayName = discovery.serviceName.charAt(0).toUpperCase() + discovery.serviceName.slice(1);

    return {
      INTEGRATION_NAME: integrationName,
      INTEGRATION_DISPLAY_NAME: integrationDisplayName,
      PROVIDER_TYPE: discovery.authType,
      API_BASE_URL: discovery.baseUrl,
      API_VERSION: discovery.version,
      AUTH_TYPE: discovery.authType,
      DATA_TYPES: discovery.dataTypes.map(dt => dt.name).join(','),
      PAGINATION_TYPE: discovery.pagination.type,
      RATE_LIMIT_HEADERS: discovery.rateLimiting.headers?.join(',') || ''
    };
  }
}
