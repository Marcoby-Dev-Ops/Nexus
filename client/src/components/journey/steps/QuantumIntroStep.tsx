/**
 * Quantum Journey - Introduction Step
 * 
 * Welcome step that introduces the quantum building blocks approach.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Building2, Target, ArrowRight } from 'lucide-react';
import { getAllQuantumBlocks } from '@/core/config/quantumBusinessModel';
import type { JourneyStepProps } from '../types';

interface QuantumIntroStepProps extends JourneyStepProps {
  onNext: () => void;
}

export default function QuantumIntroStep({ onNext }: QuantumIntroStepProps) {
  const quantumBlocks = getAllQuantumBlocks();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Welcome to Your Business Foundation Setup</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let's build your business using the 7 fundamental building blocks that every successful company needs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            The Foundation Approach
          </CardTitle>
          <CardDescription>
            Instead of generic modules, we'll identify the fundamental building blocks of YOUR business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quantumBlocks.map(block => (
              <div key={block.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <block.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{block.name}</div>
                  <div className="text-sm text-muted-foreground">{block.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onNext} size="lg" className="px-8">
          Create Your Business Snapshot
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
