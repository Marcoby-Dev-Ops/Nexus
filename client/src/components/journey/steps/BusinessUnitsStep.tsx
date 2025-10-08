/**
 * MVP Journey - Business Units Step
 * 
 * Step for configuring business units.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { JourneyStepProps } from '../types';

interface BusinessUnitsStepProps extends JourneyStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export default function BusinessUnitsStep({ onNext, onBack, initialData }: BusinessUnitsStepProps) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(initialData?.businessUnits || []);

  const businessUnits = [
    {
      id: 'sales',
      name: 'Sales',
      description: 'Revenue generation and pipeline management',
      icon: '📈',
      benefits: ['Pipeline tracking', 'Deal analysis', 'Revenue forecasting']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Lead generation and brand awareness',
      icon: '🌐',
      benefits: ['Campaign management', 'Lead tracking', 'Brand analytics']
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Process optimization and efficiency',
      icon: '⚙️',
      benefits: ['Workflow automation', 'Process monitoring', 'Resource optimization']
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Financial health and cash flow',
      icon: '💰',
      benefits: ['Cash flow tracking', 'Expense management', 'Financial reporting']
    }
  ];

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleNext = () => {
    onNext({ businessUnits: selectedUnits });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Set Up Your Business Units</h2>
        <p className="text-muted-foreground">
          Select the core functions of your business. You can always add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessUnits.map((unit) => (
          <Card 
            key={unit.id}
            className={`cursor-pointer transition-all ${
              selectedUnits.includes(unit.id) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleUnitToggle(unit.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{unit.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{unit.name}</h3>
                    <Checkbox 
                      checked={selectedUnits.includes(unit.id)}
                      onChange={() => handleUnitToggle(unit.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {unit.description}
                  </p>
                  <div className="space-y-1">
                    {unit.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedUnits.length === 0}
        >
          Continue with {selectedUnits.length} Business Unit{selectedUnits.length !== 1 ? 's' : ''}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
