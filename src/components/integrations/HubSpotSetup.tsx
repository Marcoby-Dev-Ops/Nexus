/**
 * HubSpot Integration Setup Component
 * Pillar: 1,2 - CRM integration for sales and marketing automation
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, ExternalLink, Loader2, AlertCircle, Users, DollarSign, TrendingUp, Mail } from 'lucide-react';
import { hubspotService } from '../../lib/services/hubspotService';
import { supabase } from '../../lib/core/supabase';
import { useNotifications } from '../../contexts/NotificationContext';

interface HubSpotSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function HubSpotSetup({ onComplete, onCancel }: HubSpotSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const { addNotification } = useNotifications();

  const steps = [
    { id: 1, title: 'Connect to HubSpot', description: 'Authorize access to your HubSpot CRM' },
    { id: 2, title: 'Test Connection', description: 'Verify data access and permissions' },
    { id: 3, title: 'Review Capabilities', description: 'See what data will be synced' },
    { id: 4, title: 'Complete Setup', description: 'Finalize HubSpot integration' }
  ];

  const initiateOAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the existing HubSpot app credentials from environment
      const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
      if (!clientId) {
        throw new Error('HubSpot client ID not configured');
      }

      // Configure OAuth settings
      const redirectUri = `${window.location.origin}/integrations/hubspot/callback`;
      
      const scopes = [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.lists.read',
        'crm.lists.write'
      ];
      
      const state = btoa(JSON.stringify({ 
        timestamp: Date.now(),
        service: 'hubspot'
      }));
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        response_type: 'code',
        state
      });
      
      const authUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
      
      // Redirect to HubSpot OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('OAuth initiation failed:', error);
      setError(error.message || 'Failed to initiate HubSpot connection');
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize and test the connection
      await hubspotService.initialize();
      const result = await hubspotService.testConnection();
      setConnectionResult(result);

      if (result.success) {
        // Get sample metrics
        try {
          const metricsData = await hubspotService.getKeyMetrics();
          setMetrics(metricsData);
        } catch (metricsError) {
          // Non-critical error - connection works but metrics failed
          console.warn('Failed to fetch metrics:', metricsError);
        }
        
        setCurrentStep(3);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setError(error.message || 'Failed to test HubSpot connection');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Store integration in database
      const { error: dbError } = await supabase
        .from('user_integrations')
        .upsert({
          integration_slug: 'hubspot',
          status: 'active',
          credentials: {
            client_id: import.meta.env.VITE_HUBSPOT_CLIENT_ID
            // OAuth tokens will be stored by the callback handler
          },
          config: {
            redirect_uri: `${window.location.origin}/integrations/hubspot/callback`,
            features_enabled: ['contacts', 'deals', 'companies', 'marketing', 'analytics']
          },
          metadata: {
            setup_completed_at: new Date().toISOString(),
            capabilities: [
              'CRM Data Sync',
              'Sales Pipeline Tracking',
              'Marketing Analytics',
              'Lead Management',
              'Contact Management',
              'Deal Tracking',
              'Revenue Analytics'
            ]
          }
        }, {
          onConflict: 'integration_slug'
        });

      if (dbError) throw dbError;

      // Update business health KPIs
      try {
        await hubspotService.updateBusinessHealthKPIs();
      } catch (kpiError) {
        console.warn('Failed to update KPIs:', kpiError);
      }

      addNotification({
        type: 'success',
        message: 'HubSpot integration completed! CRM data and sales analytics are now active.'
      });

      setCurrentStep(4);
      setTimeout(onComplete, 1500);

    } catch (error: any) {
      console.error('Setup completion failed:', error);
      setError(error.message || 'Failed to complete HubSpot setup');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Connect to HubSpot CRM</h3>
                <p className="text-muted-foreground">
                  Authorize Nexus to access your HubSpot data for automated CRM insights
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                What you'll get:
              </h4>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li><strong>Contact Management:</strong> Sync and analyze contact data</li>
                <li><strong>Deal Pipeline:</strong> Track sales opportunities and revenue</li>
                <li><strong>Marketing Analytics:</strong> Monitor campaign performance</li>
                <li><strong>Lead Scoring:</strong> Automated lead qualification</li>
                <li><strong>Revenue Insights:</strong> Sales forecasting and reporting</li>
                <li><strong>Business Health KPIs:</strong> Automated CRM metrics</li>
              </ul>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🔐 Security & Privacy</h4>
              <p className="text-sm text-primary">
                Your HubSpot data is encrypted and only used to provide business insights. 
                We follow industry-standard security practices and never share your data.
              </p>
            </div>

            <div className="flex gap-4">
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
                    Connect HubSpot
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Test HubSpot Connection</h3>
                <p className="text-muted-foreground">
                  Verify that we can access your CRM data successfully
                </p>
              </div>
            </div>

            {connectionResult && (
              <div className={`p-4 rounded-lg ${connectionResult.success ? 'bg-success/5' : 'bg-destructive/5'}`}>
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className={`font-medium ${connectionResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {connectionResult.success ? 'Connection Successful!' : 'Connection Failed'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${connectionResult.success ? 'text-success' : 'text-destructive'}`}>
                  {connectionResult.message}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={testConnection} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">HubSpot Integration Ready</h3>
                <p className="text-muted-foreground">
                  Review the capabilities and data that will be synced
                </p>
              </div>
            </div>

            {metrics && metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {metrics.slice(0, 4).map((metric: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{metric.name}</p>
                        <p className="text-lg font-semibold">{metric.value}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        metric.trend === 'up' ? 'bg-success' : 
                        metric.trend === 'down' ? 'bg-destructive' : 'bg-gray-400'
                      }`} />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">📊 Business Health KPIs Updated:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Badge variant="secondary">Customer Acquisition Cost</Badge>
                <Badge variant="secondary">Conversion Rate</Badge>
                <Badge variant="secondary">Customer Lifetime Value</Badge>
                <Badge variant="secondary">Monthly Recurring Revenue</Badge>
                <Badge variant="secondary">Sales Cycle Length</Badge>
                <Badge variant="secondary">Lead Velocity</Badge>
              </div>
            </div>

            <div className="bg-success/5 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ Integration Benefits</h4>
              <ul className="text-sm text-success space-y-1">
                <li>• Automated CRM data synchronization</li>
                <li>• Real-time sales pipeline tracking</li>
                <li>• Marketing campaign performance insights</li>
                <li>• Customer lifecycle analytics</li>
                <li>• Revenue forecasting and reporting</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={completeSetup} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">HubSpot Integration Complete!</h3>
              <p className="text-muted-foreground">
                Your CRM data is now being synced and analyzed automatically
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-success">
              <Mail className="w-4 h-4" />
              <span>Business health metrics will update every hour</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-warning" />
          HubSpot CRM Integration
        </CardTitle>
        <CardDescription>
          Connect your HubSpot CRM for automated sales and marketing analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/5 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Setup Error</span>
            </div>
            <p className="text-sm text-destructive mt-1">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </CardContent>
    </Card>
  );
} 