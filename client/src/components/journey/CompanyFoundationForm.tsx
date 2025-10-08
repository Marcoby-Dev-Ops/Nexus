import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Save, ArrowRight } from 'lucide-react';

interface CompanyFoundationData {
  // Company Information
  name: string;
  legalName?: string;
  legalStructure: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship' | 'Other';
  foundedDate: string;
  
  // Location
  headquarters: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  
  // Contact Information
  website: string;
  email: string;
  phone: string;
}

interface CompanyFoundationFormProps {
  initialData?: Partial<CompanyFoundationData>;
  onSave: (data: CompanyFoundationData) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function CompanyFoundationForm({ 
  initialData = {}, 
  onSave, 
  onNext, 
  isLoading = false 
}: CompanyFoundationFormProps) {
  const [formData, setFormData] = useState<CompanyFoundationData>({
    name: '',
    legalName: '',
    legalStructure: 'LLC',
    foundedDate: '',
    headquarters: {
      address: '',
      city: '',
      state: '',
      country: 'United States',
      zipCode: ''
    },
    website: '',
    email: '',
    phone: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyFoundationData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!formData.foundedDate) {
      newErrors.foundedDate = 'Founded date is required';
    }

    if (!formData.headquarters.city.trim()) {
      newErrors['headquarters.city'] = 'City is required';
    }

    if (!formData.headquarters.state.trim()) {
      newErrors['headquarters.state'] = 'State is required';
    }

    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    } else if (!formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
            1
          </div>
          Company Foundation
        </CardTitle>
        <CardDescription>
          Set up your basic company information - name, legal structure, founding date, location, and contact details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Acme Corporation"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name (if different)</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => handleInputChange('legalName', e.target.value)}
                placeholder="e.g., Acme Corporation LLC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalStructure">Legal Structure *</Label>
              <Select 
                value={formData.legalStructure} 
                onValueChange={(value) => handleInputChange('legalStructure', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select legal structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foundedDate">Founded Date *</Label>
              <Input
                id="foundedDate"
                type="date"
                value={formData.foundedDate}
                onChange={(e) => handleInputChange('foundedDate', e.target.value)}
                className={errors.foundedDate ? 'border-red-500' : ''}
              />
              {errors.foundedDate && <p className="text-sm text-red-500">{errors.foundedDate}</p>}
            </div>
          </div>
        </div>

        {/* Headquarters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Headquarters</h3>
          
          <div className="space-y-2">
            <Label htmlFor="headquarters.address">Address</Label>
            <Input
              id="headquarters.address"
              value={formData.headquarters.address}
              onChange={(e) => handleInputChange('headquarters.address', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headquarters.city">City *</Label>
              <Input
                id="headquarters.city"
                value={formData.headquarters.city}
                onChange={(e) => handleInputChange('headquarters.city', e.target.value)}
                placeholder="San Francisco"
                className={errors['headquarters.city'] ? 'border-red-500' : ''}
              />
              {errors['headquarters.city'] && <p className="text-sm text-red-500">{errors['headquarters.city']}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters.state">State *</Label>
              <Input
                id="headquarters.state"
                value={formData.headquarters.state}
                onChange={(e) => handleInputChange('headquarters.state', e.target.value)}
                placeholder="CA"
                className={errors['headquarters.state'] ? 'border-red-500' : ''}
              />
              {errors['headquarters.state'] && <p className="text-sm text-red-500">{errors['headquarters.state']}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters.zipCode">ZIP Code</Label>
              <Input
                id="headquarters.zipCode"
                value={formData.headquarters.zipCode}
                onChange={(e) => handleInputChange('headquarters.zipCode', e.target.value)}
                placeholder="94105"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headquarters.country">Country</Label>
            <Select 
              value={formData.headquarters.country} 
              onValueChange={(value) => handleInputChange('headquarters.country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.acme.com"
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@acme.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
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
      </CardContent>
    </Card>
  );
}
