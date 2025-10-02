import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { Card } from '@/shared/components/ui/Card';
import { CheckCircle, ArrowRight, UserPlus, Shield, Key, Trophy } from 'lucide-react';

type SignupStep = 'welcome' | 'registering' | 'validating' | 'entitling' | 'complete';

/**
 * Enhanced SignupPage - Multi-step signup flow
 * 
 * Guides users through the complete signup process:
 * 1. Welcome & Information
 * 2. Register in Authentik
 * 3. Validate Account
 * 4. Get Nexus Entitlement
 * 5. Complete
 */
export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuthentikAuth();

  const steps = [
    {
      id: 'welcome' as SignupStep,
      title: 'Welcome to Nexus',
      description: 'Create your account and start your business journey',
      icon: UserPlus,
      status: currentStep === 'welcome' ? 'current' : currentStep === 'registering' || currentStep === 'validating' || currentStep === 'entitling' || currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'registering' as SignupStep,
      title: 'Register in Authentik',
      description: 'Secure account creation through Marcoby',
      icon: Shield,
      status: currentStep === 'registering' ? 'current' : currentStep === 'validating' || currentStep === 'entitling' || currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'validating' as SignupStep,
      title: 'Validate Account',
      description: 'Email verification and account activation',
      icon: CheckCircle,
      status: currentStep === 'validating' ? 'current' : currentStep === 'entitling' || currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'entitling' as SignupStep,
      title: 'Get Nexus Entitlement',
      description: 'Access to Nexus business platform',
      icon: Key,
      status: currentStep === 'entitling' ? 'current' : currentStep === 'complete' ? 'completed' : 'upcoming'
    },
    {
      id: 'complete' as SignupStep,
      title: 'Complete',
      description: 'Ready to start your business journey',
      icon: Trophy,
      status: currentStep === 'complete' ? 'current' : 'upcoming'
    }
  ];

  const handleStartSignup = async () => {
    setLoading(true);
    setError('');
    setCurrentStep('registering');

    try {
      // Simulate the registration process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to Authentik enrollment flow directly
      const authentikUrl = import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com';
      window.location.href = `${authentikUrl}/if/flow/nexus-enrollment-flow/?next=` + encodeURIComponent('/login');
      
      // The user will be redirected to Authentik, so we won't reach the next steps
      // These would be handled after they return from Authentik
      
    } catch (err) {
      setError('An unexpected error occurred');
      setCurrentStep('welcome');
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-foreground">Create your Nexus account</h1>
            <p className="text-muted-foreground mt-2">
              Join thousands of entrepreneurs building better businesses
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
          {currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">What you'll get:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Secure account through Marcoby authentication</li>
                  <li>• Access to Nexus business platform</li>
                  <li>• Business health assessment tools</li>
                  <li>• Integration capabilities</li>
                  <li>• Personalized business insights</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleStartSignup}
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                    Starting registration...
                  </>
                ) : (
                  'Start Registration'
                )}
              </button>
            </div>
          )}

          {currentStep === 'registering' && (
            <div className="space-y-6">
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="font-medium text-primary mb-2">Registering with Marcoby</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Marcoby where you can create your account securely. 
                  This ensures your data is protected with enterprise-grade security.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Redirecting to Marcoby...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:text-primary/80">
                ← Back to home page
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 
