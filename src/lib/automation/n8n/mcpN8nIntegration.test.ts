import { mcpN8nIntegration } from './mcpN8nIntegration';
import type { N8nWorkflowDefinition } from './n8nWorkflowBuilder';

globalThis.fetch = jest.fn();

describe('mcpN8nIntegration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await mcpN8nIntegration.initializeConnection('https://test-n8n.com', 'test-api-key');
  });

  const workflow: N8nWorkflowDefinition = {
    name: 'Test Workflow',
    nodes: [],
    connections: {},
    active: false,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner',
    },
  };

  it('should create workflow via Edge Function (success)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, response: { workflowId: 'wf-123' } })
    });
    const result = await mcpN8nIntegration.createWorkflow(workflow);
    expect(fetch).toHaveBeenCalledWith(
      '/functions/v1/trigger-n8n-workflow',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.success).toBe(true);
    expect(result.workflowId).toBe('wf-123');
  });

  it('should handle error from Edge Function', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Edge error' })
    });
    const result = await mcpN8nIntegration.createWorkflow(workflow);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Edge error');
  });

  it('should handle fetch/network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network fail'));
    const result = await mcpN8nIntegration.createWorkflow(workflow);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network fail');
  });

  it('should return error for unsupported methods', async () => {
    expect(await mcpN8nIntegration.updateWorkflow()).toEqual({ success: false, error: expect.stringContaining('not supported') });
    expect(await mcpN8nIntegration.activateWorkflow()).toEqual({ success: false, error: expect.stringContaining('not supported') });
    expect(await mcpN8nIntegration.deactivateWorkflow()).toEqual({ success: false, error: expect.stringContaining('not supported') });
    expect(await mcpN8nIntegration.listWorkflows()).toEqual({ success: false, error: expect.stringContaining('not supported') });
    expect(await mcpN8nIntegration.getWorkflow()).toEqual({ success: false, error: expect.stringContaining('not supported') });
    expect(await mcpN8nIntegration.deleteWorkflow()).toEqual({ success: false, error: expect.stringContaining('not supported') });
  });
}); 