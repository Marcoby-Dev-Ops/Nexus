/**
 * aiAgentWithTools.ts
 * Tool-Enabled AI Agent System
 * 
 * Combines OpenAI function calling with n8n workflows to give Nex:
 * - Real business data access
 * - Action execution capabilities
 * - Knowledge from integrated systems
 * - Workflow automation powers
 */

import { supabase } from '@/core/supabase';
import type { Agent } from '@/domains/ai/lib/agentRegistry';
// import { listPayPalTxns } from '@/domains/ai/lib/tools/paypal';

// Mock services for now
const n8nService = {
  salesAction: async (_action: string, _params: any) => ({ success: false, error: 'Service not implemented' }),
  financeAction: async (_action: string, _params: any) => ({ success: false, error: 'Service not implemented' }),
  triggerWorkflow: async (_workflow: string, _params: any) => ({ success: false, error: 'Service not implemented' })
};

const listPayPalTxns = async (_params: any) => [];

// Tool definitions for OpenAI function calling
export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: Record<string, any>, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  userId: string;
  sessionId: string;
  conversationId: string;
  agent: Agent;
  currentStep?: string;
  orgId?: string;
}

// Business Intelligence Tools
export const businessIntelligenceTools: AITool[] = [
  {
    name: "get_sales_metrics",
    description: "Get current sales performance metrics including pipeline, deals, and revenue data",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["today", "week", "month", "quarter", "year"],
          description: "The time period for the metrics"
        },
        metric_type: {
          type: "string",
          enum: ["pipeline", "closed_deals", "revenue", "forecast", "team_performance"],
          description: "Specific type of sales metric to retrieve"
        }
      },
      required: ["timeframe", "metric_type"]
    },
    handler: async (args, context) => {
      // Trigger n8n workflow to get sales data from CRM
      const result = await n8nService.salesAction('pipeline', {
        timeframe: args.timeframe,
        metric_type: args.metric_type,
        userId: context.userId
      });
      
      if (result.success) {
        return {
          data: result.data,
          summary: `Retrieved ${args.metric_type} data for ${args.timeframe}: ${JSON.stringify(result.data)}`
        };
      } else {
        return {
          error: result.error,
          fallback: "I'm having trouble accessing your sales data right now. Please check your CRM integration."
        };
      }
    }
  },
  
  {
    name: "get_financial_overview",
    description: "Get financial overview including revenue, expenses, and cash flow",
    parameters: {
      type: "object",
      properties: {
        report_type: {
          type: "string",
          enum: ["revenue", "expenses", "cash_flow", "profit_loss", "balance_sheet"],
          description: "Type of financial report to generate"
        },
        period: {
          type: "string",
          enum: ["current_month", "last_month", "quarter", "year_to_date"],
          description: "Reporting period"
        }
      },
      required: ["report_type", "period"]
    },
    handler: async (args, context) => {
      const result = await n8nService.financeAction('report', {
        report_type: args.report_type,
        period: args.period,
        userId: context.userId
      });
      
      return result.success 
        ? { data: result.data, summary: `Financial ${args.report_type} report for ${args.period}` }
        : { error: "Unable to generate financial report", fallback: "Please check your accounting system integration." };
    }
  },

  {
    name: "analyze_business_metrics",
    description: "Analyze key business metrics and provide insights using n8n data processing workflows",
    parameters: {
      type: "object",
      properties: {
        metrics: {
          type: "array",
          items: {
            type: "string",
            enum: ["customer_acquisition", "churn_rate", "lifetime_value", "growth_rate", "operational_efficiency"]
          },
          description: "List of metrics to analyze"
        },
        comparison_period: {
          type: "string",
          enum: ["month_over_month", "quarter_over_quarter", "year_over_year"],
          description: "Comparison timeframe for analysis"
        }
      },
      required: ["metrics"]
    },
    handler: async (args, context) => {
      // Use n8n workflow to aggregate data from multiple sources
      const result = await n8nService.triggerWorkflow('data-analysis-webhook', {
        metrics: args.metrics,
        comparison_period: args.comparison_period || 'month_over_month',
        userId: context.userId
      });
      
      return result.success 
        ? { insights: result.data, summary: `Analyzed ${args.metrics.join(', ')} metrics` }
        : { error: "Analysis failed", fallback: "I'll provide general business insights instead." };
    }
  },

  {
    name: "listPayPalTxns",
    description: "Returns recent PayPal transactions for this organisation (Finance)",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of transactions to return",
          default: 50
        }
      },
      required: []
    },
    handler: async (args, context) => {
      const rows = await listPayPalTxns({ orgId: context.orgId as string, limit: args.limit || 50 });
      return { rows, summary: `Fetched ${rows.length} PayPal transactions` };
    }
  }
];

// Action Execution Tools
export const actionTools: AITool[] = [
  {
    name: "create_task_or_project",
    description: "Create a new task, project, or workflow in your project management system",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the task or project"
        },
        description: {
          type: "string",
          description: "Detailed description"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level"
        },
        department: {
          type: "string",
          enum: ["sales", "marketing", "finance", "operations", "general"],
          description: "Responsible department"
        },
        due_date: {
          type: "string",
          description: "Due date in YYYY-MM-DD format"
        }
      },
      required: ["title", "department"]
    },
    handler: async (args, context) => {
      const result = await n8nService.operationsAction('automate', {
        action: 'create_task',
        task_data: args,
        created_by: context.userId
      });
      
      return result.success 
        ? { task_id: result.data?.task_id, summary: `Created ${args.priority || 'medium'} priority task: ${args.title}` }
        : { error: "Failed to create task", fallback: "I've noted this for manual follow-up." };
    }
  },

  {
    name: "send_team_notification",
    description: "Send notifications or updates to team members or departments",
    parameters: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          items: { type: "string" },
          description: "List of recipients (email addresses or department names)"
        },
        subject: {
          type: "string",
          description: "Notification subject"
        },
        message: {
          type: "string",
          description: "Message content"
        },
        urgency: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description: "Urgency level"
        }
      },
      required: ["recipients", "subject", "message"]
    },
    handler: async (args, context) => {
      const result = await n8nService.triggerWorkflow('team-notification-webhook', {
        recipients: args.recipients,
        subject: args.subject,
        message: args.message,
        urgency: args.urgency || 'normal',
        sent_by: context.userId
      });
      
      return result.success 
        ? { message_id: result.data?.message_id, summary: `Sent notification to ${args.recipients.length} recipients` }
        : { error: "Failed to send notification", fallback: "Please send this manually through your communication platform." };
    }
  },

  {
    name: "schedule_meeting",
    description: "Schedule meetings with team members or external contacts",
    parameters: {
      type: "object",
      properties: {
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "List of attendee email addresses"
        },
        title: {
          type: "string",
          description: "Meeting title"
        },
        agenda: {
          type: "string",
          description: "Meeting agenda or description"
        },
        duration_minutes: {
          type: "number",
          description: "Meeting duration in minutes"
        },
        preferred_time: {
          type: "string",
          description: "Preferred time in natural language (e.g., 'tomorrow 2pm', 'next week')"
        }
      },
      required: ["attendees", "title", "duration_minutes"]
    },
    handler: async (args, context) => {
      const result = await n8nService.triggerWorkflow('calendar-integration-webhook', {
        meeting_data: args,
        organizer: context.userId,
        action: 'schedule_meeting'
      });
      
      return result.success 
        ? { meeting_id: result.data?.meeting_id, summary: `Scheduled meeting: ${args.title}` }
        : { error: "Failed to schedule meeting", fallback: "Please schedule this manually in your calendar." };
    }
  }
];

// Content and Knowledge Tools
export const contentTools: AITool[] = [
  {
    name: "generate_business_content",
    description: "Generate business content like emails, proposals, reports, or blog posts using n8n content workflows",
    parameters: {
      type: "object",
      properties: {
        content_type: {
          type: "string",
          enum: ["email", "proposal", "report", "blog_post", "social_media", "presentation"],
          description: "Type of content to generate"
        },
        topic: {
          type: "string",
          description: "Main topic or subject"
        },
        tone: {
          type: "string",
          enum: ["professional", "friendly", "persuasive", "informative", "creative"],
          description: "Desired tone of the content"
        },
        target_audience: {
          type: "string",
          description: "Target audience (e.g., 'customers', 'investors', 'team')"
        },
        length: {
          type: "string",
          enum: ["short", "medium", "long"],
          description: "Desired content length"
        }
      },
      required: ["content_type", "topic"]
    },
    handler: async (args, context) => {
      const result = await n8nService.createContent(
        args.content_type as 'blog' | 'social' | 'email',
        `Create ${args.content_type} about: ${args.topic}`,
        {
          tone: args.tone || 'professional',
          target_audience: args.target_audience,
          length: args.length || 'medium'
        }
      );
      
      return result.success 
        ? { content: result.data?.content, summary: `Generated ${args.content_type}: ${args.topic}` }
        : { error: "Content generation failed", fallback: "I can provide you with an outline to write this manually." };
    }
  },

  {
    name: "search_company_knowledge",
    description: "Search through company documents, policies, and knowledge base",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query or question"
        },
        document_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["policies", "procedures", "templates", "reports", "contracts", "all"]
          },
          description: "Types of documents to search"
        }
      },
      required: ["query"]
    },
    handler: async (args, context) => {
      // Search company knowledge base through Supabase or n8n workflow
      const { data, error } = await (supabase as any)
        .from('company_documents')
        .select('*')
        .textSearch('content', args.query)
        .limit(5);
      
      if (error) {
        return { error: "Knowledge search failed", fallback: "Let me help you find this information manually." };
      }
      
      return {
        results: data,
        summary: `Found ${data?.length || 0} relevant documents for: ${args.query}`
      };
    }
  },

  {
    name: "develop_business_plan",
    description: "Interactively develop a concise business plan (mission, vision, goals, target market, value proposition) for the user's company when missing. If fields already exist, refine them.",
    parameters: {
      type: "object",
      properties: {
        focus_area: {
          type: "string",
          description: "Optional specific area to work on (e.g., 'mission', 'vision', 'goals'). Leave blank for full plan."
        }
      },
      required: []
    },
    handler: async (args, context) => {
      // Call edge function to generate or refine plan
      if (!context.orgId) {
        return { error: "Company not found" };
      }

      const { data, error } = await (supabase as any).functions.invoke('ai_generate_business_plan', {
        body: { company_id: context.orgId, focus_area: args.focus_area }
      });

      if (error) {
        return { error: error.message || 'Plan generation failed' };
      }

      return {
        business_plan: data?.business_plan_md,
        summary: 'Business plan generated and stored.'
      };
    }
  }
];

// Workflow Automation Tools
export const automationTools: AITool[] = [
  {
    name: "create_custom_workflow",
    description: "Create a custom n8n workflow for specific business needs using the Nexus Builder",
    parameters: {
      type: "object",
      properties: {
        workflow_description: {
          type: "string",
          description: "Detailed description of what the workflow should do"
        },
        trigger_type: {
          type: "string",
          enum: ["webhook", "schedule", "email", "form_submission", "chat_command"],
          description: "How the workflow should be triggered"
        },
        integrations_needed: {
          type: "array",
          items: { type: "string" },
          description: "List of systems to integrate (e.g., 'hubspot', 'slack', 'gmail')"
        }
      },
      required: ["workflow_description"]
    },
    handler: async (args, context) => {
      const result = await n8nService.generateWorkflow(
        args.workflow_description,
        context.agent.department as any
      );
      
      return result.success 
        ? { workflow_id: result.data?.workflow_id, summary: `Created workflow: ${args.workflow_description}` }
        : { error: "Workflow creation failed", fallback: "I can help you plan this workflow manually." };
    }
  }
];

// Combined tool registry
export const allTools: AITool[] = [
  ...businessIntelligenceTools,
  ...actionTools,
  ...contentTools,
  ...automationTools
];

// Enhanced Chat Service with Tools
export class ToolEnabledAgent {
  private tools: Map<string, AITool> = new Map();

  constructor(tools: AITool[] = allTools) {
    tools.forEach(tool => this.tools.set(tool.name, tool));
  }

  async sendMessageWithTools(
    conversationId: string,
    message: string,
    agent: Agent,
    sessionId: string,
    context?: Partial<ToolContext>
  ) {
    try {
      // Get user for context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const toolContext: ToolContext = {
        userId: user.id,
        sessionId,
        conversationId,
        agent,
        ...context,
        orgId: (await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()).data?.company_id ?? undefined,
      };

      // Enhanced system prompt with tool awareness and cross-platform context
      const toolAwareSystemPrompt = `${agent.systemPrompt}

CROSS-PLATFORM BUSINESS CONTEXT:
You have access to real-time data from all connected business platforms. This gives you unprecedented insight into:

INTEGRATED INTELLIGENCE:
- HubSpot CRM: Live sales pipeline, deal velocity, customer interactions
- Cloudflare Analytics: Website performance, security threats, global traffic patterns  
- Google Workspace: Email volume, meeting patterns, document collaboration
- Marcoby Cloud: Infrastructure utilization, cost optimization, system health
- PayPal: Transaction patterns, revenue trends, payment analytics

AI CORRELATION INSIGHTS:
- Cross-platform pattern recognition (e.g., "High email volume → 23% increase in deal velocity")
- Predictive analytics (e.g., "Current trends suggest 34% Q1 lead increase")
- Proactive recommendations (e.g., "Infrastructure scaling needed by month-end")

CONTEXTUAL DECISION MAKING:
When responding to queries, consider:
1. Current business state across all platforms
2. Historical patterns and correlations
3. Predictive insights and trends
4. Resource utilization and capacity
5. Team productivity and collaboration patterns

INTELLIGENT ROUTING:
- If query involves sales metrics → Use HubSpot data context
- If query involves website/performance → Reference Cloudflare insights
- If query involves team productivity → Include Google Workspace patterns
- If query involves infrastructure → Consider Marcoby Cloud utilization
- If query involves financial data → Incorporate PayPal transaction insights

TOOL CAPABILITIES:
You have access to real business tools and data through n8n workflows. You can:

BUSINESS INTELLIGENCE:
- Get real sales metrics, financial data, and business analytics
- Analyze performance trends and provide data-driven insights
- Access live data from CRM, accounting, and other business systems

ACTIONS:
- Create tasks and projects in your project management system
- Schedule meetings and send team notifications
- Execute business processes and workflows

CONTENT & KNOWLEDGE:
- Generate business content (emails, reports, proposals)
- Search company knowledge base and documents
- Create marketing materials and communications

AUTOMATION:
- Build custom workflows for specific business needs
- Integrate different business systems
- Automate repetitive processes

CONTEXTUAL INTELLIGENCE EXAMPLES:
- "Based on your Cloudflare data showing 180ms response time and current HubSpot pipeline of $245K, I recommend optimizing your landing pages before the Q1 marketing push."
- "Your Google Workspace shows 12h/week in meetings and Marcoby Cloud indicates 72% server utilization - perfect time to implement that automation workflow we discussed."
- "PayPal transactions show a 15% increase this month while HubSpot conversion rate is at 28% - your sales team is performing exceptionally well."

IMPORTANT: When you need to access real data or perform actions, use the available tools. Always explain what you're doing when using tools. Reference cross-platform insights to provide more intelligent, contextual responses.

Available tools: ${Array.from(this.tools.keys()).join(', ')}`;

      // Call OpenAI with function calling enabled
      const openaiRequest = {
        model: 'o3-mini-high',
        messages: [
          { role: 'system', content: toolAwareSystemPrompt },
          { role: 'user', content: message }
        ],
        functions: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        })),
        function_call: 'auto'
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiRequest),
      });

      const completion = await response.json();
      const assistantMessage = completion.choices[0].message;

      // Handle function calls
      if (assistantMessage.function_call) {
        const toolName = assistantMessage.function_call.name;
        const toolArgs = JSON.parse(assistantMessage.function_call.arguments);
        const tool = this.tools.get(toolName);

        if (tool) {
          console.log(`🔧 Executing tool: ${toolName}`, toolArgs);
          
          try {
            const toolResult = await tool.handler(toolArgs, toolContext);
            
            // Send follow-up message with tool results
            const followUpRequest = {
              model: 'o3',
              messages: [
                { role: 'system', content: toolAwareSystemPrompt },
                { role: 'user', content: message },
                assistantMessage,
                {
                  role: 'function',
                  name: toolName,
                  content: JSON.stringify(toolResult)
                }
              ]
            };

            const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(followUpRequest),
            });

            const followUpCompletion = await followUpResponse.json();
            const finalMessage = followUpCompletion.choices[0].message.content;

            return {
              success: true,
              content: finalMessage,
              toolUsed: toolName,
              toolResult: toolResult,
              model: 'gpt-4-with-tools'
            };
          } catch (toolError) {
            console.error(`Tool execution failed: ${toolName}`, toolError);
            return {
              success: true,
              content: `I attempted to ${tool.description.toLowerCase()} but encountered an issue. Let me help you with this manually instead. ${assistantMessage.content || ''}`,
              toolUsed: toolName,
              toolError: toolError,
              model: 'gpt-4-with-tools'
            };
          }
        }
      }

      // No function call - return regular response
      return {
        success: true,
        content: assistantMessage.content,
        model: 'gpt-4-with-tools'
      };

    } catch (error) {
      console.error('Tool-enabled agent error:', error);
      throw error;
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolDescription(toolName: string): string | undefined {
    return this.tools.get(toolName)?.description;
  }
}

// Export configured instance
export const toolEnabledAgent = new ToolEnabledAgent(); 