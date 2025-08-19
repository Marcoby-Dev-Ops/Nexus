/**
 * Building Blocks Service
 * 
 * Manages the 7 irreducible building blocks that compose any business
 * and provides mapping between user priorities and specific building blocks
 * for contextual AI insights generation
 */

export interface BuildingBlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: number;
  tools: Tool[];
  keyMetrics: string[];
  improvementAreas: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface PriorityBuildingBlockMapping {
  priority: string;
  buildingBlocks: {
    blockId: string;
    relevance: number; // 0-100
    specificFocus: string;
  }[];
}

export class BuildingBlocksService {
  /**
   * The 7 irreducible building blocks that compose any business
   */
  public static readonly BUILDING_BLOCKS: BuildingBlock[] = [
    {
      id: 'identity',
      name: 'Identity',
      description: 'Who you are, your mission, vision, values, and brand',
      icon: '🏢',
      priority: 1,
      keyMetrics: ['brand recognition', 'brand consistency', 'value proposition clarity'],
      improvementAreas: ['brand identity', 'mission clarity', 'value proposition', 'brand positioning'],
      tools: [
        { id: 'canva', name: 'Canva', description: 'Design and branding tools' },
        { id: 'figma', name: 'Figma', description: 'Design and prototyping' },
        { id: 'wordpress', name: 'WordPress', description: 'Website platform' },
        { id: 'wix', name: 'Wix', description: 'Website builder' },
        { id: 'squarespace', name: 'Squarespace', description: 'Website and e-commerce' },
        { id: 'shopify', name: 'Shopify', description: 'E-commerce platform' },
        { id: 'ghost', name: 'Ghost', description: 'Content management platform' }
      ]
    },
    {
      id: 'revenue',
      name: 'Revenue',
      description: 'Sales, marketing, customer acquisition, and monetization',
      icon: '💰',
      priority: 2,
      keyMetrics: ['revenue growth', 'customer acquisition cost', 'lifetime value', 'conversion rates'],
      improvementAreas: ['sales process', 'marketing efficiency', 'pricing strategy', 'customer acquisition'],
      tools: [
        { id: 'hubspot', name: 'HubSpot', description: 'CRM and marketing automation' },
        { id: 'salesforce', name: 'Salesforce', description: 'CRM platform' },
        { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing' },
        { id: 'stripe', name: 'Stripe', description: 'Payment processing' },
        { id: 'paypal', name: 'PayPal', description: 'Payment solutions' },
        { id: 'square', name: 'Square', description: 'Point of sale and payments' },
        { id: 'constant-contact', name: 'Constant Contact', description: 'Email marketing' }
      ]
    },
    {
      id: 'delivery',
      name: 'Delivery',
      description: 'Products, services, operations, logistics, and fulfillment',
      icon: '📦',
      priority: 3,
      keyMetrics: ['delivery time', 'quality scores', 'operational efficiency', 'customer satisfaction'],
      improvementAreas: ['process optimization', 'quality control', 'logistics efficiency', 'fulfillment speed'],
      tools: [
        { id: 'asana', name: 'Asana', description: 'Project management' },
        { id: 'trello', name: 'Trello', description: 'Task management' },
        { id: 'monday', name: 'Monday.com', description: 'Work management' },
        { id: 'clickup', name: 'ClickUp', description: 'Project management' },
        { id: 'jira', name: 'Jira', description: 'Project and issue tracking' },
        { id: 'notion', name: 'Notion', description: 'Workspace and docs' },
        { id: 'airtable', name: 'Airtable', description: 'Database and workflow' },
        { id: 'github', name: 'GitHub', description: 'Code repository and project management' },
        { id: 'shipstation', name: 'ShipStation', description: 'Shipping management' }
      ]
    },
    {
      id: 'people',
      name: 'People',
      description: 'Team, talent, culture, and human resources',
      icon: '👥',
      priority: 4,
      keyMetrics: ['employee satisfaction', 'productivity', 'retention rate', 'team performance'],
      improvementAreas: ['team collaboration', 'talent acquisition', 'performance management', 'culture building'],
      tools: [
        { id: 'slack', name: 'Slack', description: 'Team communication' },
        { id: 'microsoft-teams', name: 'Microsoft Teams', description: 'Collaboration platform' },
        { id: 'zoom', name: 'Zoom', description: 'Video conferencing' },
        { id: 'bamboohr', name: 'BambooHR', description: 'HR management' },
        { id: 'workday', name: 'Workday', description: 'Human capital management' },
        { id: 'gusto', name: 'Gusto', description: 'Payroll and HR' },
        { id: 'lattice', name: 'Lattice', description: 'Performance management' }
      ]
    },
    {
      id: 'money',
      name: 'Money',
      description: 'Finance, accounting, cash flow, and resource allocation',
      icon: '📊',
      priority: 5,
      keyMetrics: ['cash flow', 'profit margins', 'financial health', 'budget variance'],
      improvementAreas: ['cash flow management', 'cost control', 'financial planning', 'budget optimization'],
      tools: [
        { id: 'quickbooks', name: 'QuickBooks', description: 'Accounting software' },
        { id: 'xero', name: 'Xero', description: 'Cloud accounting' },
        { id: 'freshbooks', name: 'FreshBooks', description: 'Invoicing and accounting' },
        { id: 'wave', name: 'Wave', description: 'Free accounting software' },
        { id: 'sage', name: 'Sage', description: 'Business management software' },
        { id: 'netsuite', name: 'NetSuite', description: 'ERP and financial management' }
      ]
    },
    {
      id: 'knowledge',
      name: 'Knowledge',
      description: 'Data, insights, learning, and intellectual property',
      icon: '🧠',
      priority: 6,
      keyMetrics: ['data accuracy', 'knowledge sharing', 'learning velocity', 'insight generation'],
      improvementAreas: ['data management', 'knowledge capture', 'analytics capability', 'learning systems'],
      tools: [
        { id: 'google-analytics', name: 'Google Analytics', description: 'Web analytics' },
        { id: 'tableau', name: 'Tableau', description: 'Data visualization' },
        { id: 'power-bi', name: 'Power BI', description: 'Business intelligence' },
        { id: 'confluence', name: 'Confluence', description: 'Knowledge management' },
        { id: 'sharepoint', name: 'SharePoint', description: 'Document management' },
        { id: 'dropbox', name: 'Dropbox', description: 'File storage and sharing' },
        { id: 'onedrive', name: 'OneDrive', description: 'Cloud storage' }
      ]
    },
    {
      id: 'governance',
      name: 'Governance',
      description: 'Leadership, decision-making, compliance, and oversight',
      icon: '⚖️',
      priority: 7,
      keyMetrics: ['decision speed', 'compliance score', 'governance effectiveness', 'risk management'],
      improvementAreas: ['decision processes', 'compliance management', 'risk mitigation', 'governance structure'],
      tools: [
        { id: 'microsoft365', name: 'Microsoft 365', description: 'Productivity and business applications' },
        { id: 'docusign', name: 'DocuSign', description: 'Electronic signatures' },
        { id: 'adobe-sign', name: 'Adobe Sign', description: 'Digital document signing' },
        { id: 'okta', name: 'Okta', description: 'Identity and access management' },
        { id: 'servicenow', name: 'ServiceNow', description: 'IT service management' }
      ]
    }
  ];

  /**
   * Maps user priorities to relevant building blocks
   */
  public static readonly PRIORITY_BUILDING_BLOCK_MAPPINGS: PriorityBuildingBlockMapping[] = [
    {
      priority: 'Increase revenue',
      buildingBlocks: [
        { blockId: 'revenue', relevance: 95, specificFocus: 'sales optimization and customer acquisition' },
        { blockId: 'identity', relevance: 80, specificFocus: 'brand positioning and value proposition' },
        { blockId: 'delivery', relevance: 70, specificFocus: 'product quality and customer experience' },
        { blockId: 'knowledge', relevance: 60, specificFocus: 'customer insights and market analytics' }
      ]
    },
    {
      priority: 'Improve efficiency',
      buildingBlocks: [
        { blockId: 'delivery', relevance: 95, specificFocus: 'process automation and workflow optimization' },
        { blockId: 'people', relevance: 85, specificFocus: 'team productivity and collaboration' },
        { blockId: 'knowledge', relevance: 75, specificFocus: 'data-driven decision making' },
        { blockId: 'governance', relevance: 65, specificFocus: 'streamlined decision processes' }
      ]
    },
    {
      priority: 'Better customer insights',
      buildingBlocks: [
        { blockId: 'knowledge', relevance: 95, specificFocus: 'customer data analytics and insights' },
        { blockId: 'revenue', relevance: 85, specificFocus: 'customer behavior and sales analytics' },
        { blockId: 'delivery', relevance: 70, specificFocus: 'customer feedback and satisfaction metrics' },
        { blockId: 'identity', relevance: 60, specificFocus: 'brand perception and customer alignment' }
      ]
    },
    {
      priority: 'Automate processes',
      buildingBlocks: [
        { blockId: 'delivery', relevance: 95, specificFocus: 'workflow automation and process digitization' },
        { blockId: 'money', relevance: 80, specificFocus: 'financial process automation' },
        { blockId: 'people', relevance: 75, specificFocus: 'HR and administrative automation' },
        { blockId: 'governance', relevance: 70, specificFocus: 'compliance and approval automation' }
      ]
    },
    {
      priority: 'Scale operations',
      buildingBlocks: [
        { blockId: 'delivery', relevance: 95, specificFocus: 'scalable operations and infrastructure' },
        { blockId: 'people', relevance: 90, specificFocus: 'team scaling and organizational structure' },
        { blockId: 'money', relevance: 85, specificFocus: 'financial planning for growth' },
        { blockId: 'governance', relevance: 75, specificFocus: 'scalable governance and decision frameworks' }
      ]
    },
    {
      priority: 'Reduce costs',
      buildingBlocks: [
        { blockId: 'money', relevance: 95, specificFocus: 'cost analysis and budget optimization' },
        { blockId: 'delivery', relevance: 85, specificFocus: 'operational efficiency and waste reduction' },
        { blockId: 'people', relevance: 75, specificFocus: 'productivity optimization and resource allocation' },
        { blockId: 'knowledge', relevance: 70, specificFocus: 'cost analytics and spending insights' }
      ]
    },
    {
      priority: 'Improve team collaboration',
      buildingBlocks: [
        { blockId: 'people', relevance: 95, specificFocus: 'team communication and collaboration tools' },
        { blockId: 'knowledge', relevance: 80, specificFocus: 'knowledge sharing and documentation' },
        { blockId: 'delivery', relevance: 75, specificFocus: 'collaborative workflows and project management' },
        { blockId: 'governance', relevance: 65, specificFocus: 'team governance and decision frameworks' }
      ]
    },
    {
      priority: 'Better decision making',
      buildingBlocks: [
        { blockId: 'knowledge', relevance: 95, specificFocus: 'data analytics and business intelligence' },
        { blockId: 'governance', relevance: 90, specificFocus: 'decision frameworks and processes' },
        { blockId: 'money', relevance: 80, specificFocus: 'financial insights for decision making' },
        { blockId: 'people', relevance: 70, specificFocus: 'team input and collaborative decision making' }
      ]
    }
  ];

  /**
   * Get building block by ID
   */
  static getBuildingBlock(id: string): BuildingBlock | undefined {
    return this.BUILDING_BLOCKS.find(block => block.id === id);
  }

  /**
   * Get all building blocks
   */
  static getAllBuildingBlocks(): BuildingBlock[] {
    return this.BUILDING_BLOCKS;
  }

  /**
   * Map user priorities to relevant building blocks
   */
  static mapPrioritiesToBuildingBlocks(priorities: string[]): {
    priority: string;
    buildingBlocks: {
      block: BuildingBlock;
      relevance: number;
      specificFocus: string;
    }[];
  }[] {
    return priorities.map(priority => {
      const mapping = this.PRIORITY_BUILDING_BLOCK_MAPPINGS.find(m => m.priority === priority);
      
      if (!mapping) {
        // Default mapping for unknown priorities
        return {
          priority,
          buildingBlocks: this.BUILDING_BLOCKS.slice(0, 3).map(block => ({
            block,
            relevance: 50,
            specificFocus: 'general business improvement'
          }))
        };
      }

      return {
        priority,
        buildingBlocks: mapping.buildingBlocks
          .map(bb => {
            const block = this.getBuildingBlock(bb.blockId);
            return block ? {
              block,
              relevance: bb.relevance,
              specificFocus: bb.specificFocus
            } : null;
          })
          .filter(Boolean) as {
            block: BuildingBlock;
            relevance: number;
            specificFocus: string;
          }[]
      };
    });
  }

  /**
   * Generate building block context for AI insights
   */
  static generateBuildingBlockContext(priorities: string[], selectedTools: Record<string, string[]>): {
    contextualFocus: string[];
    relevantBlocks: BuildingBlock[];
    toolGaps: {
      blockId: string;
      blockName: string;
      missingTools: Tool[];
      coverage: number;
    }[];
  } {
    const priorityMappings = this.mapPrioritiesToBuildingBlocks(priorities);
    
    // Extract contextual focus areas
    const contextualFocus = priorityMappings.flatMap(pm => 
      pm.buildingBlocks.map(bb => bb.specificFocus)
    );

    // Get relevant building blocks (sorted by cumulative relevance)
    const blockRelevance = new Map<string, number>();
    priorityMappings.forEach(pm => {
      pm.buildingBlocks.forEach(bb => {
        const current = blockRelevance.get(bb.block.id) || 0;
        blockRelevance.set(bb.block.id, current + bb.relevance);
      });
    });

    const relevantBlocks = Array.from(blockRelevance.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([blockId]) => this.getBuildingBlock(blockId))
      .filter(Boolean) as BuildingBlock[];

    // Identify tool gaps
    const toolGaps = relevantBlocks.map(block => {
      const blockTools = block.tools;
      const selectedToolsFlat = Object.values(selectedTools).flat();
      const availableTools = blockTools.filter(tool => 
        selectedToolsFlat.includes(tool.id)
      );
      const missingTools = blockTools.filter(tool => 
        !selectedToolsFlat.includes(tool.id)
      );
      
      return {
        blockId: block.id,
        blockName: block.name,
        missingTools,
        coverage: (availableTools.length / blockTools.length) * 100
      };
    });

    return {
      contextualFocus,
      relevantBlocks,
      toolGaps
    };
  }

  /**
   * Generate building block-aware AI prompt context
   */
  static generateAIPromptContext(
    priorities: string[],
    selectedTools: Record<string, string[]>,
    industry: string,
    companySize: string
  ): string {
    const context = this.generateBuildingBlockContext(priorities, selectedTools);
    
    const priorityContext = priorities.map(priority => {
      const mapping = this.mapPrioritiesToBuildingBlocks([priority])[0];
      return `${priority}: Focus on ${mapping.buildingBlocks[0]?.specificFocus || 'general improvement'}`;
    }).join('. ');

    const toolGapsContext = context.toolGaps
      .filter(gap => gap.coverage < 70)
      .map(gap => `${gap.blockName}: ${gap.coverage.toFixed(0)}% tool coverage`)
      .join(', ');

    return `
BUSINESS BUILDING BLOCKS CONTEXT:
User's key priorities: ${priorityContext}

Most relevant building blocks for their priorities:
${context.relevantBlocks.slice(0, 3).map(block => 
  `- ${block.name}: ${block.description}`
).join('\n')}

Tool coverage gaps to address: ${toolGapsContext || 'Good coverage across all areas'}

Industry context: ${industry} (${companySize})

Generate insights that specifically address their priority-driven building block needs, focusing on the contextual areas identified above. Prioritize recommendations that strengthen the most relevant building blocks for their stated priorities.
    `.trim();
  }
}
