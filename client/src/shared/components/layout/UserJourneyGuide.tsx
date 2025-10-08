import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

interface UserJourneyGuideProps {
  onComplete?: () => void;
  className?: string;
}

export const UserJourneyGuide: React.FC<UserJourneyGuideProps> = ({ 
  onComplete,
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([
    {
      id: 'profile-setup',
      title: 'Complete Your Profile',
      description: 'Add your business information and preferences',
      completed: false,
      required: true,
      order: 1,
    },
    {
      id: 'first-integration',
      title: 'Connect Your First Tool',
      description: 'Integrate with your existing business tools',
      completed: false,
      required: true,
      order: 2,
    },
    {
      id: 'team-invite',
      title: 'Invite Your Team',
      description: 'Start collaborating with your team members',
      completed: false,
      required: false,
      order: 3,
    },
    {
      id: 'first-automation',
      title: 'Create Your First Automation',
      description: 'Set up automated workflows to save time',
      completed: false,
      required: false,
      order: 4,
    },
    {
      id: 'analytics-setup',
      title: 'Configure Analytics',
      description: 'Set up tracking for your business metrics',
      completed: false,
      required: false,
      order: 5,
    },
    {
      id: 'business-assessment',
      title: 'Complete Business Assessment',
      description: 'Set up your business goals and success metrics',
      completed: false,
      required: true,
      order: 6,
    },
  ]);

  const completedSteps = journeySteps.filter(step => step.completed).length;
  const totalSteps = journeySteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepComplete = (stepId: string) => {
    setJourneySteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, completed: true }
          : step
      )
    );
  };

  const handleNextStep = () => {
    if (currentStep < journeySteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (completedSteps === totalSteps && onComplete) {
      onComplete();
    }
  }, [completedSteps, totalSteps, onComplete]);

  useEffect(() => {
    // Auto-advance to next incomplete step
    const nextIncompleteStep = journeySteps.findIndex(step => !step.completed);
    if (nextIncompleteStep !== -1 && nextIncompleteStep !== currentStep) {
      setCurrentStep(nextIncompleteStep);
    }
  }, [journeySteps, currentStep]);

  const currentStepData = journeySteps[currentStep];

  return (
    <div className={`bg-card p-6 rounded-lg border ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Complete these steps to get the most out of Nexus
        </p>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{completedSteps} of {totalSteps} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {journeySteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : index === currentStep
                  ? 'bg-primary border-primary text-white'
                  : 'bg-muted border-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              {index < journeySteps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step.completed ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      {currentStepData && (
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentStepData.completed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {currentStepData.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-lg font-medium">{currentStepData.title}</h4>
                {currentStepData.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {currentStepData.description}
              </p>
              
              {!currentStepData.completed && (
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleStepComplete(currentStepData.id)}
                    className="w-full sm:w-auto"
                  >
                    Mark as Complete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {currentStepData && !currentStepData.completed && (
            <Button
              variant="outline"
              onClick={() => handleStepComplete(currentStepData.id)}
            >
              Skip for Now
            </Button>
          )}
          
          <Button
            onClick={handleNextStep}
            disabled={currentStep === journeySteps.length - 1}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 
