/**
 * Nexus Module Registry
 * 
 * Central registry for all Nexus modules to prevent duplication,
 * track capabilities, and manage module lifecycle.
 */

export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  category: 'data_analysis' | 'prediction' | 'automation' | 'integration' | 'reporting' | 'intelligence';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  dependencies: string[];
}

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  department: string;
  status: 'planned' | 'development' | 'testing' | 'active' | 'deprecated';
  capabilities: ModuleCapability[];
  integrations: string[];
  dataStructures: string[];
  impactMap: string[];
  cascadeEffects: string[];
  createdAt: Date;
  lastUpdated: Date;
  maintainer: string;
  documentation: string;
  testCoverage: number;
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    resourceUsage: 'low' | 'medium' | 'high';
  };
}

export interface TrinityBrainCapabilities {
  think: {
    predictiveAnalysis: boolean;
    patternRecognition: boolean;
    trendForecasting: boolean;
    riskAssessment: boolean;
    opportunityIdentification: boolean;
  };
  see: {
    realTimeMonitoring: boolean;
    anomalyDetection: boolean;
    crossDepartmentalVisibility: boolean;
    contextualAwareness: boolean;
    environmentalScanning: boolean;
  };
  act: {
    proactiveRecommendations: boolean;
    automatedActions: boolean;
    adaptiveResponses: boolean;
    preventiveMeasures: boolean;
    opportunityCapture: boolean;
  };
}

class ModuleRegistry {
  private modules: Map<string, ModuleMetadata> = new Map();
  private capabilities: Map<string, string[]> = new Map(); // capability -> modules that provide it
  private duplicateCheck: Map<string, string[]> = new Map(); // functionality -> modules

  /**
   * Register a new module
   */
  registerModule(metadata: ModuleMetadata): void {
    // Check for duplicates
    this.checkForDuplicates(metadata);
    
    // Register the module
    this.modules.set(metadata.id, metadata);
    
    // Index capabilities
    this.indexCapabilities(metadata);
    
    console.log(`✅ Module registered: ${metadata.name} (${metadata.id})`);
  }

  /**
   * Check for duplicate functionality
   */
  private checkForDuplicates(metadata: ModuleMetadata): void {
    const duplicates: string[] = [];
    
    metadata.capabilities.forEach(capability => {
      const existingModules = this.capabilities.get(capability.id) || [];
      if (existingModules.length > 0) {
        duplicates.push(`${capability.name} (conflicts with: ${existingModules.join(', ')})`);
      }
    });

    if (duplicates.length > 0) {
      console.warn(`⚠️  Potential duplicates detected for ${metadata.name}:`);
      duplicates.forEach(dup => console.warn(`   - ${dup}`));
    }
  }

  /**
   * Index module capabilities
   */
  private indexCapabilities(metadata: ModuleMetadata): void {
    metadata.capabilities.forEach(capability => {
      const existing = this.capabilities.get(capability.id) || [];
      existing.push(metadata.id);
      this.capabilities.set(capability.id, existing);
    });
  }

  /**
   * Get module by ID
   */
  getModule(id: string): ModuleMetadata | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all modules
   */
  getAllModules(): ModuleMetadata[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by department
   */
  getModulesByDepartment(department: string): ModuleMetadata[] {
    return this.getAllModules().filter(module => module.department === department);
  }

  /**
   * Get modules by capability
   */
  getModulesByCapability(capabilityId: string): ModuleMetadata[] {
    const moduleIds = this.capabilities.get(capabilityId) || [];
    return moduleIds.map(id => this.modules.get(id)!).filter(Boolean);
  }

  /**
   * Get module statistics
   */
  getStatistics(): {
    totalModules: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    totalCapabilities: number;
    averageTestCoverage: number;
  } {
    const modules = this.getAllModules();
    
    return {
      totalModules: modules.length,
      byStatus: this.groupBy(modules, 'status'),
      byDepartment: this.groupBy(modules, 'department'),
      totalCapabilities: this.capabilities.size,
      averageTestCoverage: modules.reduce((sum, m) => sum + m.testCoverage, 0) / modules.length
    };
  }

  private groupBy(items: ModuleMetadata[], key: keyof ModuleMetadata): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Find gaps in functionality
   */
  findGaps(requiredCapabilities: string[]): string[] {
    return requiredCapabilities.filter(cap => !this.capabilities.has(cap));
  }

  /**
   * Suggest module improvements
   */
  suggestImprovements(): Array<{
    moduleId: string;
    suggestions: string[];
    priority: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      moduleId: string;
      suggestions: string[];
      priority: 'low' | 'medium' | 'high';
    }> = [];

    this.getAllModules().forEach(module => {
      const moduleSuggestions: string[] = [];
      let priority: 'low' | 'medium' | 'high' = 'low';

      // Test coverage suggestions
      if (module.testCoverage < 80) {
        moduleSuggestions.push(`Increase test coverage from ${module.testCoverage}% to 80%+`);
        priority = 'high';
      }

      // Performance suggestions
      if (module.performanceMetrics.averageResponseTime > 1000) {
        moduleSuggestions.push(`Improve response time from ${module.performanceMetrics.averageResponseTime}ms`);
        priority = 'medium';
      }

      // Documentation suggestions
      if (!module.documentation || module.documentation.length < 100) {
        moduleSuggestions.push('Add comprehensive documentation');
        priority = 'medium';
      }

      if (moduleSuggestions.length > 0) {
        suggestions.push({
          moduleId: module.id,
          suggestions: moduleSuggestions,
          priority
        });
      }
    });

    return suggestions;
  }
}

// Global registry instance
export const moduleRegistry = new ModuleRegistry();

// Initialize with existing modules
export const initializeModuleRegistry = () => {
  // Sales Module
  moduleRegistry.registerModule({
    id: 'sales-module',
    name: 'Sales Intelligence Module',
    version: '1.0.0',
    description: 'Comprehensive sales intelligence with Trinity Brain capabilities for predictive revenue generation',
    department: 'sales',
    status: 'development',
    capabilities: [
      {
        id: 'pipeline-analysis',
        name: 'Pipeline Analysis',
        description: 'Advanced pipeline health analysis and forecasting',
        category: 'data_analysis',
        complexity: 'advanced',
        dependencies: []
      },
      {
        id: 'deal-prediction',
        name: 'Deal Prediction',
        description: 'AI-powered deal outcome prediction and optimization',
        category: 'prediction',
        complexity: 'expert',
        dependencies: ['pipeline-analysis']
      },
      {
        id: 'revenue-forecasting',
        name: 'Revenue Forecasting',
        description: 'Multi-dimensional revenue forecasting with confidence intervals',
        category: 'prediction',
        complexity: 'advanced',
        dependencies: ['pipeline-analysis', 'deal-prediction']
      },
      {
        id: 'proactive-outreach',
        name: 'Proactive Outreach',
        description: 'Automated proactive customer outreach based on behavioral triggers',
        category: 'automation',
        complexity: 'expert',
        dependencies: ['deal-prediction']
      },
      {
        id: 'competitive-intelligence',
        name: 'Competitive Intelligence',
        description: 'Real-time competitive analysis and positioning recommendations',
        category: 'intelligence',
        complexity: 'advanced',
        dependencies: []
      }
    ],
    integrations: ['marketing', 'finance', 'operations', 'customer-success', 'product'],
    dataStructures: ['SalesData', 'DealData', 'CustomerData', 'PipelineData'],
    impactMap: ['marketing', 'finance', 'operations', 'customer-success', 'hr', 'product'],
    cascadeEffects: ['deal-closure', 'pipeline-velocity', 'quota-achievement'],
    createdAt: new Date(),
    lastUpdated: new Date(),
    maintainer: 'Sales Intelligence Team',
    documentation: 'docs/modules/sales-module.md',
    testCoverage: 85,
    performanceMetrics: {
      averageResponseTime: 450,
      successRate: 0.97,
      resourceUsage: 'medium'
    }
  });

  // Product Development Module
  moduleRegistry.registerModule({
    id: 'product-development-module',
    name: 'Product Development Intelligence',
    version: '1.0.0',
    description: 'Product strategy and development intelligence with user-centric insights',
    department: 'product',
    status: 'active',
    capabilities: [
      {
        id: 'feature-adoption-analysis',
        name: 'Feature Adoption Analysis',
        description: 'Track and analyze feature adoption patterns',
        category: 'data_analysis',
        complexity: 'intermediate',
        dependencies: []
      },
      {
        id: 'user-behavior-prediction',
        name: 'User Behavior Prediction',
        description: 'Predict user behavior and feature usage patterns',
        category: 'prediction',
        complexity: 'advanced',
        dependencies: ['feature-adoption-analysis']
      },
      {
        id: 'roadmap-optimization',
        name: 'Roadmap Optimization',
        description: 'AI-powered product roadmap prioritization',
        category: 'intelligence',
        complexity: 'expert',
        dependencies: ['user-behavior-prediction']
      }
    ],
    integrations: ['sales', 'marketing', 'operations', 'customer-success', 'engineering'],
    dataStructures: ['ProductDevelopmentData', 'FeatureData', 'UserMetrics'],
    impactMap: ['sales', 'marketing', 'operations', 'customer-success', 'finance', 'hr'],
    cascadeEffects: ['product-launch', 'roadmap-shift', 'feature-adoption'],
    createdAt: new Date(),
    lastUpdated: new Date(),
    maintainer: 'Product Intelligence Team',
    documentation: 'docs/modules/product-development-module.md',
    testCoverage: 78,
    performanceMetrics: {
      averageResponseTime: 320,
      successRate: 0.94,
      resourceUsage: 'low'
    }
  });

  // Marketing Module
  moduleRegistry.registerModule({
    id: 'marketing-module',
    name: 'Marketing Intelligence Engine',
    version: '1.0.0',
    description: 'Comprehensive marketing intelligence and campaign optimization',
    department: 'marketing',
    status: 'development',
    capabilities: [
      {
        id: 'campaign-optimization',
        name: 'Campaign Optimization',
        description: 'Real-time campaign performance optimization',
        category: 'automation',
        complexity: 'advanced',
        dependencies: []
      },
      {
        id: 'lead-scoring',
        name: 'Lead Scoring',
        description: 'AI-powered lead quality scoring and prioritization',
        category: 'intelligence',
        complexity: 'advanced',
        dependencies: []
      },
      {
        id: 'attribution-modeling',
        name: 'Attribution Modeling',
        description: 'Multi-touch attribution analysis across channels',
        category: 'data_analysis',
        complexity: 'expert',
        dependencies: ['campaign-optimization']
      }
    ],
    integrations: ['sales', 'finance', 'product', 'customer-success'],
    dataStructures: ['MarketingData', 'CampaignData', 'LeadData'],
    impactMap: ['sales', 'finance', 'product', 'customer-success'],
    cascadeEffects: ['campaign-launch', 'lead-generation', 'brand-awareness'],
    createdAt: new Date(),
    lastUpdated: new Date(),
    maintainer: 'Marketing Intelligence Team',
    documentation: 'docs/modules/marketing-module.md',
    testCoverage: 72,
    performanceMetrics: {
      averageResponseTime: 380,
      successRate: 0.92,
      resourceUsage: 'medium'
    }
  });

  console.log('📋 Module Registry initialized with existing modules');
};

// Trinity Brain System capabilities for each module
export const TRINITY_BRAIN_CAPABILITIES: Record<string, TrinityBrainCapabilities> = {
  'sales-module': {
    think: {
      predictiveAnalysis: true,
      patternRecognition: true,
      trendForecasting: true,
      riskAssessment: true,
      opportunityIdentification: true
    },
    see: {
      realTimeMonitoring: true,
      anomalyDetection: true,
      crossDepartmentalVisibility: true,
      contextualAwareness: true,
      environmentalScanning: true
    },
    act: {
      proactiveRecommendations: true,
      automatedActions: true,
      adaptiveResponses: true,
      preventiveMeasures: true,
      opportunityCapture: true
    }
  },
  'product-development-module': {
    think: {
      predictiveAnalysis: true,
      patternRecognition: true,
      trendForecasting: true,
      riskAssessment: true,
      opportunityIdentification: true
    },
    see: {
      realTimeMonitoring: true,
      anomalyDetection: true,
      crossDepartmentalVisibility: true,
      contextualAwareness: true,
      environmentalScanning: false
    },
    act: {
      proactiveRecommendations: true,
      automatedActions: false,
      adaptiveResponses: true,
      preventiveMeasures: true,
      opportunityCapture: true
    }
  },
  'marketing-module': {
    think: {
      predictiveAnalysis: true,
      patternRecognition: true,
      trendForecasting: true,
      riskAssessment: true,
      opportunityIdentification: true
    },
    see: {
      realTimeMonitoring: true,
      anomalyDetection: true,
      crossDepartmentalVisibility: true,
      contextualAwareness: true,
      environmentalScanning: true
    },
    act: {
      proactiveRecommendations: true,
      automatedActions: true,
      adaptiveResponses: true,
      preventiveMeasures: true,
      opportunityCapture: true
    }
  }
};

// Initialize on module load
initializeModuleRegistry(); 