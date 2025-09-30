import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

interface IndustryBusinessModelData {
  industry: string;
  sector: string;
  businessModel: string;
  companyStage: string;
  companySize: string;
  revenueRange: string;
}

interface IndustryBusinessModelFormProps {
  initialData?: Partial<IndustryBusinessModelData>;
  onSave: (data: IndustryBusinessModelData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function IndustryBusinessModelForm({ 
  initialData = {}, 
  onSave, 
  onNext, 
  onPrevious,
  isLoading = false 
}: IndustryBusinessModelFormProps) {
  const [formData, setFormData] = useState<IndustryBusinessModelData>({
    industry: '',
    sector: '',
    businessModel: 'B2B',
    companyStage: 'startup',
    companySize: '1-10',
    revenueRange: '0-100k',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
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

    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.sector.trim()) {
      newErrors.sector = 'Sector is required';
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            2
          </div>
          Industry & Business Model
        </CardTitle>
        <CardDescription>
          Define your industry, sector, business model, company stage, and size
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industry Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Industry Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
                className={errors.industry ? 'border-red-500' : ''}
              />
              {errors.industry && <p className="text-sm text-red-500">{errors.industry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                placeholder="e.g., Software, Fintech, MedTech"
                className={errors.sector ? 'border-red-500' : ''}
              />
              {errors.sector && <p className="text-sm text-red-500">{errors.sector}</p>}
            </div>
          </div>
        </div>

        {/* Business Model */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Business Model</h3>
          
          <div className="space-y-2">
            <Label htmlFor="businessModel">Business Model</Label>
            <Select 
              value={formData.businessModel} 
              onValueChange={(value) => handleInputChange('businessModel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                <SelectItem value="B2C">B2C (Business to Consumer)</SelectItem>
                <SelectItem value="B2B2C">B2B2C (Business to Business to Consumer)</SelectItem>
                <SelectItem value="Marketplace">Marketplace</SelectItem>
                <SelectItem value="SaaS">SaaS (Software as a Service)</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Freemium">Freemium</SelectItem>
                <SelectItem value="Subscription">Subscription</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Company Stage & Size */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Stage & Size</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyStage">Company Stage</Label>
              <Select 
                value={formData.companyStage} 
                onValueChange={(value) => handleInputChange('companyStage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea Stage</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="growth">Growth Stage</SelectItem>
                  <SelectItem value="scale">Scale Stage</SelectItem>
                  <SelectItem value="mature">Mature</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select 
                value={formData.companySize} 
                onValueChange={(value) => handleInputChange('companySize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Revenue Range */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Revenue Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="revenueRange">Annual Revenue Range</Label>
            <Select 
              value={formData.revenueRange} 
              onValueChange={(value) => handleInputChange('revenueRange', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select revenue range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-100k">$0 - $100K</SelectItem>
                <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                <SelectItem value="10m-50m">$10M - $50M</SelectItem>
                <SelectItem value="50m+">$50M+</SelectItem>
                <SelectItem value="pre-revenue">Pre-revenue</SelectItem>
              </SelectContent>
            </Select>
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
