/**
 * API Documentation Analyzer
 * Analyzes OpenAPI/Swagger documentation to discover data points and integration patterns
 */

export interface ApiDocAnalysisResult {
  title: string;
  version: string;
  serverUrl: string;
  authMethods: string[];
  endpointCount: number;
  patterns: IntegrationPattern[];
}

export interface IntegrationPattern {
  name: string;
  description: string;
  endpoints: IntegrationEndpoint[];
}

export interface IntegrationEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
}

export interface DataPointDiscovery {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description: string;
  category: DataPointCategory;
  businessValue: 'high' | 'medium' | 'low';
  refreshFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  isRequired: boolean;
  sampleValue: any;
}

export type DataPointCategory = 
  | 'customer' | 'financial' | 'operational' | 'marketing' | 'sales'
  | 'support' | 'analytics' | 'communication' | 'document' | 'task'
  | 'project' | 'inventory' | 'hr' | 'legal' | 'other';

export class APIDocAnalyzer {
  /**
   * Analyze OpenAPI/Swagger documentation to extract data points
   */
  async analyzeApiDoc(apiDoc: any): Promise<ApiDocAnalysisResult> {
    const docObj = typeof apiDoc === 'string' ? JSON.parse(apiDoc) : apiDoc;
    
    return {
      title: docObj.info?.title || 'Untitled API',
      version: docObj.info?.version || '1.0.0',
      serverUrl: docObj.servers?.[0]?.url || 'https://api.example.com',
      authMethods: this.extractAuthMethods(docObj),
      endpointCount: Object.keys(docObj.paths || {}).length,
      patterns: this.identifyPatterns(docObj)
    };
  }

  /**
   * Discover data points from API documentation
   */
  async discoverDataPoints(apiDoc: any, integrationType?: string): Promise<DataPointDiscovery[]> {
    const docObj = typeof apiDoc === 'string' ? JSON.parse(apiDoc) : apiDoc;
    const dataPoints: DataPointDiscovery[] = [];

    // Analyze each endpoint for potential data points
    for (const [path, pathObj] of Object.entries(docObj.paths || {})) {
      for (const [method, methodObj] of Object.entries(pathObj as any)) {
        if (method === 'get' || method === 'post') {
          const endpointDataPoints = this.extractDataPointsFromEndpoint(
            path,
            method.toUpperCase(),
            methodObj as any,
            integrationType
          );
          dataPoints.push(...endpointDataPoints);
        }
      }
    }

    return dataPoints;
  }

  /**
   * Extract authentication methods from API documentation
   */
  private extractAuthMethods(docObj: any): string[] {
    const authMethods: string[] = [];
    
    if (docObj.components?.securitySchemes) {
      for (const [name, scheme] of Object.entries(docObj.components.securitySchemes)) {
        const schemeObj = scheme as any;
        if (schemeObj.type === 'oauth2') {
          authMethods.push('oauth2');
        } else if (schemeObj.type === 'apiKey') {
          authMethods.push('apiKey');
        } else if (schemeObj.type === 'http' && schemeObj.scheme === 'bearer') {
          authMethods.push('bearer');
        }
      }
    }

    return [...new Set(authMethods)];
  }

  /**
   * Identify common patterns in API endpoints
   */
  private identifyPatterns(docObj: any): IntegrationPattern[] {
    const patterns: IntegrationPattern[] = [];
    const paths = docObj.paths || {};

    // CRUD Operations Pattern
    const crudEndpoints = this.findCRUDEndpoints(paths);
    if (crudEndpoints.length > 0) {
      patterns.push({
        name: 'CRUD Operations',
        description: 'Standard Create, Read, Update, Delete operations',
        endpoints: crudEndpoints
      });
    }

    // Search/Query Pattern
    const searchEndpoints = this.findSearchEndpoints(paths);
    if (searchEndpoints.length > 0) {
      patterns.push({
        name: 'Search & Query',
        description: 'Advanced search and filtering capabilities',
        endpoints: searchEndpoints
      });
    }

    // Analytics Pattern
    const analyticsEndpoints = this.findAnalyticsEndpoints(paths);
    if (analyticsEndpoints.length > 0) {
      patterns.push({
        name: 'Analytics & Reporting',
        description: 'Data analysis and reporting endpoints',
        endpoints: analyticsEndpoints
      });
    }

    return patterns;
  }

  /**
   * Find CRUD operation endpoints
   */
  private findCRUDEndpoints(paths: any): IntegrationEndpoint[] {
    const endpoints: IntegrationEndpoint[] = [];
    
    for (const [path, pathObj] of Object.entries(paths)) {
      const pathStr = path as string;
      const pathData = pathObj as any;
      
      // Look for typical CRUD patterns
      if (pathData.get && !pathStr.includes('{')) {
        endpoints.push({
          name: `Get ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: 'GET',
          description: `Retrieve ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
      
      if (pathData.post) {
        endpoints.push({
          name: `Create ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: 'POST',
          description: `Create new ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
      
      if (pathData.put || pathData.patch) {
        endpoints.push({
          name: `Update ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: pathData.put ? 'PUT' : 'PATCH',
          description: `Update ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
      
      if (pathData.delete) {
        endpoints.push({
          name: `Delete ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: 'DELETE',
          description: `Delete ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
    }
    
    return endpoints;
  }

  /**
   * Find search and query endpoints
   */
  private findSearchEndpoints(paths: any): IntegrationEndpoint[] {
    const endpoints: IntegrationEndpoint[] = [];
    
    for (const [path, pathObj] of Object.entries(paths)) {
      const pathStr = path as string;
      const pathData = pathObj as any;
      
      if (pathData.get && (pathStr.includes('search') || pathStr.includes('query') || pathStr.includes('filter'))) {
        endpoints.push({
          name: `Search ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: 'GET',
          description: `Search and filter ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
    }
    
    return endpoints;
  }

  /**
   * Find analytics and reporting endpoints
   */
  private findAnalyticsEndpoints(paths: any): IntegrationEndpoint[] {
    const endpoints: IntegrationEndpoint[] = [];
    
    for (const [path, pathObj] of Object.entries(paths)) {
      const pathStr = path as string;
      const pathData = pathObj as any;
      
      if (pathData.get && (pathStr.includes('analytics') || pathStr.includes('report') || pathStr.includes('stats'))) {
        endpoints.push({
          name: `Analytics: ${this.getResourceName(pathStr)}`,
          path: pathStr,
          method: 'GET',
          description: `Analytics and reporting for ${this.getResourceName(pathStr).toLowerCase()}`
        });
      }
    }
    
    return endpoints;
  }

  /**
   * Extract data points from a specific endpoint
   */
  private extractDataPointsFromEndpoint(
    path: string,
    method: string,
    methodObj: any,
    integrationType?: string
  ): DataPointDiscovery[] {
    const dataPoints: DataPointDiscovery[] = [];
    
    // Extract from response schema
    if (methodObj.responses?.['200']?.content?.['application/json']?.schema) {
      const schema = methodObj.responses['200'].content['application/json'].schema;
      const schemaDataPoints = this.extractDataPointsFromSchema(schema, path, integrationType);
      dataPoints.push(...schemaDataPoints);
    }
    
    // Extract from request body (for POST/PUT)
    if ((method === 'POST' || method === 'PUT') && methodObj.requestBody?.content?.['application/json']?.schema) {
      const schema = methodObj.requestBody.content['application/json'].schema;
      const schemaDataPoints = this.extractDataPointsFromSchema(schema, path, integrationType);
      dataPoints.push(...schemaDataPoints);
    }
    
    return dataPoints;
  }

  /**
   * Extract data points from JSON schema
   */
  private extractDataPointsFromSchema(
    schema: any,
    path: string,
    integrationType?: string
  ): DataPointDiscovery[] {
    const dataPoints: DataPointDiscovery[] = [];
    
    if (!schema) return dataPoints;
    
    // Handle different schema types
    if (schema.type === 'object' && schema.properties) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        const propSchema = propertySchema as any;
        const dataPoint = this.createDataPointFromProperty(
          propertyName,
          propSchema,
          path,
          integrationType
        );
        if (dataPoint) {
          dataPoints.push(dataPoint);
        }
      }
    } else if (schema.type === 'array' && schema.items) {
      // For arrays, analyze the item schema
      const itemDataPoints = this.extractDataPointsFromSchema(schema.items, path, integrationType);
      dataPoints.push(...itemDataPoints);
    }
    
    return dataPoints;
  }

  /**
   * Create a data point from a schema property
   */
  private createDataPointFromProperty(
    propertyName: string,
    propertySchema: any,
    path: string,
    integrationType?: string
  ): DataPointDiscovery | null {
    const type = this.mapSchemaTypeToDataPointType(propertySchema.type);
    const category = this.categorizeDataPoint(propertyName, path, integrationType);
    const businessValue = this.assessBusinessValue(propertyName, path);
    const refreshFrequency = this.assessRefreshFrequency(path);
    
    return {
      name: propertyName,
      type,
      description: propertySchema.description || `${propertyName} from ${path}`,
      category,
      businessValue,
      refreshFrequency,
      isRequired: propertySchema.required || false,
      sampleValue: this.generateSampleValue(propertySchema)
    };
  }

  /**
   * Map JSON schema type to data point type
   */
  private mapSchemaTypeToDataPointType(schemaType: string): DataPointDiscovery['type'] {
    switch (schemaType) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }

  /**
   * Categorize data point based on name and path
   */
  private categorizeDataPoint(name: string, path: string, integrationType?: string): DataPointCategory {
    const nameLower = name.toLowerCase();
    const pathLower = path.toLowerCase();
    
    // Integration-specific categorization
    if (integrationType === 'hubspot') {
      if (nameLower.includes('email') || pathLower.includes('contact')) return 'customer';
      if (nameLower.includes('amount') || nameLower.includes('deal')) return 'financial';
      if (nameLower.includes('company')) return 'customer';
    }
    
    if (integrationType === 'salesforce') {
      if (nameLower.includes('email') || pathLower.includes('contact')) return 'customer';
      if (nameLower.includes('amount') || nameLower.includes('opportunity')) return 'financial';
      if (nameLower.includes('account')) return 'customer';
    }
    
    // Generic categorization
    if (nameLower.includes('email') || nameLower.includes('contact')) return 'customer';
    if (nameLower.includes('amount') || nameLower.includes('revenue') || nameLower.includes('deal')) return 'financial';
    if (nameLower.includes('status') || nameLower.includes('performance')) return 'operational';
    if (nameLower.includes('campaign') || nameLower.includes('marketing')) return 'marketing';
    if (nameLower.includes('lead') || nameLower.includes('opportunity')) return 'sales';
    
    return 'other';
  }

  /**
   * Assess business value of a data point
   */
  private assessBusinessValue(name: string, path: string): DataPointDiscovery['businessValue'] {
    const nameLower = name.toLowerCase();
    
    // High value indicators
    if (nameLower.includes('email') || nameLower.includes('amount') || nameLower.includes('revenue')) {
      return 'high';
    }
    
    // Medium value indicators
    if (nameLower.includes('name') || nameLower.includes('status') || nameLower.includes('date')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess refresh frequency based on endpoint
   */
  private assessRefreshFrequency(path: string): DataPointDiscovery['refreshFrequency'] {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('realtime') || pathLower.includes('live')) return 'real-time';
    if (pathLower.includes('hourly') || pathLower.includes('minute')) return 'hourly';
    if (pathLower.includes('daily') || pathLower.includes('day')) return 'daily';
    if (pathLower.includes('weekly') || pathLower.includes('week')) return 'weekly';
    if (pathLower.includes('monthly') || pathLower.includes('month')) return 'monthly';
    
    return 'daily'; // Default
  }

  /**
   * Generate sample value for a schema property
   */
  private generateSampleValue(propertySchema: any): any {
    if (propertySchema.example) return propertySchema.example;
    
    switch (propertySchema.type) {
      case 'string':
        if (propertySchema.format === 'email') return 'user@example.com';
        if (propertySchema.format === 'date') return '2024-01-01';
        if (propertySchema.format === 'date-time') return '2024-01-01T00:00:00Z';
        return 'Sample String';
      case 'number':
      case 'integer':
        return 123;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Get resource name from path
   */
  private getResourceName(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment.includes('{')) {
      // Handle path parameters
      const paramName = lastSegment.replace('{', '').replace('}', '');
      return paramName.charAt(0).toUpperCase() + paramName.slice(1);
    }
    
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }
} 