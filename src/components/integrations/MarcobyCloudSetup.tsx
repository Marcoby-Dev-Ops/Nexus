import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Cloud, 
  Server, 
  Activity, 
  DollarSign, 
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';
import { marcobyCloudService } from '@/lib/services/marcobyCloudService';
import { supabase } from '../../lib/core/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface MarcobyCloudSetupProps {
  onComplete: () => void;
  onClose: () => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const MarcobyCloudSetup: React.FC<MarcobyCloudSetupProps> = ({ onComplete, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    apiKey: '',
    orgId: '',
    endpoint: 'https://cloud.marcoby.com',
    rspUsername: '',
    rspPassword: ''
  });
  
  // Test results
  const [testResults, setTestResults] = useState<{
    connection: boolean | null;
    metrics: any | null;
    health: any | null;
  }>({
    connection: null,
    metrics: null,
    health: null
  });

  const [error, setError] = useState<string | null>(null);

  const steps: SetupStep[] = [
    {
      id: 1,
      title: 'API Configuration',
      description: 'Connect to your Marcoby Cloud account',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Test Infrastructure',
      description: 'Verify access to infrastructure metrics',
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Review Capabilities',
      description: 'Preview monitoring and optimization features',
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Complete Setup',
      description: 'Activate monitoring and automation',
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
    if (!formData.rspUsername || !formData.rspPassword) {
      setError('Please provide ResellersPanel username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test connection (simulated for demo)
      const connectionResult = await marcobyCloudService.testConnection();
      
      if (connectionResult.success) {
        setTestResults(prev => ({ ...prev, connection: true }));
        setCurrentStep(2);
      } else {
        throw new Error(connectionResult.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
      setTestResults(prev => ({ ...prev, connection: false }));
    } finally {
      setLoading(false);
    }
  };

  const testInfrastructure = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize service with test config
      const testService = new (marcobyCloudService.constructor as any)();
      testService.config = {
        apiKey: formData.apiKey || '',
        orgId: formData.orgId,
        endpoint: formData.endpoint,
        rspUsername: formData.rspUsername,
        rspPassword: formData.rspPassword,
        rspApiUrl: 'https://cp.resellerspanel.com/api'
      };

      // Fetch sample metrics
      const metrics = await testService.getInfrastructureMetrics();
      const health = await testService.getHealthSummary();
      
      setTestResults(prev => ({ 
        ...prev, 
        metrics,
        health
      }));
      
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Infrastructure test failed');
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
        integration_slug: 'marcoby-cloud',
        name: `Marcoby Cloud - ${formData.orgId}`,
        status: 'active',
        config: {
          org_id: formData.orgId,
          endpoint: formData.endpoint,
          rsp_api_url: 'https://cp.resellerspanel.com/api'
        },
        credentials: {
          api_key: formData.apiKey || '',
          rsp_username: formData.rspUsername,
          rsp_password: formData.rspPassword
        },
        last_sync_at: new Date().toISOString()
      };

      const { error: saveError } = await supabase
        .from('user_integrations')
        .insert(integrationData);

      if (saveError) throw saveError;

      addNotification({
        type: 'success',
        message: 'Marcoby Cloud Connected! Infrastructure monitoring is now active with automated KPI updates.'
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save integration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Cloud className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Connect Marcoby Cloud</CardTitle>
              <p className="text-sm text-muted-foreground">
                Infrastructure monitoring, cost optimization, and automation insights
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
              <h3 className="text-lg font-semibold mb-2">Marcoby Cloud API Setup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to your Marcoby Cloud infrastructure management platform.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-blue-800">
                <ExternalLink className="w-4 h-4" />
                ResellersPanel Integration
              </h4>
              <p className="text-sm text-blue-700">
                Marcoby Cloud uses ResellersPanel as its white-label backend. Enter your ResellersPanel API credentials to connect your hosting infrastructure.
              </p>
              <ol className="text-sm space-y-1 ml-4 list-decimal text-blue-700">
                <li>Log in to your <a href="https://cp.resellerspanel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ResellersPanel Control Panel</a></li>
                <li>Navigate to API Settings</li>
                <li>Enable API access for your account</li>
                <li>Use your ResellersPanel username and password</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rspUsername">ResellersPanel Username</Label>
                <Input
                  id="rspUsername"
                  placeholder="your-username"
                  value={formData.rspUsername}
                  onChange={(e) => handleInputChange('rspUsername', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rspPassword">ResellersPanel Password</Label>
                <div className="relative">
                  <Input
                    id="rspPassword"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="your-password"
                    value={formData.rspPassword}
                    onChange={(e) => handleInputChange('rspPassword', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization ID (Optional)</Label>
                <Input
                  id="orgId"
                  placeholder="org-xxxxxxxx-xxxx-xxxx"
                  value={formData.orgId}
                  onChange={(e) => handleInputChange('orgId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">Marcoby Cloud URL</Label>
                <Input
                  id="endpoint"
                  placeholder="https://cloud.marcoby.com"
                  value={formData.endpoint}
                  onChange={(e) => handleInputChange('endpoint', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={testConnection} 
                disabled={loading || !formData.rspUsername || !formData.rspPassword}
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

        {/* Step 2: Test Infrastructure */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Infrastructure Access</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let's verify we can access your infrastructure metrics and monitoring data.
              </p>
            </div>

            <div className="bg-success/10 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <h4 className="font-medium text-success">Connection Successful</h4>
                  <p className="text-sm text-success/80">
                    Connected to Marcoby Cloud via ResellersPanel API
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={testInfrastructure} 
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Infrastructure'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review Capabilities */}
        {currentStep === 3 && testResults.metrics && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Infrastructure Overview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Preview of your infrastructure metrics and monitoring capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Server className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Infrastructure</h4>
                      <p className="text-2xl font-bold">
                        {testResults.metrics.infrastructure.activeServers}/{testResults.metrics.infrastructure.totalServers}
                      </p>
                      <p className="text-sm text-muted-foreground">Active Servers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-green-500" />
                    <div>
                      <h4 className="font-medium">Uptime</h4>
                      <p className="text-2xl font-bold">
                        {testResults.metrics.infrastructure.uptime}%
                      </p>
                      <p className="text-sm text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-amber-500" />
                    <div>
                      <h4 className="font-medium">Monthly Cost</h4>
                      <p className="text-2xl font-bold">
                        ${testResults.metrics.costs.monthlySpend.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Current spend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Performance Monitoring</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• CPU: {testResults.metrics.infrastructure.cpuUtilization}% utilization</li>
                  <li>• Memory: {testResults.metrics.infrastructure.memoryUtilization}% utilization</li>
                  <li>• Response time: {testResults.metrics.performance.responseTime}ms</li>
                  <li>• Throughput: {testResults.metrics.performance.throughput} req/s</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Cost Optimization</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Potential savings: ${testResults.metrics.costs.optimizationSavings}</li>
                  <li>• Cost trend: {testResults.metrics.costs.costTrend}</li>
                  <li>• Top cost driver: Compute ({testResults.metrics.costs.topCostDrivers[0]?.percentage}%)</li>
                  <li>• Storage utilization: {testResults.metrics.storage.storageUtilization}%</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Security & Compliance</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Security score: {testResults.metrics.security.securityScore}%</li>
                  <li>• Vulnerabilities: {testResults.metrics.security.vulnerabilities}</li>
                  <li>• Patch level: {testResults.metrics.security.patchLevel}%</li>
                  <li>• Critical alerts: {testResults.metrics.security.criticalAlerts}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-success">✅ Automation Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Automation coverage: {testResults.metrics.automation.automationCoverage}%</li>
                  <li>• Automated tasks: {testResults.metrics.automation.automatedTasks}/{testResults.metrics.automation.totalTasks}</li>
                  <li>• Deployment frequency: {testResults.metrics.automation.deploymentFrequency}/week</li>
                  <li>• Failure rate: {testResults.metrics.automation.failureRate}%</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(4)}
                className="min-w-[120px]"
              >
                Continue Setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete Setup */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Activate!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your Marcoby Cloud integration will provide comprehensive infrastructure monitoring and automatic KPI updates.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">🚀 What happens next:</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Automatic updates to <strong>Asset Utilization</strong> KPI</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Real-time <strong>Service Uptime</strong> monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Automated <strong>Automation Coverage</strong> tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Cost optimization recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Security and performance alerts</span>
                </li>
              </ul>
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
                    Activating...
                  </>
                ) : (
                  'Activate Monitoring'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarcobyCloudSetup; 