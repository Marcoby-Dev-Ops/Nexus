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
  onComplete: (data: any) => void;
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
  const [setupData, setSetupData] = useState<any>({});
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
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                {integration.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect {integration.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This integration will help you sync data and get insights from your {integration.name} account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mb-2" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Setup Time</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{integration.estimatedSetupTime}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Database className="w-5 h-5 text-green-600 mb-2" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Data Sources</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{integration.features.length} types</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">What you'll get:</h4>
              <ul className="space-y-2">
                {integration.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
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
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authorize Access
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the button below to securely connect your {integration.name} account. You'll be redirected to {integration.name} to authorize access.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Secure Connection</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Nexus uses industry-standard OAuth 2.0 authentication. We never store your {integration.name} password.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
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
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                API Configuration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter your {integration.name} API credentials to establish the connection.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setSetupData({ ...setupData, apiKey: e.target.value })}
                />
              </div>

              {integration.name === 'QuickBooks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your company ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setSetupData({ ...setupData, companyId: e.target.value })}
                  />
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">How to find your API key</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
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
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Configure Permissions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose which data types you want to sync with Nexus.
              </p>
            </div>

            <div className="space-y-3">
              {integration.features.map((feature, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onChange={(e) => {
                      const permissions = setupData.permissions || {};
                      permissions[feature] = e.target.checked;
                      setSetupData({ ...setupData, permissions });
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                You can change these permissions later in the integration settings.
              </p>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Test Connection
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Let's verify that everything is working correctly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Connection established
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Data access verified
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Initial sync completed
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-200">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Setup {integration.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{integration.category}</Badge>
              <Badge className={
                integration.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                integration.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
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
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
            </div>
            
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleComplete}
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
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

export default IntegrationSetupModal; 