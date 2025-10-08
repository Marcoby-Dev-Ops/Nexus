import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Save, ArrowRight, ArrowLeft, Plus, X, Heart } from 'lucide-react';

interface CoreValuesData {
  values: string[];
  culturePrinciples: string[];
}

interface CoreValuesFormProps {
  initialData?: Partial<CoreValuesData>;
  onSave: (data: CoreValuesData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function CoreValuesForm({ 
  initialData = {}, 
  onSave, 
  onNext, 
  onPrevious,
  isLoading = false 
}: CoreValuesFormProps) {
  const [formData, setFormData] = useState<CoreValuesData>({
    values: [''],
    culturePrinciples: [''],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleArrayChange = (field: 'values' | 'culturePrinciples', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'values' | 'culturePrinciples') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'values' | 'culturePrinciples', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const validValues = formData.values.filter(v => v.trim() !== '');
    const validPrinciples = formData.culturePrinciples.filter(p => p.trim() !== '');

    if (validValues.length === 0) {
      newErrors.values = 'At least one core value is required';
    }

    if (validPrinciples.length === 0) {
      newErrors.culturePrinciples = 'At least one culture principle is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const cleanData = {
        values: formData.values.filter(v => v.trim() !== ''),
        culturePrinciples: formData.culturePrinciples.filter(p => p.trim() !== '')
      };
      onSave(cleanData);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      const cleanData = {
        values: formData.values.filter(v => v.trim() !== ''),
        culturePrinciples: formData.culturePrinciples.filter(p => p.trim() !== '')
      };
      onSave(cleanData);
      onNext();
    }
  };

  const commonValues = [
    'Integrity', 'Innovation', 'Excellence', 'Collaboration', 'Transparency',
    'Customer Focus', 'Respect', 'Accountability', 'Growth', 'Diversity',
    'Quality', 'Trust', 'Passion', 'Empowerment', 'Sustainability'
  ];

  const commonPrinciples = [
    'We value open communication and feedback',
    'We embrace failure as a learning opportunity',
    'We prioritize work-life balance',
    'We celebrate diversity and inclusion',
    'We encourage continuous learning and development',
    'We act with integrity in all our decisions',
    'We put our customers at the center of everything we do',
    'We foster a culture of innovation and creativity'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            4
          </div>
          Core Values
        </CardTitle>
        <CardDescription>
          Define your company values and culture principles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Values */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Core Values</h3>
            <Heart className="w-4 h-4 text-red-500" />
          </div>
          
          <div className="space-y-3">
            <Label>What values guide your company's decisions and actions? *</Label>
            {formData.values.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => handleArrayChange('values', index, e.target.value)}
                  placeholder={`Core value ${index + 1}`}
                  className="flex-1"
                />
                {formData.values.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('values', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('values')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Value
            </Button>
            {errors.values && <p className="text-sm text-red-500">{errors.values}</p>}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Common Core Values:</h4>
            <div className="flex flex-wrap gap-2">
              {commonValues.map((value, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newValues = [...formData.values];
                    if (newValues[newValues.length - 1] === '') {
                      newValues[newValues.length - 1] = value;
                    } else {
                      newValues.push(value);
                    }
                    setFormData(prev => ({ ...prev, values: newValues }));
                  }}
                  className="text-xs"
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Culture Principles */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Culture Principles</h3>
            <Heart className="w-4 h-4 text-red-500" />
          </div>
          
          <div className="space-y-3">
            <Label>What principles define your company culture? *</Label>
            {formData.culturePrinciples.map((principle, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={principle}
                  onChange={(e) => handleArrayChange('culturePrinciples', index, e.target.value)}
                  placeholder={`Culture principle ${index + 1}`}
                  className="flex-1 min-h-[60px]"
                />
                {formData.culturePrinciples.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('culturePrinciples', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('culturePrinciples')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Principle
            </Button>
            {errors.culturePrinciples && <p className="text-sm text-red-500">{errors.culturePrinciples}</p>}
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Example Culture Principles:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {commonPrinciples.map((principle, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💡 Tips for Defining Values & Culture:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Values</strong>: Choose 3-7 core values that truly guide your decisions</li>
            <li>• <strong>Culture Principles</strong>: Define how you work together and treat each other</li>
            <li>• Be authentic - choose values you actually live by</li>
            <li>• Make them specific and actionable</li>
            <li>• Ensure they align with your mission and vision</li>
          </ul>
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
