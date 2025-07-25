/**
 * AIFeatureCard.tsx
 * Consistent AI feature card following Nexus design system
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'demo' | 'development';
  usage: number;
  potential: number;
}

interface AIFeatureCardProps {
  feature: AIFeature;
  onLearnMore?: (feature: AIFeature) => void;
  onDemo?: (feature: AIFeature) => void;
}

export const AIFeatureCard: React.FC<AIFeatureCardProps> = ({
  feature,
  onLearnMore,
  onDemo
}) => {
  const getStatusVariant = (status: string) => {
    return status === 'available' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'demo': return 'Demo';
      case 'development': return 'In Development';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="h-full">
      <div className="p-6 space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <feature.icon className="h-8 w-8 text-primary" />
          <Badge variant={getStatusVariant(feature.status)}>
            {getStatusLabel(feature.status)}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage: {feature.usage}%</span>
              <span className="text-muted-foreground">
                {feature.potential - feature.usage}% untapped
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${feature.usage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          {onLearnMore && (
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => onLearnMore(feature)}
            >
              Learn More
            </Button>
          )}
          {onDemo && feature.status !== 'development' && (
            <Button 
              className="flex-1"
              onClick={() => onDemo(feature)}
            >
              {feature.status === 'available' ? 'Use' : 'Demo'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}; 