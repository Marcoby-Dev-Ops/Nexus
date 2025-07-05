/**
 * workspaceClarifyWorkflow.ts
 * n8n workflow for clarifying and structuring ideas from the Workspace
 * Converts raw ideas into actionable tasks/projects with department routing
 */

import type { N8nWorkflowDefinition, N8nNode, N8nConnection } from './n8nWorkflowBuilder';

export interface ClarifyIdeaRequest {
  idea: string;
  userId: string;
  context?: {
    department?: string;
    priority?: 'low' | 'medium' | 'high';
    timeline?: string;
  };
}

export interface ClarifyIdeaResponse {
  success: boolean;
  data?: {
    type: 'project' | 'task';
    suggestedDepartment: string;
    breakdown: string[];
    estimatedEffort: string;
    priority: 'low' | 'medium' | 'high';
    nextSteps: string[];
    reasoning: string;
  };
  error?: string;
}

/**
 * Create the "Clarify Idea" workflow definition
 */
export function createClarifyIdeaWorkflow(): N8nWorkflowDefinition {
  const nodes: N8nNode[] = [
    // Webhook Trigger
    {
      id: 'webhook-trigger',
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [240, 300],
      parameters: {
        httpMethod: 'POST',
        path: 'clarify-idea',
        responseMode: 'responseNode',
        options: {}
      },
      webhookId: 'clarify-idea-webhook'
    },

    // Validate Input
    {
      id: 'validate-input',
      name: 'Validate Input',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [460, 300],
      parameters: {
        functionCode: `
          const idea = $input.first().json.idea;
          const userId = $input.first().json.userId;
          
          if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
            throw new Error('Idea is required and must be a non-empty string');
          }
          
          if (!userId || typeof userId !== 'string') {
            throw new Error('User ID is required');
          }
          
          return {
            idea: idea.trim(),
            userId,
            context: $input.first().json.context || {}
          };
        `
      }
    },

    // Call OpenRouter API
    {
      id: 'openrouter-api',
      name: 'Call OpenRouter',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [680, 300],
      parameters: {
        method: 'POST',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        httpHeaderAuth: {
          name: 'Authorization',
          value: 'Bearer {{ $env.OPENROUTER_API_KEY }}'
        },
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'Content-Type',
              value: 'application/json'
            },
            {
              name: 'HTTP-Referer',
              value: 'https://nexus-app.com'
            },
            {
              name: 'X-Title',
              value: 'Nexus Workspace'
            }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'model',
              value: 'anthropic/claude-3.5-sonnet'
            },
            {
              name: 'messages',
              value: JSON.stringify([
                {
                  role: 'system',
                  content: `You are an AI assistant that helps clarify and structure business ideas. 
                  Analyze the user's idea and provide:
                  1. Whether it should be a project or task
                  2. Which department it belongs to (Marketing, Sales, Support, Operations, Finance)
                  3. A breakdown of actionable steps
                  4. Estimated effort (1-2 hours, 1-2 days, 1-2 weeks, 1+ months)
                  5. Priority level (low, medium, high)
                  6. Next immediate steps
                  
                  Respond in JSON format:
                  {
                    "type": "project|task",
                    "suggestedDepartment": "department_name",
                    "breakdown": ["step1", "step2", "step3"],
                    "estimatedEffort": "time_estimate",
                    "priority": "low|medium|high",
                    "nextSteps": ["next1", "next2"],
                    "reasoning": "brief explanation"
                  }`
                },
                {
                  role: 'user',
                  content: '{{ $json.idea }}'
                }
              ])
            },
            {
              name: 'temperature',
              value: '0.3'
            },
            {
              name: 'max_tokens',
              value: '1000'
            }
          ]
        }
      }
    },

    // Parse AI Response
    {
      id: 'parse-response',
      name: 'Parse AI Response',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [900, 300],
      parameters: {
        functionCode: `
          try {
            const aiResponse = $input.first().json.choices[0].message.content;
            const parsed = JSON.parse(aiResponse);
            
            // Validate required fields
            const required = ['type', 'suggestedDepartment', 'breakdown', 'estimatedEffort', 'priority', 'nextSteps', 'reasoning'];
            for (const field of required) {
              if (!parsed[field]) {
                throw new Error(\`Missing required field: \${field}\`);
              }
            }
            
            return {
              success: true,
              data: parsed
            };
          } catch (error) {
            return {
              success: false,
              error: 'Failed to parse AI response: ' + error.message
            };
          }
        `
      }
    },

    // Error Handler
    {
      id: 'error-handler',
      name: 'Error Handler',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [900, 500],
      parameters: {
        functionCode: `
          const error = $input.first().json;
          return {
            success: false,
            error: error.message || 'An error occurred while clarifying the idea'
          };
        `
      }
    },

    // Response Node
    {
      id: 'response',
      name: 'Response',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [1120, 300],
      parameters: {
        responseCode: 200,
        responseMode: 'responseNode',
        options: {}
      }
    }
  ];

  const connections: N8nConnection = {
    'Webhook Trigger': {
      main: [
        {
          node: 'Validate Input',
          type: 'main',
          index: 0
        }
      ]
    },
    'Validate Input': {
      main: [
        {
          node: 'Call OpenRouter',
          type: 'main',
          index: 0
        }
      ]
    },
    'Call OpenRouter': {
      main: [
        {
          node: 'Parse AI Response',
          type: 'main',
          index: 0
        }
      ]
    },
    'Parse AI Response': {
      main: [
        {
          node: 'Response',
          type: 'main',
          index: 0
        }
      ]
    }
  };

  return {
    name: 'Clarify Idea Workflow',
    nodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner'
    }
  };
}

/**
 * Service function to trigger the clarify idea workflow
 */
export async function triggerClarifyIdeaWorkflow(
  idea: string,
  userId: string,
  context?: Record<string, any>
): Promise<ClarifyIdeaResponse> {
  try {
    // Import the n8n service
    const { N8nService } = await import('./n8nService');
    const n8nService = new N8nService();

    // Trigger the workflow
    const response = await n8nService.triggerWorkflow('clarify-idea-webhook', {
      idea,
      userId,
      context
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to clarify idea'
      };
    }
  } catch (error: any) {
    console.error('Clarify idea workflow failed:', error);
    return {
      success: false,
      error: error.message || 'Workflow execution failed'
    };
  }
} 