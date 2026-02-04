import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { useToast } from '@/shared/ui/components/Toast';
import { ArrowLeft, CheckCircle, Clock, Target } from 'lucide-react';

// Import form components
import { CompanyFoundationForm } from '@/components/journey/CompanyFoundationForm';
import { IndustryBusinessModelForm } from '@/components/journey/IndustryBusinessModelForm';
import { MissionVisionForm } from '@/components/journey/MissionVisionForm';
import { CoreValuesForm } from '@/components/journey/CoreValuesForm';
import { StrategicContextForm } from '@/components/journey/StrategicContextForm';
import { IdentityReviewForm } from '@/components/journey/IdentityReviewForm';

// Import services
import { businessIdentityService } from '@/services/business/BusinessIdentityService';
import { useJourneyManagement } from '@/hooks/useJourneyManagement';

interface IdentityData {
  companyFoundation?: any;
  industryBusinessModel?: any;
  missionVision?: any;
  coreValues?: any;
  strategicContext?: any;
}

const JOURNEY_STEPS = [
  { id: 'companyFoundation', title: 'Company Foundation', component: CompanyFoundationForm },
  { id: 'industryBusinessModel', title: 'Industry & Business Model', component: IndustryBusinessModelForm },
  { id: 'missionVision', title: 'Mission & Vision', component: MissionVisionForm },
  { id: 'coreValues', title: 'Core Values', component: CoreValuesForm },
  { id: 'strategicContext', title: 'Strategic Context', component: StrategicContextForm },
  { id: 'review', title: 'Review & Complete', component: IdentityReviewForm },
];

export default function BusinessIdentityJourneyPage() {
  const navigate = useNavigate();
  const { journeyId } = useParams();
  const { toast } = useToast();
  const { completeJourney } = useJourneyManagement();

  const [currentStep, setCurrentStep] = useState(0);
  const [identityData, setIdentityData] = useState<IdentityData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentStepData = JOURNEY_STEPS[currentStep];
  const progress = ((currentStep + 1) / JOURNEY_STEPS.length) * 100;

  useEffect(() => {
    // Load existing journey data if journeyId is provided
    if (journeyId) {
      loadJourneyData();
    }
  }, [journeyId]);

  const loadJourneyData = async () => {
    try {
      setIsLoading(true);
      const response = await businessIdentityService.getIdentityStatus();
      if (response.success) {
        setIdentityData(response.data || {});
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (stepId: string, data: any) => {
    try {
      setIsLoading(true);
      
      let response;
      switch (stepId) {
        case 'companyFoundation':
          response = await businessIdentityService.updateCompanyFoundation(data);
          break;
        case 'industryBusinessModel':
          response = await businessIdentityService.updateIndustryBusinessModel(data);
          break;
        case 'missionVision':
          response = await businessIdentityService.updateMissionVision(data);
          break;
        case 'coreValues':
          response = await businessIdentityService.updateCoreValues(data);
          break;
        case 'strategicContext':
          response = await businessIdentityService.updateStrategicContext(data);
          break;
        default:
          throw new Error('Unknown step');
      }

      if (response.success) {
        setIdentityData(prev => ({
          ...prev,
          [stepId]: data
        }));
        
        toast({
          title: 'Progress Saved',
          description: 'Your business identity information has been saved.',
          type: 'success'
        });
      } else {
        throw new Error(response.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your progress. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < JOURNEY_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEdit = (stepId: string) => {
    const stepIndex = JOURNEY_STEPS.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      
      // Validate completion
      const validationResponse = await businessIdentityService.validateIdentityCompletion();
      if (!validationResponse.success || !validationResponse.data.isComplete) {
        throw new Error('Please complete all sections before finishing the journey');
      }

      // Complete the journey
      if (journeyId) {
        const completeResponse = await completeJourney(journeyId);
        if (!completeResponse.success) {
          throw new Error(completeResponse.error || 'Failed to complete journey');
        }
      }

      toast({
        title: 'Journey Completed!',
        description: 'Your business identity has been successfully established.',
        type: 'success'
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing journey:', error);
      toast({
        title: 'Completion Failed',
        description: error instanceof Error ? error.message : 'Failed to complete the journey. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBackToJourneys = () => {
    navigate('/journey-management');
  };

  if (isLoading && currentStep === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading journey...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentFormComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToJourneys}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journeys
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold">Business Identity Setup</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {JOURNEY_STEPS.length}: {currentStepData.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>~{JOURNEY_STEPS.length * 5} minutes</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{Math.round(progress)}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {JOURNEY_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentFormComponent
              initialData={identityData[currentStepData.id]}
              onSave={(data) => handleSave(currentStepData.id, data)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onEdit={handleEdit}
              onComplete={handleComplete}
              isLoading={isLoading || isCompleting}
              identityData={identityData}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
