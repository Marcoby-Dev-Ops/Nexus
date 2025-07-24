import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Brain, Zap, Target, Workflow, BarChart3, Users, Settings, Lightbulb, Activity } from 'lucide-react';
// Lazy load all demo components
const TrinityBrainDemo = React.lazy(() => import('./TrinityBrainDemo').then(module => ({ default: module.TrinityBrainDemo })));
const UnifiedBrainDemo = React.lazy(() => import('./UnifiedBrainDemo').then(module => ({ default: module.UnifiedBrainDemo })));
const AutomationTemplateMarketplaceDemo = React.lazy(() => import('../demo/AutomationTemplateMarketplaceDemo').then(module => ({ default: module.AutomationTemplateMarketplaceDemo })));
const ContextualDataCompletionDemo = React.lazy(() => import('../ai/ContextualDataCompletionDemo').then(module => ({ default: module.ContextualDataCompletionDemo })));
const ContextChipsDemo = React.lazy(() => import('../ai/ContextChipsDemo').then(module => ({ default: module.ContextChipsDemo })));
const AutomationRecipeDemo = React.lazy(() => import('../automation/AutomationRecipeDemo').then(module => ({ default: module.AutomationRecipeDemo })));
const RealTimeSyncDemo = React.lazy(() => import('./RealTimeSyncDemo').then(module => ({ default: module.RealTimeSyncDemo })));
const AutomatedWorkflowDemo = React.lazy(() => import('./AutomatedWorkflowDemo').then(module => ({ default: module.AutomatedWorkflowDemo })));
const NexusOperatingSystemDemo = React.lazy(() => import('./NexusOperatingSystemDemo').then(module => ({ default: module.NexusOperatingSystemDemo })));

interface DemoItem {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'automation' | 'analytics' | 'integration' | 'workflow';
  icon: React.ReactNode;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  badge?: string;
  featured?: boolean;
}

const DEMOITEMS: DemoItem[] = [
  {
    id: 'trinity-brain',
    title: 'Trinity Brain System',
    description: 'Advanced AI orchestration with Think-See-Act methodology',
    category: 'ai',
    icon: <Brain className="w-5 h-5" />,
    component: TrinityBrainDemo,
    badge: 'Core AI',
    featured: true
  },
  {
    id: 'unified-brain',
    title: 'Unified Brain Intelligence',
    description: 'Cross-departmental AI coordination and insights',
    category: 'ai',
    icon: <Lightbulb className="w-5 h-5" />,
    component: UnifiedBrainDemo,
    badge: 'Intelligence'
  },
  {
    id: 'contextual-completion',
    title: 'Contextual Data Completion',
    description: 'AI-powered context gap detection and filling',
    category: 'ai',
    icon: <Target className="w-5 h-5" />,
    component: ContextualDataCompletionDemo,
    badge: 'Context AI'
  },
  {
    id: 'context-chips',
    title: 'Context Source Chips',
    description: 'Visual representation of AI response data sources',
    category: 'ai',
    icon: <Activity className="w-5 h-5" />,
    component: ContextChipsDemo,
    badge: 'UI/UX'
  },
  {
    id: 'automation-marketplace',
    title: 'Automation Template Marketplace',
    description: 'Browse and deploy automation templates',
    category: 'automation',
    icon: <Zap className="w-5 h-5" />,
    component: AutomationTemplateMarketplaceDemo,
    badge: 'Templates',
    featured: true
  },
  {
    id: 'automation-recipes',
    title: 'Automation Recipe Engine',
    description: 'Create and manage automation workflows',
    category: 'automation',
    icon: <Workflow className="w-5 h-5" />,
    component: AutomationRecipeDemo,
    badge: 'Workflows'
  },
  {
    id: 'real-time-sync',
    title: 'Real-Time Data Sync',
    description: 'Live synchronization across integrated platforms',
    category: 'integration',
    icon: <BarChart3 className="w-5 h-5" />,
    component: RealTimeSyncDemo,
    badge: 'Sync'
  },
  {
    id: 'automated-workflow',
    title: 'Automated Workflow Engine',
    description: 'End-to-end business process automation',
    category: 'workflow',
    icon: <Settings className="w-5 h-5" />,
    component: AutomatedWorkflowDemo,
    badge: 'Process'
  },
  {
    id: 'nexus-os',
    title: 'Nexus Operating System',
    description: 'Complete business operating system demonstration',
    category: 'workflow',
    icon: <Users className="w-5 h-5" />,
    component: NexusOperatingSystemDemo,
    badge: 'Platform',
    featured: true
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Demos', count: DEMO_ITEMS.length },
  { id: 'ai', label: 'AI & Intelligence', count: DEMO_ITEMS.filter(d => d.category === 'ai').length },
  { id: 'automation', label: 'Automation', count: DEMO_ITEMS.filter(d => d.category === 'automation').length },
  { id: 'integration', label: 'Integration', count: DEMO_ITEMS.filter(d => d.category === 'integration').length },
  { id: 'workflow', label: 'Workflow', count: DEMO_ITEMS.filter(d => d.category === 'workflow').length }
];

export const DemoShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const filteredDemos = selectedCategory === 'all' 
    ? DEMOITEMS: DEMO_ITEMS.filter(demo => demo.category === selectedCategory);

  const featuredDemos = DEMO_ITEMS.filter(demo => demo.featured);

  const selectedDemoItem = selectedDemo ? DEMO_ITEMS.find(d => d.id === selectedDemo) : null;

  if (selectedDemo && selectedDemoItem) {
    const DemoComponent = selectedDemoItem.component;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{selectedDemoItem.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{selectedDemoItem.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedDemo(null)}>
            ← Back to Showcase
          </Button>
        </div>

        <React.Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <DemoComponent />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Nexus Platform Demos
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore the full capabilities of the Nexus platform through interactive demonstrations
          of our AI, automation, and workflow systems.
        </p>
      </div>

      {/* Featured Demos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Featured Demonstrations</h2>
        <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
          {featuredDemos.map((demo) => (
            <Card key={demo.id} className="hover: shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {demo.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{demo.title}</CardTitle>
                      {demo.badge && (
                        <Badge variant="secondary" className="mt-1">
                          {demo.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{demo.description}</p>
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedDemo(demo.id)}
                >
                  Launch Demo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
              <span>{category.label}</span>
              <Badge variant="outline" className="ml-2">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDemos.map((demo) => (
              <Card key={demo.id} className="hover: shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {demo.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{demo.title}</CardTitle>
                      {demo.badge && (
                        <Badge variant="secondary" className="mt-1">
                          {demo.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{demo.description}</p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedDemo(demo.id)}
                  >
                    View Demo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemoShowcase; 