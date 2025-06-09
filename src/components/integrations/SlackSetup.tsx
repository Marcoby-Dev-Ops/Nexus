/**
 * Slack Integration Setup Component
 * Provides seamless Slack integration with OAuth flow and workspace connection
 * Complements Teams integration for complete communication intelligence
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Checkbox';
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Zap, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Loader2,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Smile,
  FileText,
  MessageCircle
} from 'lucide-react';

interface SlackSetupProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: any;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  optional?: boolean;
}

interface SlackMetrics {
  totalChannels: number;
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: number;
  publicChannels: number;
  privateChannels: number;
}

interface SlackPermission {
  scope: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  category: 'basic' | 'messages' | 'users' | 'files';
}

const SlackSetup: React.FC<SlackSetupProps> = ({
  onComplete,
  onCancel,
  existingConfig
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [slackData, setSlackData] = useState<SlackMetrics | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState(existingConfig?.workspaceUrl || '');
  const [includePrivateChannels, setIncludePrivateChannels] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [setupProgress, setSetupProgress] = useState(0);

  const setupSteps: SetupStep[] = [
    {
      id: 'workspace',
      title: 'Connect Workspace',
      description: 'Connect to your Slack workspace and authenticate',
      completed: connectionStatus === 'connected',
      current: currentStep === 0
    },
    {
      id: 'permissions',
      title: 'Configure Permissions',
      description: 'Review and approve the permissions needed for Slack integration',
      completed: false,
      current: currentStep === 1
    },
    {
      id: 'channels',
      title: 'Select Channels',
      description: 'Choose which channels to include in analytics',
      completed: false,
      current: currentStep === 2
    },
    {
      id: 'analytics',
      title: 'Enable Analytics',
      description: 'Set up communication analytics and insights generation',
      completed: false,
      current: currentStep === 3
    }
  ];

  const requiredPermissions: SlackPermission[] = [
    {
      scope: 'channels:read',
      description: 'View basic information about public channels',
      icon: Hash,
      required: true,
      category: 'basic'
    },
    {
      scope: 'channels:history',
      description: 'View messages and content in public channels',
      icon: MessageSquare,
      required: true,
      category: 'messages'
    },
    {
      scope: 'groups:read',
      description: 'View basic information about private channels',
      icon: Users,
      required: false,
      category: 'basic'
    },
    {
      scope: 'groups:history',
      description: 'View messages and content in private channels',
      icon: MessageSquare,
      required: false,
      category: 'messages'
    },
    {
      scope: 'users:read',
      description: 'View user profiles and information',
      icon: Users,
      required: true,
      category: 'users'
    },
    {
      scope: 'reactions:read',
      description: 'View emoji reactions on messages',
      icon: Smile,
      required: false,
      category: 'messages'
    },
    {
      scope: 'files:read',
      description: 'View files shared in channels',
      icon: FileText,
      required: false,
      category: 'files'
    },
    {
      scope: 'im:read',
      description: 'View direct message information',
      icon: MessageCircle,
      required: false,
      category: 'messages'
    }
  ];

  const expectedInsights = [
    {
      title: 'Channel Activity Analysis',
      description: 'Identify your most active channels and quiet spaces',
      icon: BarChart3,
      metrics: ['Message volume', 'User engagement', 'Peak activity times']
    },
    {
      title: 'Response Time Intelligence',
      description: 'Track how quickly your team responds to messages',
      icon: Clock,
      metrics: ['Average response time', 'Response patterns', 'Time-to-resolution']
    },
    {
      title: 'Team Collaboration Insights',
      description: 'Understand how your team collaborates and communicates',
      icon: Users,
      metrics: ['Cross-team communication', 'Mention patterns', 'Thread engagement']
    },
    {
      title: 'Productivity Patterns',
      description: 'Discover when your team is most productive and engaged',
      icon: TrendingUp,
      metrics: ['Peak hours', 'Message quality', 'Emoji sentiment']
    }
  ];

  useEffect(() => {
    // Calculate setup progress based on completed steps
    const completedSteps = setupSteps.filter(step => step.completed).length;
    setSetupProgress((completedSteps / setupSteps.length) * 100);
  }, [connectionStatus]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);

      // Validate workspace URL
      if (!workspaceUrl) {
        throw new Error('Please enter your Slack workspace URL');
      }

      // Build OAuth URL for Slack
      const scopes = requiredPermissions
        .filter(p => p.required || (p.scope.includes('groups') && includePrivateChannels))
        .map(p => p.scope)
        .join(',');

      const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/slack/callback`;
      
      const authUrl = `https://slack.com/oauth/v2/authorize?` +
        `client_id=${clientId}&` +
        `scope=${scopes}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${btoa(JSON.stringify({ workspaceUrl }))}`;

      // Open OAuth window
      const authWindow = window.open(
        authUrl,
        'slack-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'slack-oauth-success') {
          authWindow?.close();
          
          // Simulate getting workspace data
          const mockData: SlackMetrics = {
            totalChannels: 15,
            totalMessages: 2847,
            activeUsers: 12,
            averageResponseTime: 18,
            publicChannels: 12,
            privateChannels: includePrivateChannels ? 3 : 0
          };

          setConnectionStatus('connected');
          setSlackData(mockData);
          setCurrentStep(1);
          
        } else if (event.data.type === 'slack-oauth-error') {
          authWindow?.close();
          throw new Error(event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup listener after timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
          setConnectionStatus('error');
          setError('Authentication timed out. Please try again.');
        }
      }, 300000); // 5 minutes timeout

    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect to Slack');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePermissionApproval = () => {
    setCurrentStep(2);
  };

  const handleChannelSelection = () => {
    setCurrentStep(3);
  };

  const handleAnalyticsSetup = () => {
    // Complete setup
    onComplete?.({
      platform: 'slack',
      status: 'connected',
      config: {
        workspaceUrl,
        includePrivateChannels,
        selectedChannels,
        permissions: requiredPermissions
          .filter(p => p.required || (p.scope.includes('groups') && includePrivateChannels))
          .map(p => p.scope)
      },
      data: slackData
    });
  };

  const formatWorkspaceUrl = (url: string) => {
    // Remove protocol and trailing slash, ensure .slack.com domain
    let formatted = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!formatted.includes('.slack.com')) {
      formatted = formatted.includes('.') ? formatted : `${formatted}.slack.com`;
    }
    return formatted;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Connect to Slack</h3>
                <p className="text-muted-foreground">
                  Connect your Slack workspace to start analyzing team communication patterns
                </p>
              </div>
            </div>

            {connectionStatus === 'error' && error && (
              <Alert variant="error">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="workspace-url">Workspace URL</Label>
                <Input
                  id="workspace-url"
                  placeholder="yourcompany.slack.com"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(formatWorkspaceUrl(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your Slack workspace URL or subdomain
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="private-channels"
                  checked={includePrivateChannels}
                  onCheckedChange={(checked: boolean) => setIncludePrivateChannels(checked)}
                />
                <Label htmlFor="private-channels" className="text-sm">
                  Include private channels (requires additional permissions)
                </Label>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={isConnecting || !workspaceUrl}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting to Slack...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Connect with Slack
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Security & Privacy
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• OAuth 2.0 authentication with Slack</li>
                <li>• Read-only access to protect your data</li>
                <li>• No message content stored - only analytics</li>
                <li>• GDPR and SOC 2 compliant data handling</li>
              </ul>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Review Permissions</h3>
                <p className="text-muted-foreground">
                  These permissions enable comprehensive Slack analytics while protecting your privacy
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {['basic', 'messages', 'users', 'files'].map(category => {
                const categoryPermissions = requiredPermissions.filter(p => p.category === category);
                if (categoryPermissions.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="font-medium mb-3 capitalize">{category} Permissions</h4>
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => {
                        const Icon = permission.icon;
                        const isEnabled = permission.required || 
                          (permission.scope.includes('groups') && includePrivateChannels);
                        
                        return (
                          <div key={permission.scope} className={`flex items-start space-x-3 p-3 border rounded-lg ${
                            isEnabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                          }`}>
                            <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{permission.scope}</span>
                                {permission.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                {!permission.required && isEnabled && (
                                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                We only analyze communication patterns and metadata. 
                Message content is processed locally and never stored on our servers.
              </AlertDescription>
            </Alert>

            <Button onClick={handlePermissionApproval} className="w-full" size="lg">
              Approve Permissions & Continue
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Hash className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Select Channels</h3>
                <p className="text-muted-foreground">
                  Choose which channels to include in your communication analytics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <Hash className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{slackData?.publicChannels || 0}</div>
                <div className="text-sm text-muted-foreground">Public Channels</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{slackData?.privateChannels || 0}</div>
                <div className="text-sm text-muted-foreground">Private Channels</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Channel Selection</Label>
                <Button variant="outline" size="sm">
                  Select All
                </Button>
              </div>
              
              {/* Mock channel list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[
                  { name: 'general', type: 'public', members: 12 },
                  { name: 'random', type: 'public', members: 8 },
                  { name: 'development', type: 'public', members: 5 },
                  { name: 'marketing', type: 'public', members: 4 },
                  { name: 'sales', type: 'public', members: 6 },
                  ...(includePrivateChannels ? [
                    { name: 'leadership', type: 'private', members: 3 },
                    { name: 'hr-private', type: 'private', members: 2 }
                  ] : [])
                ].map((channel) => (
                  <div key={channel.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox 
                      id={`channel-${channel.name}`}
                      defaultChecked={channel.name === 'general'}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedChannels(prev => [...prev, channel.name]);
                        } else {
                          setSelectedChannels(prev => prev.filter(c => c !== channel.name));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {channel.type === 'public' ? (
                          <Hash className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Users className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">#{channel.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {channel.members} members
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                You can modify channel selection later in the integration settings.
                Analytics will only include selected channels.
              </AlertDescription>
            </Alert>

            <Button onClick={handleChannelSelection} className="w-full" size="lg">
              Continue with Selected Channels
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analytics Ready!</h3>
                <p className="text-muted-foreground">
                  Your Slack integration is complete. Here's what insights you'll get:
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {expectedInsights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.title} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {insight.metrics.map((metric) => (
                            <Badge key={metric} variant="outline" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Step:</strong> Add Microsoft Teams integration for complete 
                cross-platform communication intelligence and optimization insights.
              </AlertDescription>
            </Alert>

            <Button onClick={handleAnalyticsSetup} className="w-full" size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Slack Setup
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Slack Integration</h2>
            <p className="text-muted-foreground">
              Connect Slack for comprehensive communication analytics
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Setup Progress</div>
            <div className="text-2xl font-bold">{Math.round(setupProgress)}%</div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-2 mb-6">
          {setupSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
                step.completed 
                  ? 'bg-green-100 text-green-800'
                  : step.current
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    step.current ? 'border-purple-600 bg-purple-600' : 'border-muted-foreground'
                  }`} />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
              {index < setupSteps.length - 1 && (
                <div className="w-8 h-px bg-muted" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Cancel/Back Actions */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel Setup
        </Button>
        {currentStep > 0 && connectionStatus !== 'connecting' && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          >
            Previous Step
          </Button>
        )}
      </div>
    </div>
  );
};

export default SlackSetup; 