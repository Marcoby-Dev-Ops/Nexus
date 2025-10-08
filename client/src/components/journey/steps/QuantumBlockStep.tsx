/**
 * Quantum Journey - Block Configuration Step
 * 
 * Step for configuring individual quantum building blocks.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { getQuantumBlock, type QuantumBlock } from '@/core/config/quantumBusinessModel';
import type { JourneyStepProps } from '../types';

interface QuantumBlockStepProps extends JourneyStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  blockId: string;
  initialData?: any;
}

interface BlockData {
  properties: Record<string, any>;
  strength: number;
  health: number;
}

export default function QuantumBlockStep({ 
  onNext, 
  onBack, 
  blockId, 
  initialData 
}: QuantumBlockStepProps) {
  const [blockData, setBlockData] = useState<BlockData>({
    properties: initialData?.properties || {},
    strength: initialData?.strength || 50,
    health: initialData?.health || 70
  });

  const block = getQuantumBlock(blockId);
  if (!block) {
    return <div>Block not found</div>;
  }

  const handlePropertyChange = (propertyId: string, value: string) => {
    setBlockData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propertyId]: value
      }
    }));
  };

  const handleStrengthChange = (value: number) => {
    setBlockData(prev => ({ ...prev, strength: value }));
  };

  const handleHealthChange = (value: number) => {
    setBlockData(prev => ({ ...prev, health: value }));
  };

  const handleContinue = () => {
    onNext({
      blockId,
      ...blockData
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <block.icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{block.name}</h1>
          <p className="text-muted-foreground">{block.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Your {block.name}</CardTitle>
          <CardDescription>
            Tell us about your {block.name.toLowerCase()} to customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Properties */}
          <div className="space-y-4">
            <h3 className="font-semibold">Key Properties</h3>
            {block.properties.map(property => (
              <div key={property.id} className="space-y-2">
                <Label htmlFor={property.id} className="text-sm font-medium">
                  {property.name}
                  {property.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={property.id}
                  type="text"
                  placeholder={property.examples[0]}
                  value={blockData.properties[property.id] || ''}
                  onChange={(e) => handlePropertyChange(property.id, e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{property.description}</p>
              </div>
            ))}
          </div>

          {/* Strength & Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Strength (1-100)</Label>
              <input
                type="range"
                min="1"
                max="100"
                value={blockData.strength}
                onChange={(e) => handleStrengthChange(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${blockData.strength}%, hsl(var(--muted)) ${blockData.strength}%, hsl(var(--muted)) 100%)`
                }}
              />
              <div className="text-sm text-muted-foreground">
                Strength: {blockData.strength}% - How well developed is this area?
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Health (1-100)</Label>
              <input
                type="range"
                min="1"
                max="100"
                value={blockData.health}
                onChange={(e) => handleHealthChange(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${blockData.health}%, hsl(var(--muted)) ${blockData.health}%, hsl(var(--muted)) 100%)`
                }}
              />
              <div className="text-sm text-muted-foreground">
                Health: {blockData.health}% - How well is this area performing?
              </div>
            </div>
          </div>

          {/* AI Capabilities Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold">AI Capabilities Available</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {block.aiCapabilities.map(capability => (
                <div key={capability.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium">{capability.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
