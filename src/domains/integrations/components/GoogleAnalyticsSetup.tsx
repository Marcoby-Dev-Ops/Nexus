import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Badge,
  Alert, AlertDescription
} from '@/shared/components/ui';
import { 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  RefreshCw
} from 'lucide-react';
import { googleAnalyticsService } from '@/domains/analytics/lib/googleAnalyticsService';
import { supabase } from "@/core/supabase";
import { useAuth } from '@/core/auth/AuthProvider';
import { useNotifications } from '@/core/hooks/NotificationContext';

interface GoogleAnalyticsSetupProps {
  onComplete?: () => void;
  onClose?: () => void;
}

interface Property {
  id: string;
  name: string;
  websiteUrl: string;
}

const GoogleAnalyticsSetup: React.FC<GoogleAnalyticsSetupProps> = ({ 
  onComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState<'connect' | 'properties' | 'test' | 'complete'>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [testResults, setTestResults] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const authenticated = googleAnalyticsService.isAuthenticated();
    
    // If authenticated, skip to properties step
    if (authenticated) {
      setCurrentStep('properties');
      loadProperties();
    }
  }, []);

  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const authUrl = await googleAnalyticsService.initializeOAuth();
      
      // Open OAuth in popup
      const popup = window.open(
        authUrl,
        'google-analytics-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkOAuth = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(checkOAuth);
            
            // Check if authentication succeeded
            if (googleAnalyticsService.isAuthenticated()) {
              setCurrentStep('properties');
              await loadProperties();
            } else {
              setError('Authentication was cancelled or failed');
            }
            setIsConnecting(false);
          }
        } catch {
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

  const loadProperties = async () => {
    try {
      const availableProperties = await googleAnalyticsService.getAvailableProperties();
      setProperties(availableProperties);
      
      if (availableProperties.length === 1) {
        // Auto-select if only one property
        setSelectedProperty(availableProperties[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    }
  };

  const handlePropertySelect = async (property: Property) => {
    setSelectedProperty(property);
    
    try {
      await googleAnalyticsService.setActiveProperty(property.id);
      setCurrentStep('test');
      await runConnectionTest();
    } catch (err: any) {
      setError(err.message || 'Failed to set property');
    }
  };

  const runConnectionTest = async () => {
    try {
      const result = await googleAnalyticsService.testConnection();
      setTestResults(result);
      
      if (result.success) {
        setCurrentStep('complete');
        await saveIntegration();
      }
    } catch (err: any) {
      setTestResults({
        success: false,
        message: err.message || 'Connection test failed'
      });
    }
  };

  const saveIntegration = async () => {
    if (!user || !selectedProperty) return;

    try {
      // Save to user_integrations table
      

      if (dbError) throw dbError;

      addNotification({
        type: 'success',
        message: `Google Analytics Connected: Successfully connected to ${selectedProperty.name}`
      });

      onComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save integration');
    }
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Google Analytics</h3>
        <p className="text-muted-foreground">
          Connect your Google Analytics account to track website performance
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          We'll access your Google Analytics data in read-only mode to provide insights and reporting.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>Visitor analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>Page views</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span>Traffic sources</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Real-time data</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
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

  const renderPropertiesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Select Property</h3>
        <p className="text-muted-foreground">
          Choose which Google Analytics property to connect
        </p>
      </div>

      {properties.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No Google Analytics properties found. Make sure you have GA4 properties set up.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card 
              key={property.id}
              className={`cursor-pointer transition-colors hover: bg-muted ${
                selectedProperty?.id === property.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handlePropertySelect(property)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{property.name}</h4>
                    {property.websiteUrl && (
                      <p className="text-sm text-muted-foreground">{property.websiteUrl}</p>
                    )}
                  </div>
                  <Badge variant="outline">GA4</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          {testResults ? (
            testResults.success ? (
              <CheckCircle className="w-16 h-16 text-success" />
            ) : (
              <AlertCircle className="w-16 h-16 text-destructive" />
            )
          ) : (
            <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">Testing Connection</h3>
        <p className="text-muted-foreground">
          Verifying access to your Google Analytics data
        </p>
      </div>

      {testResults && (
        <Alert variant={testResults.success ? "default" : "destructive"}>
          <AlertDescription>{testResults.message}</AlertDescription>
        </Alert>
      )}

      {!testResults?.success && (
        <Button onClick={runConnectionTest} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Test
        </Button>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connected Successfully!</h3>
        <p className="text-muted-foreground">
          Your Google Analytics account is now connected
        </p>
      </div>

      {selectedProperty && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="font-medium">{selectedProperty.name}</p>
              {selectedProperty.websiteUrl && (
                <p className="text-sm text-muted-foreground">{selectedProperty.websiteUrl}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
        <Button onClick={onComplete} className="flex-1">
          View Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Google Analytics Setup
        </CardTitle>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {['connect', 'properties', 'test', 'complete'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                currentStep === step || 
                (['connect', 'properties', 'test', 'complete'].indexOf(currentStep) > index)
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < 3 && <div className="flex-1 h-px bg-muted" />}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 'connect' && renderConnectStep()}
        {currentStep === 'properties' && renderPropertiesStep()}
        {currentStep === 'test' && renderTestStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </CardContent>
    </Card>
  );
};

export default GoogleAnalyticsSetup; 