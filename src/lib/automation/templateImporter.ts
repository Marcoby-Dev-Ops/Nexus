import { supabase } from '@/lib/supabase/supabaseClient';
import { N8nWorkflowBuilder, N8nWorkflowDefinition } from './n8n/n8nWorkflowBuilder';
import { n8nService } from './n8n/n8nService';

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'finance' | 'operations' | 'customer_success' | 'general';
  source: 'zapier' | 'make' | 'n8n' | 'custom' | 'nexus';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  timeSavingsPerWeek: number; // hours
  requiredIntegrations: string[];
  templateData: any; // Original template format
  nexusWorkflow?: N8nWorkflowDefinition; // Converted to Nexus format
  conversionStatus: 'pending' | 'converted' | 'failed';
  tags: string[];
  rating: number;
  downloads: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateImportResult {
  success: boolean;
  templateId?: string;
  nexusWorkflowId?: string;
  errors?: string[];
  warnings?: string[];
  conversionNotes?: string[];
}

export interface ZapierTemplate {
  id: string;
  title: string;
  description: string;
  steps: Array<{
    app: string;
    action: string;
    params: Record<string, any>;
  }>;
  trigger: {
    app: string;
    event: string;
    params: Record<string, any>;
  };
}

export interface MakeTemplate {
  id: string;
  name: string;
  description: string;
  modules: Array<{
    app: string;
    module: string;
    parameters: Record<string, any>;
    connections: Array<{ target: string; type: string }>;
  }>;
  connections: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

export class AutomationTemplateImporter {
  private n8nBuilder: N8nWorkflowBuilder;

  constructor() {
    this.n8nBuilder = new N8nWorkflowBuilder();
  }

  /**
   * Import template from various sources
   */
  async importTemplate(
    templateData: any,
    source: 'zapier' | 'make' | 'n8n' | 'custom',
    userId: string
  ): Promise<TemplateImportResult> {
    try {
      let template: AutomationTemplate;

      switch (source) {
        case 'zapier':
          template = await this.convertZapierTemplate(templateData as ZapierTemplate);
          break;
        case 'make':
          template = await this.convertMakeTemplate(templateData as MakeTemplate);
          break;
        case 'n8n':
          template = await this.convertN8nTemplate(templateData);
          break;
        case 'custom':
          template = await this.convertCustomTemplate(templateData);
          break;
        default:
          throw new Error(`Unsupported template source: ${source}`);
      }

      // Save template to database
      const { data: savedTemplate, error } = await supabase
        .from('automation_templates')
        .insert({
          ...template,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save template: ${error.message}`);
      }

      // Convert to Nexus workflow if not already done
      let nexusWorkflowId: string | undefined;
      if (template.nexusWorkflow) {
        const workflowResult = await this.n8nBuilder.createWorkflow(template.nexusWorkflow);
        if (workflowResult.success) {
          nexusWorkflowId = workflowResult.workflowId;
          
          // Update template with workflow ID
          await supabase
            .from('automation_templates')
            .update({ nexus_workflow_id: nexusWorkflowId })
            .eq('id', savedTemplate.id);
        }
      }

      return {
        success: true,
        templateId: savedTemplate.id,
        nexusWorkflowId,
        conversionNotes: template.conversionStatus === 'converted' 
          ? ['Successfully converted to Nexus format']
          : ['Template imported but requires manual conversion']
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Convert Zapier template to Nexus format
   */
  private async convertZapierTemplate(zapierTemplate: ZapierTemplate): Promise<AutomationTemplate> {
    const template: AutomationTemplate = {
      id: `zapier-${zapierTemplate.id}`,
      name: zapierTemplate.title,
      description: zapierTemplate.description,
      category: this.categorizeTemplate(zapierTemplate.title, zapierTemplate.description),
      source: 'zapier',
      difficulty: 'intermediate',
      estimatedSetupTime: 15,
      timeSavingsPerWeek: 2,
      requiredIntegrations: this.extractIntegrations(zapierTemplate),
      templateData: zapierTemplate,
      conversionStatus: 'pending',
      tags: this.generateTags(zapierTemplate.title, zapierTemplate.description),
      rating: 4.0,
      downloads: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Attempt automatic conversion
    try {
      template.nexusWorkflow = await this.convertZapierToN8n(zapierTemplate);
      template.conversionStatus = 'converted';
    } catch (error) {
      template.conversionStatus = 'failed';
      console.warn('Failed to convert Zapier template:', error);
    }

    return template;
  }

  /**
   * Convert Make.com template to Nexus format
   */
  private async convertMakeTemplate(makeTemplate: MakeTemplate): Promise<AutomationTemplate> {
    const template: AutomationTemplate = {
      id: `make-${makeTemplate.id}`,
      name: makeTemplate.name,
      description: makeTemplate.description,
      category: this.categorizeTemplate(makeTemplate.name, makeTemplate.description),
      source: 'make',
      difficulty: 'intermediate',
      estimatedSetupTime: 20,
      timeSavingsPerWeek: 3,
      requiredIntegrations: this.extractMakeIntegrations(makeTemplate),
      templateData: makeTemplate,
      conversionStatus: 'pending',
      tags: this.generateTags(makeTemplate.name, makeTemplate.description),
      rating: 4.2,
      downloads: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Attempt automatic conversion
    try {
      template.nexusWorkflow = await this.convertMakeToN8n(makeTemplate);
      template.conversionStatus = 'converted';
    } catch (error) {
      template.conversionStatus = 'failed';
      console.warn('Failed to convert Make template:', error);
    }

    return template;
  }

  /**
   * Convert n8n template to Nexus format
   */
  private async convertN8nTemplate(n8nTemplate: any): Promise<AutomationTemplate> {
    return {
      id: `n8n-${n8nTemplate.id || Date.now()}`,
      name: n8nTemplate.name || 'Imported n8n Workflow',
      description: n8nTemplate.description || 'Imported from n8n',
      category: this.categorizeTemplate(n8nTemplate.name, n8nTemplate.description),
      source: 'n8n',
      difficulty: 'advanced',
      estimatedSetupTime: 10,
      timeSavingsPerWeek: 4,
      requiredIntegrations: this.extractN8nIntegrations(n8nTemplate),
      templateData: n8nTemplate,
      nexusWorkflow: n8nTemplate,
      conversionStatus: 'converted',
      tags: this.generateTags(n8nTemplate.name, n8nTemplate.description),
      rating: 4.5,
      downloads: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert custom template to Nexus format
   */
  private async convertCustomTemplate(customTemplate: any): Promise<AutomationTemplate> {
    return {
      id: `custom-${Date.now()}`,
      name: customTemplate.name || 'Custom Template',
      description: customTemplate.description || 'Custom automation template',
      category: customTemplate.category || 'general',
      source: 'custom',
      difficulty: customTemplate.difficulty || 'intermediate',
      estimatedSetupTime: customTemplate.estimatedSetupTime || 15,
      timeSavingsPerWeek: customTemplate.timeSavingsPerWeek || 2,
      requiredIntegrations: customTemplate.requiredIntegrations || [],
      templateData: customTemplate,
      conversionStatus: 'pending',
      tags: customTemplate.tags || [],
      rating: 4.0,
      downloads: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert Zapier workflow to n8n format
   */
  private async convertZapierToN8n(zapierTemplate: ZapierTemplate): Promise<N8nWorkflowDefinition> {
    const nodes: any[] = [];
    const connections: any = {};

    // Create trigger node
    const triggerNode = {
      id: 'trigger',
      name: 'Zapier Trigger',
      type: this.mapZapierTriggerToN8n(zapierTemplate.trigger.app),
      typeVersion: 1,
      position: [240, 300],
      parameters: this.mapZapierParamsToN8n(zapierTemplate.trigger.params)
    };
    nodes.push(triggerNode);

    let previousNodeName = 'Zapier Trigger';
    let yPosition = 500;

    // Create action nodes
    for (const [index, step] of zapierTemplate.steps.entries()) {
      const actionNode = {
        id: `action-${index}`,
        name: `${step.app} Action`,
        type: this.mapZapierActionToN8n(step.app, step.action),
        typeVersion: 1,
        position: [240, yPosition],
        parameters: this.mapZapierParamsToN8n(step.params)
      };
      nodes.push(actionNode);

      // Connect to previous node
      if (!connections[previousNodeName]) {
        connections[previousNodeName] = { main: [] };
      }
      connections[previousNodeName].main.push([{
        node: actionNode.name,
        type: 'main',
        index: 0
      }]);

      previousNodeName = actionNode.name;
      yPosition += 200;
    }

    return {
      name: zapierTemplate.title,
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
   * Convert Make.com workflow to n8n format
   */
  private async convertMakeToN8n(makeTemplate: MakeTemplate): Promise<N8nWorkflowDefinition> {
    const nodes: any[] = [];
    const connections: any = {};

    // Convert Make modules to n8n nodes
    for (const [index, module] of makeTemplate.modules.entries()) {
      const node = {
        id: `node-${index}`,
        name: `${module.app} ${module.module}`,
        type: this.mapMakeModuleToN8n(module.app, module.module),
        typeVersion: 1,
        position: [240, 300 + (index * 200)],
        parameters: this.mapMakeParamsToN8n(module.parameters)
      };
      nodes.push(node);
    }

    // Convert Make connections to n8n connections
    for (const connection of makeTemplate.connections) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        if (!connections[sourceNode.name]) {
          connections[sourceNode.name] = { main: [] };
        }
        connections[sourceNode.name].main.push([{
          node: targetNode.name,
          type: 'main',
          index: 0
        }]);
      }
    }

    return {
      name: makeTemplate.name,
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
   * Helper methods for mapping between platforms
   */
  private mapZapierTriggerToN8n(app: string): string {
    const mapping: Record<string, string> = {
      'webhook': 'n8n-nodes-base.webhook',
      'schedule': 'n8n-nodes-base.cron',
      'gmail': 'n8n-nodes-base.gmail',
      'hubspot': 'n8n-nodes-base.hubspot',
      'slack': 'n8n-nodes-base.slack'
    };
    return mapping[app.toLowerCase()] || 'n8n-nodes-base.webhook';
  }

  private mapZapierActionToN8n(app: string, action: string): string {
    const mapping: Record<string, string> = {
      'gmail': 'n8n-nodes-base.gmail',
      'hubspot': 'n8n-nodes-base.hubspot',
      'slack': 'n8n-nodes-base.slack',
      'http': 'n8n-nodes-base.httpRequest',
      'webhook': 'n8n-nodes-base.webhook'
    };
    return mapping[app.toLowerCase()] || 'n8n-nodes-base.httpRequest';
  }

  private mapMakeModuleToN8n(app: string, module: string): string {
    const mapping: Record<string, string> = {
      'http': 'n8n-nodes-base.httpRequest',
      'webhook': 'n8n-nodes-base.webhook',
      'gmail': 'n8n-nodes-base.gmail',
      'hubspot': 'n8n-nodes-base.hubspot',
      'slack': 'n8n-nodes-base.slack'
    };
    return mapping[app.toLowerCase()] || 'n8n-nodes-base.httpRequest';
  }

  private mapZapierParamsToN8n(params: Record<string, any>): Record<string, any> {
    // Convert Zapier parameters to n8n format
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Handle common parameter mappings
      if (key === 'url') converted.url = value;
      if (key === 'method') converted.method = value;
      if (key === 'body') converted.body = value;
      if (key === 'headers') converted.headers = value;
      
      // Default: keep as-is
      converted[key] = value;
    }
    
    return converted;
  }

  private mapMakeParamsToN8n(params: Record<string, any>): Record<string, any> {
    // Convert Make parameters to n8n format
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Handle common parameter mappings
      if (key === 'url') converted.url = value;
      if (key === 'method') converted.method = value;
      if (key === 'body') converted.body = value;
      if (key === 'headers') converted.headers = value;
      
      // Default: keep as-is
      converted[key] = value;
    }
    
    return converted;
  }

  private categorizeTemplate(name: string, description: string): AutomationTemplate['category'] {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('sales') || text.includes('lead') || text.includes('crm')) return 'sales';
    if (text.includes('marketing') || text.includes('campaign') || text.includes('email')) return 'marketing';
    if (text.includes('finance') || text.includes('invoice') || text.includes('payment')) return 'finance';
    if (text.includes('customer') || text.includes('support') || text.includes('ticket')) return 'customer_success';
    if (text.includes('operations') || text.includes('workflow') || text.includes('process')) return 'operations';
    
    return 'general';
  }

  private extractIntegrations(zapierTemplate: ZapierTemplate): string[] {
    const integrations = new Set<string>();
    
    integrations.add(zapierTemplate.trigger.app.toLowerCase());
    zapierTemplate.steps.forEach(step => {
      integrations.add(step.app.toLowerCase());
    });
    
    return Array.from(integrations);
  }

  private extractMakeIntegrations(makeTemplate: MakeTemplate): string[] {
    const integrations = new Set<string>();
    
    makeTemplate.modules.forEach(module => {
      integrations.add(module.app.toLowerCase());
    });
    
    return Array.from(integrations);
  }

  private extractN8nIntegrations(n8nTemplate: any): string[] {
    const integrations = new Set<string>();
    
    if (n8nTemplate.nodes) {
      n8nTemplate.nodes.forEach((node: any) => {
        if (node.type && node.type.includes('.')) {
          const app = node.type.split('.').pop();
          if (app && app !== 'base') {
            integrations.add(app.toLowerCase());
          }
        }
      });
    }
    
    return Array.from(integrations);
  }

  private generateTags(name: string, description: string): string[] {
    const text = `${name} ${description}`.toLowerCase();
    const tags: string[] = [];
    
    const keywords = [
      'automation', 'workflow', 'integration', 'email', 'crm', 'sales',
      'marketing', 'finance', 'customer', 'support', 'operations',
      'notification', 'sync', 'data', 'report', 'analytics'
    ];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(
    category?: string,
    source?: string,
    userId?: string
  ): Promise<AutomationTemplate[]> {
    let query = supabase.from('automation_templates').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (source) {
      query = query.eq('source', source);
    }
    
    const { data, error } = await query.order('downloads', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Deploy template as active workflow
   */
  async deployTemplate(
    templateId: string,
    customizations: Record<string, any> = {},
    userId: string
  ): Promise<TemplateImportResult> {
    try {
      const { data: template, error } = await supabase
        .from('automation_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        throw new Error('Template not found');
      }

      // Apply customizations to the workflow
      let workflowDefinition = template.nexus_workflow;
      if (customizations && Object.keys(customizations).length > 0) {
        workflowDefinition = this.applyCustomizations(workflowDefinition, customizations);
      }

      // Deploy to n8n
      const deployResult = await this.n8nBuilder.createWorkflow(workflowDefinition);
      
      if (deployResult.success) {
        // Update download count
        await supabase
          .from('automation_templates')
          .update({ downloads: template.downloads + 1 })
          .eq('id', templateId);

        // Log deployment
        await supabase
          .from('template_deployments')
          .insert({
            template_id: templateId,
            user_id: userId,
            workflow_id: deployResult.workflowId,
            customizations,
            deployed_at: new Date().toISOString()
          });

        return {
          success: true,
          templateId,
          nexusWorkflowId: deployResult.workflowId,
          conversionNotes: ['Template deployed successfully']
        };
      } else {
        throw new Error(deployResult.error || 'Deployment failed');
      }

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  private applyCustomizations(workflow: any, customizations: Record<string, any>): any {
    // Apply user customizations to the workflow definition
    const customizedWorkflow = JSON.parse(JSON.stringify(workflow));
    
    // Apply customizations to nodes
    if (customizedWorkflow.nodes) {
      customizedWorkflow.nodes.forEach((node: any) => {
        if (customizations[node.name]) {
          node.parameters = { ...node.parameters, ...customizations[node.name] };
        }
      });
    }
    
    return customizedWorkflow;
  }
}

export const automationTemplateImporter = new AutomationTemplateImporter(); 