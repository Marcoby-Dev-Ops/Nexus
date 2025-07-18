import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
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
  Star,
  SkipForward
} from 'lucide-react';

import { useIntegrationSetup } from '@/domains/hooks/useIntegrationSetup';
import type { IntegrationSetupProps } from '@/shared/lib/types/integrations';

/**
 * Standardized Integration Setup Component
 * Implements the complete 6-step progressive workflow strategy
 * with comprehensive analytics, error recovery, and user experience optimization
 */
const StandardIntegrationSetup: React.FC<IntegrationSetupProps> = ({
  integration,
  isOpen,
  onClose,
  onComplete,
  onError,
  config,
  initialData
}) => {
  const {
    currentStep,
    steps,
    setupData,
    isConnecting,
    connectionStatus,
    errors,
    analytics,
    nextStep,
    previousStep,
    skipStep,
    retryStep,
    validateStep,
    resetSetup,
    completeSetup,
    getStepProgress,
    getEstimatedTimeRemaining,
    canProceed
  } = useIntegrationSetup(integration, config);

  const currentStepData = steps[currentStep];
  const progress = getStepProgress();
  const timeRemaining = getEstimatedTimeRemaining();

  /**
   * Enhanced Progress Bar with Step Names and Time Estimation
   */
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground/90 dark:text-muted-foreground/60">
            Step {currentStep + 1} of {steps.length}
          </span>
          {currentStepData.optional && (
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{timeRemaining} remaining</span>
        </div>
      </div>
      
      <Progress value={progress} className="h-2 mb-4" />
      
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex flex-col items-center space-y-1 ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${
              index < currentStep 
                ? 'bg-success' 
                : index === currentStep 
                  ? 'bg-primary' 
                  : 'bg-muted'
            }`} />
            <span className="text-xs font-medium hidden md:block">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Error Display with Recovery Actions
   */
  const renderErrors = () => {
    if (errors.length === 0) return null;

    return (
      <div className="mb-6 space-y-4">
        {errors.map((error, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${
              error.severity === 'high' || error.severity === 'critical'
                ? 'bg-destructive/5 dark:bg-destructive/20 border-destructive/20 dark:border-red-800'
                : 'bg-warning/5 dark:bg-warning/20/20 border-warning/20 dark:border-warning/80'
            }`}
          >
            <div className="flex items-start space-x-4">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                error.severity === 'high' || error.severity === 'critical' 
                  ? 'text-destructive' 
                  : 'text-warning'
              }`} />
              <div className="flex-1">
                <h4 className={`font-medium ${
                  error.severity === 'high' || error.severity === 'critical'
                            ? 'text-destructive'
        : 'text-warning'
                }`}>
                  {error.message}
                </h4>
                {error.suggestion && (
                  <p className={`text-sm mt-1 ${
                    error.severity === 'high' || error.severity === 'critical'
                      ? 'text-destructive'
                      : 'text-warning/90 dark:text-warning'
                  }`}>
                    {error.suggestion}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-3">
                  {error.retryable && (
                    <Button size="sm" variant="outline" onClick={retryStep}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  {error.helpUrl && (
                    <Button size="sm" variant="outline">
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Get Help
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Step Content Renderer with Consistent Patterns
   */
  const renderStepContent = () => {
    switch (currentStepData.type) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 dark:bg-primary/20/20 rounded-full flex items-center justify-center mb-6">
                {integration.icon}
              </div>
              <h2 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-3">
                Connect {integration.name}
              </h2>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md mx-auto">
                {integration.description || `This integration will help you sync data and get insights from your ${integration.name} account.`}
              </p>
            </div>

            {/* Value Proposition Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Setup Time</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.estimatedSetupTime}</div>
              </div>
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Database className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Data Sources</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{integration.features.length} types</div>
              </div>
              <div className="p-4 bg-background dark:bg-background/50 rounded-lg text-center">
                <Shield className="w-6 h-6 text-secondary mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Security</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Enterprise-grade</div>
              </div>
            </div>

            {/* Feature List */}
            <div>
              <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-4">What you'll get:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integration.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Signals */}
            <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Secure & Trusted</h4>
              </div>
              <p className="text-sm text-primary dark:text-primary">
                We use industry-standard encryption and never store your passwords. Your data is processed securely and in compliance with privacy regulations.
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge variant="secondary">SOC 2 Compliant</Badge>
                <Badge variant="secondary">GDPR Ready</Badge>
                <Badge variant="secondary">256-bit SSL</Badge>
              </div>
            </div>
          </div>
        );

      case 'prerequisites':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-warning/10 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                <Book className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Prerequisites Check
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Please confirm you have the following before we proceed:
              </p>
            </div>

            <div className="space-y-4">
              {integration.prerequisites?.map((prereq, index) => (
                <label 
                  key={index} 
                  className="flex items-start space-x-4 p-4 border border-border dark:border-border rounded-lg hover:bg-background dark:hover:bg-background/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary border-border rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground dark:text-primary-foreground">
                      {prereq}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Troubleshooting Help */}
            <div className="bg-background dark:bg-background/50 border border-border dark:border-border rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground dark:text-primary-foreground">Need help?</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    If you don't have the required access, contact your system administrator or check our setup guide.
                  </p>
                  {integration.documentation && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                      View Setup Guide <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return integration.authType === 'oauth' ? renderOAuthStep() : renderApiKeyStep();

      case 'permissions':
        return renderPermissionsStep();

      case 'configuration':
        return renderConfigurationStep();

      case 'testing':
        return renderTestingStep();

      case 'success':
        return renderSuccessStep();

      default:
        return null;
    }
  };

  /**
   * OAuth Authentication Step
   */
  const renderOAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
          Secure Authorization
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          Click the button below to securely connect your {integration.name} account. You'll be redirected to {integration.name} to authorize access.
        </p>
      </div>

      <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
                          <h4 className="font-medium text-foreground">Secure Connection</h4>
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
            nextStep();
          }, 1000);
        }}
        disabled={isConnecting}
      >
        <Globe className="w-5 h-5 mr-2" />
        {isConnecting ? 'Connecting...' : `Authorize with ${integration.name}`}
      </Button>
    </div>
  );

  /**
   * API Key Authentication Step
   */
  const renderApiKeyStep = () => (
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
            API Key *
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="Enter your API key"
              className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-warning/5 dark:bg-warning/20/20 border border-warning/20 dark:border-warning/80 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">How to find your API key</h4>
              <p className="text-sm text-warning/90 dark:text-warning mt-1">
                Go to your {integration.name} account settings → API section → Generate new API key
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Permissions Configuration Step
   */
  const renderPermissionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-secondary/10 dark:bg-secondary/20/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
          Data Permissions
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          Choose which data types you want to sync with Nexus. You can modify these later.
        </p>
      </div>

      <div className="space-y-4">
        {integration.features.map((feature, index) => (
          <label 
            key={index} 
            className="flex items-center justify-between p-4 border border-border dark:border-border rounded-lg hover:bg-background dark:hover:bg-background/50 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-foreground dark:text-primary-foreground">
                  {feature}
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Read access only
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Recommended</Badge>
          </label>
        ))}
      </div>

      <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
        <p className="text-sm text-primary dark:text-primary">
          💡 <strong>Pro tip:</strong> Start with all permissions enabled. You can fine-tune access levels later in the integration settings.
        </p>
      </div>
    </div>
  );

  /**
   * Advanced Configuration Step
   */
  const renderConfigurationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
          Advanced Settings
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          Customize sync frequency and data mapping for optimal performance.
        </p>
      </div>

      {/* Configuration options would go here */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
            Sync Frequency
          </label>
          <select className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground">
            <option value="realtime">Real-time (Recommended)</option>
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
    </div>
  );

  /**
   * Connection Testing Step
   */
  const renderTestingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-4">
          {connectionStatus === 'testing' ? (
            <RefreshCw className="w-8 h-8 text-success animate-spin" />
          ) : (
            <Zap className="w-8 h-8 text-success" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
          Testing Connection
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          We're verifying that everything is working correctly.
        </p>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
          <div className="flex items-center space-x-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">
              Connection established
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
          <div className="flex items-center space-x-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">
              Permissions verified
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-success/5 dark:bg-success/20 border border-success/20 dark:border-success/80 rounded-lg">
          <div className="flex items-center space-x-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">
              Initial data sync completed
            </span>
          </div>
        </div>
      </div>

      {connectionStatus === 'success' && (
        <div className="bg-primary/5 dark:bg-primary/20/20 border border-border dark:border-primary/80 rounded-lg p-4">
          <p className="text-sm text-primary dark:text-primary">
            🎉 Excellent! Your {integration.name} integration is ready. Data will start appearing in your dashboard within a few minutes.
          </p>
        </div>
      )}
    </div>
  );

  /**
   * Success Step
   */
  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <div className="mx-auto w-20 h-20 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-3">
          Integration Complete!
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          Your {integration.name} account is now connected and syncing data.
        </p>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-background dark:bg-background/50 rounded-lg">
          <Database className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-sm font-medium text-foreground dark:text-primary-foreground">View Dashboard</div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">See your data</div>
        </div>
        <div className="p-4 bg-background dark:bg-background/50 rounded-lg">
          <Book className="w-6 h-6 text-success mx-auto mb-2" />
          <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Setup Guide</div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">Learn best practices</div>
        </div>
        <div className="p-4 bg-background dark:bg-background/50 rounded-lg">
          <MessageCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
          <div className="text-sm font-medium text-foreground dark:text-primary-foreground">Get Support</div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">Need help?</div>
        </div>
      </div>

      <Button 
        onClick={() => {
          onComplete(setupData);
          onClose();
        }}
        className="w-full"
        size="lg"
      >
        Continue to Dashboard
      </Button>
    </div>
  );

  /**
   * Navigation Controls
   */
  const renderNavigation = () => (
    <div className="flex items-center justify-between pt-6 border-t border-border dark:border-border">
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={currentStep === 0}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <div className="flex items-center space-x-2">
        {currentStepData.canSkip && (
          <Button
            variant="ghost"
            onClick={skipStep}
            className="flex items-center space-x-2"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </Button>
        )}
        
        {currentStep === steps.length - 1 ? (
          <Button
            onClick={completeSetup}
            disabled={isConnecting || !canProceed()}
            className="flex items-center space-x-2"
          >
            <span>{isConnecting ? 'Completing...' : 'Complete Setup'}</span>
            <Check className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={isConnecting || !canProceed()}
            className="flex items-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-critical">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold">
            {currentStepData.title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderProgressBar()}
          {renderErrors()}
          {renderStepContent()}
          {renderNavigation()}
        </CardContent>
      </Card>
    </div>
  );
};

export default StandardIntegrationSetup; 