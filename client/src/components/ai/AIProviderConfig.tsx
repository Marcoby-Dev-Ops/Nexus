import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Brain, Zap, DollarSign, CheckCircle } from 'lucide-react';
import { openAIService } from '@/services/ai/OpenAIService';

interface AIProviderConfigProps {
  onProviderChange?: (provider: 'openai' | 'openrouter') => void;
}

export default function AIProviderConfig({ onProviderChange }: AIProviderConfigProps) {
  const [currentProvider, setCurrentProvider] = useState<'openai' | 'openrouter'>('openai');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    // Get current provider and models
    const provider = openAIService.getProvider();
    setCurrentProvider(provider);
    setAvailableModels(openAIService.getAvailableModels());
  }, []);

  const handleProviderChange = (provider: 'openai' | 'openrouter') => {
    openAIService.setProvider(provider);
    setCurrentProvider(provider);
    setAvailableModels(openAIService.getAvailableModels());
    onProviderChange?.(provider);
  };

  const getProviderInfo = (provider: 'openai' | 'openrouter') => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'Direct OpenAI API access',
          icon: <Brain className="w-5 h-5" />,
          features: ['GPT-4', 'GPT-4 Turbo', 'Reliable', 'Fast'],
          cost: 'Standard OpenAI pricing'
        };
      case 'openrouter':
        return {
          name: 'OpenRouter',
          description: 'Multi-provider AI gateway',
          icon: <Zap className="w-5 h-5" />,
          features: ['Claude 3', 'Llama 2', 'Gemini', 'Multiple Models'],
          cost: 'Competitive pricing'
        };
    }
  };

  const currentInfo = getProviderInfo(currentProvider);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Provider Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Provider Display */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {currentInfo.icon}
            <div>
              <h3 className="font-semibold">{currentInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{currentInfo.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Switch Provider</label>
          <Select value={currentProvider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  OpenAI
                </div>
              </SelectItem>
              <SelectItem value="openrouter">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  OpenRouter
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Provider Features */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Available Models</label>
          <div className="flex flex-wrap gap-2">
            {availableModels.map((model) => (
              <Badge key={model} variant="outline" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
        </div>

        {/* Features & Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Features</label>
            <div className="flex flex-wrap gap-1">
              {currentInfo.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pricing</label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              {currentInfo.cost}
            </div>
          </div>
        </div>

        {/* Usage Recommendations */}
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Usage Recommendations
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Identity & Analysis:</strong> {openAIService.getRecommendedModel('identity')}</p>
            <p><strong>Content Generation:</strong> {openAIService.getRecommendedModel('generation')}</p>
            <p><strong>Validation:</strong> {openAIService.getRecommendedModel('validation')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
