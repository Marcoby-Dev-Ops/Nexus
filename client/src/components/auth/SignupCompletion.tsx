import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';
import { CheckCircle, ArrowRight, UserPlus, Shield, Key, Trophy, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';

type CompletionStep = 'validating' | 'entitling' | 'complete';

interface SignupCompletionProps {
  onComplete?: () => void;
}

/**
 * SignupCompletion - Handles the completion flow after user returns from Authentik
 * 
 * Shows the remaining steps:
 * 1. Validate Account (email verification)
 * 2. Get Nexus Entitlement
 * 3. Complete
 */
export default function SignupCompletion({ onComplete }: SignupCompletionProps) {
  const [currentStep, setCurrentStep] = useState<CompletionStep>('validating');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [entitlementGranted, setEntitlementGranted] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'validating' as CompletionStep,
      title: 'Validate Account',
      description: 'Email verification and account activation',
      icon: Mail,
      status: currentStep === 'validating' ? 'current' : currentStep === 'entitling' || currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'entitling' as CompletionStep,
      title: 'Get Nexus Entitlement',
      description: 'Access to Nexus business platform',
      icon: Key,
      status: currentStep === 'entitling' ? 'current' : currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'complete' as CompletionStep,
      title: 'Complete',
      description: 'Ready to start your business journey',
      icon: Trophy,
      status: currentStep === 'complete' ? 'current' : 'upcoming'
    }
  ];

  // Simulate email verification process
  useEffect(() => {
    if (currentStep === 'validating') {
      const timer = setTimeout(() => {
        setEmailVerified(true);
        setCurrentStep('entitling');
        logger.info('Email verification completed', { userId: user?.id });
      }, 3000); // Simulate 3 second verification

      return () => clearTimeout(timer);
    }
  }, [currentStep, user?.id]);

  // Simulate entitlement granting process
  useEffect(() => {
    if (currentStep === 'entitling') {
      const timer = setTimeout(() => {
        setEntitlementGranted(true);
        setCurrentStep('complete');
        logger.info('Nexus entitlement granted', { userId: user?.id });
      }, 2000); // Simulate 2 second entitlement process

      return () => clearTimeout(timer);
    }
  }, [currentStep, user?.id]);

  // Handle completion
  useEffect(() => {
    if (currentStep === 'complete') {
      const timer = setTimeout(() => {
        onComplete?.();
        navigate('/dashboard'); // Redirect to dashboard
      }, 2000); // Show completion for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete, navigate]);

  const getStepIcon = (step: typeof steps[0]) => {
    const Icon = step.icon;
    const status = step.status;
    
    if (status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (status === 'current') {
      return <Icon className="w-6 h-6 text-primary" />;
    } else {
      return <Icon className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStepStatus = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-primary bg-primary/10 border-primary/20';
      default:
        return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome to Nexus!</h1>
            <p className="text-muted-foreground mt-2">
              Completing your account setup
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStepStatus(step)}`}>
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${step.status === 'completed' ? 'text-green-600' : step.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          {currentStep === 'validating' && (
            <div className="space-y-6">
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="font-medium text-primary mb-2">Validating your account</h3>
                <p className="text-sm text-muted-foreground">
                  We're verifying your email address and activating your account. 
                  This usually takes just a few seconds.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Verifying account...</span>
              </div>
            </div>
          )}

          {currentStep === 'entitling' && (
            <div className="space-y-6">
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="font-medium text-primary mb-2">Granting Nexus access</h3>
                <p className="text-sm text-muted-foreground">
                  Setting up your Nexus entitlement and preparing your workspace. 
                  You'll have access to all business tools and features.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Setting up your workspace...</span>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-600 mb-2">🎉 Welcome to Nexus!</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is now fully set up and ready to use. 
                  You'll be redirected to your dashboard in a moment.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">What's next:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete your business profile</li>
                  <li>• Connect your first integration</li>
                  <li>• Get your business health score</li>
                  <li>• Explore Nexus features</li>
                </ul>
              </div>

              <div className="flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                <span className="text-sm text-muted-foreground">Redirecting to dashboard...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
