import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Save, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

interface MissionVisionData {
  missionStatement: string;
  visionStatement: string;
}

interface MissionVisionFormProps {
  initialData?: Partial<MissionVisionData>;
  onSave: (data: MissionVisionData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function MissionVisionForm({ 
  initialData = {}, 
  onSave, 
  onNext, 
  onPrevious,
  isLoading = false 
}: MissionVisionFormProps) {
  const [formData, setFormData] = useState<MissionVisionData>({
    missionStatement: '',
    visionStatement: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.missionStatement.trim()) {
      newErrors.missionStatement = 'Mission statement is required';
    } else if (formData.missionStatement.trim().length < 20) {
      newErrors.missionStatement = 'Mission statement should be at least 20 characters';
    }

    if (!formData.visionStatement.trim()) {
      newErrors.visionStatement = 'Vision statement is required';
    } else if (formData.visionStatement.trim().length < 20) {
      newErrors.visionStatement = 'Vision statement should be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      onSave(formData);
      onNext();
    }
  };

  const missionExamples = [
    "To democratize access to financial services through innovative technology solutions.",
    "To empower small businesses with the tools they need to compete in the digital economy.",
    "To revolutionize healthcare delivery through AI-powered diagnostic tools.",
    "To create sustainable energy solutions for a better tomorrow."
  ];

  const visionExamples = [
    "A world where every business has access to the financial tools they need to thrive.",
    "To be the leading platform that transforms how small businesses operate globally.",
    "To eliminate preventable diseases through early detection and personalized care.",
    "To power a carbon-neutral future through renewable energy innovation."
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            3
          </div>
          Mission & Vision
        </CardTitle>
        <CardDescription>
          Craft your company mission statement and vision for the future
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Statement */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Mission Statement</h3>
            <Lightbulb className="w-4 h-4 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="missionStatement">
              What is your company's purpose? What problem do you solve? *
            </Label>
            <Textarea
              id="missionStatement"
              value={formData.missionStatement}
              onChange={(e) => handleInputChange('missionStatement', e.target.value)}
              placeholder="Describe your company's core purpose and the problem you solve..."
              className={`min-h-[120px] ${errors.missionStatement ? 'border-red-500' : ''}`}
            />
            {errors.missionStatement && <p className="text-sm text-red-500">{errors.missionStatement}</p>}
            <p className="text-sm text-muted-foreground">
              {formData.missionStatement.length}/500 characters
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Example Mission Statements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {missionExamples.map((example, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Vision Statement</h3>
            <Lightbulb className="w-4 h-4 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visionStatement">
              What is your company's long-term vision? What future do you want to create? *
            </Label>
            <Textarea
              id="visionStatement"
              value={formData.visionStatement}
              onChange={(e) => handleInputChange('visionStatement', e.target.value)}
              placeholder="Describe your company's vision for the future and the impact you want to make..."
              className={`min-h-[120px] ${errors.visionStatement ? 'border-red-500' : ''}`}
            />
            {errors.visionStatement && <p className="text-sm text-red-500">{errors.visionStatement}</p>}
            <p className="text-sm text-muted-foreground">
              {formData.visionStatement.length}/500 characters
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Example Vision Statements:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {visionExamples.map((example, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💡 Tips for Writing Great Mission & Vision Statements:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Mission</strong>: Focus on what you do today and why it matters</li>
            <li>• <strong>Vision</strong>: Paint a picture of the future you want to create</li>
            <li>• Keep them clear, concise, and inspiring</li>
            <li>• Make sure they align with your business goals</li>
            <li>• Use language that resonates with your target audience</li>
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
