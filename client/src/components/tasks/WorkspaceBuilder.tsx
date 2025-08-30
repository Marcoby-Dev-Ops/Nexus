import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Plus, Grid, Save, Share, Download, Upload, Settings, Eye, EyeOff, GripVertical, Trash2, Palette, Zap, Brain, BarChart3, Mail, Calendar, CheckSquare, Lightbulb, Shield, MessageSquare, Activity, Target, AlertTriangle } from 'lucide-react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

// Component Registry with metadata
export interface WorkspaceComponent {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'analytics' | 'communication' | 'ai' | 'business' | 'custom';
  icon: React.ReactNode;
  component: React.ComponentType<Record<string, unknown>>;
  defaultProps?: Record<string, unknown>;
  configurable: boolean;
  size: 'small' | 'medium' | 'large' | 'extra-large';
  tags: string[];
  premium?: boolean;
  dependencies?: string[];
}

// Import actual components
import { TasksWidget } from '@/components/tasks/widgets/TasksWidget';
import { IdeasWidget } from '@/components/tasks/widgets/IdeasWidget';
import { CalendarWidget } from '@/shared/features/widgets/CalendarWidget';
import { EmailWidget } from '@/components/tasks/widgets/EmailWidget';
import { RecentsWidget } from '@/components/tasks/widgets/RecentsWidget';
import { QuickActionsWidget } from '@/components/tasks/widgets/QuickActionsWidget';
import { ProactiveAlertsWidget } from '@/components/tasks/widgets/ProactiveAlertsWidget';
import { NextBestActionWidget } from '@/components/tasks/widgets/NextBestActionWidget';
import { AIPerformanceWidget } from '../dashboard/AIPerformanceWidget';
import DigestibleMetricsDashboard from '../analytics/DigestibleMetricsDashboard';
import { SecurityDashboard } from '../dashboard/SecurityDashboard';
import UnifiedCommunicationDashboard from '../dashboard/UnifiedCommunicationDashboard';

const COMPONENTREGISTRY: WorkspaceComponent[] = [
  // Productivity Components
  {
    id: 'tasks-widget',
    name: 'Tasks',
    description: 'Manage your daily tasks and to-dos',
    category: 'productivity',
    icon: <CheckSquare className="w-4 h-4" />,
    component: TasksWidget,
    configurable: true,
    size: 'medium',
    tags: ['tasks', 'productivity', 'todo']
  },
  {
    id: 'ideas-widget',
    name: 'Ideas & Innovation',
    description: 'Capture and organize breakthrough ideas',
    category: 'productivity',
    icon: <Lightbulb className="w-4 h-4" />,
    component: IdeasWidget,
    configurable: true,
    size: 'medium',
    tags: ['ideas', 'innovation', 'creativity']
  },
  {
    id: 'calendar-widget',
    name: 'Calendar',
    description: 'Unified calendar across all platforms',
    category: 'productivity',
    icon: <Calendar className="w-4 h-4" />,
    component: CalendarWidget,
    configurable: true,
    size: 'large',
    tags: ['calendar', 'meetings', 'scheduling']
  },
  {
    id: 'quick-actions-widget',
    name: 'Quick Actions',
    description: 'Customizable action buttons for common tasks',
    category: 'productivity',
    icon: <Zap className="w-4 h-4" />,
    component: QuickActionsWidget,
    configurable: true,
    size: 'small',
    tags: ['actions', 'shortcuts', 'productivity']
  },

  // Communication Components
  {
    id: 'email-widget',
    name: 'Email',
    description: 'Stay on top of your inbox',
    category: 'communication',
    icon: <Mail className="w-4 h-4" />,
    component: EmailWidget,
    configurable: true,
    size: 'medium',
    tags: ['email', 'communication', 'inbox']
  },
  {
    id: 'communication-dashboard',
    name: 'Team Communication',
    description: 'Slack + Teams analytics and insights',
    category: 'communication',
    icon: <MessageSquare className="w-4 h-4" />,
    component: UnifiedCommunicationDashboard,
    configurable: true,
    size: 'extra-large',
    tags: ['slack', 'teams', 'communication', 'analytics'],
    premium: true
  },

  // Analytics Components
  {
    id: 'business-metrics',
    name: 'Business Metrics',
    description: 'Key business metrics in plain English',
    category: 'analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    component: DigestibleMetricsDashboard,
    configurable: true,
    size: 'extra-large',
    tags: ['metrics', 'analytics', 'business', 'kpi']
  },
  {
    id: 'security-dashboard',
    name: 'Security Monitor',
    description: 'Security alerts and monitoring',
    category: 'analytics',
    icon: <Shield className="w-4 h-4" />,
    component: SecurityDashboard,
    configurable: true,
    size: 'large',
    tags: ['security', 'monitoring', 'alerts'],
    premium: true
  },

  // AI Components
  {
    id: 'ai-performance',
    name: 'AI Performance',
    description: 'AI usage, costs, and optimization',
    category: 'ai',
    icon: <Brain className="w-4 h-4" />,
    component: AIPerformanceWidget,
    configurable: true,
    size: 'medium',
    tags: ['ai', 'performance', 'costs', 'optimization']
  },
  {
    id: 'next-best-action',
    name: 'AI Recommendations',
    description: 'AI-powered suggestions for your workflow',
    category: 'ai',
    icon: <Target className="w-4 h-4" />,
    component: NextBestActionWidget,
    configurable: true,
    size: 'medium',
    tags: ['ai', 'recommendations', 'suggestions']
  },
  {
    id: 'proactive-alerts',
    name: 'Smart Alerts',
    description: 'AI-powered business alerts and notifications',
    category: 'ai',
    icon: <AlertTriangle className="w-4 h-4" />,
    component: ProactiveAlertsWidget,
    configurable: true,
    size: 'medium',
    tags: ['alerts', 'ai', 'notifications', 'proactive']
  },

  // Business Components
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Track your recent actions and pin favorites',
    category: 'business',
    icon: <Activity className="w-4 h-4" />,
    component: RecentsWidget,
    configurable: true,
    size: 'medium',
    tags: ['activity', 'recent', 'history', 'favorites']
  }
];

interface WorkspaceLayout {
  id: string;
  name: string;
  description: string;
  components: LayoutComponent[];
  author?: string;
  isPublic?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutComponent {
  id: string;
  componentId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, unknown>;
  visible: boolean;
}

// Sortable Component Wrapper
const SortableComponent: React.FC<{
  component: LayoutComponent;
  registry: WorkspaceComponent;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onConfigure: (id: string) => void;
}> = ({ component, registry, onRemove, onToggleVisibility, onConfigure }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const ComponentToRender = registry.component;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Component Controls */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover: opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1 flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onToggleVisibility(component.id)}
        >
          {component.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>
        {registry.configurable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onConfigure(component.id)}
          >
            <Settings className="w-3 h-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover: text-destructive"
          onClick={() => onRemove(component.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Component */}
      <div className={`${component.visible ? 'opacity-100' : 'opacity-50'} transition-opacity`}>
        <ComponentToRender {...(component.config || {})} />
      </div>
    </div>
  );
};

// Component Palette
const ComponentPalette: React.FC<{
  onAddComponent: (componentId: string) => void;
  searchTerm: string;
  selectedCategory: string;
}> = ({ onAddComponent, searchTerm, selectedCategory }) => {
  const filteredComponents = COMPONENT_REGISTRY.filter(
    (component) =>
      (selectedCategory === 'all' || component.category === selectedCategory) &&
      component.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {filteredComponents.map((component) => (
        <Card
          key={component.id}
          className="w-full min-h-[80px] p-4 cursor-pointer hover: shadow-md transition-shadow border-2 border-transparent hover:border-primary/20 flex flex-col justify-between"
          onClick={() => onAddComponent(component.id)}
        >
          <div className="flex items-center gap-4 mb-2">
            {component.icon}
            <span className="font-semibold text-base truncate">{component.name}</span>
            {component.premium && (
              <Badge variant="secondary" className="text-xs">Pro</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{component.description}</p>
          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline">{component.category}</Badge>
            <Badge variant="outline">{component.size}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Main Workspace Builder
export const WorkspaceBuilder: React.FC = () => {
  const [layout, setLayout] = useState<LayoutComponent[]>([]);
  const [workspaceName, setWorkspaceName] = useState('My Custom Workspace');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const addComponent = useCallback((componentId: string) => {
    const registry = COMPONENT_REGISTRY.find(c => c.id === componentId);
    if (!registry) return;

    const newComponent: LayoutComponent = {
      id: `${componentId}-${Date.now()}`,
      componentId,
      position: { x: 0, y: layout.length },
      size: { width: 12, height: 4 }, // Grid-based sizing
      config: registry.defaultProps || {},
      visible: true
    };

    setLayout(prev => [...prev, newComponent]);
  }, [layout.length]);

  const removeComponent = useCallback((id: string) => {
    setLayout(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggleComponentVisibility = useCallback((id: string) => {
    setLayout(prev => prev.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    ));
  }, []);

  const configureComponent = useCallback((id: string) => {
    // Open configuration dialog
     
     
    // eslint-disable-next-line no-console
    console.log('Configure component: ', id);
  }, []);

  const saveWorkspace = useCallback(() => {
    const workspace: WorkspaceLayout = {
      id: `workspace-${Date.now()}`,
      name: workspaceName,
      description: `Custom workspace with ${layout.length} components`,
      components: layout,
      author: 'Current User',
      isPublic: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage for now
    const savedWorkspaces = JSON.parse(localStorage.getItem('nexus-workspaces') || '[]');
    savedWorkspaces.push(workspace);
    localStorage.setItem('nexus-workspaces', JSON.stringify(savedWorkspaces));
    
     
     
    // eslint-disable-next-line no-console
    console.log('Workspace saved: ', workspace);
  }, [workspaceName, layout]);

  const categories = ['all', ...Array.from(new Set(COMPONENT_REGISTRY.map(c => c.category)))];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Workspace name..."
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPalette(!showPalette)}
            >
              <Palette className="w-4 h-4 mr-2" />
              {showPalette ? 'Hide' : 'Show'} Palette
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={saveWorkspace}>
              <Save className="w-4 h-4 mr-2" />
              Save Workspace
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Component Palette Sidebar */}
        {showPalette && (
          <div className="w-96 border-r shadow-lg bg-gradient-to-b from-muted/30 to-background/80 p-6 overflow-y-auto sticky top-0 h-screen z-10">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Add Components</h3>
                <Input
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-3"
                />
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <ComponentPalette
                onAddComponent={addComponent}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
              />
            </div>
          </div>
        )}

        {/* Main Workspace Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {layout.length === 0 ? (
                <div className="text-center py-12">
                  <Grid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Building Your Workspace</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop components from the palette to create your personalized workspace
                  </p>
                  <Button onClick={() => setShowPalette(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Component
                  </Button>
                </div>
              ) : (
                <SortableContext items={layout.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 lg: grid-cols-2 xl:grid-cols-3 gap-6">
                    {layout.map((component) => {
                      const registry = COMPONENT_REGISTRY.find(r => r.id === component.componentId);
                      if (!registry) return null;

                      return (
                        <SortableComponent
                          key={component.id}
                          component={component}
                          registry={registry}
                          onRemove={removeComponent}
                          onToggleVisibility={toggleComponentVisibility}
                          onConfigure={configureComponent}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              )}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="opacity-50">
                  <Card>
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Workspace Stats */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{layout.length} components</span>
            <span>{layout.filter(c => c.visible).length} visible</span>
            <span>{layout.filter(c => !c.visible).length} hidden</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Last saved: Never</span>
            <Button variant="ghost" size="sm">
              <Upload className="w-3 h-3 mr-1" />
              Import
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceBuilder; 
