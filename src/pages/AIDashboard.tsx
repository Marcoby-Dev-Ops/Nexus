/**
 * AIDashboard.tsx
 * Modern AI capabilities dashboard following Nexus design system
 */

import React, { useState } from 'react';
import { 
  Brain, 
  Eye, 
  TrendingUp, 
  Code, 
  Network,
  Settings,
  Bot,
  Zap,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AIFeatureCard } from '@/components/ai/AIFeatureCard';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'demo' | 'development';
  usage: number;
  potential: number;
}

const AI_FEATURES: AIFeature[] = [
  {
    id: 'system-evolution',
    title: 'Self-Evolving System',
    description: 'AI that continuously improves Nexus automatically',
    icon: Brain,
    status: 'demo',
    usage: 5,
    potential: 95
  },
  {
    id: 'process-intelligence',
    title: 'Process Intelligence',
    description: 'Discovers and optimizes business processes',
    icon: Settings,
    status: 'demo',
    usage: 10,
    potential: 90
  },
  {
    id: 'multi-modal',
    title: 'Multi-Modal AI',
    description: 'Processes documents, voice, and images',
    icon: Eye,
    status: 'demo',
    usage: 15,
    potential: 85
  },
  {
    id: 'predictive',
    title: 'Predictive Analytics',
    description: 'Predicts and prevents business issues',
    icon: TrendingUp,
    status: 'demo',
    usage: 20,
    potential: 80
  },
  {
    id: 'code-generation',
    title: 'Code Generation',
    description: 'Creates features from natural language',
    icon: Code,
    status: 'demo',
    usage: 8,
    potential: 92
  },
  {
    id: 'smart-integration',
    title: 'Smart Integration',
    description: 'Auto-manages business tool connections',
    icon: Network,
    status: 'demo',
    usage: 25,
    potential: 75
  }
];

export const AIDashboard: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);

  const totalPotential = AI_FEATURES.reduce((sum, feature) => 
    sum + (feature.potential - feature.usage), 0
  );

  const averageUsage = AI_FEATURES.reduce((sum, feature) => 
    sum + feature.usage, 0
  ) / AI_FEATURES.length;

  const handleLearnMore = (feature: AIFeature) => {
    setSelectedFeature(feature);
  };

  const handleDemo = (feature: AIFeature) => {
    // Navigate to demo or trigger demo modal
    console.log(`Starting demo for ${feature.title}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Capabilities</h1>
        </div>
        <p className="text-muted-foreground">
          Transform your business with advanced AI that works behind the scenes
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalPotential.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Untapped Potential</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{averageUsage.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Average Usage</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{AI_FEATURES.length}</div>
            <div className="text-sm text-muted-foreground">AI Capabilities</div>
          </div>
        </Card>
      </div>

      {/* AI Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_FEATURES.map((feature) => (
            <AIFeatureCard
              key={feature.id}
              feature={feature}
              onLearnMore={handleLearnMore}
              onDemo={handleDemo}
            />
          ))}
        </div>
      </div>

      {/* Feature Details Modal/Card */}
      {selectedFeature && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <selectedFeature.icon className="h-10 w-10 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">{selectedFeature.title}</h2>
                  <p className="text-muted-foreground">{selectedFeature.description}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setSelectedFeature(null)}>
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Capability Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Usage:</span>
                    <span className="font-medium">{selectedFeature.usage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential:</span>
                    <span className="font-medium">{selectedFeature.potential}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={selectedFeature.status === 'available' ? 'default' : 'secondary'}>
                      {selectedFeature.status === 'available' ? 'Available' : 
                       selectedFeature.status === 'demo' ? 'Demo' : 'In Development'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Benefits</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Increased efficiency</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Reduced manual work</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Better insights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Faster decisions</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4 border-t">
              <Button onClick={() => handleDemo(selectedFeature)}>
                Try Demo
              </Button>
              <Button variant="secondary">
                View Documentation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Getting Started */}
      <Card>
        <div className="p-6 text-center space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Ready to Get Started?</h2>
            <p className="text-muted-foreground">
              These AI capabilities work automatically in the background to make your business more efficient.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button size="lg">
              Start Free Trial
            </Button>
            <Button variant="secondary" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}; 