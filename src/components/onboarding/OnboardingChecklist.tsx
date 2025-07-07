import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { CheckCircle, Circle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { useNavigate } from 'react-router-dom';

const stepConfig = {
  welcome: { title: 'Explore the Dashboard', description: 'Take a look around your new command center.', path: '/dashboard' },
  company_profile: { title: 'Complete Your Profile', description: 'Fill in your company details for personalized AI insights.', path: '/onboarding/company-profile' },
  connect_source: { title: 'Connect a Data Source', description: 'Integrate your tools to see the full picture.', path: '/settings' },
  ask_ai: { title: 'Ask the AI Assistant', description: 'Get your first AI-powered answer.', path: '/ai-chat' },
};

type StepKey = keyof typeof stepConfig;

export const OnboardingChecklist: React.FC = () => {
  const { steps, isOpen, isCompleted, toggleChecklist } = useOnboarding();
  const navigate = useNavigate();

  if (isCompleted) {
    return null;
  }
  
  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const handleStepClick = (step: StepKey) => {
    navigate(stepConfig[step].path);
    toggleChecklist(); // close the checklist when a step is clicked
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 w-full max-w-sm z-50"
        >
          <Card className="shadow-2xl">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Getting Started Guide</h3>
                <Button variant="ghost" size="icon" onClick={toggleChecklist}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete these steps to unlock the full power of Nexus.
              </p>
              <Progress value={progressPercentage} className="mt-3" />
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(stepConfig).map(([stepKey, config]) => {
                const isStepCompleted = steps[stepKey as StepKey];
                return (
                  <div key={stepKey} className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${isStepCompleted ? 'bg-success/5 dark:bg-success/20' : 'bg-background hover:bg-muted/50'}`}>
                    <div>
                      {isStepCompleted ? (
                        <CheckCircle className="h-6 w-6 text-success" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium ${isStepCompleted ? 'line-through text-muted-foreground' : ''}`}>{config.title}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      {!isStepCompleted && (
                        <Button
                          variant="link"
                          className="p-0 h-auto mt-1 text-sm"
                          onClick={() => handleStepClick(stepKey as StepKey)}
                        >
                          Go to Step <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 