import { supabase } from '@/lib/supabase';
import type { WorkflowGenerationRequest } from './n8nWorkflowBuilder';
import { N8nWorkflowBuilder } from './n8nWorkflowBuilder';
import { n8nService } from '@/services/automation/n8nService';

export interface AutomationRecipe {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'finance' | 'operations' | 'customer_success';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  tags: string[];
  benefits: string[];
  prerequisites: string[];
  icon: string;
  
  // Workflow configuration
  triggerType: 'webhook' | 'schedule' | 'manual' | 'email';
  schedule?: string; // For scheduled workflows
  integrations: string[];
  actions: RecipeAction[];
  
  // Customization options
  customizationOptions: CustomizationOption[];
  
  // Success metrics
  successMetrics: string[];
  
  // Status and metadata
  isActive: boolean;
  usageCount: number;
  averageRating: number;
  lastUpdated: string;
}

export interface RecipeAction {
  id: string;
  type: 'http_request' | 'database' | 'email' | 'slack' | 'transform' | 'ai_process' | 'integration';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  customizable: boolean;
  required: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'time' | 'email' | 'url';
  options?: string[]; // For select type
  defaultValue?: unknown;
  required: boolean;
  placeholder?: string;
}

export interface RecipeDeployment {
  id: string;
  recipeId: string;
  userId: string;
  workflowId: string;
  customizations: Record<string, unknown>;
  status: 'pending' | 'deployed' | 'active' | 'paused' | 'failed';
  deployedAt: string;
  lastExecuted?: string;
  executionCount: number;
  errorCount: number;
}

export interface RecipeExecutionResult {
  success: boolean;
  deploymentId?: string;
  workflowId?: string;
  webhookUrl?: string;
  error?: string;
  actionCardId?: string;
}

class AutomationRecipeEngine {
  private n8nBuilder: N8nWorkflowBuilder;
  private recipeCache: Map<string, AutomationRecipe> = new Map();

  constructor() {
    this.n8nBuilder = new N8nWorkflowBuilder();
  }

  /**
   * Get all available automation recipes
   */
  async getAvailableRecipes(): Promise<AutomationRecipe[]> {
    try {
      // Check cache first
      if (this.recipeCache.size > 0) {
        return Array.from(this.recipeCache.values());
      }

      // Load from database
      const { data: recipes, error } = await supabase
        .from('automation_recipes')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to load recipes: ', error);
        return this.getDefaultRecipes();
      }

      // Cache recipes
      recipes?.forEach(recipe => {
        this.recipeCache.set(recipe.id, recipe);
      });

      return recipes || this.getDefaultRecipes();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching recipes: ', error);
      return this.getDefaultRecipes();
    }
  }

  /**
   * Get recipes by category
   */
  async getRecipesByCategory(category: AutomationRecipe['category']): Promise<AutomationRecipe[]> {
    const allRecipes = await this.getAvailableRecipes();
    return allRecipes.filter(recipe => recipe.category === category);
  }

  /**
   * Get a specific recipe by ID
   */
  async getRecipe(recipeId: string): Promise<AutomationRecipe | null> {
    const recipes = await this.getAvailableRecipes();
    return recipes.find(recipe => recipe.id === recipeId) || null;
  }

  /**
   * Deploy a recipe with customizations
   */
  async deployRecipe(
    recipeId: string, 
    customizations: Record<string, unknown> = {},
    userId: string
  ): Promise<RecipeExecutionResult> {
    try {
      const recipe = await this.getRecipe(recipeId);
      if (!recipe) {
        return { success: false, error: 'Recipe not found' };
      }

      // Validate customizations
      const validationResult = this.validateCustomizations(recipe, customizations);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate workflow request
      const workflowRequest = await this.createWorkflowRequest(recipe, customizations);

      // Create n8n workflow
      const workflowResult = await this.n8nBuilder.generateWorkflow(workflowRequest);
      if (!workflowResult.success) {
        return { success: false, error: workflowResult.error };
      }

      // Create deployment record
      const deploymentId = await this.createDeploymentRecord(
        recipe.id,
        userId,
        workflowResult.workflowId!,
        customizations
      );

      // Create success action card
      const actionCardId = await this.createSuccessActionCard(
        recipe,
        deploymentId,
        workflowResult.webhookUrl
      );

      // Update recipe usage count
      await this.updateRecipeUsage(recipe.id);

      return {
        success: true,
        deploymentId,
        workflowId: workflowResult.workflowId,
        webhookUrl: workflowResult.webhookUrl,
        actionCardId
      };

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Recipe deployment failed: ', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user's deployed recipes
   */
  async getUserDeployments(userId: string): Promise<RecipeDeployment[]> {
    try {
      const { data: deployments, error } = await supabase
        .from('automation_recipe_deployments')
        .select(`
          *,
          automation_recipes(name, description, category, icon)
        `)
        .eq('user_id', userId)
        .order('deployed_at', { ascending: false });

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to fetch deployments: ', error);
        return [];
      }

      return deployments || [];
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching deployments: ', error);
      return [];
    }
  }

  /**
   * Pause/resume a deployed recipe
   */
  async toggleDeployment(deploymentId: string, action: 'pause' | 'resume'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_recipe_deployments')
        .update({ 
          status: action === 'pause' ? 'paused' : 'active',
          updatedat: new Date().toISOString()
        })
        .eq('id', deploymentId);

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to toggle deployment: ', error);
        return false;
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error toggling deployment: ', error);
      return false;
    }
  }

  /**
   * Create workflow request from recipe and customizations
   */
  private async createWorkflowRequest(
    recipe: AutomationRecipe, 
    customizations: Record<string, unknown>
  ): Promise<WorkflowGenerationRequest> {
    // Apply customizations to recipe actions
    const customizedActions = recipe.actions.map(action => {
      const customizedParams = { ...action.parameters };
      
      // Apply customizations to parameters
      Object.entries(customizations).forEach(([key, value]) => {
        if (customizedParams[key] !== undefined) {
          customizedParams[key] = value;
        }
      });

      return {
        type: action.type,
        name: action.name,
        parameters: customizedParams
      };
    });

    return {
      name: `${recipe.name} - ${new Date().toLocaleDateString()}`,
      description: recipe.description,
      triggerType: recipe.triggerType,
      integrations: recipe.integrations,
      actions: customizedActions,
      department: recipe.category
    };
  }

  /**
   * Validate customizations against recipe requirements
   */
  private validateCustomizations(
    recipe: AutomationRecipe, 
    customizations: Record<string, unknown>
  ): { valid: boolean; error?: string } {
    for (const option of recipe.customizationOptions) {
      if (option.required && !customizations[option.id]) {
        return { valid: false, error: `${option.name} is required` };
      }

      const value = customizations[option.id];
      if (value !== undefined) {
        // Type validation
        if (option.type === 'email' && typeof value === 'string' && !value.includes('@')) {
          return { valid: false, error: `${option.name} must be a valid email` };
        }
        if (option.type === 'number' && typeof value !== 'number') {
          return { valid: false, error: `${option.name} must be a number` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Create deployment record in database
   */
  private async createDeploymentRecord(
    recipeId: string,
    userId: string,
    workflowId: string,
    customizations: Record<string, unknown>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('automation_recipe_deployments')
      .insert({
        recipeid: recipeId,
        userid: userId,
        workflowid: workflowId,
        customizations,
        status: 'deployed',
        deployedat: new Date().toISOString(),
        executioncount: 0,
        errorcount: 0
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create deployment record: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Create success action card
   */
  private async createSuccessActionCard(
    recipe: AutomationRecipe,
    deploymentId: string,
    webhookUrl?: string
  ): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('action_cards')
      .insert({
        userid: userData.user.id,
        domain: 'automation',
        kind: 'notification',
        title: `${recipe.name} Deployed Successfully`,
        description: `Your automation recipe "${recipe.name}" has been deployed and is now active.`,
        meta: {
          recipeid: recipe.id,
          deploymentid: deploymentId,
          webhookurl: webhookUrl,
          successmetrics: recipe.successMetrics
        },
        data: {
          recipename: recipe.name,
          category: recipe.category,
          estimatedtime: recipe.estimatedTime,
          benefits: recipe.benefits
        },
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create action card: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Update recipe usage count
   */
  private async updateRecipeUsage(recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_recipes')
      .update({ 
        usagecount: supabase.rpc('increment_usage_count', { recipeid: recipeId })
      })
      .eq('id', recipeId);

    if (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to update recipe usage: ', error);
    }
  }

  /**
   * Get default starter recipes (fallback)
   */
  private getDefaultRecipes(): AutomationRecipe[] {
    return [
      {
        id: 'client-onboarding',
        name: 'Client Onboarding Automation',
        description: 'Automatically onboard new clients with welcome emails, document collection, and task creation.',
        category: 'operations',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        tags: ['onboarding', 'welcome', 'automation'],
        benefits: ['Save 2 hours per client', 'Consistent experience', 'Reduced manual work'],
        prerequisites: ['Email integration', 'CRM connection'],
        icon: '🎯',
        triggerType: 'webhook',
        integrations: ['hubspot', 'email'],
        actions: [
          {
            id: 'send-welcome-email',
            type: 'email',
            name: 'Send Welcome Email',
            description: 'Send personalized welcome email to new client',
            parameters: {
              subject: 'Welcome to {{company_name}}!',
              template: 'welcome-template'
            },
            customizable: true,
            required: true
          },
          {
            id: 'create-crm-contact',
            type: 'integration',
            name: 'Create CRM Contact',
            description: 'Add client to CRM system',
            parameters: {
              integration: 'hubspot',
              action: 'create_contact'
            },
            customizable: false,
            required: true
          }
        ],
        customizationOptions: [
          {
            id: 'company_name',
            name: 'Company Name',
            description: 'Your company name for personalization',
            type: 'text',
            required: true,
            placeholder: 'Enter your company name'
          },
          {
            id: 'welcome_email_template',
            name: 'Welcome Email Template',
            description: 'Choose welcome email template',
            type: 'select',
            options: ['formal', 'casual', 'custom'],
            defaultValue: 'formal',
            required: true
          }
        ],
        successMetrics: ['Email delivery rate', 'Client response rate', 'Onboarding completion time'],
        isActive: true,
        usageCount: 0,
        averageRating: 4.8,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'invoice-processing',
        name: 'Invoice Processing Workflow',
        description: 'Automatically process invoices from creation to payment tracking.',
        category: 'finance',
        difficulty: 'medium',
        estimatedTime: '20 minutes',
        tags: ['invoicing', 'payments', 'finance'],
        benefits: ['Faster payment cycles', 'Reduced errors', 'Better cash flow'],
        prerequisites: ['Stripe integration', 'Accounting software'],
        icon: '💰',
        triggerType: 'webhook',
        integrations: ['stripe', 'quickbooks'],
        actions: [
          {
            id: 'create-invoice',
            type: 'integration',
            name: 'Create Invoice',
            description: 'Generate invoice in accounting system',
            parameters: {
              integration: 'stripe',
              action: 'create_invoice'
            },
            customizable: true,
            required: true
          },
          {
            id: 'send-invoice-email',
            type: 'email',
            name: 'Send Invoice Email',
            description: 'Email invoice to client',
            parameters: {
              subject: 'Invoice {{invoice_number}} from {{company_name}}',
              template: 'invoice-template'
            },
            customizable: true,
            required: true
          }
        ],
        customizationOptions: [
          {
            id: 'payment_terms',
            name: 'Payment Terms',
            description: 'Default payment terms in days',
            type: 'select',
            options: ['15', '30', '45', '60'],
            defaultValue: '30',
            required: true
          },
          {
            id: 'late_fee_percentage',
            name: 'Late Fee Percentage',
            description: 'Late fee percentage for overdue invoices',
            type: 'number',
            defaultValue: 1.5,
            required: false
          }
        ],
        successMetrics: ['Invoice processing time', 'Payment collection rate', 'Late payment reduction'],
        isActive: true,
        usageCount: 0,
        averageRating: 4.6,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'lead-nurturing',
        name: 'Lead Nurturing Sequence',
        description: 'Automated email sequence to nurture leads through the sales funnel.',
        category: 'sales',
        difficulty: 'medium',
        estimatedTime: '25 minutes',
        tags: ['lead nurturing', 'sales', 'email marketing'],
        benefits: ['Higher conversion rates', 'Automated follow-ups', 'Better lead scoring'],
        prerequisites: ['Email marketing platform', 'CRM integration'],
        icon: '📈',
        triggerType: 'webhook',
        integrations: ['hubspot', 'mailchimp'],
        actions: [
          {
            id: 'add-to-nurture-list',
            type: 'integration',
            name: 'Add to Nurture List',
            description: 'Add lead to nurturing email list',
            parameters: {
              integration: 'mailchimp',
              action: 'add_to_list'
            },
            customizable: true,
            required: true
          },
          {
            id: 'update-lead-score',
            type: 'integration',
            name: 'Update Lead Score',
            description: 'Update lead scoring in CRM',
            parameters: {
              integration: 'hubspot',
              action: 'update_lead_score'
            },
            customizable: false,
            required: true
          }
        ],
        customizationOptions: [
          {
            id: 'nurture_sequence_length',
            name: 'Sequence Length',
            description: 'Number of emails in nurture sequence',
            type: 'select',
            options: ['5', '7', '10', '14'],
            defaultValue: '7',
            required: true
          },
          {
            id: 'email_frequency',
            name: 'Email Frequency',
            description: 'Days between emails',
            type: 'select',
            options: ['2', '3', '5', '7'],
            defaultValue: '3',
            required: true
          }
        ],
        successMetrics: ['Open rates', 'Click-through rates', 'Lead conversion rate'],
        isActive: true,
        usageCount: 0,
        averageRating: 4.7,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'weekly-reports',
        name: 'Weekly Report Generation',
        description: 'Automatically generate and distribute weekly business reports.',
        category: 'operations',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        tags: ['reporting', 'analytics', 'automation'],
        benefits: ['Consistent reporting', 'Time savings', 'Data-driven decisions'],
        prerequisites: ['Analytics platform', 'Email access'],
        icon: '📊',
        triggerType: 'schedule',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        integrations: ['internal'],
        actions: [
          {
            id: 'generate-report',
            type: 'ai_process',
            name: 'Generate Report',
            description: 'Generate weekly business report',
            parameters: {
              reporttype: 'weekly_summary',
              includemetrics: ['revenue', 'customers', 'projects']
            },
            customizable: true,
            required: true
          },
          {
            id: 'distribute-report',
            type: 'email',
            name: 'Distribute Report',
            description: 'Send report to stakeholders',
            parameters: {
              subject: 'Weekly Business Report - {{date}}',
              template: 'report-template'
            },
            customizable: true,
            required: true
          }
        ],
        customizationOptions: [
          {
            id: 'report_recipients',
            name: 'Report Recipients',
            description: 'Email addresses to receive reports',
            type: 'text',
            required: true,
            placeholder: 'Enter email addresses separated by commas'
          },
          {
            id: 'report_sections',
            name: 'Report Sections',
            description: 'Choose which sections to include',
            type: 'select',
            options: ['revenue', 'customers', 'projects', 'tasks', 'expenses'],
            defaultValue: 'revenue',
            required: true
          }
        ],
        successMetrics: ['Report delivery rate', 'Stakeholder engagement', 'Decision speed'],
        isActive: true,
        usageCount: 0,
        averageRating: 4.5,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'support-ticket-routing',
        name: 'Customer Support Ticket Routing',
        description: 'Automatically route support tickets to the right team members.',
        category: 'customer_success',
        difficulty: 'hard',
        estimatedTime: '30 minutes',
        tags: ['support', 'routing', 'customer service'],
        benefits: ['Faster response times', 'Better specialization', 'Improved satisfaction'],
        prerequisites: ['Support platform', 'Team structure'],
        icon: '🎧',
        triggerType: 'webhook',
        integrations: ['zendesk', 'slack'],
        actions: [
          {
            id: 'analyze-ticket',
            type: 'ai_process',
            name: 'Analyze Ticket',
            description: 'Analyze ticket content and urgency',
            parameters: {
              analysistype: 'ticket_categorization',
              urgencydetection: true
            },
            customizable: false,
            required: true
          },
          {
            id: 'route-ticket',
            type: 'integration',
            name: 'Route Ticket',
            description: 'Assign ticket to appropriate team member',
            parameters: {
              integration: 'zendesk',
              action: 'assign_ticket'
            },
            customizable: true,
            required: true
          },
          {
            id: 'notify-team',
            type: 'slack',
            name: 'Notify Team',
            description: 'Send notification to assigned team',
            parameters: {
              message: 'New ticket assigned: {{ticket_title}}'
            },
            customizable: true,
            required: false
          }
        ],
        customizationOptions: [
          {
            id: 'routing_rules',
            name: 'Routing Rules',
            description: 'Define how tickets should be routed',
            type: 'select',
            options: ['by_product', 'by_urgency', 'by_customer_tier', 'round_robin'],
            defaultValue: 'by_product',
            required: true
          },
          {
            id: 'escalation_time',
            name: 'Escalation Time',
            description: 'Hours before escalating unresolved tickets',
            type: 'number',
            defaultValue: 4,
            required: true
          }
        ],
        successMetrics: ['Response time', 'Resolution time', 'Customer satisfaction'],
        isActive: true,
        usageCount: 0,
        averageRating: 4.9,
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const automationRecipeEngine = new AutomationRecipeEngine(); 