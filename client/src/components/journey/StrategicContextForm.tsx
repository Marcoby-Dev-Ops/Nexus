import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Save, ArrowRight, ArrowLeft, Plus, X, Target, AlertTriangle, TrendingUp, Star } from 'lucide-react';

interface StrategicContextData {
  businessGoals: string[];
  challenges: string[];
  successMetrics: string[];
  strategicPriorities: string[];
}

interface StrategicContextFormProps {
  initialData?: Partial<StrategicContextData>;
  onSave: (data: StrategicContextData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function StrategicContextForm({ 
  initialData = {}, 
  onSave, 
  onNext, 
  onPrevious,
  isLoading = false 
}: StrategicContextFormProps) {
  const [formData, setFormData] = useState<StrategicContextData>({
    businessGoals: [''],
    challenges: [''],
    successMetrics: [''],
    strategicPriorities: [''],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleArrayChange = (field: keyof StrategicContextData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof StrategicContextData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: keyof StrategicContextData, index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const validGoals = formData.businessGoals.filter(g => g.trim() !== '');
    const validChallenges = formData.challenges.filter(c => c.trim() !== '');
    const validMetrics = formData.successMetrics.filter(m => m.trim() !== '');
    const validPriorities = formData.strategicPriorities.filter(p => p.trim() !== '');

    if (validGoals.length === 0) {
      newErrors.businessGoals = 'At least one business goal is required';
    }

    if (validChallenges.length === 0) {
      newErrors.challenges = 'At least one challenge is required';
    }

    if (validMetrics.length === 0) {
      newErrors.successMetrics = 'At least one success metric is required';
    }

    if (validPriorities.length === 0) {
      newErrors.strategicPriorities = 'At least one strategic priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const cleanData = {
        businessGoals: formData.businessGoals.filter(g => g.trim() !== ''),
        challenges: formData.challenges.filter(c => c.trim() !== ''),
        successMetrics: formData.successMetrics.filter(m => m.trim() !== ''),
        strategicPriorities: formData.strategicPriorities.filter(p => p.trim() !== '')
      };
      onSave(cleanData);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      const cleanData = {
        businessGoals: formData.businessGoals.filter(g => g.trim() !== ''),
        challenges: formData.challenges.filter(c => c.trim() !== ''),
        successMetrics: formData.successMetrics.filter(m => m.trim() !== ''),
        strategicPriorities: formData.strategicPriorities.filter(p => p.trim() !== '')
      };
      onSave(cleanData);
      onNext();
    }
  };

  const commonGoals = [
    'Increase revenue by 50%',
    'Expand to new markets',
    'Improve customer satisfaction',
    'Reduce operational costs',
    'Launch new products',
    'Build brand awareness',
    'Improve team productivity',
    'Achieve profitability'
  ];

  const commonChallenges = [
    'Limited funding/resources',
    'Market competition',
    'Customer acquisition',
    'Team scaling',
    'Technology limitations',
    'Regulatory compliance',
    'Supply chain issues',
    'Talent retention'
  ];

  const commonMetrics = [
    'Monthly Recurring Revenue (MRR)',
    'Customer Acquisition Cost (CAC)',
    'Customer Lifetime Value (CLV)',
    'Net Promoter Score (NPS)',
    'Monthly Active Users (MAU)',
    'Conversion rate',
    'Churn rate',
    'Gross margin'
  ];

  const commonPriorities = [
    'Product development',
    'Sales and marketing',
    'Customer success',
    'Operations efficiency',
    'Team building',
    'Technology infrastructure',
    'Market expansion',
    'Financial management'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            5
          </div>
          Strategic Context
        </CardTitle>
        <CardDescription>
          Set your business goals, challenges, and success metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Business Goals</h3>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            <Label>What are your key business objectives for the next 12 months? *</Label>
            {formData.businessGoals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) => handleArrayChange('businessGoals', index, e.target.value)}
                  placeholder={`Business goal ${index + 1}`}
                  className="flex-1"
                />
                {formData.businessGoals.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('businessGoals', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('businessGoals')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Goal
            </Button>
            {errors.businessGoals && <p className="text-sm text-red-500">{errors.businessGoals}</p>}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Common Business Goals:</h4>
            <div className="flex flex-wrap gap-2">
              {commonGoals.map((goal, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newGoals = [...formData.businessGoals];
                    if (newGoals[newGoals.length - 1] === '') {
                      newGoals[newGoals.length - 1] = goal;
                    } else {
                      newGoals.push(goal);
                    }
                    setFormData(prev => ({ ...prev, businessGoals: newGoals }));
                  }}
                  className="text-xs"
                >
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Challenges */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Key Challenges</h3>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          
          <div className="space-y-3">
            <Label>What are the main challenges you're facing or expect to face? *</Label>
            {formData.challenges.map((challenge, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={challenge}
                  onChange={(e) => handleArrayChange('challenges', index, e.target.value)}
                  placeholder={`Challenge ${index + 1}`}
                  className="flex-1"
                />
                {formData.challenges.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('challenges', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('challenges')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Challenge
            </Button>
            {errors.challenges && <p className="text-sm text-red-500">{errors.challenges}</p>}
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Common Challenges:</h4>
            <div className="flex flex-wrap gap-2">
              {commonChallenges.map((challenge, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newChallenges = [...formData.challenges];
                    if (newChallenges[newChallenges.length - 1] === '') {
                      newChallenges[newChallenges.length - 1] = challenge;
                    } else {
                      newChallenges.push(challenge);
                    }
                    setFormData(prev => ({ ...prev, challenges: newChallenges }));
                  }}
                  className="text-xs"
                >
                  {challenge}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Success Metrics</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          
          <div className="space-y-3">
            <Label>How will you measure success? What KPIs matter most? *</Label>
            {formData.successMetrics.map((metric, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={metric}
                  onChange={(e) => handleArrayChange('successMetrics', index, e.target.value)}
                  placeholder={`Success metric ${index + 1}`}
                  className="flex-1"
                />
                {formData.successMetrics.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('successMetrics', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('successMetrics')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Metric
            </Button>
            {errors.successMetrics && <p className="text-sm text-red-500">{errors.successMetrics}</p>}
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Common Success Metrics:</h4>
            <div className="flex flex-wrap gap-2">
              {commonMetrics.map((metric, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMetrics = [...formData.successMetrics];
                    if (newMetrics[newMetrics.length - 1] === '') {
                      newMetrics[newMetrics.length - 1] = metric;
                    } else {
                      newMetrics.push(metric);
                    }
                    setFormData(prev => ({ ...prev, successMetrics: newMetrics }));
                  }}
                  className="text-xs"
                >
                  {metric}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Strategic Priorities */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Strategic Priorities</h3>
            <Star className="w-4 h-4 text-purple-500" />
          </div>
          
          <div className="space-y-3">
            <Label>What are your top strategic priorities for the next quarter? *</Label>
            {formData.strategicPriorities.map((priority, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={priority}
                  onChange={(e) => handleArrayChange('strategicPriorities', index, e.target.value)}
                  placeholder={`Strategic priority ${index + 1}`}
                  className="flex-1"
                />
                {formData.strategicPriorities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('strategicPriorities', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('strategicPriorities')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Priority
            </Button>
            {errors.strategicPriorities && <p className="text-sm text-red-500">{errors.strategicPriorities}</p>}
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Common Strategic Priorities:</h4>
            <div className="flex flex-wrap gap-2">
              {commonPriorities.map((priority, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPriorities = [...formData.strategicPriorities];
                    if (newPriorities[newPriorities.length - 1] === '') {
                      newPriorities[newPriorities.length - 1] = priority;
                    } else {
                      newPriorities.push(priority);
                    }
                    setFormData(prev => ({ ...prev, strategicPriorities: newPriorities }));
                  }}
                  className="text-xs"
                >
                  {priority}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={isLoading}
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
