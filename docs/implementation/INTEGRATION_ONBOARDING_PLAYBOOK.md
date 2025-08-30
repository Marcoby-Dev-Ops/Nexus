# 🚀 Integration Onboarding Playbook
*Pillar: 1,2 - Complete guide for implementing new integrations in Nexus*

## 📋 Overview

This playbook provides step-by-step instructions for implementing new integrations in Nexus, based on proven patterns from our existing integrations (Google Analytics, Cloudflare, Marcoby Cloud, NinjaRMM, PayPal, etc.).

## 🏗️ Architecture Pattern

### 1. **Service Layer** (`src/lib/services/`)
- **Purpose**: Business logic and API communication
- **Pattern**: `{integrationName}Service.ts`
- **Example**: `googleAnalyticsService.ts`, `cloudflareService.ts`

### 2. **Setup Component** (`src/components/integrations/`)
- **Purpose**: User onboarding wizard
- **Pattern**: `{IntegrationName}Setup.tsx`
- **Example**: `GoogleAnalyticsSetup.tsx`, `CloudflareSetup.tsx`

### 3. **Database Storage** (`supabase/migrations/`)
- **Purpose**: Configuration and credentials storage
- **Tables**: `integrations`, `user_integrations`

### 4. **Edge Functions** (`supabase/functions/`)
- **Purpose**: OAuth callbacks and secure operations
- **Pattern**: `{integration}-oauth-callback/`

---

## 🛠️ Step-by-Step Implementation

### **Phase 1: Service Foundation**

#### 1.1 Create Service Class
```typescript
// src/lib/services/{integrationName}Service.ts
export interface {IntegrationName}Config {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  endpoint: string;
  // Add integration-specific fields
}

export interface {IntegrationName}Metrics {
  // Define metrics structure
}

export class {IntegrationName}Service {
  private config: {IntegrationName}Config | null = null;

  async initialize(): Promise<boolean> {
    // Load config from user_integrations table
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Validate credentials and connectivity
  }

  async getMetrics(): Promise<{IntegrationName}Metrics> {
    // Fetch business metrics
  }

  async updateBusinessHealthKPIs(): Promise<void> {
    // Call upsert_kpis edge function
  }
}
```

#### 1.2 Define Integration Metadata
```typescript
// Database entry pattern
const integrationData = {
  slug: 'integration-name',
  name: 'Integration Display Name',
  category: 'analytics|infrastructure|crm|finance|marketing',
  description: 'Brief description of capabilities',
  logo_url: '/integrations/integration-name.svg',
  setup_url: '/integrations/integration-name',
  oauth_required: true, // or false for API key auth
  config_schema: {
    type: 'object',
    properties: {
      // Define configuration fields
    }
  },
  capabilities: [
    'kpi_name_1',
    'kpi_name_2'
  ]
};
```

### **Phase 2: Setup Component**

#### 2.1 Create Setup Wizard
```typescript
// src/components/integrations/{IntegrationName}Setup.tsx
interface {IntegrationName}SetupProps {
  onComplete: () => void;
  onClose: () => void;
}

const {IntegrationName}Setup: React.FC<{IntegrationName}SetupProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Define form fields
  });

  const steps = [
    { id: 1, title: 'Connect', description: 'Authenticate your account' },
    { id: 2, title: 'Configure', description: 'Set up data access' },
    { id: 3, title: 'Test', description: 'Verify connection' },
    { id: 4, title: 'Complete', description: 'Activate integration' }
  ];

  // Implementation follows established patterns...
};
```

#### 2.2 Step Implementation Patterns

**OAuth Flow:**
```typescript
const handleOAuthConnect = async () => {
  const authUrl = await service.getAuthorizationUrl();
  const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
  
  // Poll for completion
  const checkOAuth = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkOAuth);
      // Check authentication status
    }
  }, 1000);
};
```

**API Key Flow:**
```typescript
const handleApiKeyTest = async () => {
  const result = await service.testConnection();
  if (result.success) {
    setCurrentStep(currentStep + 1);
  } else {
    setError(result.message);
  }
};
```

### **Phase 3: Database Integration**

#### 3.1 Add to Integrations Table
```sql
-- Add to migration file
INSERT INTO integrations (slug, name, category, description, oauth_required, capabilities) VALUES (
  'integration-name',
  'Integration Display Name',
  'category',
  'Description of integration capabilities',
  true, -- or false for API key
  '["kpi_1", "kpi_2"]'
);
```

#### 3.2 User Integration Storage
```typescript
// Save user connection
const integrationData = {
  user_id: user.id,
  integration_slug: 'integration-name',
  name: `${integrationName} - ${userIdentifier}`,
  status: 'active',
  config: {
    // Non-sensitive configuration
  },
  credentials: {
    // Encrypted sensitive data
  },
  last_sync_at: new Date().toISOString()
};

await supabase.from('user_integrations').insert(integrationData);
```

### **Phase 4: Edge Functions (if needed)**

#### 4.1 OAuth Callback Function
```typescript
// supabase/functions/{integration}-oauth-callback/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Exchange code for tokens
    // Store in user_integrations
    // Redirect to success page
    
    return new Response(successHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  } catch (error) {
    // Handle errors
  }
});
```

### **Phase 5: Wire Into Main Integration Page**

#### 5.1 Add to Integrations Page
```typescript
// src/pages/Integrations.tsx
const handleSetupIntegration = (integration: Integration) => {
  if (integration.slug === 'your-integration') {
    setYourIntegrationModal(true);
  }
  // ... other integrations
};

// Add modal component
{yourIntegrationModal && (
  <YourIntegrationSetup
    onComplete={() => {
      setYourIntegrationModal(false);
      fetchIntegrations(); // Refresh list
      addNotification({
        type: 'success',
        message: 'Integration connected successfully!'
      });
    }}
    onClose={() => setYourIntegrationModal(false)}
  />
)}
```

---

## 🎯 Authentication Patterns

### **OAuth 2.0 (Recommended)**
- **Use for**: Google, Microsoft, Slack, PayPal, etc.
- **Flow**: Authorization Code with PKCE
- **Storage**: Refresh tokens in encrypted `credentials` field
- **Refresh**: Automatic token refresh in service layer

### **API Key**
- **Use for**: Simple APIs, internal tools
- **Validation**: Test connection during setup
- **Storage**: Encrypted in `credentials` field
- **Security**: Rate limiting and key rotation support

### **Custom Authentication**
- **Use for**: ResellersPanel, proprietary systems
- **Pattern**: Username/password or custom tokens
- **Implementation**: Custom validation in service layer

---

## 📊 Business Health KPI Integration

### **KPI Mapping Pattern**
```typescript
const kpiMappings = {
  'service_uptime': metrics.infrastructure.uptime,
  'website_performance': metrics.performance.responseTime,
  'asset_utilization': metrics.infrastructure.cpuUtilization,
  // Map integration metrics to business KPIs
};

// Update via edge function
await supabase.functions.invoke('upsert_kpis', {
  body: { kpis: kpiMappings }
});
```

### **Supported KPI Categories**
- **Finance**: `revenue`, `profit_margin`, `cash_runway`
- **Operations**: `service_uptime`, `asset_utilization`, `automation_coverage`
- **Marketing**: `website_traffic`, `conversion_rate`, `customer_acquisition_cost`
- **Security**: `security_score`, `vulnerability_count`

---

## 🔧 Testing & Validation

### **Connection Testing**
```typescript
// Test during setup
const testResult = await service.testConnection();
if (!testResult.success) {
  throw new Error(testResult.message);
}
```

### **Data Validation**
```typescript
// Validate metrics structure
const validateMetrics = (metrics: any): boolean => {
  // Implement validation logic
  return true;
};
```

### **Error Handling**
```typescript
// Comprehensive error handling
try {
  await service.syncData();
} catch (error) {
  logger.error({ error, integration: 'integration-name' }, 'Sync failed');
  // Update integration status
  // Notify user if needed
}
```

---

## 📋 Checklist for New Integrations

### **Pre-Development**
- [ ] API documentation reviewed
- [ ] Authentication method determined
- [ ] KPI mapping defined
- [ ] User journey planned

### **Development**
- [ ] Service class implemented
- [ ] Setup component created
- [ ] Database entries added
- [ ] Edge functions (if needed)
- [ ] Integration wired into main page

### **Testing**
- [ ] Connection testing works
- [ ] OAuth flow functional (if applicable)
- [ ] KPI updates working
- [ ] Error handling comprehensive
- [ ] User experience smooth

### **Documentation**
- [ ] Service methods documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide created
- [ ] KPI mapping documented

---

## 🚀 Quick Start Template

Use this command to scaffold a new integration:

```bash
# Copy existing integration as template
cp -r src/components/integrations/CloudflareSetup.tsx src/components/integrations/YourIntegrationSetup.tsx
cp -r src/lib/services/cloudflareService.ts src/lib/services/yourIntegrationService.ts

# Update class names, interfaces, and implementation
# Follow the patterns established in existing integrations
```

---

## 🔗 Related Documentation

- [Business Health KPIs](../modules/business-health-system.md)
- [Security Guidelines](../compliance/SECURITY_AUDIT_REPORT.md)
- [Database Schema](../../supabase/migrations/)
- [Edge Functions](../../supabase/functions/)

---

*This playbook ensures consistency, security, and maintainability across all integrations in the Nexus platform.* 