/**
 * Google Workspace Setup Component
 * Comprehensive Google business tools integration
 * Pillar: 1,2,3 - Drive, Calendar, Gmail, and more
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Calendar,
  HardDrive,
  Mail,
  Users,
  BarChart3,
  Search,
  Building,
  Shield,
  Clock,
  FileText,
  Video
} from 'lucide-react';

interface GoogleWorkspaceSetupProps {
  onComplete: (integration: any) => void;
  onClose: () => void;
}

interface ServiceStatus {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  metrics?: any;
}

const GoogleWorkspaceSetup: React.FC<GoogleWorkspaceSetupProps> = ({ 
  onComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState<'connect' | 'services' | 'test' | 'complete'>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [testResults, setTestResults] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    setIsAuthenticated(googleWorkspaceService.isAuthenticated());
    
    // If authenticated, skip to services step
    if (googleWorkspaceService.isAuthenticated()) {
      setCurrentStep('services');
      loadServices();
    }
  }, []);

  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const authUrl = await googleWorkspaceService.initializeOAuth();
      
      // Open OAuth in popup
      const popup = window.open(
        authUrl,
        'google-workspace-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkOAuth = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(checkOAuth);
            
            // Check if authentication succeeded
            if (googleWorkspaceService.isAuthenticated()) {
              setIsAuthenticated(true);
              setCurrentStep('services');
              await loadServices();
            } else {
              setError('Authentication was cancelled or failed');
            }
            setIsConnecting(false);
          }
        } catch (err) {
          clearInterval(checkOAuth);
          setError('Authentication failed');
          setIsConnecting(false);
        }
      }, 1000);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkOAuth);
        if (isConnecting) {
          setIsConnecting(false);
          setError('Authentication timed out');
        }
      }, 300000); // 5 minutes

    } catch (err: any) {
      setError(err.message || 'Failed to start authentication');
      setIsConnecting(false);
    }
  };

  const loadServices = async () => {
    try {
      const availableServices = googleWorkspaceService.getAvailableServices();
      
      const servicesList: ServiceStatus[] = [
        {
          name: 'Google Drive',
          icon: <HardDrive className="w-5 h-5" />,
          connected: availableServices.includes('Google Drive')
        },
        {
          name: 'Google Calendar',
          icon: <Calendar className="w-5 h-5" />,
          connected: availableServices.includes('Google Calendar')
        },
        {
          name: 'Gmail',
          icon: <Mail className="w-5 h-5" />,
          connected: availableServices.includes('Gmail')
        },
        {
          name: 'Google Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
          connected: availableServices.includes('Google Analytics')
        },
        {
          name: 'Search Console',
          icon: <Search className="w-5 h-5" />,
          connected: availableServices.includes('Search Console')
        },
        {
          name: 'Google My Business',
          icon: <Building className="w-5 h-5" />,
          connected: availableServices.includes('Google My Business')
        }
      ];

      setServices(servicesList);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    }
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await googleWorkspaceService.testConnection();
      setTestResults(result);

      if (result.success) {
        setCurrentStep('complete');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleComplete = async () => {
    try {
      // Save integration to database
      const integrationData = {
        name: 'Google Workspace',
        slug: 'google-workspace',
        category: 'productivity',
        provider: 'google',
        status: 'active',
        config: {
          services: services.filter(s => s.connected).map(s => s.name),
          connectedAt: new Date().toISOString()
        }
      };

      addNotification({
        type: 'success',
        message: 'Google Workspace integration completed successfully!'
      });

      onComplete(integrationData);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    }
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <HardDrive className="w-8 h-8 text-primary" />
          <Calendar className="w-8 h-8 text-success" />
          <Mail className="w-8 h-8 text-destructive" />
          <BarChart3 className="w-8 h-8 text-warning" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Connect Google Workspace</h3>
        <p className="text-muted-foreground">
          Connect your Google business tools for comprehensive productivity insights
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          We'll access your Google services in read-only mode to provide business insights and automation.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <span>Drive storage & files</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-success" />
          <span>Calendar & meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-destructive" />
          <span>Email analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-warning" />
          <span>Website analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-secondary" />
          <span>Search performance</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-warning" />
          <span>Business profile</span>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleOAuthConnect} 
        disabled={isConnecting}
        className="w-full"
        size="lg"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect with Google
          </>
        )}
      </Button>
    </div>
  );

  const renderServicesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connected Services</h3>
        <p className="text-muted-foreground">
          Your Google Workspace services are now connected
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.name} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {service.icon}
                <span className="font-medium">{service.name}</span>
              </div>
              {service.connected ? (
                <Badge variant="default" className="bg-success/10 text-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Not Available
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Business Insights Available:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-primary">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Meeting analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Document collaboration</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Team productivity</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Storage optimization</span>
          </div>
        </div>
      </div>

      <Button onClick={() => setCurrentStep('test')} className="w-full">
        Test Connection
      </Button>
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Video className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Test Connection</h3>
        <p className="text-muted-foreground">
          Let's verify your Google Workspace integration is working
        </p>
      </div>

      {testResults && (
        <Alert variant={testResults.success ? "success" : "error"}>
          {testResults.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResults.message}
            {testResults.details && (
              <div className="mt-2 text-xs">
                <div>User: {testResults.details.user}</div>
                <div>Email: {testResults.details.email}</div>
                {testResults.details.emailsTotal && (
                  <div>Total Emails: {testResults.details.emailsTotal}</div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleTestConnection} 
        disabled={isConnecting}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          'Test Connection'
        )}
      </Button>

      {testResults?.success && (
        <Button onClick={() => setCurrentStep('complete')} variant="outline" className="w-full">
          Continue to Complete
        </Button>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Integration Complete!</h3>
        <p className="text-muted-foreground">
          Your Google Workspace is now connected and providing business insights
        </p>
      </div>

      <div className="bg-success/5 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">What's Next:</h4>
        <ul className="text-sm text-success space-y-1">
          <li>• Drive storage and collaboration metrics are being collected</li>
          <li>• Calendar meetings and productivity insights are available</li>
          <li>• Email analytics will appear in your dashboard</li>
          <li>• Business health KPIs will update automatically</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
        <Button onClick={handleComplete}>
          Complete Setup
        </Button>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'connect':
        return renderConnectStep();
      case 'services':
        return renderServicesStep();
      case 'test':
        return renderTestStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderConnectStep();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex gap-1">
            <HardDrive className="w-5 h-5 text-primary" />
            <Calendar className="w-5 h-5 text-success" />
          </div>
          Google Workspace Integration
        </CardTitle>
        
        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          {['connect', 'services', 'test', 'complete'].map((step, index) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded ${
                ['connect', 'services', 'test', 'complete'].indexOf(currentStep) >= index
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {getStepContent()}
      </CardContent>
    </Card>
  );
};

export default GoogleWorkspaceSetup; 