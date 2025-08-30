import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Rocket,
  Users,
  Zap,
  BarChart3
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface FirstTimeWelcomeProps {
  userName?: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const FirstTimeWelcome: React.FC<FirstTimeWelcomeProps> = ({ 
  userName, 
  onComplete, 
  onSkip 
}) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome!',
      description: 'We\'re glad you\'re here',
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      content: `You're all set up and ready to go.
Let's get you started with your business journey.`
    },
    {
      title: 'What to Expect',
      description: 'A quick overview of what\'s ahead',
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      content: `We'll help you set up your profile and connect your tools.
Then you'll be ready to start building your business.`
    },
    {
      title: 'Getting Started',
      description: 'Just a few quick steps',
      icon: <Zap className="w-8 h-8 text-primary" />,
      content: `We'll walk you through the basics.
It only takes a few minutes to get everything configured.`
    },
    {
      title: 'Ready to Begin',
      description: 'Let\'s get you set up',
      icon: <Rocket className="w-8 h-8 text-primary" />,
      content: `Everything looks good!
Let's start building your business.`
    }
  ];

  useEffect(() => {
    // Show confetti on first step
    if (currentStep === 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-6">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.1}
        />
      )}
      
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {currentStepData.icon}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              {currentStepData.title}
            </CardTitle>
            <p className="text-muted-foreground text-lg mb-4">
              {currentStepData.description}
            </p>
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="text-sm">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent className="space-y-6">
                         <div className="text-center">
               <p className="text-muted-foreground text-base leading-relaxed">
                 {currentStepData.content}
               </p>
             </div>



            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
              
              <Button 
                onClick={handleNext}
                className="px-8 py-3"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <Rocket className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
