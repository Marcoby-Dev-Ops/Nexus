/**
 * Microsoft Teams Integration Setup Component
 * Provides seamless Teams integration with enterprise-grade OAuth flow
 * Complements Slack integration for complete communication intelligence
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Label } from '@/shared/components/ui/Label';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Video, 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart3,
  Mail,
  FileText,
  FolderOpen
} from 'lucide-react';
import { microsoftTeamsService } from '@/services/integrations/microsoftTeamsService';

interface TeamsSetupProps {
  onComplete?: (data: unknown) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, unknown>;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  optional?: boolean;
}

interface TeamsMetrics {
  totalTeams: number;
  totalChannels: number;
  totalMessages: number;
  totalMeetings: number;
  activeUsers: number;
  averageResponseTime: number;
}

const MicrosoftTeamsSetup: React.FC<TeamsSetupProps> = ({
  onComplete,
  onCancel,
  existingConfig
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [teamsData, setTeamsData] = useState<TeamsMetrics | null>(null);
  const [tenantId, setTenantId] = useState((existingConfig?.tenantId as string) || '');
  const [clientId] = useState((existingConfig?.clientId as string) || '');
  const [setupProgress, setSetupProgress] = useState(0);

  const teamsService = microsoftTeamsService;

  const setupSteps: SetupStep[] = [
    {
      id: 'authenticate',
      title: 'Connect to Microsoft 365',
      description: 'Authenticate with your Microsoft 365 account to access Teams, OneDrive, SharePoint, and Outlook',
      completed: connectionStatus === 'connected',
      current: currentStep === 0
    },
    {
      id: 'permissions',
      title: 'Configure Permissions',
      description: 'Review and approve the permissions needed for comprehensive Microsoft 365 integration',
      completed: false,
      current: currentStep === 1
    },
    {
      id: 'sync',
      title: 'Initial Data Sync',
      description: 'Import your Teams, OneDrive, SharePoint, and Outlook data',
      completed: false,
      current: currentStep === 2
    },
    {
      id: 'analytics',
      title: 'Enable Analytics',
      description: 'Set up comprehensive analytics for all Microsoft 365 services',
      completed: false,
      current: currentStep === 3
    }
  ];

  const requiredPermissions = [
    {
      scope: 'Team.ReadBasic.All',
      description: 'Read Teams information and structure',
      icon: Users,
      required: true
    },
    {
      scope: 'Channel.ReadBasic.All', 
      description: 'Read Teams channels and messages',
      icon: MessageSquare,
      required: true
    },
    {
      scope: 'ChannelMessage.Read.All',
      description: 'Read Teams messages for analytics',
      icon: MessageSquare,
      required: true
    },
    {
      scope: 'Chat.Read',
      description: 'Read Teams chat conversations',
      icon: MessageSquare,
      required: true
    },
    {
      scope: 'Mail.Read',
      description: 'Read Outlook emails and messages',
      icon: Mail,
      required: true
    },
    {
      scope: 'Calendars.Read',
      description: 'Read Outlook calendar and meetings',
      icon: Calendar,
      required: true
    },
    {
      scope: 'Files.Read.All',
      description: 'Read OneDrive and SharePoint documents',
      icon: FileText,
      required: true
    },
    {
      scope: 'Sites.Read.All',
      description: 'Read SharePoint sites and libraries',
      icon: FolderOpen,
      required: true
    },
    {
      scope: 'User.Read',
      description: 'Read user profile information',
      icon: Users,
      required: true
    }
  ];

  const expectedInsights = [
    {
      title: 'Communication Intelligence',
      description: 'Comprehensive analysis of Teams, Outlook, and collaboration patterns',
      icon: TrendingUp,
      metrics: ['Peak activity hours', 'Response time analysis', 'Cross-platform usage']
    },
    {
      title: 'Document & Content Analytics',
      description: 'Insights into OneDrive and SharePoint usage patterns',
      icon: FileText,
      metrics: ['Document collaboration', 'File sharing patterns', 'Content engagement']
    },
    {
      title: 'Meeting & Calendar Optimization',
      description: 'Optimize meeting efficiency and calendar management',
      icon: Video,
      metrics: ['Meeting frequency', 'Duration analysis', 'Calendar conflicts']
    },
    {
      title: 'Unified Productivity Insights',
      description: 'Cross-service analytics for comprehensive productivity optimization',
      icon: BarChart3,
      metrics: ['Tool efficiency', 'Workflow optimization', 'Collaboration health']
    }
  ];

  useEffect(() => {
    // Calculate setup progress based on completed steps
    const completedSteps = setupSteps.filter(step => step.completed).length;
    setSetupProgress((completedSteps / setupSteps.length) * 100);
  }, [connectionStatus, setupSteps]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);

      // Initiate OAuth flow
      const authUrl = teamsService.initiateAuth();
      
      // Open OAuth window
      const authWindow = window.open(
        authUrl,
        'teams-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'teams-oauth-success') {
          authWindow?.close();
          
          // Handle OAuth callback
          const { code, state } = event.data;
          await teamsService.handleCallback(code, state);
          
          // Test connection and get initial data
          const testResult = await teamsService.testConnection();
          if (testResult.success) {
            setConnectionStatus('connected');
            setTeamsData(testResult.data);
            setCurrentStep(1);
          } else {
            throw new Error(testResult.message);
          }
        } else if (event.data.type === 'teams-oauth-error') {
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
      setError(err instanceof Error ? err.message: 'Failed to connect to Microsoft Teams');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePermissionApproval = () => {
    setCurrentStep(2);
    // Start initial sync
    setTimeout(() => {
      setCurrentStep(3);
    }, 3000);
  };

  const handleAnalyticsSetup = () => {
    // Complete setup
    onComplete?.({
      platform: 'microsoft-365',
      status: 'connected',
      config: {
        tenantId,
        clientId,
        permissions: requiredPermissions.map(p => p.scope)
      },
      data: teamsData
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Connect Microsoft 365</h3>
                <p className="text-muted-foreground">
                  Securely connect your Microsoft 365 account to access Teams, OneDrive, SharePoint, and Outlook for comprehensive productivity insights
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
                <Label htmlFor="tenant-id">Tenant ID (Optional)</Label>
                <Input
                  id="tenant-id"
                  placeholder="Enter your Microsoft 365 Tenant ID"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank to use the default authentication flow
                </p>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting to Teams...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Connect with Microsoft
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Enterprise Security
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• OAuth 2.0 authentication with Microsoft</li>
                <li>• No passwords stored - tokens are encrypted</li>
                <li>• Read-only access to protect your data</li>
                <li>• Compliant with Microsoft security standards</li>
              </ul>
            </div>
          </div>
        );

      case 1: return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Review Permissions</h3>
                <p className="text-muted-foreground">
                  These permissions enable comprehensive Teams analytics while protecting your privacy
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {requiredPermissions.map((permission) => {
                const Icon = permission.icon;
                return (
                  <div key={permission.scope} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <Icon className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{permission.scope}</span>
                        {permission.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                All data is processed locally and used only for generating insights. 
                Your Teams content remains private and secure.
              </AlertDescription>
            </Alert>

            <Button onClick={handlePermissionApproval} className="w-full" size="lg">
              Approve Permissions & Continue
            </Button>
          </div>
        );

      case 2: return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Importing Teams Data</h3>
                <p className="text-muted-foreground">
                  We're securely importing your Teams data to generate insights
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">{teamsData?.totalTeams || 0}</div>
                  <div className="text-sm text-muted-foreground">Teams</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <MessageSquare className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">{teamsData?.totalChannels || 0}</div>
                  <div className="text-sm text-muted-foreground">Channels</div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Currently Importing:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Team and channel structure</li>
                  <li>✓ User profiles and roles</li>
                  <li className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Recent messages and conversations
                  </li>
                  <li>• Meeting history and analytics</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 3: return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-success" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analytics Ready!</h3>
                <p className="text-muted-foreground">
                  Your Teams integration is complete. Here's what insights you'll get:
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {expectedInsights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.title} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-4">
                      <Icon className="w-5 h-5 text-primary mt-0.5" />
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
                <strong>Pro Tip: </strong> Combine with Slack integration for comprehensive 
                cross-platform communication insights and optimization recommendations.
              </AlertDescription>
            </Alert>

            <Button onClick={handleAnalyticsSetup} className="w-full" size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Teams Setup
            </Button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Microsoft Teams Integration</h2>
            <p className="text-muted-foreground">
              Connect Teams for comprehensive communication intelligence
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
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
                step.completed 
                  ? 'bg-success/10 text-success'
                  : step.current
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    step.current ? 'border-blue-600 bg-primary' : 'border-muted-foreground'
                  }`} />
                )}
                <span className="hidden sm: inline">{step.title}</span>
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

export default MicrosoftTeamsSetup; 