/**
 * Microsoft Graph Integration Component
 * Pillar: 2 - Minimum Lovable Feature Set
 * Simple Microsoft 365 integration using existing OAuth and Graph API calls
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
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MicrosoftGraphIntegrationProps {
  onComplete?: () => void;
}

const MicrosoftGraphIntegration: React.FC<MicrosoftGraphIntegrationProps> = ({
  onComplete
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'checking'>('checking');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Check if user already has Microsoft 365 connected
  const checkConnection = async () => {
    if (!user) return;
    
    try {
      // Check if user has Microsoft Graph integration connected
      const { data: office365Integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'office-365')
        .single();

      if (office365Integration) {
        const { data: userIntegration } = await supabase
          .from('user_integrations')
          .select('status, config')
          .eq('user_id', user.id)
          .eq('integration_id', office365Integration.id)
          .eq('name', 'Microsoft 365 Graph')
          .single();

        const isConnected = userIntegration?.status === 'active' && 
                           userIntegration?.config?.graph_enabled === true;
        
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking Microsoft connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user]);

  // Listen for URL parameter changes to refresh connection status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const setupParam = urlParams.get('setup');
    
    if (setupParam === 'microsoft365') {
      // Delay to allow the integration to be saved first
      const timer = setTimeout(() => {
        checkConnection();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event when Microsoft 365 is connected
  useEffect(() => {
    const handleMicrosoft365Connected = () => {
      console.log('🔄 Microsoft 365 connection event received, refreshing status...');
      checkConnection();
    };

    window.addEventListener('microsoft365Connected', handleMicrosoft365Connected);
    
    return () => {
      window.removeEventListener('microsoft365Connected', handleMicrosoft365Connected);
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Check if user is already authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // User is already signed in, link the Microsoft identity
        const { error } = await supabase.auth.linkIdentity({
          provider: 'azure',
          options: {
            scopes: 'openid profile email https://graph.microsoft.com/User.Read https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read',
            redirectTo: `${window.location.origin}/integrations?setup=microsoft365`
          }
        });

        if (error) {
          console.error('Failed to link Microsoft identity:', error);
          // Fallback to regular OAuth if linking fails
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
              scopes: 'openid profile email https://graph.microsoft.com/User.Read https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read',
              redirectTo: `${window.location.origin}/integrations?setup=microsoft365`
            }
          });
          
          if (oauthError) throw oauthError;
        }
      } else {
        // No user signed in, use regular OAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            scopes: 'openid profile email https://graph.microsoft.com/User.Read https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read',
            redirectTo: `${window.location.origin}/integrations?setup=microsoft365`
          }
        });

        if (error) throw error;
      }

      addNotification({
        type: 'info',
        message: 'Redirecting to Microsoft for authorization...'
      });
    } catch (error) {
      console.error('Microsoft connection error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to connect to Microsoft 365. Please try again.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      addNotification({
        type: 'info',
        message: 'Microsoft 365 integration disabled for this session'
      });
      setConnectionStatus('disconnected');
      onComplete?.();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const features = [
    {
      id: 'email',
      title: 'Email Integration',
      description: 'Connect Outlook email to unified inbox',
      icon: <Mail className="w-6 h-6 text-primary" />,
      status: connectionStatus === 'connected' ? 'available' : 'requires_auth'
    },
    {
      id: 'calendar',
      title: 'Calendar Access',
      description: 'View Microsoft 365 calendar events',
      icon: <Calendar className="w-6 h-6 text-success" />,
      status: connectionStatus === 'connected' ? 'available' : 'requires_auth'
    },
    {
      id: 'contacts',
      title: 'People & Contacts',
      description: 'Access your organization directory',
      icon: <Users className="w-6 h-6 text-secondary" />,
      status: connectionStatus === 'connected' ? 'available' : 'requires_auth'
    },
    {
      id: 'teams',
      title: 'Teams Integration',
      description: 'Future: Teams chat and collaboration',
      icon: <MessageSquare className="w-6 h-6 text-warning" />,
      status: 'coming_soon'
    }
  ];

  if (connectionStatus === 'checking') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Checking Microsoft 365 connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary dark:text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Microsoft 365 Integration</h2>
        <p className="text-muted-foreground">
          Connect your Microsoft 365 account to access email, calendar, and more
        </p>
      </div>

      {/* Connection Status */}
      {connectionStatus === 'connected' ? (
        <Alert>
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription>
            <strong>Connected:</strong> Your Microsoft 365 account is successfully linked.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Not Connected:</strong> Connect your Microsoft 365 account to enable enhanced features.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus === 'connected' ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your Microsoft 365 account is connected and ready to use.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/inbox'}>
                      <Mail className="w-4 h-4 mr-2" />
                      Open Unified Inbox
                    </Button>
                    <Button variant="outline" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Microsoft 365 account to enable email synchronization, 
                    calendar access, and more productivity features.
                  </p>
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Connect Microsoft 365
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        <Badge 
                          variant={
                            feature.status === 'available' ? 'default' :
                            feature.status === 'requires_auth' ? 'secondary' :
                            'outline'
                          }
                        >
                          {feature.status === 'available' ? 'Ready' :
                           feature.status === 'requires_auth' ? 'Connect Required' :
                           'Coming Soon'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learn More</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a 
              href="https://docs.microsoft.com/en-us/graph/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Microsoft Graph Documentation
            </a>
            <a 
              href="/settings/security" 
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Security & Privacy Settings
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MicrosoftGraphIntegration; 