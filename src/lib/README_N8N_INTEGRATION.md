# N8n Integration for Nexus OS

This documentation explains how to set up and use the n8n workflow integration in your Nexus OS application.

## 🚀 Quick Start

### 1. Environment Setup

Add these environment variables to your `.env` file in the client directory:

```env
# n8n Configuration
VITE_N8N_API_KEY=your-n8n-api-key-here
```

The n8n base URL is already configured to use `https://automate.marcoby.net`.

### 2. Available Services

#### Core Service: `n8nService`
- `triggerWorkflow(webhookId, data)` - Trigger any n8n workflow
- `chatWithAssistant(department, message, context)` - Chat with department assistants
- `generateWorkflow(requirements, department)` - Auto-generate workflows
- `createContent(type, prompt, options)` - Create blog/social/email content

#### React Hooks: `useN8n`, `useDepartmentAssistant`, etc.
- Provides React state management for n8n interactions
- Handles loading states, errors, and responses
- Department-specific assistant hooks

### 3. Existing Workflows

Your n8n instance already has these workflows configured:

| Workflow | Webhook ID | Purpose |
|----------|------------|---------|
| Beyond IT Blogging | `719eaaee-c476-43cd-95c2-c169c0c68c6b` | Content creation and blog management |
| Nexus Builder | `53c96d78-ed61-4f86-a343-4836c0c656ff` | Auto-generate new workflows |

## 🏗️ Usage Examples

### Basic Chat with Department Assistant

```tsx
import { useDepartmentAssistant } from '../lib/useN8n';

function SalesPage() {
  const { askAssistant, isLoading, error } = useDepartmentAssistant('sales');
  
  const handleQuestion = async () => {
    const response = await askAssistant("What are our top deals this month?");
    console.log(response.data);
  };
  
  return (
    <div>
      <button onClick={handleQuestion} disabled={isLoading}>
        Ask Sales Assistant
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Full Assistant Panel Integration

```tsx
import { DepartmentAssistantDemo } from '../components/ai/DepartmentAssistantDemo';

function FinancePage() {
  return (
    <div>
      <h1>Finance Dashboard</h1>
      {/* Your existing content */}
      
      {/* Floating assistant button */}
      <DepartmentAssistantDemo department="finance" />
    </div>
  );
}
```

### Content Creation

```tsx
import { useContentCreation } from '../lib/useN8n';

function MarketingPage() {
  const { createBlogPost, isLoading } = useContentCreation();
  
  const generateBlogPost = async () => {
    const response = await createBlogPost(
      "Write a blog post about AI automation in business",
      { tone: 'professional', length: 'medium' }
    );
  };
  
  return (
    <button onClick={generateBlogPost} disabled={isLoading}>
      Generate Blog Post
    </button>
  );
}
```

### Workflow Generation

```tsx
import { useWorkflowBuilder } from '../lib/useN8n';

function OperationsPage() {
  const { buildWorkflow, isLoading } = useWorkflowBuilder();
  
  const createCustomWorkflow = async () => {
    const response = await buildWorkflow(
      "Create a workflow that automatically creates invoices when a deal is closed in HubSpot"
    );
  };
  
  return (
    <button onClick={createCustomWorkflow} disabled={isLoading}>
      Build Custom Workflow
    </button>
  );
}
```

## 🔧 Component Integration

### Adding Assistant to Existing Pages

1. Import the demo component:
```tsx
import { DepartmentAssistantDemo } from '../components/ai/DepartmentAssistantDemo';
```

2. Add it to your page:
```tsx
<DepartmentAssistantDemo department="sales" />
```

### Custom Integration

For more control, use the core `N8nAssistantPanel`:

```tsx
import { N8nAssistantPanel } from '../components/ai/N8nAssistantPanel';

function CustomAssistant() {
  const [showAssistant, setShowAssistant] = useState(false);
  
  return (
    <div>
      {showAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-96 h-96 bg-white rounded-lg">
            <N8nAssistantPanel 
              department="operations"
              onClose={() => setShowAssistant(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## 📊 Department-Specific Features

### Sales Department
- **HubSpot Integration**: Connect to your existing HubSpot workflow
- **Pipeline Management**: Ask about deals, contacts, and forecasts
- **Lead Processing**: Automate lead qualification and routing

### Finance Department  
- **Invoice Generation**: Automated invoice creation
- **Financial Reporting**: Generate reports and analytics
- **Payment Processing**: Handle payment workflows

### Operations Department
- **Process Automation**: Create and manage operational workflows
- **Deployment Management**: Connect with Coolify for deployments
- **Resource Monitoring**: Track and manage resources

### Marketing Department
- **Content Creation**: Blog posts, social media, email campaigns
- **Campaign Management**: Automate marketing workflows
- **Analytics**: Track marketing performance

## 🔗 Extending the Integration

### Adding New Webhooks

1. Create a new workflow in n8n with a Chat Trigger
2. Copy the webhook ID
3. Add it to `WORKFLOW_WEBHOOKS` in `n8nService.ts`:

```typescript
const WORKFLOW_WEBHOOKS = {
  // ... existing webhooks
  sales: {
    assistant: 'your-new-webhook-id',
    pipeline: 'another-webhook-id'
  }
};
```

### Custom Actions

Add department-specific actions by extending the service:

```typescript
// In n8nService.ts
async customSalesAction(data: any): Promise<N8nResponse> {
  return this.triggerWorkflow('your-custom-webhook', data);
}
```

## 🚨 Error Handling

The integration includes comprehensive error handling:

- **Connection Errors**: Automatic health checks and connection status
- **Workflow Errors**: Detailed error messages from n8n
- **Retry Logic**: Built-in retry for failed requests
- **User Feedback**: Clear error messages in the UI

## 🔒 Security Notes

- API keys are handled securely through environment variables
- All requests go through your n8n instance at `https://automate.marcoby.net`
- Webhook endpoints are unique and secure
- User context is passed securely to workflows

## 📈 Monitoring

- Each workflow execution returns an `executionId` for tracking
- Connection status is monitored with health checks
- Error logging for debugging and monitoring

## 🎯 Next Steps

1. **Activate Workflows**: Activate your existing "Beyond IT Blogging" and "Nexus Builder" workflows
2. **Configure Webhooks**: Set up department-specific webhook IDs
3. **Add Components**: Integrate assistant components into your department pages
4. **Create Custom Workflows**: Use the Nexus Builder to create department-specific automations
5. **Test Integration**: Try the demo components to ensure everything works

## 💡 Tips

- Start with the `DepartmentAssistantDemo` component for quick integration
- Use the workflow builder to create custom automations on-demand
- Monitor the n8n execution logs for debugging
- Leverage the existing "Beyond IT Blogging" workflow for content creation
- The "Nexus Builder" can auto-generate new workflows based on natural language requirements 