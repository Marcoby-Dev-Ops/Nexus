/**
 * mcpN8nIntegration.ts - MCP n8n Integration Helper
 * Provides a clean interface for MCP n8n tool integration
 * Replace placeholder implementations with actual MCP tool calls when available
 */

import type { N8nWorkflowDefinition } from './n8nWorkflowBuilder';

export interface McpN8nClient {
  clientId: string;
  isInitialized: boolean;
}

export interface CreateWorkflowRequest {
  clientId: string;
  name: string;
  nodes: any[];
  connections: Record<string, any>;
}

export interface CreateWorkflowResponse {
  success: boolean;
  workflowId?: string;
  error?: string;
}

export interface ActivateWorkflowRequest {
  clientId: string;
  id: string;
}

export interface ActivateWorkflowResponse {
  success: boolean;
  error?: string;
}

/**
 * MCP n8n Integration Service
 * This service provides a clean interface for n8n operations
 * When MCP tools are available, replace the placeholder implementations
 */
export class McpN8nIntegrationService {
  private clientId = 'nexus-workflow-builder';
  private isInitialized = false;

  /**
   * Initialize n8n connection (no-op for Edge Function, always returns success)
   */
  async initializeConnection(url: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    // For Edge Function, assume always initialized
    this.isInitialized = true;
    return { success: true };
  }

  /**
   * Create workflow in n8n via Supabase Edge Function
   */
  async createWorkflow(workflow: N8nWorkflowDefinition): Promise<CreateWorkflowResponse> {
    try {
      if (!this.isInitialized) {
        return { success: false, error: 'n8n connection not initialized' };
      }
      const response = await fetch('/functions/v1/trigger-n8n-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflow.name, parameters: { nodes: workflow.nodes, connections: workflow.connections } })
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };
      return { success: true, workflowId: data.response?.workflowId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update workflow (not supported via Edge Function, return error)
   */
  async updateWorkflow(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Update workflow not supported via Edge Function' };
  }

  /**
   * Activate workflow (not supported via Edge Function, return error)
   */
  async activateWorkflow(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Activate workflow not supported via Edge Function' };
  }

  /**
   * Deactivate workflow (not supported via Edge Function, return error)
   */
  async deactivateWorkflow(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Deactivate workflow not supported via Edge Function' };
  }

  /**
   * List workflows (not supported via Edge Function, return error)
   */
  async listWorkflows(): Promise<{ success: boolean; workflows?: any[]; error?: string }> {
    return { success: false, error: 'List workflows not supported via Edge Function' };
  }

  /**
   * Get workflow (not supported via Edge Function, return error)
   */
  async getWorkflow(): Promise<{ success: boolean; workflow?: any; error?: string }> {
    return { success: false, error: 'Get workflow not supported via Edge Function' };
  }

  /**
   * Delete workflow (not supported via Edge Function, return error)
   */
  async deleteWorkflow(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Delete workflow not supported via Edge Function' };
  }

  /**
   * Get client information
   */
  getClientInfo(): McpN8nClient {
    return {
      clientId: this.clientId,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const mcpN8nIntegration = new McpN8nIntegrationService();

/**
 * Helper functions for easy migration to MCP tools
 * When MCP tools are available, these can be easily replaced
 */

export async function initializeN8nConnection(url: string, apiKey: string) {
  return mcpN8nIntegration.initializeConnection(url, apiKey);
}

export async function createN8nWorkflow(workflow: N8nWorkflowDefinition) {
  return mcpN8nIntegration.createWorkflow(workflow);
}

export async function activateN8nWorkflow(workflowId: string) {
  return mcpN8nIntegration.activateWorkflow();
}

export async function deactivateN8nWorkflow(workflowId: string) {
  return mcpN8nIntegration.deactivateWorkflow();
}

export async function listN8nWorkflows() {
  return mcpN8nIntegration.listWorkflows();
}

export async function getN8nWorkflow(workflowId: string) {
  return mcpN8nIntegration.getWorkflow();
}

export async function deleteN8nWorkflow(workflowId: string) {
  return mcpN8nIntegration.deleteWorkflow();
} 