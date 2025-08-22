import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Label } from '@/shared/components/ui/Label';
import type { CreateIntegrationRequest } from '../types/integration';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface IntegrationWizardProps {
  onComplete: (integration: CreateIntegrationRequest) => void;
  onCancel: () => void;
}

type WizardStep = 'basic' | 'configuration' | 'review';

export const IntegrationWizard: React.FC<IntegrationWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [formData, setFormData] = useState<Partial<CreateIntegrationRequest>>({
    name: '',
    description: '',
    provider: '',
    type: 'api',
    config: {},
    metadata: {
      version: '1.0.0',
      category: 'general',
      tags: [],
    },
  });

  const updateFormData = (updates: Partial<CreateIntegrationRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('configuration');
    else if (currentStep === 'configuration') setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'configuration') setCurrentStep('basic');
    else if (currentStep === 'review') setCurrentStep('configuration');
  };

  const handleSubmit = () => {
    if (formData.name && formData.description && formData.provider && formData.type) {
      onComplete(formData as CreateIntegrationRequest);
    }
  };

  const isBasicValid = formData.name && formData.description && formData.provider;
  const isConfigValid = formData.config && Object.keys(formData.config).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create New Integration</h2>
            <Button variant="ghost" onClick={onCancel}>×</Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'basic' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'basic' ? '1' : <Check className="w-4 h-4" />}
              </div>
              <div className={`w-16 h-1 ${
                currentStep === 'configuration' || currentStep === 'review' ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'configuration' ? 'bg-blue-500 text-white' : 
                currentStep === 'review' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'configuration' ? '2' : currentStep === 'review' ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className={`w-16 h-1 ${
                currentStep === 'review' ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'review' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 'basic' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Integration Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="e.g., Stripe Payment Gateway"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      placeholder="Describe what this integration does..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => updateFormData({ provider: e.target.value })}
                      placeholder="e.g., Stripe, PayPal, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Integration Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => updateFormData({ type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API Integration</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="oauth">OAuth</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'configuration' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.type === 'api' && (
                    <>
                      <div>
                        <Label htmlFor="baseUrl">Base URL</Label>
                        <Input
                          id="baseUrl"
                          value={formData.config?.baseUrl || ''}
                          onChange={(e) => updateFormData({
                            config: { ...formData.config, baseUrl: e.target.value }
                          })}
                          placeholder="https://api.example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={formData.config?.apiKey || ''}
                          onChange={(e) => updateFormData({
                            config: { ...formData.config, apiKey: e.target.value }
                          })}
                          placeholder="Enter your API key"
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.type === 'webhook' && (
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={formData.config?.webhookUrl || ''}
                        onChange={(e) => updateFormData({
                          config: { ...formData.config, webhookUrl: e.target.value }
                        })}
                        placeholder="https://your-domain.com/webhook"
                      />
                    </div>
                  )}

                  {formData.type === 'oauth' && (
                    <>
                      <div>
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          value={formData.config?.oauthConfig?.clientId || ''}
                          onChange={(e) => updateFormData({
                            config: {
                              ...formData.config,
                              oauthConfig: {
                                ...formData.config?.oauthConfig,
                                clientId: e.target.value
                              }
                            }
                          })}
                          placeholder="Enter OAuth client ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          value={formData.config?.oauthConfig?.clientSecret || ''}
                          onChange={(e) => updateFormData({
                            config: {
                              ...formData.config,
                              oauthConfig: {
                                ...formData.config?.oauthConfig,
                                clientSecret: e.target.value
                              }
                            }
                          })}
                          placeholder="Enter OAuth client secret"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Name:</span> {formData.name}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {formData.description}
                    </div>
                    <div>
                      <span className="font-medium">Provider:</span> {formData.provider}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {formData.type}
                    </div>
                    {formData.config && Object.keys(formData.config).length > 0 && (
                      <div>
                        <span className="font-medium">Configuration:</span>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          {JSON.stringify(formData.config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 'basic'}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep === 'review' ? (
              <Button onClick={handleSubmit}>
                Create Integration
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 'basic' && !isBasicValid) ||
                  (currentStep === 'configuration' && !isConfigValid)
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
