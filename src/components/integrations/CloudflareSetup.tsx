import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Separator,
  Alert, AlertDescription
} from '@/components/ui';
import { 
  Shield, 
  Globe, 
  Zap, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { cloudflareService } from '@/lib/services/cloudflareService';
import { supabase } from '../../lib/core/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface CloudflareSetupProps {
  onComplete: () => void;
  onClose: () => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const CloudflareSetup: React.FC<CloudflareSetupProps> = ({ onComplete, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    apiToken: '',
    email: '',
    zoneId: '',
    accountId: ''
  });
  
  // Test results
  const [testResults, setTestResults] = useState<{
    connection: boolean | null;
    zones: any[] | null;
    analytics: any | null;
  }>({
    connection: null,
    zones: null,
    analytics: null
  });

  const [error, setError] = useState<string | null>(null);

  const steps: SetupStep[] = [
    {
      id: 1,
      title: 'API Configuration',
      description: 'Enter your Cloudflare API credentials',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Zone Selection',
      description: 'Select your domain zone to monitor',
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Test Connection',
      description: 'Verify integration and fetch sample data',
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Complete Setup',
      description: 'Save configuration and start monitoring',
      completed: false
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const testConnection = async () => {
    if (!formData.apiToken || !formData.email) {
      setError('Please provide API token and email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test basic connection
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          'Authorization': `Bearer ${formData.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(prev => ({ ...prev, connection: true }));
        
        // Fetch available zones
        const zonesResponse = await fetch('https://api.cloudflare.com/client/v4/zones', {
          headers: {
            'Authorization': `Bearer ${formData.apiToken}`,
            'Content-Type': 'application/json'
          }
        });

        const zonesData = await zonesResponse.json();
        
        if (zonesData.success) {
          setTestResults(prev => ({ ...prev, zones: zonesData.result }));
          setCurrentStep(2);
        } else {
          throw new Error('Failed to fetch zones');
        }
      } else {
        throw new Error(data.errors?.[0]?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
      setTestResults(prev => ({ ...prev, connection: false }));
    } finally {
      setLoading(false);
    }
  };

  const selectZone = async (zone: any) => {
    setFormData(prev => ({
      ...prev,
      zoneId: zone.id,
      accountId: zone.account.id
    }));
    
    setCurrentStep(3);
  };

  const testAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Test analytics API
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${formData.zoneId}/analytics/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${formData.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setTestResults(prev => ({ ...prev, analytics: data.result }));
        setCurrentStep(4);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analytics test failed');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Save integration to database
      const integrationData = {
        user_id: user.id,
        integration_slug: 'cloudflare',
        name: `Cloudflare - ${testResults.zones?.find(z => z.id === formData.zoneId)?.name}`,
        status: 'active',
        config: {
          zone_id: formData.zoneId,
          account_id: formData.accountId,
          zone_name: testResults.zones?.find(z => z.id === formData.zoneId)?.name
        },
        credentials: {
          api_token: formData.apiToken,
          email: formData.email
        },
        last_sync_at: new Date().toISOString()
      };

      const { error: saveError } = await supabase
        .from('user_integrations')
        .insert(integrationData);

      if (saveError) throw saveError;

      addNotification({
        type: 'success',
        message: 'Cloudflare Connected! Your Cloudflare integration is now active and monitoring your infrastructure.'
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save integration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      message: 'Copied to clipboard'
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Connect Cloudflare</CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitor infrastructure performance, security, and uptime
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentStep === step.id 
                  ? 'bg-primary/10 text-primary' 
                  : step.completed 
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                    {step.id}
                  </span>
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: API Configuration */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Cloudflare API Setup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You'll need a Cloudflare API token with Zone:Read and Analytics:Read permissions.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                How to get your API token:
              </h4>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                <li>Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare API Tokens</a></li>
                <li>Click "Create Token"</li>
                <li>Use "Custom token" template</li>
                <li>Add permissions: Zone:Read, Analytics:Read</li>
                <li>Include all zones or select specific zones</li>
                <li>Copy the generated token</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Cloudflare Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiToken">API Token</Label>
                <div className="relative">
                  <Input
                    id="apiToken"
                    type={showApiToken ? 'text' : 'password'}
                    placeholder="Your Cloudflare API token"
                    value={formData.apiToken}
                    onChange={(e) => handleInputChange('apiToken', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiToken(!showApiToken)}
                  >
                    {showApiToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={testConnection} 
                disabled={loading || !formData.apiToken || !formData.email}
                className="min-w-[120px]"
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
            </div>
          </div>
        )}

        {/* Step 2: Zone Selection */}
        {currentStep === 2 && testResults.zones && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Zone to Monitor</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which domain zone you want to monitor for analytics and performance.
              </p>
            </div>

            <div className="space-y-3">
              {testResults.zones.map((zone: any) => (
                <Card 
                  key={zone.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => selectZone(zone)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{zone.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Status: <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                              {zone.status}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Test Analytics */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Analytics Access</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let's verify we can access your Cloudflare analytics data.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium">Selected Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    {testResults.zones?.find(z => z.id === formData.zoneId)?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={testAnalytics} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Analytics'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete Setup */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Connect!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your Cloudflare integration is configured and ready. This will provide:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Performance Monitoring</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Page load times and TTFB</li>
                  <li>• Cache hit ratios</li>
                  <li>• Bandwidth usage</li>
                  <li>• Request analytics</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Security Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Threat detection</li>
                  <li>• DDoS protection status</li>
                  <li>• Bot traffic analysis</li>
                  <li>• Security events</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Uptime Monitoring</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Service availability</li>
                  <li>• Incident tracking</li>
                  <li>• Performance alerts</li>
                  <li>• Historical uptime</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Business KPIs</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Service uptime KPI</li>
                  <li>• Website performance</li>
                  <li>• Infrastructure health</li>
                  <li>• Automated reporting</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={completeSetup} 
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudflareSetup; 