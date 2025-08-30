# Integration Development Guide

## Overview

This guide shows you how to use the **API Learning System** to create integrations consistently and correctly. The system ensures all integrations follow Nexus standards and provides step-by-step guidance throughout the development process.

---

## Quick Start: Creating a New Integration

### **Step 1: Discover and Analyze the API**

```typescript
import { APILearningSystem } from '@/services/api-learning/APILearningSystem';

const apiLearning = new APILearningSystem();

// Example: Slack Integration
const request = {
  serviceName: 'slack',
  documentationUrl: 'https://api.slack.com/web',
  // Or use OpenAPI spec:
  // apiSpecUrl: 'https://api.slack.com/specs/openapi/v2/slack_web.json',
  targetDataTypes: ['channels', 'users', 'messages']
};

const result = await apiLearning.learnAndIntegrateAPI(request);

if (result.success) {
  console.log('✅ API Analysis Complete');
  console.log(`Compliance Score: ${result.data.compliance.score}/100`);
  console.log(`Feasibility: ${result.data.compliance.integrationFeasibility}`);
  
  // Get development checklist
  const checklist = apiLearning.getDevelopmentChecklist(result.data.discovery);
  console.log('Development Checklist:', checklist);
} else {
  console.error('❌ API Analysis Failed:', result.error);
}
```

### **Step 2: Review Compliance Report**

The system provides a detailed compliance report:

```typescript
// Example compliance report
{
  score: 85,
  feasibility: 'high',
  requirements: [
    {
      requirement: 'oauth2_authorization_code_flow',
      status: 'pass',
      details: 'OAuth 2.0 Authorization Code Flow is supported',
      impact: 'critical'
    },
    {
      requirement: 'restful_api',
      status: 'pass', 
      details: 'RESTful API patterns detected',
      impact: 'critical'
    }
    // ... more requirements
  ],
  recommendations: [
    'Ensure all integrations extend BaseService for consistent error handling and logging',
    'Use ServiceResponse<T> pattern for all service method returns',
    'Implement proper token refresh logic for OAuth integrations',
    // ... more recommendations
  ]
}
```

### **Step 3: Follow the Development Checklist**

The system provides a comprehensive checklist:

```typescript
// Example checklist for Slack integration
[
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
  '✅ Use consistent naming conventions',
  '✅ Implement OAuth 2.0 Authorization Code Flow',
  '✅ Add state parameter for security',
  '✅ Handle OAuth callback validation',
  '✅ Implement token refresh mechanism',
  '✅ Store tokens securely in database',
  '✅ Define TypeScript interfaces for all data types',
  '✅ Implement data transformation utilities',
  '✅ Add data validation',
  '✅ Handle pagination properly',
  '✅ Implement rate limiting'
]
```

---

## Development Workflow

### **Phase 1: API Discovery & Analysis**

```typescript
// 1. Start with API Learning System
const apiLearning = new APILearningSystem();

// 2. Provide API information
const request = {
  serviceName: 'your-service-name',
  documentationUrl: 'https://api.example.com/docs',
  // OR
  apiSpecUrl: 'https://api.example.com/openapi.json',
  // OR
  manualConfig: {
    baseUrl: 'https://api.example.com',
    version: 'v1',
    authType: 'oauth2',
    endpoints: [
      {
        path: '/users',
        method: 'GET',
        description: 'List users'
      }
      // ... more endpoints
    ],
    oauthEndpoints: {
      auth: 'https://api.example.com/oauth/authorize',
      token: 'https://api.example.com/oauth/token'
    },
    scopes: ['users:read', 'users:write']
  }
};

// 3. Analyze the API
const analysis = await apiLearning.learnAndIntegrateAPI(request);

// 4. Review results
if (analysis.success) {
  const { discovery, compliance, generated, deployed } = analysis.data;
  
  console.log('📊 Analysis Results:');
  console.log(`- Service: ${discovery.serviceName}`);
  console.log(`- Base URL: ${discovery.baseUrl}`);
  console.log(`- Auth Type: ${discovery.authType}`);
  console.log(`- Endpoints Found: ${discovery.endpoints.length}`);
  console.log(`- Data Types: ${discovery.dataTypes.map(dt => dt.name).join(', ')}`);
  console.log(`- Compliance Score: ${compliance.score}/100`);
  console.log(`- Feasibility: ${compliance.integrationFeasibility}`);
  
  // 5. Get development guidance
  if (compliance.integrationFeasibility === 'high') {
    console.log('🎉 Ready to proceed with integration!');
    console.log('📋 Development Checklist:');
    compliance.recommendations.forEach(rec => console.log(`- ${rec}`));
  } else {
    console.log('⚠️  Integration may require additional work');
    console.log('❌ Missing Requirements:', compliance.missingRequirements);
  }
}
```

### **Phase 2: Manual Development (If Needed)**

If the API doesn't meet all requirements or you prefer manual development:

```typescript
// 1. Get template variables for manual development
const templateVars = apiLearning.getTemplateVariables(discovery);

// 2. Use the Universal Integration Template
// Copy from docs/current/development/UNIVERSAL_INTEGRATION_TEMPLATE.md
// Replace template variables with actual values

// 3. Follow the development checklist
const checklist = apiLearning.getDevelopmentChecklist(discovery);
checklist.forEach(item => {
  console.log(item); // Check off each item as you complete it
});
```

### **Phase 3: Code Generation & Deployment**

```typescript
// 1. The system can generate code automatically
if (analysis.success && analysis.data.generated) {
  const { serviceClass, utilsFile, indexFile, uiComponent } = analysis.data.generated;
  
  // 2. Review generated code
  console.log('📝 Generated Service Class:', serviceClass);
  console.log('🔧 Generated Utils File:', utilsFile);
  console.log('📦 Generated Index File:', indexFile);
  console.log('🎨 Generated UI Component:', uiComponent);
  
  // 3. Deploy the integration
  if (analysis.data.deployed.success) {
    console.log('🚀 Integration deployed successfully!');
    console.log('🆔 Integration ID:', analysis.data.deployed.integrationId);
    
    // 4. Get integration setup guide
    if (analysis.data.deployed.integrationSetup) {
      console.log('📋 Integration Setup Guide:');
      console.log('Service:', analysis.data.deployed.integrationSetup.displayName);
      console.log('Environment Variables:', analysis.data.deployed.integrationSetup.environmentVariables);
      console.log('Setup Steps:', analysis.data.deployed.integrationSetup.setupSteps);
    }
  }
}
```

### **Phase 4: Integration Setup & Configuration**

The API Learning System now provides a complete setup guide for each integration:

```typescript
// Get the integration setup guide
const setupGuide = analysis.data.deployed.integrationSetup;

if (setupGuide) {
  console.log('🔧 Integration Setup Guide for', setupGuide.displayName);
  
  // Environment Variables
  console.log('📝 Required Environment Variables:');
  setupGuide.environmentVariables.forEach(envVar => {
    console.log(`- ${envVar.name}: ${envVar.description}`);
    console.log(`  Source: ${envVar.source}`);
    console.log(`  Example: ${envVar.example}`);
  });
  
  // OAuth Configuration (if applicable)
  if (setupGuide.oauthConfiguration) {
    console.log('🔐 OAuth Configuration:');
    console.log('- Client ID Source:', setupGuide.oauthConfiguration.clientIdSource);
    console.log('- Redirect URI:', setupGuide.oauthConfiguration.redirectUri);
    console.log('- Required Scopes:', setupGuide.oauthConfiguration.requiredScopes);
  }
  
  // Setup Steps
  console.log('📋 Setup Steps:');
  setupGuide.setupSteps.forEach(step => {
    console.log(`${step.stepNumber}. ${step.title}`);
    console.log(`   ${step.description}`);
    console.log(`   Action: ${step.action}`);
    if (step.codeExample) {
      console.log(`   Code Example:\n${step.codeExample}`);
    }
  });
  
  // Testing Instructions
  console.log('🧪 Testing Instructions:');
  setupGuide.testingInstructions.forEach(instruction => {
    console.log(`- ${instruction}`);
  });
  
  // Troubleshooting Tips
  console.log('🔧 Troubleshooting Tips:');
  setupGuide.troubleshootingTips.forEach(tip => {
    console.log(`- ${tip}`);
  });
}
```

---

## Real-World Examples

### **Example 1: Google Analytics Integration**

The Google Analytics integration demonstrates the complete API Learning System workflow:

```typescript
// Google Analytics API Analysis
const googleAnalyticsRequest = {
  serviceName: 'google-analytics',
  documentationUrl: 'https://developers.google.com/analytics',
  targetDataTypes: ['accounts', 'properties', 'reports']
};

const googleAnalyticsResult = await apiLearning.learnAndIntegrateAPI(googleAnalyticsRequest);

if (googleAnalyticsResult.success) {
  const { discovery, compliance, deployed } = googleAnalyticsResult.data;
  
  console.log('📊 Google Analytics Analysis Results:');
  console.log(`- Service: ${discovery.serviceName}`);
  console.log(`- Base URL: ${discovery.baseUrl}`);
  console.log(`- Auth Type: ${discovery.authType}`);
  console.log(`- Compliance Score: ${compliance.score}/100`);
  console.log(`- Feasibility: ${compliance.integrationFeasibility}`);
  
  // Get setup guide
  if (deployed.integrationSetup) {
    console.log('🔧 Google Analytics Setup Guide:');
    
    // Environment Variables
    console.log('📝 Required Environment Variables:');
    deployed.integrationSetup.environmentVariables.forEach(envVar => {
      console.log(`- ${envVar.name}: ${envVar.description}`);
    });
    
    // OAuth Configuration
    if (deployed.integrationSetup.oauthConfiguration) {
      console.log('🔐 OAuth Configuration:');
      console.log('- Redirect URI:', deployed.integrationSetup.oauthConfiguration.redirectUri);
      console.log('- Required Scopes:', deployed.integrationSetup.oauthConfiguration.requiredScopes);
    }
    
    // Setup Steps
    console.log('📋 Setup Steps:');
    deployed.integrationSetup.setupSteps.forEach(step => {
      console.log(`${step.stepNumber}. ${step.title}`);
      console.log(`   ${step.description}`);
    });
  }
}

// Expected Results:
// - Compliance Score: 95/100
// - Feasibility: high
// - Auth Type: oauth2
// - Data Types: accounts, properties, reports
// - Environment Variables: VITE_GOOGLE_ANALYTICS_CLIENT_ID, VITE_GOOGLE_ANALYTICS_CLIENT_SECRET
// - OAuth Scopes: https://www.googleapis.com/auth/analytics.readonly, https://www.googleapis.com/auth/userinfo.email
```

### **Example 2: Slack Integration**

```typescript
// Slack API Analysis
const slackRequest = {
  serviceName: 'slack',
  documentationUrl: 'https://api.slack.com/web',
  targetDataTypes: ['channels', 'users', 'messages']
};

const slackResult = await apiLearning.learnAndIntegrateAPI(slackRequest);

// Expected Results:
// - Compliance Score: 95/100
// - Feasibility: high
// - Auth Type: oauth2
// - Data Types: channels, users, messages
// - Pagination: cursor-based
// - Rate Limiting: X-RateLimit-Remaining, X-RateLimit-Reset
```

### **Example 2: Stripe Integration**

```typescript
// Stripe API Analysis
const stripeRequest = {
  serviceName: 'stripe',
  apiSpecUrl: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
  targetDataTypes: ['payments', 'customers', 'subscriptions']
};

const stripeResult = await apiLearning.learnAndIntegrateAPI(stripeRequest);

// Expected Results:
// - Compliance Score: 98/100
// - Feasibility: high
// - Auth Type: api_key
// - Data Types: payments, customers, subscriptions
// - Pagination: cursor-based
// - Rate Limiting: Stripe-RateLimit-Remaining, Stripe-RateLimit-Reset
```

### **Example 3: GitHub Integration**

```typescript
// GitHub API Analysis
const githubRequest = {
  serviceName: 'github',
  documentationUrl: 'https://docs.github.com/en/rest',
  targetDataTypes: ['repositories', 'issues', 'pull_requests']
};

const githubResult = await apiLearning.learnAndIntegrateAPI(githubRequest);

// Expected Results:
// - Compliance Score: 92/100
// - Feasibility: high
// - Auth Type: oauth2
// - Data Types: repositories, issues, pull_requests
// - Pagination: page-based
// - Rate Limiting: X-RateLimit-Remaining, X-RateLimit-Reset
```

---

## Best Practices

### **1. Always Start with API Learning**

```typescript
// ✅ Good: Start with analysis
const result = await apiLearning.learnAndIntegrateAPI(request);
if (result.success) {
  // Follow the guidance
  const checklist = result.data.compliance.recommendations;
  // Implement step by step
}

// ❌ Bad: Skip analysis and start coding
// This leads to inconsistencies and missing requirements
```

### **2. Follow the Development Checklist**

```typescript
// ✅ Good: Use the checklist
const checklist = apiLearning.getDevelopmentChecklist(discovery);
checklist.forEach(item => {
  // Complete each item before moving to the next
  console.log(`Working on: ${item}`);
});

// ❌ Bad: Skip the checklist
// This leads to missing critical components
```

### **3. Use the Universal Template**

```typescript
// ✅ Good: Use the template for consistency
// Copy from UNIVERSAL_INTEGRATION_TEMPLATE.md
// Replace template variables with actual values
// All integrations will follow the same structure

// ❌ Bad: Create custom structure
// This leads to inconsistencies across integrations
```

### **4. Extend BaseService**

```typescript
// ✅ Good: Extend BaseService
export class SlackService extends BaseService {
  async getValidTokens(userId: string): Promise<ServiceResponse<SlackTokens>> {
    return this.executeDbOperation(async () => {
      // Implementation
    }, `get valid Slack tokens for user ${userId}`);
  }
}

// ❌ Bad: Create custom service class
// This leads to inconsistent error handling and logging
```

### **5. Use ServiceResponse Pattern**

```typescript
// ✅ Good: Use ServiceResponse
async syncSlackData(userId: string): Promise<ServiceResponse<{ dataSynced: number }>> {
  try {
    // Implementation
    return this.createSuccessResponse({ dataSynced: 100 });
  } catch (error) {
    return this.handleError(error, 'sync Slack data');
  }
}

// ❌ Bad: Return raw data or throw errors
// This leads to inconsistent error handling
```

---

## Troubleshooting

### **Common Issues**

#### **1. Low Compliance Score**

```typescript
// Problem: API doesn't meet minimum requirements
const result = await apiLearning.learnAndIntegrateAPI(request);
if (result.data.compliance.score < 60) {
  console.log('❌ API doesn\'t meet minimum requirements');
  console.log('Missing:', result.data.compliance.missingRequirements);
  
  // Solution: Manual configuration or API improvements
  const manualConfig = {
    // Provide detailed manual configuration
  };
}
```

#### **2. Missing OAuth Endpoints**

```typescript
// Problem: OAuth endpoints not detected
// Solution: Provide manual OAuth configuration
const request = {
  serviceName: 'custom-service',
  manualConfig: {
    baseUrl: 'https://api.custom.com',
    authType: 'oauth2',
    oauthEndpoints: {
      auth: 'https://api.custom.com/oauth/authorize',
      token: 'https://api.custom.com/oauth/token',
      userinfo: 'https://api.custom.com/user'
    },
    scopes: ['read', 'write']
  }
};
```

#### **3. Custom Data Structures**

```typescript
// Problem: Non-standard data structures
// Solution: Provide manual data type definitions
const request = {
  serviceName: 'custom-service',
  manualConfig: {
    // ... other config
    dataTypes: [
      {
        name: 'custom_entity',
        schema: {
          type: 'object',
          properties: {
            custom_id: { type: 'string' },
            custom_field: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    ]
  }
};
```

---

## Integration with Development Tools

### **VS Code Integration**

Create a `.vscode/tasks.json` for integration development:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Analyze API",
      "type": "shell",
      "command": "node",
      "args": ["-e", "require('./src/services/api-learning/APILearningSystem').analyzeAPI()"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Generate Integration",
      "type": "shell", 
      "command": "node",
      "args": ["-e", "require('./src/services/api-learning/APILearningSystem').generateIntegration()"],
      "group": "build"
    }
  ]
}
```

### **GitHub Actions Integration**

```yaml
# .github/workflows/integration-check.yml
name: Integration Compliance Check

on:
  pull_request:
    paths: ['src/services/integrations/**']

jobs:
  compliance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:integrations
      - run: npm run check:compliance
```

---

## Summary

The **API Learning System** ensures consistent integration development by:

1. **Analyzing APIs** against Nexus standards
2. **Providing guidance** through compliance reports and checklists
3. **Generating code** using universal templates
4. **Enforcing consistency** across all integrations
5. **Automating deployment** of compliant integrations

By following this guide, you'll create integrations that:
- ✅ Extend BaseService consistently
- ✅ Use ServiceResponse<T> pattern
- ✅ Follow Nexus coding standards
- ✅ Include comprehensive error handling
- ✅ Have proper TypeScript interfaces
- ✅ Include thorough testing
- ✅ Use consistent naming conventions
- ✅ Follow the same architectural patterns

This ensures that all integrations in Nexus are consistent, maintainable, and follow the same high-quality standards.
