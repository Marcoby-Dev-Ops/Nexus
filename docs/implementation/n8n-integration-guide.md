# n8n Integration Guide

## Overview

This guide explains the enhanced n8n workflow integration that solves the issue of incomplete workflow generation. The solution creates complete, properly connected n8n workflows instead of just triggering existing incomplete workflows.

## Problem Solved

**Before**: n8n workflow generation was incomplete, requiring manual editing to make workflows functional.

**After**: Complete workflow generation with proper node structures, connections, and validation.

## Architecture

### Core Components

1. **`n8nWorkflowBuilder.ts`** - Main workflow builder service
2. **`mcpN8nIntegration.ts`** - MCP tool integration helper
3. **`EnhancedWorkflowBuilder.tsx`** - React component for UI
4. **`n8nService.ts`** - Updated service with fallback support

### Key Features

- ✅ Complete node generation with proper types
- ✅ Automatic connection mapping between nodes
- ✅ Validation of workflow structure
- ✅ Support for multiple trigger types (webhook, schedule, manual, email)
- ✅ Integration with external services
- ✅ Fallback to existing webhook-based approach
- ✅ Type-safe interfaces and error handling

## Usage

### Basic Workflow Generation

```typescript
import { n8nWorkflowBuilder } from '../lib/n8nWorkflowBuilder';

// Generate from description
const result = await n8nWorkflowBuilder.generateFromDescription(
  "Create a workflow that receives webhook data, saves it to database, and sends email notification",
  "operations"
);

if (result.success) {
  console.log('Workflow created:', result.workflowId);
  console.log('Webhook URL:', result.webhookUrl);
}
```

### Advanced Workflow Generation

```typescript
import { n8nWorkflowBuilder } from '../lib/n8nWorkflowBuilder';

const workflowRequest = {
  name: "Customer Onboarding",
  description: "Automated customer onboarding process",
  triggerType: "webhook" as const,
  integrations: ["hubspot", "slack"],
  actions: [
    {
      type: "database" as const,
      name: "Save Customer",
      parameters: { table: "customers" }
    },
    {
      type: "email" as const,
      name: "Welcome Email",
      parameters: { subject: "Welcome!" }
    }
  ],
  department: "sales"
};

const result = await n8nWorkflowBuilder.generateWorkflow(workflowRequest);
```

### Using the React Component

```tsx
import { EnhancedWorkflowBuilder } from '../components/workflow/EnhancedWorkflowBuilder';

function WorkflowPage() {
  const handleWorkflowCreated = (workflowId: string, webhookUrl?: string) => {
    console.log('New workflow created:', { workflowId, webhookUrl });
  };

  return (
    <EnhancedWorkflowBuilder
      initialDescription="Process customer inquiries"
      department="sales"
      onWorkflowCreated={handleWorkflowCreated}
    />
  );
}
```

## Workflow Structure

### Generated Node Types

1. **Trigger Nodes**
   - `n8n-nodes-base.webhook` - HTTP webhook triggers
   - `n8n-nodes-base.cron` - Scheduled triggers
   - `n8n-nodes-base.manualTrigger` - Manual execution
   - `n8n-nodes-base.emailReadImap` - Email triggers

2. **Action Nodes**
   - `n8n-nodes-base.httpRequest` - HTTP requests
   - `n8n-nodes-base.postgres` - Database operations
   - `n8n-nodes-base.emailSend` - Email sending
   - `n8n-nodes-base.function` - Custom JavaScript processing

3. **Integration Nodes**
   - Configurable HTTP requests for external APIs
   - Support for HubSpot, Salesforce, Stripe, Slack, etc.

4. **Response Nodes**
   - `n8n-nodes-base.respondToWebhook` - Webhook responses

### Connection Structure

Nodes are automatically connected in sequence:
```
Trigger → Action 1 → Action 2 → Integration → Response
```

Each connection includes:
- Source node name
- Target node name
- Connection type (main)
- Index (0 for linear workflows)

## MCP Tool Integration

### Current Status

The implementation uses placeholder functions that can be easily replaced with actual MCP n8n tools. All MCP calls are centralized in `mcpN8nIntegration.ts`.

### Available MCP Tools

The following MCP n8n tools are available and ready for integration:

1. **Connection Management**
   - `mcp_n8n_Workflow_Integration_Server_init_n8n`

2. **Workflow Operations**
   - `mcp_n8n_Workflow_Integration_Server_create_workflow`
   - `mcp_n8n_Workflow_Integration_Server_update_workflow`
   - `mcp_n8n_Workflow_Integration_Server_get_workflow`
   - `mcp_n8n_Workflow_Integration_Server_list_workflows`
   - `mcp_n8n_Workflow_Integration_Server_delete_workflow`

3. **Workflow Control**
   - `mcp_n8n_Workflow_Integration_Server_activate_workflow`
   - `mcp_n8n_Workflow_Integration_Server_deactivate_workflow`

### Integration Steps

To integrate real MCP tools:

1. **Update `mcpN8nIntegration.ts`**:
   ```typescript
   // Replace placeholder implementations with actual MCP calls
   async initializeConnection(url: string, apiKey: string) {
     return await mcp_n8n_Workflow_Integration_Server_init_n8n({
       url,
       apiKey
     });
   }
   ```

2. **Update workflow creation**:
   ```typescript
   async createWorkflow(workflow: N8nWorkflowDefinition) {
     const result = await mcp_n8n_Workflow_Integration_Server_create_workflow({
       clientId: this.clientId,
       name: workflow.name,
       nodes: workflow.nodes,
       connections: workflow.connections
     });
     return result;
   }
   ```

3. **Test with real n8n instance**:
   - Configure user n8n credentials
   - Test workflow creation
   - Verify node connections
   - Test activation/deactivation

## Configuration

### User n8n Configuration

Users must configure their n8n instance:

```typescript
// Via userN8nConfigService
const config = {
  baseUrl: "https://your-n8n-instance.com",
  apiKey: "your-api-key",
  isActive: true
};
```

### Environment Variables

For development/testing:
```env
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key
```

## Error Handling

### Validation Errors
- Empty workflow name/description
- Missing n8n configuration
- Invalid node structures

### Connection Errors
- n8n instance unreachable
- Invalid API credentials
- Network timeouts

### Fallback Mechanism
- Falls back to webhook-based approach if new builder fails
- Maintains backward compatibility
- Provides clear error messages

## Testing

### Unit Tests
```typescript
// Test workflow generation
describe('N8nWorkflowBuilder', () => {
  it('should generate complete workflow', async () => {
    const result = await n8nWorkflowBuilder.generateFromDescription(
      "Test workflow"
    );
    expect(result.success).toBe(true);
    expect(result.workflowDefinition?.nodes.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
// Test with real n8n instance (when MCP tools are integrated)
describe('MCP Integration', () => {
  it('should create workflow in n8n', async () => {
    // Test actual workflow creation
  });
});
```

## Migration Path

### Phase 1: Current Implementation ✅
- Complete workflow builder with placeholder MCP calls
- React UI component
- Fallback mechanism
- Type-safe interfaces

### Phase 2: MCP Integration (Next)
- Replace placeholder calls with actual MCP tools
- Test with real n8n instances
- Validate workflow execution

### Phase 3: Advanced Features (Future)
- Workflow templates
- Visual workflow editor
- Advanced node configurations
- Workflow versioning

## Troubleshooting

### Common Issues

1. **"No n8n configuration found"**
   - Ensure user has configured n8n instance
   - Check `userN8nConfigService.getCurrentUserConfig()`

2. **"Workflow validation failed"**
   - Check node types and parameters
   - Ensure at least one trigger node exists

3. **"Connection initialization failed"**
   - Verify n8n instance URL and API key
   - Check network connectivity

### Debug Mode

Enable detailed logging:
```typescript
// In development
console.log('Workflow definition:', workflowDefinition);
console.log('MCP client info:', mcpN8nIntegration.getClientInfo());
```

## Contributing

### Adding New Node Types

1. Update `WorkflowAction` interface
2. Add case in `createActionNode` method
3. Update integration tests
4. Document new node type

### Adding New Integrations

1. Add integration to `availableIntegrations` list
2. Update `createIntegrationNode` method
3. Add integration-specific parameters
4. Test with actual service

## Security Considerations

- n8n API keys are stored securely via `userN8nConfigService`
- Workflow validation prevents malicious node injection
- All external API calls are validated
- User permissions are respected through n8n's built-in security

## Performance

- Workflow generation is optimized for speed
- Connections are created efficiently
- Validation is minimal but thorough
- Fallback mechanism prevents blocking

## Support

For issues or questions:
1. Check this documentation
2. Review error messages and logs
3. Test with simple workflow first
4. Verify n8n configuration

---

**Pillar Tags**: 1, 2, 3 (Automation, Integration, User Experience) 