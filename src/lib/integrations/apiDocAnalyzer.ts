/**
 * API Documentation Analyzer
 * 
 * This service parses API documentation (OpenAPI/Swagger and other formats)
 * and generates integration models and connectors for Nexus.
 */

import type { Integration, UserIntegration } from '../../lib/types/userProfile';

// Types for API documentation analysis
export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: Record<string, APIResponse>;
  tags?: string[];
  security?: string[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  schema: APISchema;
  description?: string;
}

export interface APIRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, { schema: APISchema }>;
}

export interface APIResponse {
  description: string;
  content?: Record<string, { schema: APISchema }>;
}

export interface APISchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  properties?: Record<string, APISchema>;
  items?: APISchema;
  required?: string[];
  enum?: (string | number)[];
  description?: string;
}

export interface APIAuthentication {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  flows?: Record<string, {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes?: Record<string, string>;
  }>;
  scheme?: string; // For HTTP authentication
  bearerFormat?: string; // For HTTP bearer
  in?: 'query' | 'header' | 'cookie'; // For apiKey
  name?: string; // For apiKey
}

export interface APIDocumentation {
  info: {
    title: string;
    description?: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, APIEndpoint>>;
  components?: {
    schemas?: Record<string, APISchema>;
    securitySchemes?: Record<string, APIAuthentication>;
  };
}

export interface IntegrationPattern {
  endpointGroup: string;
  purpose: string;
  requiredEndpoints: APIEndpoint[];
  dataModel: Record<string, APISchema>;
  authRequirements: APIAuthentication[];
  configRequirements: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  usageSuggestions: string[];
}

export interface GeneratedConnector {
  integrationName: string;
  integrationSlug: string;
  configTemplate: Record<string, any>;
  endpointMappers: Record<string, string>;
  authSetupCode: string;
  clientSetupCode: string;
}

// Main API Documentation Analyzer Class
export class APIDocAnalyzer {
  /**
   * Parse an OpenAPI/Swagger document
   */
  async parseOpenAPIDoc(openApiJson: string): Promise<APIDocumentation> {
    try {
      const parsedDoc = JSON.parse(openApiJson);
      
      // Validate that this is an OpenAPI document
      if (!parsedDoc.openapi && !parsedDoc.swagger) {
        throw new Error('Invalid OpenAPI document format');
      }
      
      // Transform the document into our internal format
      const apiDoc: APIDocumentation = {
        info: parsedDoc.info,
        servers: parsedDoc.servers || [{ url: parsedDoc.host || '' }],
        paths: {},
        components: parsedDoc.components
      };
      
      // Process paths and endpoints
      Object.entries(parsedDoc.paths).forEach(([path, pathItem]: [string, any]) => {
        apiDoc.paths[path] = {};
        
        // Process HTTP methods
        ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
          if (pathItem[method]) {
            const methodUpper = method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            apiDoc.paths[path][method] = this.transformEndpoint(pathItem[method], methodUpper);
          }
        });
      });
      
      return apiDoc;
    } catch (error) {
      console.error('Error parsing OpenAPI document:', error);
      throw new Error(`Failed to parse API documentation: ${error}`);
    }
  }
  
  /**
   * Transform an OpenAPI endpoint to our internal format
   */
  private transformEndpoint(endpoint: any, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): APIEndpoint {
    return {
      path: endpoint.path || '',
      method,
      description: endpoint.summary || endpoint.description || '',
      parameters: endpoint.parameters?.map(this.transformParameter) || [],
      requestBody: endpoint.requestBody ? this.transformRequestBody(endpoint.requestBody) : undefined,
      responses: this.transformResponses(endpoint.responses || {}),
      tags: endpoint.tags || [],
      security: endpoint.security || []
    };
  }
  
  /**
   * Transform OpenAPI parameter to our internal format
   */
  private transformParameter(param: any): APIParameter {
    return {
      name: param.name,
      in: param.in,
      required: param.required || false,
      schema: param.schema ? this.transformSchema(param.schema) : { type: 'string' },
      description: param.description
    };
  }
  
  /**
   * Transform OpenAPI request body to our internal format
   */
  private transformRequestBody(requestBody: any): APIRequestBody {
    return {
      description: requestBody.description,
      required: requestBody.required || false,
      content: Object.entries(requestBody.content || {}).reduce((acc, [contentType, content]: [string, any]) => {
        acc[contentType] = {
          schema: this.transformSchema(content.schema)
        };
        return acc;
      }, {} as Record<string, { schema: APISchema }>)
    };
  }
  
  /**
   * Transform OpenAPI responses to our internal format
   */
  private transformResponses(responses: Record<string, any>): Record<string, APIResponse> {
    return Object.entries(responses).reduce((acc, [code, response]: [string, any]) => {
      acc[code] = {
        description: response.description || '',
        content: response.content ? Object.entries(response.content).reduce((contentAcc, [contentType, content]: [string, any]) => {
          contentAcc[contentType] = {
            schema: this.transformSchema(content.schema)
          };
          return contentAcc;
        }, {} as Record<string, { schema: APISchema }>) : undefined
      };
      return acc;
    }, {} as Record<string, APIResponse>);
  }
  
  /**
   * Transform OpenAPI schema to our internal format
   */
  private transformSchema(schema: any): APISchema {
    if (!schema) return { type: 'object' };
    
    return {
      type: schema.type || 'object',
      format: schema.format,
      properties: schema.properties ? Object.entries(schema.properties).reduce((acc, [propName, propSchema]: [string, any]) => {
        acc[propName] = this.transformSchema(propSchema);
        return acc;
      }, {} as Record<string, APISchema>) : undefined,
      items: schema.items ? this.transformSchema(schema.items) : undefined,
      required: schema.required,
      enum: schema.enum,
      description: schema.description
    };
  }
  
  /**
   * Analyze API documentation to generate integration patterns
   */
  async analyzeDocumentation(apiDoc: APIDocumentation): Promise<IntegrationPattern[]> {
    // Group endpoints by tags
    const endpointsByTag = this.groupEndpointsByTags(apiDoc);
    
    // Generate patterns for each endpoint group
    const patterns: IntegrationPattern[] = [];
    
    for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
      // Skip tags with too few endpoints
      if (endpoints.length < 2) continue;
      
      const pattern: IntegrationPattern = {
        endpointGroup: tag,
        purpose: this.inferPurpose(tag, endpoints),
        requiredEndpoints: this.identifyKeyEndpoints(endpoints),
        dataModel: this.extractDataModels(endpoints, apiDoc),
        authRequirements: this.identifyAuthRequirements(endpoints, apiDoc),
        configRequirements: this.identifyConfigRequirements(tag, endpoints),
        usageSuggestions: this.generateUsageSuggestions(tag, endpoints)
      };
      
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  /**
   * Group endpoints by their tags
   */
  private groupEndpointsByTags(apiDoc: APIDocumentation): Record<string, APIEndpoint[]> {
    const endpointsByTag: Record<string, APIEndpoint[]> = {};
    
    // Iterate through all paths and methods
    Object.entries(apiDoc.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        const tags = endpoint.tags?.length ? endpoint.tags : ['default'];
        
        // Add this endpoint to each of its tags
        tags.forEach(tag => {
          if (!endpointsByTag[tag]) {
            endpointsByTag[tag] = [];
          }
          
          const fullEndpoint = {
            ...endpoint,
            path: path // Ensure path is included
          };
          
          endpointsByTag[tag].push(fullEndpoint);
        });
      });
    });
    
    return endpointsByTag;
  }
  
  /**
   * Infer the purpose of an endpoint group based on tag and endpoints
   */
  private inferPurpose(tag: string, endpoints: APIEndpoint[]): string {
    // Simple purpose inference based on tag name and endpoint methods
    const hasCRUD = 
      endpoints.some(e => e.method === 'GET') &&
      endpoints.some(e => e.method === 'POST') &&
      (endpoints.some(e => e.method === 'PUT') || endpoints.some(e => e.method === 'PATCH')) &&
      endpoints.some(e => e.method === 'DELETE');
      
    if (hasCRUD) {
      return `Manage ${tag} records with full CRUD operations`;
    }
    
    if (endpoints.every(e => e.method === 'GET')) {
      return `Read-only access to ${tag} data`;
    }
    
    return `Interact with ${tag} functionality`;
  }
  
  /**
   * Identify the key endpoints required for basic integration
   */
  private identifyKeyEndpoints(endpoints: APIEndpoint[]): APIEndpoint[] {
    // For simplicity, we'll just pick a few key endpoints
    // In a real implementation, this would be more sophisticated
    
    // Prioritize listing/getting endpoints, then creation, then update/delete
    const getEndpoints = endpoints.filter(e => e.method === 'GET').slice(0, 2);
    const createEndpoints = endpoints.filter(e => e.method === 'POST').slice(0, 1);
    const updateEndpoints = endpoints.filter(e => 
      e.method === 'PUT' || e.method === 'PATCH'
    ).slice(0, 1);
    
    return [...getEndpoints, ...createEndpoints, ...updateEndpoints];
  }
  
  /**
   * Extract data models from endpoints
   */
  private extractDataModels(endpoints: APIEndpoint[], apiDoc: APIDocumentation): Record<string, APISchema> {
    const dataModels: Record<string, APISchema> = {};
    
    // Look at request bodies and responses for data models
    endpoints.forEach(endpoint => {
      // From request body
      if (endpoint.requestBody?.content) {
        Object.values(endpoint.requestBody.content).forEach(content => {
          if (content.schema.type === 'object' && content.schema.properties) {
            const modelName = `${endpoint.path.split('/').pop() || 'model'}Request`;
            dataModels[modelName] = content.schema;
          }
        });
      }
      
      // From responses
      Object.values(endpoint.responses).forEach(response => {
        if (response.content) {
          Object.values(response.content).forEach(content => {
            if (content.schema.type === 'object' && content.schema.properties) {
              const modelName = `${endpoint.path.split('/').pop() || 'model'}Response`;
              dataModels[modelName] = content.schema;
            }
          });
        }
      });
    });
    
    return dataModels;
  }
  
  /**
   * Identify authentication requirements
   */
  private identifyAuthRequirements(endpoints: APIEndpoint[], apiDoc: APIDocumentation): APIAuthentication[] {
    const authMethods: APIAuthentication[] = [];
    
    // Check security requirements from components
    if (apiDoc.components?.securitySchemes) {
      Object.values(apiDoc.components.securitySchemes).forEach(scheme => {
        authMethods.push(scheme);
      });
    }
    
    return authMethods;
  }
  
  /**
   * Identify configuration requirements for integration
   */
  private identifyConfigRequirements(tag: string, endpoints: APIEndpoint[]): Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }> {
    // Basic config requirements
    const configRequirements = [
      {
        name: 'baseUrl',
        type: 'string',
        description: 'API base URL',
        required: true
      }
    ];
    
    // Add auth-related config
    const authMethods = new Set<string>();
    endpoints.forEach(endpoint => {
      endpoint.security?.forEach(security => {
        Object.keys(security).forEach(key => {
          authMethods.add(key);
        });
      });
    });
    
    authMethods.forEach(method => {
      configRequirements.push({
        name: `${method}`,
        type: 'string',
        description: `Authentication token for ${method}`,
        required: true
      });
    });
    
    return configRequirements;
  }
  
  /**
   * Generate usage suggestions for the integration
   */
  private generateUsageSuggestions(tag: string, endpoints: APIEndpoint[]): string[] {
    const suggestions: string[] = [];
    
    // Basic usage suggestions
    suggestions.push(`Connect to ${tag} to synchronize data with Nexus`);
    
    if (endpoints.some(e => e.method === 'GET')) {
      suggestions.push(`Import ${tag} data into reports and dashboards`);
    }
    
    if (endpoints.some(e => e.method === 'POST')) {
      suggestions.push(`Create new ${tag} records from Nexus workflows`);
    }
    
    if (endpoints.some(e => e.method === 'PUT' || e.method === 'PATCH')) {
      suggestions.push(`Update ${tag} data based on Nexus events`);
    }
    
    return suggestions;
  }
  
  /**
   * Generate a connector implementation based on the API documentation
   */
  async generateConnector(
    apiDoc: APIDocumentation, 
    patterns: IntegrationPattern[]
  ): Promise<GeneratedConnector> {
    const integrationName = apiDoc.info.title;
    const integrationSlug = integrationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Generate configuration template
    const configTemplate: Record<string, any> = {};
    
    // Combine config requirements from all patterns
    const allConfigRequirements = patterns.flatMap(p => p.configRequirements);
    allConfigRequirements.forEach(config => {
      configTemplate[config.name] = {
        type: config.type,
        description: config.description,
        required: config.required
      };
    });
    
    // Generate client setup code based on authentication requirements
    const authTypes = new Set(patterns.flatMap(p => p.authRequirements.map(a => a.type)));
    let authSetupCode = '';
    let clientSetupCode = '';
    
    if (authTypes.has('oauth2')) {
      authSetupCode = this.generateOAuth2Setup(patterns);
      clientSetupCode = this.generateOAuth2Client(patterns);
    } else if (authTypes.has('apiKey')) {
      authSetupCode = this.generateApiKeySetup(patterns);
      clientSetupCode = this.generateApiKeyClient(patterns);
    } else {
      // Default to basic setup
      authSetupCode = this.generateBasicAuthSetup();
      clientSetupCode = this.generateBasicAuthClient();
    }
    
    // Generate endpoint mappers for all patterns
    const endpointMappers: Record<string, string> = {};
    patterns.forEach(pattern => {
      pattern.requiredEndpoints.forEach(endpoint => {
        const functionName = this.endpointToFunctionName(endpoint);
        endpointMappers[functionName] = this.generateEndpointMapper(endpoint);
      });
    });
    
    return {
      integrationName,
      integrationSlug,
      configTemplate,
      endpointMappers,
      authSetupCode,
      clientSetupCode
    };
  }
  
  /**
   * Generate OAuth2 setup code
   */
  private generateOAuth2Setup(patterns: IntegrationPattern[]): string {
    // Find OAuth2 auth requirement
    const oauth2Auth = patterns
      .flatMap(p => p.authRequirements)
      .find(a => a.type === 'oauth2');
    
    if (!oauth2Auth || !oauth2Auth.flows) {
      return '// OAuth2 configuration not found in API documentation';
    }
    
    // Get first OAuth2 flow
    const [flowType, flow] = Object.entries(oauth2Auth.flows)[0];
    
    return `
/**
 * OAuth2 authentication setup for ${oauth2Auth.description || 'API'}
 */
export const setupOAuth2 = async (config: IntegrationConfig): Promise<AuthCredentials> => {
  // OAuth2 flow: ${flowType}
  const authUrl = '${flow.authorizationUrl || ''}';
  const tokenUrl = '${flow.tokenUrl || ''}';
  
  // Configure required scopes
  const requiredScopes = [
    ${Object.keys(flow.scopes || {}).map(scope => `'${scope}'`).join(',\n    ')}
  ];
  
  // Set up OAuth2 client
  const oauth2Client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    authorizationUrl: authUrl,
    tokenUrl: tokenUrl
  });
  
  // Generate authorization URL
  const authorizationUrl = oauth2Client.getAuthorizationUrl({
    scope: requiredScopes.join(' '),
    state: generateRandomState()
  });
  
  return {
    type: 'oauth2',
    authorizationUrl,
    clientId: config.clientId
  };
};

export const handleOAuth2Callback = async (
  config: IntegrationConfig,
  code: string,
  state: string
): Promise<TokenCredentials> => {
  // Validate state to prevent CSRF attacks
  if (state !== getStoredState(config.clientId)) {
    throw new Error('Invalid state parameter');
  }
  
  // Exchange code for tokens
  const oauth2Client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    tokenUrl: '${flow.tokenUrl || ''}'
  });
  
  const tokenResponse = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
  };
};

export const refreshOAuth2Token = async (
  config: IntegrationConfig,
  credentials: TokenCredentials
): Promise<TokenCredentials> => {
  const oauth2Client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    tokenUrl: '${flow.tokenUrl || ''}'
  });
  
  const tokenResponse = await oauth2Client.refreshToken(credentials.refreshToken);
  
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || credentials.refreshToken,
    expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
  };
};`;
  }
  
  /**
   * Generate OAuth2 client code
   */
  private generateOAuth2Client(patterns: IntegrationPattern[]): string {
    return `
/**
 * Create API client with OAuth2 authentication
 */
export const createApiClient = (config: IntegrationConfig, credentials: TokenCredentials): ApiClient => {
  // Create axios instance with base configuration
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Authorization': \`Bearer \${credentials.accessToken}\`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  // Add token refresh interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 and we haven't tried to refresh token yet
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Check if token needs refresh
        if (credentials.expiresAt && Date.now() > credentials.expiresAt) {
          // Refresh token
          const newCredentials = await refreshOAuth2Token(config, credentials);
          
          // Update token in storage
          await updateStoredCredentials(config.integrationId, newCredentials);
          
          // Update authorization header
          originalRequest.headers['Authorization'] = \`Bearer \${newCredentials.accessToken}\`;
          
          // Retry the request with new token
          return client(originalRequest);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};`;
  }
  
  /**
   * Generate API Key setup code
   */
  private generateApiKeySetup(patterns: IntegrationPattern[]): string {
    // Find API Key auth requirement
    const apiKeyAuth = patterns
      .flatMap(p => p.authRequirements)
      .find(a => a.type === 'apiKey');
    
    if (!apiKeyAuth) {
      return '// API Key configuration not found in API documentation';
    }
    
    return `
/**
 * API Key authentication setup
 */
export const setupApiKey = (config: IntegrationConfig): AuthCredentials => {
  return {
    type: 'apiKey',
    apiKey: config.apiKey,
    keyName: '${apiKeyAuth.name || 'api_key'}',
    keyLocation: '${apiKeyAuth.in || 'header'}'
  };
};`;
  }
  
  /**
   * Generate API Key client code
   */
  private generateApiKeyClient(patterns: IntegrationPattern[]): string {
    // Find API Key auth requirement
    const apiKeyAuth = patterns
      .flatMap(p => p.authRequirements)
      .find(a => a.type === 'apiKey');
    
    if (!apiKeyAuth) {
      return '// API Key client configuration not found in API documentation';
    }
    
    const keyLocation = apiKeyAuth.in || 'header';
    const keyName = apiKeyAuth.name || 'api_key';
    
    let headerConfig = '';
    if (keyLocation === 'header') {
      headerConfig = `headers: {
      '${keyName}': credentials.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }`;
    } else if (keyLocation === 'query') {
      headerConfig = `headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    params: {
      '${keyName}': credentials.apiKey
    }`;
    }
    
    return `
/**
 * Create API client with API Key authentication
 */
export const createApiClient = (config: IntegrationConfig, credentials: AuthCredentials): ApiClient => {
  // Create axios instance with base configuration
  const client = axios.create({
    baseURL: config.baseUrl,
    ${headerConfig}
  });
  
  return client;
};`;
  }
  
  /**
   * Generate basic auth setup code (fallback)
   */
  private generateBasicAuthSetup(): string {
    return `
/**
 * Basic authentication setup
 */
export const setupBasicAuth = (config: IntegrationConfig): AuthCredentials => {
  return {
    type: 'basic',
    username: config.username,
    password: config.password
  };
};`;
  }
  
  /**
   * Generate basic auth client code (fallback)
   */
  private generateBasicAuthClient(): string {
    return `
/**
 * Create API client with Basic authentication
 */
export const createApiClient = (config: IntegrationConfig, credentials: AuthCredentials): ApiClient => {
  // Create axios instance with base configuration
  const client = axios.create({
    baseURL: config.baseUrl,
    auth: {
      username: credentials.username,
      password: credentials.password
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  return client;
};`;
  }
  
  /**
   * Generate endpoint mapper code
   */
  private generateEndpointMapper(endpoint: APIEndpoint): string {
    const functionName = this.endpointToFunctionName(endpoint);
    const method = endpoint.method.toLowerCase();
    let url = endpoint.path;
    
    // Replace path parameters with template literals
    const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
    pathParams.forEach(param => {
      url = url.replace(`{${param.name}}`, `\${params.${param.name}}`);
    });
    
    // Handle query parameters
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    const hasQueryParams = queryParams.length > 0;
    
    // Handle request body
    const hasRequestBody = endpoint.requestBody?.required || false;
    
    let code = `
/**
 * ${endpoint.description || functionName}
 */
export const ${functionName} = async (client: ApiClient, `;
    
    // Add parameters
    if (pathParams.length > 0 || queryParams.length > 0) {
      code += `params: {
      ${pathParams.map(p => `${p.name}${p.required ? '' : '?'}: ${this.schemaTypeToTS(p.schema)}`).join(',\n      ')}
      ${queryParams.map(p => `${p.name}${p.required ? '' : '?'}: ${this.schemaTypeToTS(p.schema)}`).join(',\n      ')}
    }`;
      
      if (hasRequestBody) {
        code += `, `;
      }
    }
    
    // Add request body
    if (hasRequestBody) {
      const bodyContent = endpoint.requestBody?.content || {};
      const firstContentType = Object.keys(bodyContent)[0] || 'application/json';
      const bodySchema = bodyContent[firstContentType]?.schema;
      
      code += `data: ${this.schemaTypeToTS(bodySchema)}`;
    }
    
    code += `): Promise<any> => {
    try {`;
    
    // Generate request code
    let requestCode = '';
    if (method === 'get' || method === 'delete') {
      requestCode = `
      const response = await client.${method}(\`${url}\`${hasQueryParams ? ', { params }' : ''});`;
    } else {
      requestCode = `
      const response = await client.${method}(\`${url}\`${hasRequestBody ? ', data' : ', {}'});`;
    }
    
    code += requestCode;
    
    // Return response data
    code += `
      return response.data;
    } catch (error) {
      console.error(\`Error in ${functionName}:\`, error);
      throw new Error(\`API error in ${functionName}: \${error.message}\`);
    }
  };`;
    
    return code;
  }
  
  /**
   * Convert endpoint to function name
   */
  private endpointToFunctionName(endpoint: APIEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathParts = endpoint.path.split('/').filter(Boolean);
    
    // Remove path parameters
    const cleanPathParts = pathParts.map(part => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return 'By' + part.substring(1, part.length - 1);
      }
      return part;
    });
    
    // Generate function name
    let functionName = '';
    
    if (method === 'get') {
      // Check if it's likely a list endpoint (no path params at the end)
      const lastPart = pathParts[pathParts.length - 1];
      if (!lastPart.startsWith('{')) {
        functionName = 'get' + this.capitalize(lastPart);
      } else {
        // It's likely a single item endpoint
        const resourceName = pathParts[pathParts.length - 2];
        functionName = 'get' + this.capitalize(resourceName) + 'ById';
      }
    } else if (method === 'post') {
      const resourceName = pathParts[pathParts.length - 1];
      functionName = 'create' + this.capitalize(resourceName);
    } else if (method === 'put' || method === 'patch') {
      const resourceName = pathParts[pathParts.length - 2];
      functionName = 'update' + this.capitalize(resourceName);
    } else if (method === 'delete') {
      const resourceName = pathParts[pathParts.length - 2];
      functionName = 'delete' + this.capitalize(resourceName);
    }
    
    return functionName;
  }
  
  /**
   * Convert schema type to TypeScript type
   */
  private schemaTypeToTS(schema?: APISchema): string {
    if (!schema) return 'any';
    
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        if (schema.items) {
          return `${this.schemaTypeToTS(schema.items)}[]`;
        }
        return 'any[]';
      case 'object':
        if (schema.properties) {
          return `{
            ${Object.entries(schema.properties).map(([propName, propSchema]) => {
              const isRequired = schema.required?.includes(propName) || false;
              return `${propName}${isRequired ? '' : '?'}: ${this.schemaTypeToTS(propSchema)}`;
            }).join(',\n            ')}
          }`;
        }
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }
  
  /**
   * Capitalize first letter of string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const apiDocAnalyzer = new APIDocAnalyzer(); 