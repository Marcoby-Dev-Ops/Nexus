import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Badge,
  Button,
  Checkbox,
  Label,
  Input
} from '@/shared/shared/components/ui';
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
  Database,
  HelpCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Book,
  MessageCircle,
  Star
} from 'lucide-react';

interface Integration {
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
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'prerequisites' | 'auth' | 'permissions' | 'configuration' | 'testing' | 'success';
  completed: boolean;
  optional?: boolean;
  estimatedTime?: string;
  helpText?: string;
  troubleshooting?: string;
}

interface SetupData {
  apiKey?: string;
  username?: string;
  password?: string;
  [key: string]: any; // For dynamic permissions
}

interface EnhancedIntegrationSetupProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

/**
 * Enhanced Integration Setup with comprehensive workflow management
 * Implements best practices for maximum success rates
 */
const EnhancedIntegrationSetup: React.FC<EnhancedIntegrationSetupProps> = ({
  integration,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState({
    stepStartTime: Date.now(),
    totalTime: 0,
    retryCount: 0
  });

  // Enhanced setup steps with comprehensive flow
  const getSetupSteps = (): SetupStep[] => {
    const steps: SetupStep[] = [
      {
        id: 'welcome',
        title: 'Getting Started',
        description: `Welcome! Let's connect your ${integration.name} account`,
        type: 'welcome',
        completed: false,
        estimatedTime: '1 min',
        helpText: 'This wizard will guide you through a secure connection process'
      }
    ];

    // Add prerequisites if they exist
    if (integration.prerequisites && integration.prerequisites.length > 0) {
      steps.push({
        id: 'prerequisites',
        title: 'Prerequisites Check',
        description: 'Verify you have everything needed for setup',
        type: 'prerequisites',
        completed: false,
        estimatedTime: '2 min',
        helpText: 'Make sure you have the required access and information'
      });
    }

    // Authentication step based on type
    steps.push({
      id: 'auth',
      title: integration.authType === 'oauth' ? 'Authorization' : 'Credentials',
      description: integration.authType === 'oauth' 
        ? 'Authorize Nexus to access your account securely'
        : 'Enter your API credentials or connection details',
      type: 'auth',
      completed: false,
      estimatedTime: '3 min',
      helpText: 'Your credentials are encrypted and stored securely',
      troubleshooting: 'Having trouble? Check our troubleshooting guide below'
    });

    // Permissions and configuration
    steps.push({
      id: 'permissions',
      title: 'Data Permissions',
      description: 'Configure what data to sync and access levels',
      type: 'permissions',
      completed: false,
      estimatedTime: '2 min',
      helpText: 'You can change these settings anytime after setup'
    });

    // Advanced configuration (optional for some integrations)
    if (integration.difficulty !== 'easy') {
      steps.push({
        id: 'configuration',
        title: 'Advanced Settings',
        description: 'Customize sync frequency and data mapping',
        type: 'configuration',
        completed: false,
        optional: true,
        estimatedTime: '3 min',
        helpText: 'Optional: Use defaults for quick setup'
      });
    }

    // Testing
    steps.push({
      id: 'testing',
      title: 'Connection Test',
      description: 'Verify everything is working correctly',
      type: 'testing',
      completed: false,
      estimatedTime: '1 min',
      helpText: 'We\'ll test the connection and fetch sample data'
    });

    // Success
    steps.push({
      id: 'success',
      title: 'All Set!',
      description: 'Your integration is ready to use',
      type: 'success',
      completed: false,
      estimatedTime: '1 min'
    });

    return steps;
  };

  const steps = getSetupSteps();
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Track analytics
  useEffect(() => {
    setAnalytics(prev => ({ ...prev, stepStartTime: Date.now() }));
  }, [currentStep]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      // Track step completion time
      const stepTime = Date.now() - analytics.stepStartTime;
      setAnalytics(prev => ({ 
        ...prev, 
        totalTime: prev.totalTime + stepTime 
      }));

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    
    switch (currentStepData.type) {
      case 'auth':
        if (integration.authType === 'api_key' && !setupData.apiKey) {
          errors.push('API key is required');
        }
        if (integration.authType === 'credentials' && (!setupData.username || !setupData.password)) {
          errors.push('Username and password are required');
        }
        break;
      case 'permissions':
        if (!setupData.selectedPermissions || setupData.selectedPermissions.length === 0) {
          errors.push('Please select at least one data type to sync');
        }
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setConnectionStatus('success');
        steps[currentStep].completed = true;
      } else {
        throw new Error('Connection failed: Invalid credentials or network error');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed');
      setAnalytics(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    }
  };

  const handleComplete = async () => {
    setIsConnecting(true);
    
    try {
      // Final setup completion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const completionData = {
        integrationId: integration.id,
        setupData,
        connectedAt: new Date().toISOString(),
        setupDuration: analytics.totalTime + (Date.now() - analytics.stepStartTime),
        retryCount: analytics.retryCount
      };
      
      onComplete(completionData);
      onClose();
    } catch (error) {
      setErrorMessage('Setup completion failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground/90 dark:text-muted-foreground/60">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
          {currentStepData.estimatedTime}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-background rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : index === currentStep ? (
              <div className="w-4 h-4 border-2 border-blue-600 rounded-full" />
            ) : (
              <div className="w-4 h-4 border-2 border-border rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStepData.type) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 dark:bg-primary/20/20 rounded-full flex items-center justify-center mb-4">
                {integration.icon}
              </div>
              <h3 className="text-2xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Connect {integration.name}
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md mx-auto">
                This secure integration will sync your {integration.name} data with Nexus for powerful insights and automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Setup Time</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.estimatedSetupTime}</div>
              </div>
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Shield className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Security</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Bank-level encryption</div>
              </div>
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Database className="w-6 h-6 text-secondary mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Data Types</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.features.length} available</div>
              </div>
            </div>

            <div className="bg-primary/5 dark:bg-primary/20/20 p-4 rounded-lg">
              <h4 className="font-medium text-foreground dark:text-primary-foreground mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                What you'll get:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {integration.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help Resources */}
            <div className="flex justify-center space-x-4">
              {integration.documentation && (
                <Button variant="outline" size="sm">
                  <Book className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              )}
              {integration.videoTutorial && (
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Video Guide
                </Button>
              )}
              {integration.supportUrl && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Help
                </Button>
              )}
            </div>
          </div>
        );

      case 'prerequisites':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-4">
                Before we start, make sure you have:
              </h3>
              <div className="space-y-4">
                {integration.prerequisites?.map((prereq, index) => (
                  <label key={index} className="flex items-start space-x-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-primary rounded focus:ring-blue-500"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSetupData(prev => ({
                          ...prev,
                          prerequisites: {
                            ...prev.prerequisites,
                            [index]: checked
                          }
                        }));
                      }}
                    />
                    <span className="text-foreground/90 dark:text-muted-foreground/60">{prereq}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-warning/5 dark:bg-warning/20/20 p-4 rounded-lg">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning/80 dark:text-warning">
                    Need Help Getting Access?
                  </h4>
                  <p className="text-sm text-warning/90 dark:text-warning mt-1">
                    Contact your {integration.name} administrator if you don't have the required permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-6">
            {integration.authType === 'oauth' ? (
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                    Authorize Access
                  </h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Click the button below to securely connect your {integration.name} account.
                  </p>
                </div>
                
                <div className="bg-primary/5 dark:bg-primary/20/20 p-6 rounded-lg">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="font-medium text-foreground dark:text-primary-foreground mb-2">
                    Secure OAuth Connection
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                    You'll be redirected to {integration.name} to authorize access. 
                    We only request the minimum permissions needed.
                  </p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Globe className="w-4 h-4 mr-2" />
                    Connect to {integration.name}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                    Enter Your Credentials
                  </h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Your credentials are encrypted and stored securely.
                  </p>
                </div>

                <div className="space-y-4">
                  {integration.authType === 'api_key' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
                        API Key *
                      </label>
                      <div className="relative">
                        <Input
                          id="api_key"
                          type={showApiKey ? "text" : "password"}
                          value={setupData.apiKey || ''}
                          onChange={(e) => setSetupData((prev: SetupData) => ({ ...prev, apiKey: e.target.value }))}
                          className="pr-10"
                        />
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Find your API key in {integration.name} Settings → API → Generate Key
                      </p>
                    </div>
                  )}

                  {integration.authType === 'credentials' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
                          Username *
                        </label>
                        <Input
                          id="username"
                          type="text"
                          value={setupData.username || ''}
                          onChange={(e) => setSetupData((prev: SetupData) => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
                          Password *
                        </label>
                        <Input
                          id="password"
                          type="password"
                          value={setupData.password || ''}
                          onChange={(e) => setSetupData((prev: SetupData) => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>

                {validationErrors.length > 0 && (
                  <div className="bg-destructive/5 dark:bg-destructive/20 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                      <div>
                        {validationErrors.map((error, index) => (
                          <p key={index} className="text-sm text-destructive dark:text-red-300">{error}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Test Connection
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                Let's verify everything is working correctly
              </p>
            </div>

            <div className="bg-background dark:bg-background/50 p-6 rounded-lg">
              {connectionStatus === 'idle' && (
                <div className="text-center">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                    Ready to test your connection
                  </p>
                  <Button onClick={handleTestConnection} className="bg-primary hover:bg-primary/90">
                    <Zap className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              )}

              {connectionStatus === 'testing' && (
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Testing connection...
                  </p>
                </div>
              )}

              {connectionStatus === 'success' && (
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <h4 className="font-medium text-success dark:text-success mb-2">
                    Connection Successful!
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Successfully connected to {integration.name} and fetched sample data.
                  </p>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <h4 className="font-medium text-destructive dark:text-red-300 mb-2">
                    Connection Failed
                  </h4>
                  <p className="text-sm text-destructive dark:text-destructive mb-4">
                    {errorMessage}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleTestConnection}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Setup
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Common Issues Help */}
            {integration.commonIssues && connectionStatus === 'error' && (
              <div className="bg-warning/5 dark:bg-warning/20/20 p-4 rounded-lg">
                <h4 className="font-medium text-warning/80 dark:text-warning mb-3">
                  Common Issues & Solutions:
                </h4>
                <div className="space-y-2">
                  {integration.commonIssues.map((item, index) => (
                    <details key={index} className="group">
                      <summary className="cursor-pointer text-sm font-medium text-warning/90 dark:text-warning">
                        {item.issue}
                      </summary>
                      <p className="text-sm text-warning dark:text-yellow-400 mt-1 ml-4">
                        {item.solution}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div>
              <div className="mx-auto w-20 h-20 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Integration Complete!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                {integration.name} is now connected and syncing data with Nexus.
              </p>
            </div>

            <div className="bg-success/5 dark:bg-success/20 p-4 rounded-lg">
              <h4 className="font-medium text-success dark:text-success mb-2">
                Next Steps:
              </h4>
              <ul className="text-sm text-success dark:text-success space-y-1 text-left">
                <li>• Data will start syncing within the next few minutes</li>
                <li>• Check the dashboard for your first insights</li>
                <li>• Configure automation rules if needed</li>
                <li>• Explore Trinity AI recommendations</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <Book className="w-4 h-4 mr-2" />
                View Documentation
              </Button>
              <Button onClick={handleComplete} className="bg-primary hover:bg-primary/90">
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      default:
        return <div>Unknown step type</div>;
    }
  };

  const renderHelpPanel = () => (
    <div className="bg-background dark:bg-background/50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <HelpCircle className="w-4 h-4 text-primary mr-2" />
        <span className="text-sm font-medium text-foreground dark:text-primary-foreground">Need Help?</span>
      </div>
      {currentStepData.helpText && (
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
          {currentStepData.helpText}
        </p>
      )}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-1" />
          Chat Support
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-1" />
          Guide
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
      <div className="bg-card dark:bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20/20 rounded-lg flex items-center justify-center">
                {integration.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground dark:text-primary-foreground">
                  {integration.name} Setup
                </h2>
                <Badge className={`text-xs ${
                  integration.difficulty === 'easy' ? 'bg-success/10 text-success' :
                  integration.difficulty === 'medium' ? 'bg-warning/10 text-warning/80' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {integration.difficulty} setup
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          {renderProgressBar()}

          {/* Current Step */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground dark:text-primary-foreground mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Help Panel */}
          {currentStepData.helpText && (
            <div className="mb-6">
              {renderHelpPanel()}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-4">
              {currentStepData.optional && (
                <Button variant="outline" onClick={handleNext}>
                  Skip
                </Button>
              )}
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleComplete}
                  disabled={isConnecting}
                  className="bg-success hover:bg-success/90"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Complete Setup
                </Button>
              ) : currentStepData.type === 'testing' ? (
                <Button 
                  onClick={handleNext}
                  disabled={connectionStatus !== 'success'}
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIntegrationSetup; 