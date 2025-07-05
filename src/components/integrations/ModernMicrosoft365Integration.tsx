/**
 * Modern Microsoft 365 Integration Component
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * Uses Microsoft Graph Toolkit for best-practice Microsoft 365 integration
 * Replaces custom OAuth flows with official Microsoft components
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  Settings,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import {
  GraphLogin,
  GraphPerson,
  GraphAgenda,
  GraphPeoplePicker,
  GraphFileList
} from '@/components/microsoft365/GraphToolkitComponents';
import { useM365Integration } from '@/hooks/useM365Integration';

interface ModernMicrosoft365IntegrationProps {
  onComplete?: () => void;
}

export const ModernMicrosoft365Integration: React.FC<ModernMicrosoft365IntegrationProps> = ({
  onComplete
}) => {
  const { isConnected, isConnecting, error, connect, disconnect } = useM365Integration();
  const [selectedTab, setSelectedTab] = useState('overview');
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        message: `Microsoft 365 Error: ${error.message}`
      });
    }
  }, [error, addNotification]);

  const handleConnect = async () => {
    await connect();
    if (!error) {
      addNotification({
        type: 'success',
        message: 'Successfully connected to Microsoft 365!'
      });
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    addNotification({
      type: 'success',
      message: 'Disconnected from Microsoft 365'
    });
    onComplete?.();
  };

  const features = [
    {
      id: 'login',
      title: 'User Authentication',
      description: 'Secure Microsoft 365 login with automatic token management',
      icon: <Shield className="w-6 h-6 text-primary" />,
      component: 'Login',
      status: isConnected ? 'available' : 'requires_auth'
    },
    {
      id: 'person',
      title: 'User Profile',
      description: 'Rich user profile display with organization context',
      icon: <Users className="w-6 h-6 text-secondary" />,
      component: 'Person',
      status: isConnected ? 'available' : 'requires_auth'
    },
    {
      id: 'emails',
      title: 'Email Access',
      description: 'Read and manage emails through Microsoft Graph',
      icon: <Mail className="w-6 h-6 text-primary" />,
      component: 'Get (Email API)',
      status: isConnected ? 'available' : 'requires_auth'
    },
    {
      id: 'people',
      title: 'People Picker',
      description: 'Search and select people from your organization',
      icon: <Users className="w-6 h-6 text-warning" />,
      component: 'PeoplePicker',
      status: isConnected ? 'available' : 'requires_auth'
    },
    {
      id: 'files',
      title: 'File Browser',
      description: 'Browse OneDrive and SharePoint files',
      icon: <MessageSquare className="w-6 h-6 text-secondary" />,
      component: 'FileList',
      status: isConnected ? 'available' : 'requires_auth'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary dark:text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Microsoft Graph Toolkit Integration</h2>
        <p className="text-muted-foreground">
          Modern Microsoft 365 integration using official Microsoft Graph Toolkit components
        </p>
      </div>

      {/* Connection Status */}
      {isConnecting ? (
        <Alert>
          <Loader2 className="w-4 h-4 animate-spin" />
          <AlertDescription>
            Checking Microsoft 365 connection status...
          </AlertDescription>
        </Alert>
      ) : isConnected ? (
        <Alert>
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription>
            <strong>Connected:</strong> Microsoft Graph Toolkit is active and authenticated.
            All Microsoft 365 features are now available.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Not Connected:</strong> Connect to Microsoft 365 to enable Graph Toolkit components.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Live Demo</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Microsoft Graph Toolkit Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">🚀 Pre-built Components</h4>
                  <p className="text-sm text-muted-foreground">
                    Ready-to-use React components for common Microsoft 365 scenarios
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🔒 Secure Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    MSAL2-based authentication with automatic token management
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">⚡ Optimized Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Built-in caching, batching, and error handling
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🎨 Customizable UI</h4>
                  <p className="text-sm text-muted-foreground">
                    CSS custom properties and templating support
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {feature.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{feature.title}</p>
                      <Badge 
                        variant={feature.status === 'available' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {feature.status === 'available' ? 'Ready' : 'Auth Required'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          {isConnected ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <GraphPerson view="threelines" className="mb-4" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>People Picker</CardTitle>
                </CardHeader>
                <CardContent>
                  <GraphPeoplePicker 
                    selectionMode="multiple"
                    className="w-full"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Browser</CardTitle>
                </CardHeader>
                <CardContent>
                  <GraphFileList className="w-full h-64" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                  Connect to Microsoft 365 to see live component demos
                </p>
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Microsoft 365 account to enable Microsoft Graph Toolkit components.
                    This uses the official Microsoft authentication flow with MSAL2.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      What happens when you connect:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Secure authentication through Microsoft</li>
                      <li>• Automatic token management and refresh</li>
                      <li>• Access to your calendar, email, and files</li>
                      <li>• No passwords stored locally</li>
                    </ul>
                  </div>

                  <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect to Microsoft 365'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Connected to Microsoft 365</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Authentication tokens managed automatically</li>
                      <li>Graph API calls optimized and cached</li>
                      <li>All MGT components ready to use</li>
                      <li>Real-time data synchronization</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-mono">MSAL2Provider</span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <span className="font-mono">Microsoft Identity Platform</span>
                </div>
                <div className="flex justify-between">
                  <span>API Version:</span>
                  <span className="font-mono">Microsoft Graph v1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Toolkit Version:</span>
                  <span className="font-mono">@microsoft/mgt-react ^4.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <a 
                  href="https://learn.microsoft.com/en-us/graph/toolkit/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Microsoft Graph Toolkit Documentation
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModernMicrosoft365Integration; 