/**
 * AICapabilities.tsx
 * Simple AI capabilities showcase following Nexus design consistency
 */

import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Users, 
  Settings, 
  Lightbulb,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Camera,
  Mic,
  Shield,
  Cpu,
  Network
} from 'lucide-react';
import { AdvancedAICapabilitiesDemo } from '@/domains/ai/components/AdvancedAICapabilitiesDemo';
import { ContextualDataCompletionDemo } from '@/domains/ai/components/ContextualDataCompletionDemo';
import { CrossPlatformIntelligenceDemo } from '@/domains/ai/components/CrossPlatformIntelligenceDemo';
import { ToolEnabledDemo } from '@/domains/ai/components/ToolEnabledDemo';
import { ModelPerformanceMonitor } from '@/domains/ai/components/ModelPerformanceMonitor';

interface AICapability {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'demo' | 'development' | 'planned';
  category: 'core' | 'advanced' | 'experimental' | 'enterprise';
  usage: number;
  potential: number;
  features: string[];
}

interface CapabilityCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities: AICapability[];
}

export default function AICapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    setLoading(true);
    try {
      const allCapabilities: AICapability[] = [
        {
          id: 'contextual-chat',
          title: 'Contextual Chat',
          description: 'AI that understands your business context and provides personalized responses',
          icon: MessageSquare,
          status: 'available',
          category: 'core',
          usage: 85,
          potential: 95,
          features: ['Business Context Awareness', 'Personalized Responses', 'Memory Retention', 'Multi-turn Conversations']
        },
        {
          id: 'workflow-automation',
          title: 'Workflow Automation',
          description: 'Automate repetitive tasks and optimize business processes',
          icon: Zap,
          status: 'available',
          category: 'core',
          usage: 62,
          potential: 88,
          features: ['Task Automation', 'Process Optimization', 'Integration APIs', 'Custom Workflows']
        },
        {
          id: 'predictive-analytics',
          title: 'Predictive Analytics',
          description: 'Forecast trends and identify opportunities using AI',
          icon: TrendingUp,
          status: 'demo',
          category: 'advanced',
          usage: 45,
          potential: 92,
          features: ['Trend Forecasting', 'Risk Assessment', 'Opportunity Identification', 'Data Visualization']
        },
        {
          id: 'cross-departmental',
          title: 'Cross-Departmental Intelligence',
          description: 'Connect insights across all business departments',
          icon: Users,
          status: 'available',
          category: 'advanced',
          usage: 73,
          potential: 89,
          features: ['Department Integration', 'Shared Knowledge', 'Collaborative Insights', 'Unified Dashboard']
        },
        {
          id: 'continuous-improvement',
          title: 'Continuous Improvement',
          description: 'AI that learns and improves from every interaction',
          icon: Brain,
          status: 'available',
          category: 'core',
          usage: 78,
          potential: 94,
          features: ['Learning Algorithms', 'Performance Tracking', 'Adaptive Responses', 'Feedback Integration']
        },
        {
          id: 'multi-modal',
          title: 'Multi-Modal AI',
          description: 'Process text, voice, images, and documents simultaneously',
          icon: Eye,
          status: 'development',
          category: 'advanced',
          usage: 32,
          potential: 96,
          features: ['Text Processing', 'Voice Recognition', 'Image Analysis', 'Document Understanding']
        },
        {
          id: 'voice-interaction',
          title: 'Voice Interaction',
          description: 'Natural voice conversations with AI assistants',
          icon: Mic,
          status: 'demo',
          category: 'advanced',
          usage: 28,
          potential: 90,
          features: ['Speech Recognition', 'Natural Language Processing', 'Voice Synthesis', 'Noise Cancellation']
        },
        {
          id: 'document-intelligence',
          title: 'Document Intelligence',
          description: 'Extract insights and automate document processing',
          icon: FileText,
          status: 'available',
          category: 'core',
          usage: 67,
          potential: 87,
          features: ['Document Parsing', 'Information Extraction', 'Form Processing', 'Content Analysis']
        },
        {
          id: 'visual-analysis',
          title: 'Visual Analysis',
          description: 'Analyze images, charts, and visual data',
          icon: Camera,
          status: 'development',
          category: 'advanced',
          usage: 35,
          potential: 93,
          features: ['Image Recognition', 'Chart Analysis', 'Visual Data Processing', 'Object Detection']
        },
        {
          id: 'security-intelligence',
          title: 'Security Intelligence',
          description: 'AI-powered security monitoring and threat detection',
          icon: Shield,
          status: 'planned',
          category: 'enterprise',
          usage: 15,
          potential: 98,
          features: ['Threat Detection', 'Anomaly Monitoring', 'Security Analytics', 'Compliance Tracking']
        },
        {
          id: 'edge-computing',
          title: 'Edge Computing',
          description: 'Process AI tasks locally for enhanced privacy and speed',
          icon: Cpu,
          status: 'planned',
          category: 'enterprise',
          usage: 8,
          potential: 97,
          features: ['Local Processing', 'Privacy Enhancement', 'Reduced Latency', 'Offline Capability']
        },
        {
          id: 'quantum-ready',
          title: 'Quantum-Ready Architecture',
          description: 'Future-proof AI infrastructure for quantum computing',
          icon: Network,
          status: 'planned',
          category: 'experimental',
          usage: 2,
          potential: 99,
          features: ['Quantum Algorithms', 'Advanced Cryptography', 'Superior Performance', 'Future Scalability']
        }
      ];

      setCapabilities(allCapabilities);
    } catch (error) {
      console.error('Error loading AI capabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCapabilitiesByCategory = (): CapabilityCategory[] => {
    const categories = [
      {
        id: 'core',
        title: 'Core Capabilities',
        description: 'Essential AI features for daily business operations',
        icon: Brain,
        capabilities: capabilities.filter(c => c.category === 'core')
      },
      {
        id: 'advanced',
        title: 'Advanced Features',
        description: 'Sophisticated AI capabilities for enhanced productivity',
        icon: Sparkles,
        capabilities: capabilities.filter(c => c.category === 'advanced')
      },
      {
        id: 'enterprise',
        title: 'Enterprise Solutions',
        description: 'High-security and scalable AI solutions for large organizations',
        icon: Shield,
        capabilities: capabilities.filter(c => c.category === 'enterprise')
      },
      {
        id: 'experimental',
        title: 'Experimental',
        description: 'Cutting-edge AI technologies in development',
        icon: Lightbulb,
        capabilities: capabilities.filter(c => c.category === 'experimental')
      }
    ];

    return categories.filter(cat => cat.capabilities.length > 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'demo': return 'text-blue-600 bg-blue-50';
      case 'development': return 'text-orange-600 bg-orange-50';
      case 'planned': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'demo': return <Clock className="w-4 h-4" />;
      case 'development': return <AlertCircle className="w-4 h-4" />;
      case 'planned': return <Lightbulb className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'demo': return 'Demo';
      case 'development': return 'In Development';
      case 'planned': return 'Planned';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            AI Capabilities
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore the full spectrum of AI capabilities available in your business ecosystem
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Configure AI
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="demos">Live Demos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Capability Categories */}
          <div className="space-y-6">
            {getCapabilitiesByCategory().map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold">{category.title}</h2>
                </div>
                <p className="text-muted-foreground mb-4">{category.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.capabilities.map((capability) => (
                    <Card key={capability.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <capability.icon className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{capability.title}</CardTitle>
                          </div>
                          <Badge className={getStatusColor(capability.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(capability.status)}
                              {getStatusText(capability.status)}
                            </div>
                          </Badge>
                        </div>
                        <CardDescription>{capability.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Usage</span>
                              <span>{capability.usage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${capability.usage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Potential</span>
                              <span>{capability.potential}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${capability.potential}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Key Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {capability.features.slice(0, 2).map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {capability.features.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{capability.features.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                                                     <Button 
                             variant="outline" 
                             size="sm" 
                             className="w-full"
                             onClick={() => console.log('Learn more about:', capability.id)}
                           >
                             <ArrowUpRight className="w-4 h-4 mr-2" />
                             Learn More
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Detailed Capabilities</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedAICapabilitiesDemo />
              <ContextualDataCompletionDemo />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="demos" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Interactive Demos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CrossPlatformIntelligenceDemo />
              <ToolEnabledDemo />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Performance Metrics</h2>
            <ModelPerformanceMonitor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 