/**
 * Quantum Onboarding Flow
 * 
 * Guides users through setting up their business using the 7 quantum building blocks.
 * This provides a universal schema that works for any business, regardless of industry or size.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { 
  getAllQuantumBlocks, 
  getQuantumBlock, 
  type QuantumBlock, 
  type QuantumBusinessProfile,
  type QuantumBlockProfile,
  calculateBusinessHealth,
  generateQuantumInsights,
  generateQuantumRecommendations
} from '@/core/config/quantumBusinessModel';
import { OnboardingService } from '@/shared/services/OnboardingService';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/shared/hooks/useUserProfile';
import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, ArrowRight, CheckCircle, 
  AlertCircle, Target, Zap
} from 'lucide-react';

interface QuantumOnboardingFlowProps {
  onComplete: (profile: QuantumBusinessProfile) => void;
}

interface QuantumStepData {
  blockId: string;
  properties: Record<string, any>;
  strength: number;
  health: number;
}

const QuantumOnboardingFlow: React.FC<QuantumOnboardingFlowProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const onboardingService = new OnboardingService();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, QuantumStepData>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  const quantumBlocks = getAllQuantumBlocks();
  const totalSteps = quantumBlocks.length + 2; // +2 for intro and summary

  // Initialize step data for all blocks
  useEffect(() => {
    const initialData: Record<string, QuantumStepData> = {};
    quantumBlocks.forEach(block => {
      initialData[block.id] = {
        blockId: block.id,
        properties: {},
        strength: 50, // Default middle value
        health: 70    // Default good health
      };
    });
    setStepData(initialData);
  }, []);

  const handleStepComplete = (blockId: string, data: Partial<QuantumStepData>) => {
    setStepData(prev => ({
      ...prev,
      [blockId]: { ...prev[blockId], ...data }
    }));
    setCompletedSteps(prev => new Set([...prev, blockId]));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Build quantum business profile
      const quantumProfile: QuantumBusinessProfile = {
        id: `quantum-${user?.id}-${Date.now()}`,
        companyId: user?.company?.id || 'unknown',
        blocks: Object.values(stepData).map(data => ({
          blockId: data.blockId,
          strength: data.strength,
          health: data.health,
          properties: data.properties,
          healthIndicators: {},
          aiCapabilities: [],
          marketplaceIntegrations: []
        })),
        relationships: [],
        healthScore: calculateBusinessHealth({
          id: '',
          companyId: '',
          blocks: Object.values(stepData).map(data => ({
            blockId: data.blockId,
            strength: data.strength,
            health: data.health,
            properties: data.properties,
            healthIndicators: {},
            aiCapabilities: [],
            marketplaceIntegrations: []
          })),
          relationships: [],
          healthScore: 0,
          maturityLevel: 'startup',
          lastUpdated: new Date().toISOString()
        }),
        maturityLevel: 'startup',
        lastUpdated: new Date().toISOString()
      };

      // Save to onboarding service
      await onboardingService.saveQuantumProfile(quantumProfile);
      
      onComplete(quantumProfile);
    } catch (error) {
      console.error('Error completing quantum onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderIntroStep = () => (
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
                 <Button onClick={handleNext} size="lg" className="px-8">
           Create Your Business Snapshot
           <ArrowRight className="ml-2 h-4 w-4" />
         </Button>
      </div>
    </div>
  );

  const renderBlockStep = (block: QuantumBlock) => {
    const currentData = stepData[block.id] || { blockId: block.id, properties: {}, strength: 50, health: 70 };
    const isCompleted = completedSteps.has(block.id);

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
          {isCompleted && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Badge>
          )}
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
                  <label className="text-sm font-medium">
                    {property.name}
                    {property.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder={property.examples[0]}
                    value={currentData.properties[property.id] || ''}
                    onChange={(e) => {
                      const newData = {
                        ...currentData,
                        properties: {
                          ...currentData.properties,
                          [property.id]: e.target.value
                        }
                      };
                      setStepData(prev => ({ ...prev, [block.id]: newData }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{property.description}</p>
                </div>
              ))}
            </div>

            {/* Strength & Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Strength (1-100)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={currentData.strength}
                  onChange={(e) => {
                    const newData = { ...currentData, strength: parseInt(e.target.value) };
                    setStepData(prev => ({ ...prev, [block.id]: newData }));
                  }}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  Strength: {currentData.strength}% - How well developed is this area?
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Health (1-100)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={currentData.health}
                  onChange={(e) => {
                    const newData = { ...currentData, health: parseInt(e.target.value) };
                    setStepData(prev => ({ ...prev, [block.id]: newData }));
                  }}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  Health: {currentData.health}% - How well is this area performing?
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
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button 
            onClick={() => {
              handleStepComplete(block.id, currentData);
              handleNext();
            }}
          >
            {isCompleted ? 'Update & Continue' : 'Complete & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderSummaryStep = () => {
    const insights = generateQuantumInsights({
      id: '',
      companyId: '',
      blocks: Object.values(stepData).map(data => ({
        blockId: data.blockId,
        strength: data.strength,
        health: data.health,
        properties: data.properties,
        healthIndicators: {},
        aiCapabilities: [],
        marketplaceIntegrations: []
      })),
      relationships: [],
      healthScore: 0,
      maturityLevel: 'startup',
      lastUpdated: new Date().toISOString()
    });

    const recommendations = generateQuantumRecommendations({
      id: '',
      companyId: '',
      blocks: Object.values(stepData).map(data => ({
        blockId: data.blockId,
        strength: data.strength,
        health: data.health,
        properties: data.properties,
        healthIndicators: {},
        aiCapabilities: [],
        marketplaceIntegrations: []
      })),
      relationships: [],
      healthScore: 0,
      maturityLevel: 'startup',
      lastUpdated: new Date().toISOString()
    });

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
                   <h1 className="text-3xl font-bold">Your Business Snapshot</h1>
         <p className="text-xl text-muted-foreground">
           Here's what we've discovered about your business and our recommendations
         </p>
        </div>

        {/* Business Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Business Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(stepData).map(data => {
                const block = getQuantumBlock(data.blockId);
                if (!block) return null;
                
                return (
                  <div key={data.blockId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <block.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{block.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Strength</span>
                        <span>{data.strength}%</span>
                      </div>
                      <Progress value={data.strength} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Health</span>
                        <span>{data.health}%</span>
                      </div>
                      <Progress value={data.health} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 5).map(insight => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={insight.type === 'risk' ? 'destructive' : 'default'}>
                        {insight.type}
                      </Badge>
                      <span className="font-medium">{insight.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Priority: {insight.priority} | Impact: {insight.impact}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{rec.type.replace('_', ' ')}</Badge>
                      <span className="font-medium">{rec.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Impact: {rec.impact} | Effort: {rec.effort} | Est. Value: ${rec.estimatedValue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button 
            onClick={handleComplete} 
            size="lg" 
            className="px-8"
            disabled={isLoading}
          >
            {isLoading ? 'Setting Up Your Business...' : 'Complete Setup & Launch Nexus'}
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return renderIntroStep();
    } else if (currentStep <= quantumBlocks.length) {
      const blockIndex = currentStep - 1;
      const block = quantumBlocks[blockIndex];
      return renderBlockStep(block);
    } else {
      return renderSummaryStep();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Setup Progress</span>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      {renderCurrentStep()}
    </div>
  );
};

export default QuantumOnboardingFlow;
