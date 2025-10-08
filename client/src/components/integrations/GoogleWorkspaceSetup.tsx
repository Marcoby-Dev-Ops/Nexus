/**
 * Google Workspace Setup Component (Enhanced)
 * Two-step setup: OAuth authentication → Service selection
 * Enables granular control over which Google services to integrate
 */
import React, { useState } from 'react';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { CheckCircle, ExternalLink, AlertCircle, Loader2, Mail, Calendar, FolderOpen, Users } from 'lucide-react';
import { createGoogleWorkspaceAuthUrl } from '@/services/integrations/google-workspace/utils';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Google Workspace required scopes
const GOOGLE_WORKSPACE_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

interface GoogleWorkspaceSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function GoogleWorkspaceSetup({ onComplete, onCancel }: GoogleWorkspaceSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4;

  const initiateOAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Replace auth calls
      const result = await authentikAuthService.getSession();
      const session = result.data;
      
      if (result.error) {
        console.warn('⚠️ [GoogleWorkspaceSetup] Session check failed: ', result.error);
        setError('Authentication error. Please log in again and try connecting Google Workspace.');
        setLoading(false);
        return;
      }

      if (!session) {
        console.error('❌ [GoogleWorkspaceSetup] No valid session found');
        setError('Please log in again before connecting Google Workspace.');
        setLoading(false);
        return;
      }

      console.log('✅ [GoogleWorkspaceSetup] Session validated, proceeding with OAuth');

      // Get OAuth configuration from server-side API
      const configResponse = await fetch('/api/oauth/config/google-workspace');
      if (!configResponse.ok) {
        setError('Failed to get Google Workspace configuration from server.');
        setLoading(false);
        return;
      }
      
      const config = await configResponse.json();
      const { clientId, redirectUri } = config;
      
      if (!clientId) {
        setError('Google Workspace credentials not configured. Please check your environment variables.');
        setLoading(false);
        return;
      }

      // Use redirect URI from server configuration
      
      // Create state parameter with user ID and timestamp for security
      const state = btoa(JSON.stringify({ 
        timestamp: Date.now(),
        service: 'google-workspace',
        userId: user?.id || null
      }));
      
      console.log('🔧 [GoogleWorkspaceSetup] Creating OAuth URL with: ', {
        clientId: clientId ? '***' : 'missing',
        redirectUri,
        windowOrigin: window.location.origin,
        scopes: GOOGLE_WORKSPACE_REQUIRED_SCOPES,
        state: state ? '***' : 'missing',
        userId: user?.id || 'missing'
      });
      
      const authUrl = createGoogleWorkspaceAuthUrl({
        clientId,
        redirectUri,
        requiredScopes: GOOGLE_WORKSPACE_REQUIRED_SCOPES,
        state
      });
      
      console.log('🔧 [GoogleWorkspaceSetup] Generated auth URL: ', authUrl);
      
      console.log('🚀 [GoogleWorkspaceSetup] Redirecting to Google Workspace OAuth...');
      
      // Redirect to Google Workspace OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('❌ [GoogleWorkspaceSetup] OAuth initiation failed:', error);
      setError(error.message || 'Failed to initiate Google Workspace connection');
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Connect Google Workspace',
      description: 'Authorize access to your Google Workspace account',
      status: currentStep >= 1 ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: 'Select Services',
      description: 'Choose which Workspace services to connect',
      status: currentStep >= 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Configure Permissions',
      description: 'Set up access permissions for each service',
      status: currentStep >= 3 ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Complete Setup',
      description: 'Finish integration and start data sync',
      status: currentStep >= 4 ? 'completed' : 'pending'
    }
  ];

  const workspaceServices = [
    {
      name: 'Gmail',
      description: 'Email analytics and inbox management',
      icon: <Mail className="w-5 h-5" />,
      features: ['Email analytics', 'Inbox organization', 'Email insights']
    },
    {
      name: 'Calendar',
      description: 'Meeting scheduling and time tracking',
      icon: <Calendar className="w-5 h-5" />,
      features: ['Meeting analytics', 'Time tracking', 'Schedule optimization']
    },
    {
      name: 'Drive',
      description: 'Document access and file management',
      icon: <FolderOpen className="w-5 h-5" />,
      features: ['Document analytics', 'File organization', 'Collaboration insights']
    },
    {
      name: 'Contacts',
      description: 'Contact management and relationship tracking',
      icon: <Users className="w-5 h-5" />,
      features: ['Contact analytics', 'Relationship insights', 'Network mapping']
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="/google-workspace-icon.png" 
            alt="Google Workspace" 
            className="w-6 h-6"
          />
          Google Workspace Setup
        </CardTitle>
        <CardDescription>
          Connect your Google Workspace account to access email, calendar, documents, and more
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.status === 'completed' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{step.title}</div>
                <div className="text-sm text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Workspace Services */}
        <div className="space-y-4">
          <h4 className="font-medium">Available Services:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaceServices.map((service) => (
              <div key={service.name} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <span className="font-medium">{service.name}</span>
                  <Badge variant="secondary" className="ml-auto">Read Only</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Email intelligence and inbox analytics</li>
            <li>• Calendar optimization and meeting insights</li>
            <li>• Document collaboration analytics</li>
            <li>• Contact relationship mapping</li>
            <li>• Cross-platform productivity insights</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={initiateOAuth}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Workspace
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Security Note */}
        <div className="text-xs text-muted-foreground text-center">
          Your data is encrypted and secure. We only request read access to your Workspace data.
        </div>
      </CardContent>
    </Card>
  );
} 
