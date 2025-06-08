/**
 * AICapabilities.tsx
 * Simple AI capabilities showcase following Nexus design consistency
 */

import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  Eye, 
  TrendingUp, 
  Code, 
  Network,
  Bot,
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AICapability {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  currentUsage: number;
  potential: number;
  status: 'available' | 'demo' | 'development';
}

const AI_CAPABILITIES: AICapability[] = [
  {
    id: 'system-evolution',
    title: 'Self-Evolving System',
    description: 'AI that continuously analyzes usage patterns and automatically improves Nexus.',
    icon: Brain,
    currentUsage: 5,
    potential: 95,
    status: 'demo'
  },
  {
    id: 'process-mining',
    title: 'Process Intelligence',
    description: 'Discovers and optimizes business processes automatically.',
    icon: Settings,
    currentUsage: 10,
    potential: 90,
    status: 'demo'
  },
  {
    id: 'multi-modal',
    title: 'Multi-Modal AI',
    description: 'Processes documents, voice, and images for business intelligence.',
    icon: Eye,
    currentUsage: 15,
    potential: 85,
    status: 'demo'
  },
  {
    id: 'predictive',
    title: 'Predictive Analytics',
    description: 'Self-updating models that predict and prevent business issues.',
    icon: TrendingUp,
    currentUsage: 20,
    potential: 80,
    status: 'demo'
  },
  {
    id: 'code-generation',
    title: 'Code Generation',
    description: 'Creates complete features from natural language descriptions.',
    icon: Code,
    currentUsage: 8,
    potential: 92,
    status: 'demo'
  },
  {
    id: 'smart-integration',
    title: 'Smart Integration',
    description: 'Automatically discovers and maintains business tool connections.',
    icon: Network,
    currentUsage: 25,
    potential: 75,
    status: 'demo'
  }
];

export const AICapabilities: React.FC = () => {
  const [selectedCapability, setSelectedCapability] = useState<AICapability | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Available</Badge>;
      case 'demo':
        return <Badge variant="secondary">Demo</Badge>;
      case 'development':
        return <Badge variant="secondary">Development</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getUsageLevel = (usage: number) => {
    if (usage < 20) return 'Severely Underutilized';
    if (usage < 50) return 'Underutilized';
    if (usage < 80) return 'Partially Utilized';
    return 'Well Utilized';
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">AI Capabilities</h1>
        </div>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Advanced AI capabilities that transform Nexus into a proactive business operating system
        </p>
        
        <div className="flex justify-center items-center space-x-4 mt-6">
          <Badge variant="secondary">
            <AlertTriangle className="h-4 w-4 mr-2" />
            86% Untapped Potential
          </Badge>
          <Badge variant="default">
            300-600% ROI Potential
          </Badge>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AI_CAPABILITIES.map((capability) => (
          <Card
            key={capability.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCapability(capability)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <capability.icon className="h-8 w-8 text-primary" />
                {getStatusBadge(capability.status)}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{capability.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{capability.description}</p>
              
              {/* Usage Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Usage: {capability.currentUsage}%</span>
                  <span>Potential: {capability.potential}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${capability.currentUsage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {getUsageLevel(capability.currentUsage)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Capability Details */}
      {selectedCapability && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <selectedCapability.icon className="h-10 w-10 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">{selectedCapability.title}</h2>
                  <p className="text-muted-foreground">{selectedCapability.description}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedCapability(null)}>
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Capability Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Usage:</span>
                    <span className="font-medium">{selectedCapability.currentUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Potential:</span>
                    <span className="font-medium">{selectedCapability.potential - selectedCapability.currentUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    {getStatusBadge(selectedCapability.status)}
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization Level:</span>
                    <span className="font-medium">{getUsageLevel(selectedCapability.currentUsage)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Business Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Increased automation and efficiency</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Reduced manual processes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Improved business intelligence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Enhanced decision-making speed</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <Button>Learn More</Button>
              <Button variant="secondary">View Demo</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="text-center">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            These AI capabilities represent the future of business operations. 
            Start with one capability and watch your business transform.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg">Start Transformation</Button>
            <Button variant="secondary" size="lg">Schedule Demo</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}; 