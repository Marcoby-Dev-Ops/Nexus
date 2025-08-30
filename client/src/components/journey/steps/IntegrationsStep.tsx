/**
 * MVP Journey - Integrations Step
 * 
 * Step for setting up core business integrations.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  Mail, 
  Calendar, 
  CreditCard,
  Users,
  FileText,
  MessageSquare,
  Globe,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { JourneyStepProps } from '../types';

interface IntegrationsStepProps extends JourneyStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export default function IntegrationsStep({ onNext, onBack, initialData }: IntegrationsStepProps) {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    initialData?.integrations || []
  );

  const integrations = [
    {
      id: 'email',
      name: 'Email Marketing',
      description: 'Connect your email service for customer communication',
      icon: Mail,
      category: 'Communication',
      setupTime: '5 min',
      essential: true
    },
    {
      id: 'calendar',
      name: 'Calendar & Scheduling',
      description: 'Manage appointments and team scheduling',
      icon: Calendar,
      category: 'Productivity',
      setupTime: '3 min',
      essential: true
    },
    {
      id: 'payments',
      name: 'Payment Processing',
      description: 'Accept payments from customers',
      icon: CreditCard,
      category: 'Finance',
      setupTime: '10 min',
      essential: true
    },
    {
      id: 'crm',
      name: 'Customer Management',
      description: 'Track customer relationships and interactions',
      icon: Users,
      category: 'Sales',
      setupTime: '8 min',
      essential: false
    },
    {
      id: 'documents',
      name: 'Document Management',
      description: 'Store and organize business documents',
      icon: FileText,
      category: 'Operations',
      setupTime: '5 min',
      essential: false
    },
    {
      id: 'chat',
      name: 'Live Chat',
      description: 'Provide real-time customer support',
      icon: MessageSquare,
      category: 'Support',
      setupTime: '7 min',
      essential: false
    },
    {
      id: 'website',
      name: 'Website Analytics',
      description: 'Track website performance and visitor behavior',
      icon: Globe,
      category: 'Marketing',
      setupTime: '5 min',
      essential: false
    }
  ];

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleNext = () => {
    onNext({
      integrations: selectedIntegrations,
      integrationCount: selectedIntegrations.length,
      essentialIntegrations: integrations
        .filter(i => i.essential && selectedIntegrations.includes(i.id))
        .map(i => i.id)
    });
  };

  const essentialIntegrations = integrations.filter(i => i.essential);
  const optionalIntegrations = integrations.filter(i => !i.essential);
  const selectedEssential = essentialIntegrations.filter(i => 
    selectedIntegrations.includes(i.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Zap className="w-16 h-16 text-primary mb-4" />
        </div>
        <h2 className="text-2xl font-bold">Set Up Core Integrations</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect the essential tools your business needs to operate efficiently. 
          We'll help you set up the most important integrations first.
        </p>
      </div>

      {/* Essential Integrations */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Essential Integrations</h3>
            <p className="text-sm text-muted-foreground">
              These integrations are recommended for all businesses
            </p>
            <div className="mt-2">
              <Badge variant="secondary">
                {selectedEssential}/{essentialIntegrations.length} selected
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {essentialIntegrations.map((integration) => {
              const Icon = integration.icon;
              const isSelected = selectedIntegrations.includes(integration.id);
              
              return (
                <div
                  key={integration.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => handleIntegrationToggle(integration.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleIntegrationToggle(integration.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{integration.name}</span>
                        <Badge variant="destructive" className="text-xs">Essential</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {integration.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {integration.setupTime} setup
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optional Integrations */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Optional Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Additional tools that can enhance your business operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalIntegrations.map((integration) => {
              const Icon = integration.icon;
              const isSelected = selectedIntegrations.includes(integration.id);
              
              return (
                <div
                  key={integration.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => handleIntegrationToggle(integration.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleIntegrationToggle(integration.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {integration.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {integration.setupTime} setup
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Integration Summary</h3>
              <p className="text-sm text-muted-foreground">
                {selectedIntegrations.length} integrations selected
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Estimated setup time
              </div>
              <div className="font-semibold">
                {Math.ceil(selectedIntegrations.length * 5)} minutes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button 
          onClick={handleNext}
          disabled={selectedEssential < essentialIntegrations.length}
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
