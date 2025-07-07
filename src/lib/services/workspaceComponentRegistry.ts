import type { ComponentType } from 'react';

// Component metadata interface
export interface ComponentMetadata {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: string; // Icon name for lucide-react
  version: string;
  author: string;
  component: ComponentType<any>;
  defaultProps?: Record<string, any>;
  configSchema?: ConfigSchema;
  size: ComponentSize;
  tags: string[];
  premium?: boolean;
  dependencies?: string[];
  permissions?: string[];
  dataRequirements?: DataRequirement[];
  performance?: PerformanceMetrics;
  accessibility?: AccessibilityFeatures;
  responsive?: ResponsiveBreakpoints;
}

export type ComponentCategory = 
  | 'productivity' 
  | 'analytics' 
  | 'communication' 
  | 'ai' 
  | 'business' 
  | 'finance'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'hr'
  | 'custom';

export type ComponentSize = 'small' | 'medium' | 'large' | 'extra-large' | 'full-width';

export interface ConfigSchema {
  properties: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multi-select' | 'color' | 'date' | 'json';
  label: string;
  description?: string;
  default?: any;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };
}

export interface DataRequirement {
  source: string;
  type: 'api' | 'database' | 'file' | 'integration';
  required: boolean;
  description: string;
}

export interface PerformanceMetrics {
  initialLoadTime: number; // milliseconds
  memoryUsage: number; // MB
  apiCalls: number;
  updateFrequency: number; // seconds
}

export interface AccessibilityFeatures {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  focusManagement: boolean;
  ariaLabels: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  ultrawide: boolean;
}

// Workspace layout interfaces
export interface WorkspaceLayout {
  id: string;
  name: string;
  description: string;
  components: LayoutComponent[];
  author: string;
  isPublic: boolean;
  tags: string[];
  templateType?: WorkspaceTemplate;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  permissions?: LayoutPermissions;
  theme?: WorkspaceTheme;
}

export interface LayoutComponent {
  id: string;
  componentId: string;
  position: GridPosition;
  size: GridSize;
  config: Record<string, any>;
  visible: boolean;
  locked?: boolean;
  zIndex?: number;
  animations?: ComponentAnimation[];
}

export interface GridPosition {
  x: number;
  y: number;
  row?: number;
  col?: number;
}

export interface GridSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ComponentAnimation {
  type: 'fade' | 'slide' | 'scale' | 'bounce';
  duration: number;
  delay?: number;
  trigger: 'load' | 'hover' | 'click' | 'scroll';
}

export interface LayoutPermissions {
  view: string[];
  edit: string[];
  share: string[];
  delete: string[];
}

export interface WorkspaceTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  spacing: {
    base: number;
    scale: number;
  };
}

export type WorkspaceTemplate = 
  | 'executive-dashboard'
  | 'sales-workspace'
  | 'marketing-hub'
  | 'developer-console'
  | 'hr-dashboard'
  | 'finance-center'
  | 'operations-control'
  | 'customer-success'
  | 'blank';

// Component Registry Service
class WorkspaceComponentRegistryService {
  private components: Map<string, ComponentMetadata> = new Map();
  private layouts: Map<string, WorkspaceLayout> = new Map();
  private templates: Map<WorkspaceTemplate, WorkspaceLayout> = new Map();

  // Component Management
  registerComponent(metadata: ComponentMetadata): void {
    // Validate component metadata
    if (!this.validateComponentMetadata(metadata)) {
      throw new Error(`Invalid component metadata for ${metadata.id}`);
    }

    this.components.set(metadata.id, metadata);
  }

  unregisterComponent(componentId: string): void {
    this.components.delete(componentId);
  }

  getComponent(componentId: string): ComponentMetadata | undefined {
    return this.components.get(componentId);
  }

  getAllComponents(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  getComponentsByCategory(category: ComponentCategory): ComponentMetadata[] {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  searchComponents(query: string): ComponentMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllComponents().filter(comp => 
      comp.name.toLowerCase().includes(lowercaseQuery) ||
      comp.description.toLowerCase().includes(lowercaseQuery) ||
      comp.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getComponentsByTags(tags: string[]): ComponentMetadata[] {
    return this.getAllComponents().filter(comp =>
      tags.some(tag => comp.tags.includes(tag))
    );
  }

  // Layout Management
  saveLayout(layout: WorkspaceLayout): void {
    // Validate layout
    if (!this.validateLayout(layout)) {
      throw new Error(`Invalid layout: ${layout.id}`);
    }

    layout.updatedAt = new Date();
    this.layouts.set(layout.id, layout);
    
    // Persist to storage
    this.persistLayout(layout);
  }

  getLayout(layoutId: string): WorkspaceLayout | undefined {
    return this.layouts.get(layoutId);
  }

  getAllLayouts(): WorkspaceLayout[] {
    return Array.from(this.layouts.values());
  }

  getUserLayouts(userId: string): WorkspaceLayout[] {
    return this.getAllLayouts().filter(layout => layout.author === userId);
  }

  getPublicLayouts(): WorkspaceLayout[] {
    return this.getAllLayouts().filter(layout => layout.isPublic);
  }

  deleteLayout(layoutId: string): void {
    this.layouts.delete(layoutId);
    this.removePersistedLayout(layoutId);
  }

  // Template Management
  registerTemplate(template: WorkspaceTemplate, layout: WorkspaceLayout): void {
    this.templates.set(template, layout);
  }

  getTemplate(template: WorkspaceTemplate): WorkspaceLayout | undefined {
    return this.templates.get(template);
  }

  getAllTemplates(): Map<WorkspaceTemplate, WorkspaceLayout> {
    return new Map(this.templates);
  }

  createFromTemplate(template: WorkspaceTemplate, customizations?: Partial<WorkspaceLayout>): WorkspaceLayout {
    const baseLayout = this.getTemplate(template);
    if (!baseLayout) {
      throw new Error(`Template ${template} not found`);
    }

    const newLayout: WorkspaceLayout = {
      ...baseLayout,
      id: `layout-${Date.now()}`,
      name: customizations?.name || `${baseLayout.name} Copy`,
      description: customizations?.description || baseLayout.description,
      author: customizations?.author || 'Unknown',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      ...customizations
    };

    return newLayout;
  }

  // Validation
  private validateComponentMetadata(metadata: ComponentMetadata): boolean {
    return !!(
      metadata.id &&
      metadata.name &&
      metadata.description &&
      metadata.category &&
      metadata.component &&
      metadata.version &&
      metadata.author
    );
  }

  private validateLayout(layout: WorkspaceLayout): boolean {
    // Check required fields
    if (!layout.id || !layout.name || !layout.author) {
      return false;
    }

    // Validate components exist
    for (const component of layout.components) {
      if (!this.components.has(component.componentId)) {
        console.warn(`Component ${component.componentId} not found in registry`);
        return false;
      }
    }

    return true;
  }

  // Persistence
  private persistLayout(layout: WorkspaceLayout): void {
    try {
      const savedLayouts = this.loadPersistedLayouts();
      savedLayouts[layout.id] = layout;
      localStorage.setItem('nexus-workspace-layouts', JSON.stringify(savedLayouts));
    } catch (error) {
      console.error('Failed to persist layout:', error);
    }
  }

  private loadPersistedLayouts(): Record<string, WorkspaceLayout> {
    try {
      const saved = localStorage.getItem('nexus-workspace-layouts');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load persisted layouts:', error);
      return {};
    }
  }

  private removePersistedLayout(layoutId: string): void {
    try {
      const savedLayouts = this.loadPersistedLayouts();
      delete savedLayouts[layoutId];
      localStorage.setItem('nexus-workspace-layouts', JSON.stringify(savedLayouts));
    } catch (error) {
      console.error('Failed to remove persisted layout:', error);
    }
  }

  // Initialize with persisted data
  initializeFromStorage(): void {
    try {
      const savedLayouts = this.loadPersistedLayouts();
      Object.values(savedLayouts).forEach(layout => {
        this.layouts.set(layout.id, layout);
      });
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
    }
  }

  // Component Dependencies
  getComponentDependencies(componentId: string): string[] {
    const component = this.getComponent(componentId);
    return component?.dependencies || [];
  }

  validateDependencies(componentIds: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    const allDeps = new Set<string>();

    // Collect all dependencies
    componentIds.forEach(id => {
      const deps = this.getComponentDependencies(id);
      deps.forEach(dep => allDeps.add(dep));
    });

    // Check if dependencies are available
    allDeps.forEach(dep => {
      if (!componentIds.includes(dep) && !this.components.has(dep)) {
        missing.push(dep);
      }
    });

    return { valid: missing.length === 0, missing };
  }

  // Performance Analysis
  analyzeLayoutPerformance(layout: WorkspaceLayout): {
    totalLoadTime: number;
    memoryUsage: number;
    apiCalls: number;
    recommendations: string[];
  } {
    let totalLoadTime = 0;
    let memoryUsage = 0;
    let apiCalls = 0;
    const recommendations: string[] = [];

    layout.components.forEach(comp => {
      const metadata = this.getComponent(comp.componentId);
      if (metadata?.performance) {
        totalLoadTime += metadata.performance.initialLoadTime;
        memoryUsage += metadata.performance.memoryUsage;
        apiCalls += metadata.performance.apiCalls;
      }
    });

    // Generate recommendations
    if (totalLoadTime > 3000) {
      recommendations.push('Consider lazy loading some components to improve initial load time');
    }
    if (memoryUsage > 100) {
      recommendations.push('High memory usage detected. Consider reducing the number of active components');
    }
    if (apiCalls > 20) {
      recommendations.push('Many API calls detected. Consider implementing caching or data consolidation');
    }

    return { totalLoadTime, memoryUsage, apiCalls, recommendations };
  }

  // Export/Import
  exportLayout(layoutId: string): string {
    const layout = this.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout ${layoutId} not found`);
    }

    return JSON.stringify(layout, null, 2);
  }

  importLayout(layoutData: string): WorkspaceLayout {
    try {
      const layout: WorkspaceLayout = JSON.parse(layoutData);
      
      // Validate and assign new ID
      layout.id = `imported-${Date.now()}`;
      layout.createdAt = new Date();
      layout.updatedAt = new Date();
      
      if (!this.validateLayout(layout)) {
        throw new Error('Invalid layout data');
      }

      this.saveLayout(layout);
      return layout;
    } catch (error) {
      throw new Error(`Failed to import layout: ${error}`);
    }
  }
}

// Singleton instance
export const workspaceComponentRegistry = new WorkspaceComponentRegistryService();

// Initialize on module load
workspaceComponentRegistry.initializeFromStorage();

export default workspaceComponentRegistry; 