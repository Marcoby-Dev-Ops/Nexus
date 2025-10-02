/**
 * HubSpot Integration Setup Component
 * Pillar: 1,2 - CRM integration for sales and marketing automation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Zap, Users, TrendingUp, Building2, Shield, Key, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/hooks/index';
import { createHubSpotAuthUrl } from '@/services/integrations/hubspot/utils';
import { HUBSPOT_REQUIRED_SCOPES } from '@/services/integrations/hubspot/constants';
import { useToast } from '@/shared/components/ui/use-toast';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

interface HubSpotSetupProps {
  onComplete?: (payload?: any) => void;
  onCancel?: () => void;
}

export function HubSpotSetup({ onComplete, onCancel }: HubSpotSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HubSpot client ID (fetched on mount)
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    fetch('/api/oauth/config/hubspot')
      .then(res => res.json())
      .then(config => setClientId(config.clientId))
      .catch(err => console.error('Failed to get HubSpot config:', err));
  }, []);

  const totalSteps = 4;

  const initiateOAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current session without forcing refresh
      const result = await authentikAuthService.getSession();
      const session = result.data;
      
      if (result.error) {
        console.warn('⚠️ [HubSpotSetup] Session check failed: ', result.error);
        setError('Authentication error. Please log in again and try connecting HubSpot.');
        setLoading(false);
        return;
      }

      if (!session) {
        console.error('❌ [HubSpotSetup] No valid session found');
        setError('Please log in again before connecting HubSpot.');
        setLoading(false);
        return;
      }

      console.log('✅ [HubSpotSetup] Session validated, proceeding with OAuth');

      // Use the HubSpot client ID from environment (like Microsoft)
      // Get client ID from server (public info only)
  const [clientId, setClientId] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/oauth/config/hubspot')
      .then(res => res.json())
      .then(config => setClientId(config.clientId))
      .catch(err => console.error('Failed to get HubSpot config:', err));
  }, []);
      
      if (!clientId) {
        setError('HubSpot client ID not configured. Please check your environment variables.');
        setLoading(false);
        return;
      }

      // Configure OAuth settings - redirect to frontend callback page
      const redirectUri = `${window.location.origin}/integrations/hubspot/callback`;
      
      // Create state parameter with user ID and timestamp for security
      const state = btoa(JSON.stringify({ 
        timestamp: Date.now(),
        service: 'hubspot',
        userId: user?.id || null
      }));
      
      console.log('🔧 [HubSpotSetup] Creating OAuth URL with: ', {
        clientId: clientId ? '***' : 'missing',
        redirectUri,
        windowOrigin: window.location.origin,
        scopes: HUBSPOT_REQUIRED_SCOPES,
        state: state ? '***' : 'missing',
        userId: user?.id || 'missing'
      });
      
      const authUrl = createHubSpotAuthUrl({
        clientId,
        redirectUri,
        requiredScopes: HUBSPOT_REQUIRED_SCOPES,
        state
      });
      
      console.log('🔧 [HubSpotSetup] Generated auth URL');
      console.log('🚀 [HubSpotSetup] Redirecting to HubSpot OAuth...');
      
      // Redirect to HubSpot OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('❌ [HubSpotSetup] OAuth initiation failed:', error);
      setError(error.message || 'Failed to initiate HubSpot OAuth');
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    // The integration is now handled by the callback page
    // This function is kept for compatibility but doesn't need to do anything
     
     
    // eslint-disable-next-line no-console
    console.log('✅ [HubSpotSetup] Setup completed via callback page');
    setLoading(false);
    onComplete?.({ 
      integrationslug: 'hubspot',
      status: 'active',
      capabilities: ['CRM Data Sync', 'Sales Pipeline Tracking', 'Marketing Analytics']
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Connect HubSpot CRM
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Connect your HubSpot account to unlock powerful CRM insights, sales analytics, and marketing automation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Contact Management</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Sync contacts, companies, and lead data</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Sales Analytics</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Track deals, pipeline, and revenue metrics</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Marketing Insights</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Analyze campaigns and lead generation</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Secure OAuth</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Industry-standard security protocols</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => setCurrentStep(2)}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2: return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Authentication Setup
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                We'll securely connect to your HubSpot account using OAuth 2.0.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to HubSpot to authorize Nexus. This process is secure and only takes a few minutes.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Read contacts, companies, and deals</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Access marketing analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Sync pipeline and revenue data</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={initiateOAuth} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect HubSpot Account'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3: return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                Connection Successful!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Your HubSpot account has been connected. Let's complete the setup.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">OAuth Authentication</div>
                  <div className="text-sm text-muted-foreground">Successfully connected to HubSpot</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">Data Sync</div>
                  <div className="text-sm text-muted-foreground">Initializing data synchronization</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={completeSetup} disabled={loading}>
                {loading ? 'Completing Setup...' : 'Complete Setup'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 4: return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
                HubSpot Integration Complete!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Your HubSpot CRM is now connected and ready to provide insights.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Contacts Synced</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All contacts available in Nexus</p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Deals Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Pipeline data flowing to dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => onComplete && onComplete({})}>
                Done
              </Button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-600" />
          HubSpot CRM Setup
        </CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps}
        </CardDescription>
        <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {renderStepContent()}
      </CardContent>
    </Card>
  );
} 
