import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Key, 
  Globe, 
  Shield,
  Zap,
  Clock,
  Database
} from 'lucide-react';
import { ButtonSpinner } from '@/components/patterns/LoadingStates';

interface IntegrationSetupModalProps {
  integration: {
    id: string;
    name: string;
    icon: React.ReactNode;
    category: string;
    difficulty: 'easy' | 'medium' | 'advanced';
    estimatedSetupTime: string;
    features: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Record<string, unknown>) => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'oauth' | 'api_key' | 'configuration' | 'permissions' | 'testing';
  completed: boolean;
}

/**
 * Integration Setup Modal with step-by-step wizard
 */
const IntegrationSetupModal: React.FC<IntegrationSetupModalProps> = ({
  integration,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<Record<string, unknown>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // Setup steps based on integration type
  const getSetupSteps = (): SetupStep[] => {
    const baseSteps: SetupStep[] = [
      {
        id: 'welcome',
        title: 'Welcome',
        description: `Let's connect your ${integration.name} account`,
        type: 'configuration',
        completed: false
      }
    ];

    // OAuth-based integrations
    if (['Salesforce', 'HubSpot', 'Google Analytics', 'Slack'].includes(integration.name)) {
      return [
        ...baseSteps,
        {
          id: 'oauth',
          title: 'Authorization',
          description: 'Authorize Nexus to access your account',
          type: 'oauth',
          completed: false
        },
        {
          id: 'permissions',
          title: 'Permissions',
          description: 'Configure data access permissions',
          type: 'permissions',
          completed: false
        },
        {
          id: 'testing',
          title: 'Test Connection',
          description: 'Verify the integration is working',
          type: 'testing',
          completed: false
        }
      ];
    }

    // API Key-based integrations
    return [
      ...baseSteps,
      {
        id: 'api_key',
        title: 'API Configuration',
        description: 'Enter your API credentials',
        type: 'api_key',
        completed: false
      },
      {
        id: 'configuration',
        title: 'Data Mapping',
        description: 'Configure which data to sync',
        type: 'configuration',
        completed: false
      },
      {
        id: 'testing',
        title: 'Test Connection',
        description: 'Verify the integration is working',
        type: 'testing',
        completed: false
      }
    ];
  };

  const steps = getSetupSteps();
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

  const handleComplete = async () => {
    setIsConnecting(true);
    
    // Simulate API call
    setTimeout(() => {
      onComplete({
        integrationId: integration.id,
        setupData,
        connectedAt: new Date().toISOString()
      });
      setIsConnecting(false);
      onClose();
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStepData.type) {
      case 'configuration':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20/20 rounded-full flex items-center justify-center mb-4">
                {integration.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Connect {integration.name}
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                This integration will help you sync data and get insights from your {integration.name} account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Setup Time</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.estimatedSetupTime}</div>
              </div>
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg">
                <Database className="w-5 h-5 text-success mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Data Sources</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.features.length} types</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground dark:text-primary-foreground mb-3">What you'll get:</h4>
              <ul className="space-y-2">
                {integration.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-4">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'oauth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Authorize Access
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Click the button below to securely connect your {integration.name} account. You'll be redirected to {integration.name} to authorize access.
              </p>
            </div>

            <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Secure Connection</h4>
                  <p className="text-sm text-primary dark:text-primary mt-1">
                    Nexus uses industry-standard OAuth 2.0 authentication. We never store your {integration.name} password.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              size="lg"
              onClick={() => {
                // Simulate OAuth flow
                setTimeout(() => {
                  setSetupData({ ...setupData, authorized: true });
                  handleNext();
                }, 1000);
              }}
            >
              <Globe className="w-5 h-5 mr-2" />
              Authorize with {integration.name}
            </Button>
          </div>
        );

      case 'api_key':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                API Configuration
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Enter your {integration.name} API credentials to establish the connection.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setSetupData({ ...setupData, apiKey: e.target.value })}
                />
              </div>

              {integration.name === 'QuickBooks' && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
                    Company ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your company ID"
                    className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setSetupData({ ...setupData, companyId: e.target.value })}
                  />
                </div>
              )}

              <div className="bg-warning/5 dark:bg-warning/20/20 border border-warning/20 dark:border-warning/80 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">How to find your API key</h4>
                    <p className="text-sm text-warning/90 dark:text-warning mt-1">
                      Go to your {integration.name} account settings → API section → Generate new API key
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-secondary/10 dark:bg-secondary/20/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Configure Permissions
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Choose which data types you want to sync with Nexus.
              </p>
            </div>

            <div className="space-y-4">
              {integration.features.map((feature, index) => (
                <label key={index} className="flex items-center space-x-4 p-4 border border-border dark:border-border rounded-lg hover:bg-background dark:hover:bg-background/50 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500"
                    onChange={(e) => {
                      const permissions = setupData.permissions || {};
                      permissions[feature] = e.target.checked;
                      setSetupData({ ...setupData, permissions });
                    }}
                  />
                  <span className="text-sm font-medium text-foreground dark:text-primary-foreground">
                    {feature}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
              <p className="text-sm text-primary dark:text-primary">
                You can change these permissions later in the integration settings.
              </p>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Test Connection
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Let's verify that everything is working correctly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Connection established
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Data access verified
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Initial sync completed
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
              <p className="text-sm text-primary dark:text-primary">
                🎉 Great! Your {integration.name} integration is ready. Data will start appearing in your dashboard within a few minutes.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-critical p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Setup {integration.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{integration.category}</Badge>
              <Badge className={
                integration.difficulty === 'easy' ? 'bg-success/10 text-success' :
                integration.difficulty === 'medium' ? 'bg-warning/10 text-warning/80' :
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
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 dark:bg-background text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-background'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-primary-foreground">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>
            
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isConnecting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={isConnecting}
                className="bg-success hover:bg-success/90"
              >
                {isConnecting ? (
                  <ButtonSpinner />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isConnecting}>
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

export default IntegrationSetupModal; 