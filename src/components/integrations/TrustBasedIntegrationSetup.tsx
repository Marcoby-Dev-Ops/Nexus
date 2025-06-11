import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Database,
  MessageCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Book,
  Key,
  Globe,
  X,
  ArrowRight,
  Check
} from 'lucide-react';

interface TrustBasedIntegrationSetupProps {
  integration: {
    id: string;
    name: string;
    icon: React.ReactNode;
    category: string;
    difficulty: 'easy' | 'medium' | 'advanced';
    estimatedSetupTime: string;
    features: string[];
    authType: 'oauth' | 'api_key' | 'webhook' | 'credentials';
    documentation?: string;
    supportUrl?: string;
    videoTutorial?: string;
    prerequisites?: string[];
    commonIssues?: { issue: string; solution: string }[];
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const TrustBasedIntegrationSetup: React.FC<TrustBasedIntegrationSetupProps> = ({
  integration,
  isOpen,
  onClose,
  onComplete
}): React.ReactElement => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<any>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Trust-building steps
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Secure Integration',
      description: `Let's connect your ${integration.name} account safely`,
      icon: <Shield className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {integration.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Connect {integration.name} Securely
            </h3>
            <p className="text-muted-foreground mb-6">
              Your data security is our top priority. We use industry-standard encryption and security practices.
            </p>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg">
              <Lock className="w-5 h-5 text-primary mb-2" />
              <div className="text-sm font-medium">End-to-End Encryption</div>
              <div className="text-sm text-muted-foreground">Your data is always encrypted</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <Shield className="w-5 h-5 text-primary mb-2" />
              <div className="text-sm font-medium">Secure Storage</div>
              <div className="text-sm text-muted-foreground">Credentials are encrypted at rest</div>
            </div>
          </div>

          {/* Setup Time */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-medium">Quick Setup</div>
            <div className="text-sm text-muted-foreground">
              This will only take about {integration.estimatedSetupTime}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'prerequisites',
      title: 'Before We Begin',
      description: "Let's make sure you have everything needed",
      icon: <CheckCircle2 className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Please ensure you have the following ready:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {integration.prerequisites?.map((prereq, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">{prereq}</div>
                </div>
              </div>
            ))}
          </div>

          {integration.documentation && (
            <Button variant="outline" className="w-full" asChild>
              <a href={integration.documentation} target="_blank" rel="noopener noreferrer">
                <Book className="w-4 h-4 mr-2" />
                View Documentation
              </a>
            </Button>
          )}
        </div>
      )
    },
    {
      id: 'auth',
      title: 'Secure Connection',
      description: 'Connect your account safely',
      icon: <Key className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Your credentials are encrypted and stored securely. We never store plain text passwords.
            </AlertDescription>
          </Alert>

          {integration.authType === 'oauth' ? (
            <div className="space-y-4">
              <Button className="w-full" onClick={() => {/* OAuth flow */}}>
                <Globe className="w-4 h-4 mr-2" />
                Connect with {integration.name}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                You'll be redirected to {integration.name} to authorize access
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="w-full p-2 border rounded"
                    placeholder="Enter your API key"
                  />
                  <button
                    className="absolute right-2 top-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={() => {/* Test connection */}}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'permissions',
      title: 'Data Access',
      description: 'Choose what data to sync',
      icon: <Database className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              You can change these permissions anytime after setup
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {integration.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <div>
                  <div className="font-medium">{feature}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'success',
      title: 'All Set!',
      description: 'Your integration is ready to use',
      icon: <CheckCircle2 className="w-6 h-6" />,
      content: (
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Connection Successful!</h3>
            <p className="text-muted-foreground">
              Your {integration.name} account is now securely connected
            </p>
          </div>
          <div className="space-y-4">
            <Button className="w-full" onClick={() => onComplete(setupData)}>
              Continue to Dashboard
            </Button>
            {integration.supportUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={integration.supportUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Help
                </a>
              </Button>
            )}
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Setup {integration.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{integration.category}</Badge>
              <Badge className={
                integration.difficulty === 'easy' ? 'bg-success/10 text-success' :
                integration.difficulty === 'medium' ? 'bg-warning/10 text-yellow-800' :
                'bg-destructive/10 text-destructive'
              }>
                {integration.difficulty}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>
            
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={() => onComplete(setupData)}
                disabled={isConnecting}
                className="bg-success hover:bg-success/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustBasedIntegrationSetup; 