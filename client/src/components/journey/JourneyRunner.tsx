/**
 * Journey Runner Component
 * 
 * Central component for executing a journey step-by-step with playbook integration.
 * Manages journey state, step progression, and displays appropriate step components.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/Separator';
import { useToast } from '@/shared/components/ui/use-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Target, 
  Award,
  Building,
  Lightbulb,
  Users,
  Zap,
  TrendingUp
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { unifiedPlaybookService, type PlaybookTemplate, type UserJourney } from '@/services/playbook/UnifiedPlaybookService';

// Import step components
import QuantumIntroStep from './steps/QuantumIntroStep';
import IdentitySetupChat from '../onboarding/IdentitySetupChat';
import QuantumBlockStep from './steps/QuantumBlockStep';
import QuantumSummaryStep from './steps/QuantumSummaryStep';
import MVPWelcomeStep from './steps/MVPWelcomeStep';
import BusinessUnitsStep from './steps/BusinessUnitsStep';
import IntegrationsStep from './steps/IntegrationsStep';
import MaturityAssessmentStep from './steps/MaturityAssessmentStep';
import MVPSummaryStep from './steps/MVPSummaryStep';

// Import journey step props type
import type { JourneyStepProps } from './types';

interface JourneyRunnerProps {
  onComplete?: (journeyData: any) => void;
  onBack?: () => void;
}

export default function JourneyRunner({ onComplete, onBack }: JourneyRunnerProps) {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeOrgId, getActiveOrg } = useOrganizationStore();

  // State
  const [template, setTemplate] = useState<JourneyTemplate | null>(null);
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<UserJourneyProgress | null>(null);
  const [journeyData, setJourneyData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load journey template and items
  useEffect(() => {
    if (journeyId && user?.id && activeOrgId) {
      loadJourney();
    }
  }, [journeyId, user?.id, activeOrgId]);

  const loadJourney = async () => {
    try {
      setIsLoading(true);

      // Get journey template
      const templateResponse = await unifiedPlaybookService.getPlaybookTemplate(journeyId!);
      if (!templateResponse.success) {
        throw new Error(templateResponse.error || 'Failed to load journey template');
      }
      setTemplate(templateResponse.data);

      // Get journey items
      const itemsResponse = await unifiedPlaybookService.getPlaybookTemplate(journeyId!);
      if (!itemsResponse.success) {
        throw new Error(itemsResponse.error || 'Failed to load journey items');
      }
      setItems(itemsResponse.data);

      // Start or get existing progress
      await startOrGetProgress();

    } catch (error) {
      console.error('Error loading journey:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journey. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startOrGetProgress = async () => {
    if (!user?.id || !activeOrgId) return;

    try {
      // For now, create a new progress instance
      // In a real implementation, you'd check for existing progress
      const progressData: Partial<UserJourneyProgress> = {
        user_id: user.id,
        organization_id: activeOrgId,
        journey_id: `journey_${Date.now()}`,
        template_id: journeyId!,
        current_step: 0,
        total_steps: items.length,
        progress_percentage: 0,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        metadata: {
          template_title: template?.title,
          template_description: template?.description
        }
      };

      setProgress(progressData as UserJourneyProgress);
    } catch (error) {
      console.error('Error starting journey progress:', error);
    }
  };

  const handleStepComplete = async (stepData: any) => {
    if (!progress || !user?.id || !activeOrgId) return;

    try {
      setIsSaving(true);

      // Save step response
      await unifiedPlaybookService.saveStepResponse(
        user.id,
        activeOrgId,
        progress.journey_id,
        items[currentStep].id,
        stepData
      );

      // Update journey data
      setJourneyData(prev => ({ ...prev, [items[currentStep].id]: stepData }));

      // Update progress
      const newProgress = {
        ...progress,
        current_step: currentStep + 1,
        progress_percentage: ((currentStep + 1) / items.length) * 100
      };
      setProgress(newProgress);

      // Move to next step or complete
      if (currentStep < items.length - 1) {
        setCurrentStep(prev => prev + 1);
        toast({
          title: 'Step Complete!',
          description: 'Great progress! Moving to the next step.',
        });
      } else {
        await completeJourney();
      }

    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: 'Error',
        description: 'Failed to save step progress. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeJourney = async () => {
    if (!progress || !user?.id || !activeOrgId) return;

    try {
      setIsSaving(true);

      // Complete journey with maturity assessment
      const completionResponse = await unifiedPlaybookService.completeJourney(
        user.id,
        activeOrgId,
        progress.journey_id
      );

      if (completionResponse.success) {
        const completedProgress = completionResponse.data;
        
        toast({
          title: 'Journey Complete! 🎉',
          description: 'Congratulations! You\'ve successfully completed this journey.',
        });

        // Show maturity assessment if available
        if (completedProgress.maturity_assessment) {
          toast({
            title: 'Maturity Assessment',
            description: `Your business maturity level: ${completedProgress.maturity_assessment.level}/5`,
          });
        }

        onComplete?.(journeyData);
      }

    } catch (error) {
      console.error('Error completing journey:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete journey. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepComponent = () => {
    if (!items[currentStep]) return null;

    const step = items[currentStep];
    const stepProps: JourneyStepProps = {
      stepId: step.id,
      stepIndex: currentStep,
      totalSteps: items.length,
      isActive: true,
      isCompleted: false,
      onStepComplete: handleStepComplete,
      onStepBack: handleStepBack,
      journeyData
    };

    // Render based on component name or step type
    switch (step.component_name) {
      case 'QuantumIntroStep':
        return <QuantumIntroStep {...stepProps} />;
      case 'IdentitySetupChat':
        return <IdentitySetupChat onComplete={handleStepComplete} onBack={handleStepBack} />;
      case 'QuantumBlockStep':
        return <QuantumBlockStep {...stepProps} />;
      case 'QuantumSummaryStep':
        return <QuantumSummaryStep {...stepProps} />;
      case 'MVPWelcomeStep':
        return <MVPWelcomeStep {...stepProps} />;
      case 'BusinessUnitsStep':
        return <BusinessUnitsStep {...stepProps} />;
      case 'IntegrationsStep':
        return <IntegrationsStep {...stepProps} />;
      case 'MaturityAssessmentStep':
        return <MaturityAssessmentStep {...stepProps} />;
      case 'MVPSummaryStep':
        return <MVPSummaryStep {...stepProps} />;
      default:
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground mb-4">{step.description}</p>
            <Button onClick={() => handleStepComplete({ completed: true })}>
              Complete Step
            </Button>
          </div>
        );
    }
  };

  const getStepIcon = (step: JourneyItem) => {
    switch (step.type) {
      case 'step':
        return <Target className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'milestone':
        return <Award className="h-4 w-4" />;
      case 'checklist':
        return <CheckCircle className="h-4 w-4" />;
      case 'building_block':
        return <Building className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journey...</p>
        </div>
      </div>
    );
  }

  if (!template || !items.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Journey Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested journey could not be loaded.</p>
        <Button onClick={() => navigate('/journey-intake')}>
          Browse Journeys
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">{template.title}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>
          
          {/* Playbook Integration Badges */}
          <div className="flex items-center gap-2">
            {template.playbook_id && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Playbook Integrated
              </Badge>
            )}
            {template.complexity && (
              <Badge variant="outline" className="capitalize">
                {template.complexity}
              </Badge>
            )}
            {template.estimated_duration_minutes && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {template.estimated_duration_minutes} min
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress?.current_step || 0} of {items.length} steps
            </span>
          </div>
          <Progress 
            value={progress?.progress_percentage || 0} 
            className="h-2" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Step Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Journey Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    disabled={index > (progress?.current_step || 0)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentStep === index
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : index < (progress?.current_step || 0)
                        ? 'border-green-200 bg-green-50'
                        : 'border-muted hover:border-muted-foreground'
                    } ${index > (progress?.current_step || 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {index < (progress?.current_step || 0) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          getStepIcon(step)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{step.title}</span>
                          {step.is_required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {currentStep === index && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        {step.estimated_duration_minutes && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {step.estimated_duration_minutes} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Playbook Integration Panel */}
          {template.playbook_id && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Playbook Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.building_blocks && template.building_blocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Building Blocks</h4>
                    <div className="space-y-1">
                      {template.building_blocks.slice(0, 3).map((block) => (
                        <div key={block.id} className="flex items-center gap-2 text-xs">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{block.name}</span>
                        </div>
                      ))}
                      {template.building_blocks.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{template.building_blocks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {template.success_metrics && template.success_metrics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Success Metrics</h4>
                    <div className="space-y-1">
                      {template.success_metrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {template.prerequisites && template.prerequisites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                    <div className="space-y-1">
                      {template.prerequisites.map((prereq, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{prereq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Current Step */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStepIcon(items[currentStep])}
                    {items[currentStep].title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {items[currentStep].description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {items.length}
                  </div>
                  {items[currentStep].estimated_duration_minutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {items[currentStep].estimated_duration_minutes} min
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepComponent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
