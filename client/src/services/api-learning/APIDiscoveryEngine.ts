/**
 * API Discovery Engine
 * Discovers and analyzes APIs from various sources (OpenAPI specs, documentation, manual config)
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';
import type { 
  APIDiscoveryResult, 
  APILearningRequest, 
  APIEndpoint, 
  DataType,
  RateLimitInfo,
  PaginationInfo 
} from './APILearningSystem';

export class APIDiscoveryEngine extends BaseService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Main discovery method
   * Routes to appropriate discovery method based on input
   */
  async discoverAPI(request: APILearningRequest): Promise<ServiceResponse<APIDiscoveryResult>> {
    try {
      this.logger.info('Starting API discovery', { serviceName: request.serviceName });

      // Route to appropriate discovery method
      if (request.apiSpecUrl) {
        return await this.discoverFromOpenAPISpec(request);
      } else if (request.documentationUrl) {
        return await this.discoverFromDocumentation(request);
      } else if (request.manualConfig) {
        return await this.discoverFromManualConfig(request);
      } else {
        return this.createErrorResponse('No discovery source provided (apiSpecUrl, documentationUrl, or manualConfig)');
      }
    } catch (error) {
      return this.handleError(error, 'discover API');
    }
  }

  /**
   * Discover API from OpenAPI/Swagger specification
   */
  private async discoverFromOpenAPISpec(request: APILearningRequest): Promise<ServiceResponse<APIDiscoveryResult>> {
    try {
      if (!request.apiSpecUrl) {
        return this.createErrorResponse('OpenAPI spec URL is required');
      }

      // Fetch OpenAPI specification
      const response = await retryFetch(request.apiSpecUrl, {
        headers: {
          'Accept': 'application/json,application/yaml,text/yaml',
        },
      });

      if (!response.ok) {
        return this.createErrorResponse(`Failed to fetch OpenAPI spec: ${response.statusText}`);
      }

      const specText = await response.text();
      const spec = this.parseOpenAPISpec(specText);

      // Extract discovery information
      const discovery: APIDiscoveryResult = {
        serviceName: request.serviceName,
        baseUrl: spec.servers?.[0]?.url || 'https://api.example.com',
        version: spec.info?.version || 'v1',
        authType: this.determineAuthType(spec),
        endpoints: this.extractEndpoints(spec),
        dataTypes: this.extractDataTypes(spec),
        rateLimiting: this.extractRateLimiting(spec),
        pagination: this.extractPagination(spec),
        complianceScore: 0, // Will be calculated by compliance analyzer
        integrationFeasibility: 'medium' // Will be determined by compliance analyzer
      };

      this.logger.info('OpenAPI discovery completed', { 
        serviceName: request.serviceName, 
        endpointsFound: discovery.endpoints.length 
      });

      return this.createSuccessResponse(discovery);
    } catch (error) {
      return this.handleError(error, 'discover from OpenAPI spec');
    }
  }

  /**
   * Discover API from documentation (web scraping approach)
   */
  private async discoverFromDocumentation(request: APILearningRequest): Promise<ServiceResponse<APIDiscoveryResult>> {
    try {
      if (!request.documentationUrl) {
        return this.createErrorResponse('Documentation URL is required');
      }

      // This would involve web scraping and pattern recognition
      // For now, return a basic structure that can be enhanced
      const discovery: APIDiscoveryResult = {
        serviceName: request.serviceName,
        baseUrl: this.extractBaseUrlFromDocUrl(request.documentationUrl),
        version: 'v1', // Default version
        authType: 'oauth2', // Default auth type
        endpoints: [], // Would be extracted from documentation
        dataTypes: [], // Would be extracted from documentation
        rateLimiting: { headers: [] },
        pagination: { type: 'none' },
        complianceScore: 0,
        integrationFeasibility: 'medium'
      };

      this.logger.info('Documentation discovery completed (basic)', { serviceName: request.serviceName });
      return this.createSuccessResponse(discovery);
    } catch (error) {
      return this.handleError(error, 'discover from documentation');
    }
  }

  /**
   * Discover API from manual configuration
   */
  private async discoverFromManualConfig(request: APILearningRequest): Promise<ServiceResponse<APIDiscoveryResult>> {
    try {
      if (!request.manualConfig) {
        return this.createErrorResponse('Manual configuration is required');
      }

      const config = request.manualConfig;
      const discovery: APIDiscoveryResult = {
        serviceName: request.serviceName,
        baseUrl: config.baseUrl,
        version: config.version,
        authType: config.authType,
        endpoints: this.convertManualEndpoints(config.endpoints),
        dataTypes: this.extractDataTypesFromEndpoints(config.endpoints),
        rateLimiting: { headers: [] },
        pagination: { type: 'none' },
        complianceScore: 0,
        integrationFeasibility: 'medium'
      };

      this.logger.info('Manual config discovery completed', { serviceName: request.serviceName });
      return this.createSuccessResponse(discovery);
    } catch (error) {
      return this.handleError(error, 'discover from manual config');
    }
  }

  /**
   * Parse OpenAPI specification (JSON or YAML)
   */
  private parseOpenAPISpec(specText: string): any {
    try {
      // Try JSON first
      if (specText.trim().startsWith('{')) {
        return JSON.parse(specText);
      }
      
      // Try YAML (would need a YAML parser)
      // For now, assume JSON
      return JSON.parse(specText);
    } catch (error) {
      this.logger.error('Failed to parse OpenAPI spec', { error });
      throw new Error('Invalid OpenAPI specification format');
    }
  }

  /**
   * Determine authentication type from OpenAPI spec
   */
  private determineAuthType(spec: any): 'oauth2' | 'api_key' | 'bearer' {
    const securitySchemes = spec.components?.securitySchemes || {};
    
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      const schemeObj = scheme as any;
      
      if (schemeObj.type === 'oauth2') {
        return 'oauth2';
      } else if (schemeObj.type === 'apiKey') {
        return 'api_key';
      } else if (schemeObj.type === 'http' && schemeObj.scheme === 'bearer') {
        return 'bearer';
      }
    }
    
    return 'oauth2'; // Default to OAuth2
  }

  /**
   * Extract endpoints from OpenAPI spec
   */
  private extractEndpoints(spec: any): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];
    const paths = spec.paths || {};
    
    for (const [path, methods] of Object.entries(paths)) {
      const methodsObj = methods as any;
      
      for (const [method, operation] of Object.entries(methodsObj)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const operationObj = operation as any;
          
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: operationObj.summary || operationObj.description || '',
            parameters: this.extractParameters(operationObj.parameters || []),
            responseSchema: this.extractResponseSchema(operationObj.responses),
            rateLimit: this.extractRateLimit(operationObj)
          });
        }
      }
    }
    
    return endpoints;
  }

  /**
   * Extract parameters from OpenAPI operation
   */
  private extractParameters(parameters: any[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      type: param.schema?.type || param.type || 'string',
      required: param.required || false,
      description: param.description || ''
    }));
  }

  /**
   * Extract response schema from OpenAPI operation
   */
  private extractResponseSchema(responses: any): any {
    const successResponse = responses['200'] || responses['201'] || responses['default'];
    return successResponse?.content?.['application/json']?.schema || {};
  }

  /**
   * Extract rate limit information from operation
   */
  private extractRateLimit(operation: any): string | undefined {
    // Look for rate limit information in various places
    return operation['x-rate-limit'] || 
           operation['x-ratelimit'] || 
           operation.extensions?.['x-rate-limit'];
  }

  /**
   * Extract data types from OpenAPI spec
   */
  private extractDataTypes(spec: any): DataType[] {
    const dataTypes: DataType[] = [];
    const schemas = spec.components?.schemas || {};
    
    for (const [name, schema] of Object.entries(schemas)) {
      const schemaObj = schema as any;
      
      if (schemaObj.type === 'object' || schemaObj.properties) {
        dataTypes.push({
          name: name.toLowerCase(),
          schema: schemaObj,
          endpoints: this.findEndpointsForSchema(spec, name),
          sampleData: this.generateSampleData(schemaObj)
        });
      }
    }
    
    return dataTypes;
  }

  /**
   * Find endpoints that use a specific schema
   */
  private findEndpointsForSchema(spec: any, schemaName: string): string[] {
    const endpoints: string[] = [];
    const paths = spec.paths || {};
    
    for (const [path, methods] of Object.entries(paths)) {
      const methodsObj = methods as any;
      
      for (const [method, operation] of Object.entries(methodsObj)) {
        const operationObj = operation as any;
        const responseSchema = this.extractResponseSchema(operationObj.responses);
        
        if (this.schemaReferences(responseSchema, schemaName)) {
          endpoints.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }
    
    return endpoints;
  }

  /**
   * Check if a schema references another schema
   */
  private schemaReferences(schema: any, schemaName: string): boolean {
    if (schema.$ref && schema.$ref.includes(schemaName)) {
      return true;
    }
    
    if (schema.items && this.schemaReferences(schema.items, schemaName)) {
      return true;
    }
    
    if (schema.properties) {
      for (const prop of Object.values(schema.properties)) {
        if (this.schemaReferences(prop as any, schemaName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Generate sample data from schema
   */
  private generateSampleData(schema: any): any[] {
    // Simple sample data generation
    const sample = {};
    
    if (schema.properties) {
      for (const [name, prop] of Object.entries(schema.properties)) {
        const propObj = prop as any;
        sample[name] = this.generateSampleValue(propObj);
      }
    }
    
    return [sample];
  }

  /**
   * Generate sample value based on schema type
   */
  private generateSampleValue(schema: any): any {
    const type = schema.type || 'string';
    
    switch (type) {
      case 'string':
        return schema.example || 'sample_string';
      case 'number':
      case 'integer':
        return schema.example || 123;
      case 'boolean':
        return schema.example || true;
      case 'array':
        return schema.example || [];
      case 'object':
        return schema.example || {};
      default:
        return 'sample_value';
    }
  }

  /**
   * Extract rate limiting information from OpenAPI spec
   */
  private extractRateLimiting(spec: any): RateLimitInfo {
    const rateLimiting: RateLimitInfo = {
      headers: [],
      limits: {},
      documentation: ''
    };
    
    // Look for rate limiting information in various places
    if (spec['x-rate-limit-headers']) {
      rateLimiting.headers = spec['x-rate-limit-headers'];
    }
    
    if (spec['x-rate-limit-documentation']) {
      rateLimiting.documentation = spec['x-rate-limit-documentation'];
    }
    
    return rateLimiting;
  }

  /**
   * Extract pagination information from OpenAPI spec
   */
  private extractPagination(spec: any): PaginationInfo {
    const pagination: PaginationInfo = {
      type: 'none',
      parameters: [],
      responseFields: []
    };
    
    // Look for pagination patterns in the spec
    const paths = spec.paths || {};
    
    for (const [path, methods] of Object.entries(paths)) {
      const methodsObj = methods as any;
      
      for (const [method, operation] of Object.entries(methodsObj)) {
        const operationObj = operation as any;
        const parameters = operationObj.parameters || [];
        
        // Check for pagination parameters
        for (const param of parameters) {
          if (['page', 'cursor', 'offset', 'limit'].includes(param.name?.toLowerCase())) {
            pagination.type = this.determinePaginationType(param.name);
            pagination.parameters.push(param.name);
          }
        }
        
        // Check for pagination response fields
        const responseSchema = this.extractResponseSchema(operationObj.responses);
        if (responseSchema.properties) {
          for (const field of Object.keys(responseSchema.properties)) {
            if (['next_cursor', 'has_more', 'next_page'].includes(field.toLowerCase())) {
              pagination.responseFields.push(field);
            }
          }
        }
      }
    }
    
    return pagination;
  }

  /**
   * Determine pagination type from parameter name
   */
  private determinePaginationType(paramName: string): 'cursor' | 'offset' | 'page' | 'none' {
    const name = paramName.toLowerCase();
    
    if (name.includes('cursor')) return 'cursor';
    if (name.includes('offset')) return 'offset';
    if (name.includes('page')) return 'page';
    
    return 'none';
  }

  /**
   * Extract base URL from documentation URL
   */
  private extractBaseUrlFromDocUrl(docUrl: string): string {
    try {
      const url = new URL(docUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return 'https://api.example.com';
    }
  }

  /**
   * Convert manual endpoints to APIEndpoint format
   */
  private convertManualEndpoints(endpoints: any[]): APIEndpoint[] {
    return endpoints.map(endpoint => ({
      path: endpoint.path || '/',
      method: endpoint.method || 'GET',
      description: endpoint.description || '',
      parameters: endpoint.parameters || [],
      responseSchema: endpoint.responseSchema || {},
      rateLimit: endpoint.rateLimit
    }));
  }

  /**
   * Extract data types from manual endpoints
   */
  private extractDataTypesFromEndpoints(endpoints: any[]): DataType[] {
    const dataTypes: DataType[] = [];
    
    // Group endpoints by likely data type
    const endpointGroups: Record<string, string[]> = {};
    
    for (const endpoint of endpoints) {
      const path = endpoint.path || '';
      const segments = path.split('/').filter(Boolean);
      
      if (segments.length > 0) {
        const dataType = segments[segments.length - 1]; // Last segment as data type
        if (!endpointGroups[dataType]) {
          endpointGroups[dataType] = [];
        }
        endpointGroups[dataType].push(`${endpoint.method || 'GET'} ${path}`);
      }
    }
    
    // Create data types from groups
    for (const [name, endpointList] of Object.entries(endpointGroups)) {
      dataTypes.push({
        name: name.toLowerCase(),
        schema: {}, // Would need to be provided in manual config
        endpoints: endpointList,
        sampleData: []
      });
    }
    
    return dataTypes;
  }
}
