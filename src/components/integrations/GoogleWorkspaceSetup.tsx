/**
 * Google Workspace Setup Component (Enhanced)
 * Two-step setup: OAuth authentication → Service selection
 * Enables granular control over which Google services to integrate
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { Alert, AlertDescription } from '@/shared/components/ui';
import { Badge } from '@/shared/components/ui';
import { useAuth } from '@/hooks/index';
import { useNotifications } from '@/core/hooks/NotificationContext.tsx';
import { googleWorkspaceService } from '@/services/analytics/googleWorkspaceService';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Calendar, HardDrive, Mail, Users, BarChart3, Search, Building, Shield, FileText, ArrowRight } from 'lucide-react';
interface GoogleWorkspaceSetupProps {
  onComplete: (integration: any) => void;
  onClose: () => void;
}

interface GoogleService {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'productivity' | 'communication' | 'storage' | 'analytics';
  scopes: string[];
  popular: boolean;
  enabled: boolean;
}

const GoogleWorkspaceSetup: React.FC<GoogleWorkspaceSetupProps> = ({ 
  onComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'oauth' | 'services' | 'complete'>('oauth');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Google services that can be enabled
  const [googleServices, setGoogleServices] = useState<GoogleService[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Access emails, labels, and email analytics',
      icon: Mail,
      category: 'communication',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      popular: true,
      enabled: false
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Sync calendar events and meeting analytics',
      icon: Calendar,
      category: 'productivity',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      popular: true,
      enabled: false
    },
    {
      id: 'drive',
      name: 'Google Drive',
      description: 'Access and sync files from Google Drive',
      icon: HardDrive,
      category: 'storage',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      popular: true,
      enabled: false
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      description: 'Website and app analytics dashboards',
      icon: BarChart3,
      category: 'analytics',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      popular: false,
      enabled: false
    },
    {
      id: 'search-console',
      name: 'Search Console',
      description: 'Search performance and SEO insights',
      icon: Search,
      category: 'analytics',
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      popular: false,
      enabled: false
    },
    {
      id: 'my-business',
      name: 'Google My Business',
      description: 'Business profile and reviews',
      icon: Building,
      category: 'productivity',
      scopes: ['https://www.googleapis.com/auth/business.manage'],
      popular: false,
      enabled: false
    },
    {
      id: 'contacts',
      name: 'Google Contacts',
      description: 'Access and sync contacts',
      icon: Users,
      category: 'communication',
      scopes: ['https://www.googleapis.com/auth/contacts.readonly'],
      popular: false,
      enabled: false
    },
    {
      id: 'docs',
      name: 'Google Docs',
      description: 'Document collaboration and analytics',
      icon: FileText,
      category: 'productivity',
      scopes: ['https://www.googleapis.com/auth/documents.readonly'],
      popular: false,
      enabled: false
    }
  ]);

  useEffect(() => {
    // If already authenticated, skip to services step
    if (googleWorkspaceService.isAuthenticated()) {
      setConnectionStatus('connected');
      setCurrentStep('services');
      // Optionally, fetch user info here
      setUserInfo({
        name: user?.name || 'Google User',
        email: user?.email || '',
        organization: user?.organization || ''
      });
    }
  }, [user]);

  const handleOAuthConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);

      // Build OAuth scope for all potential services
      const allScopes = googleServices.flatMap(service => service.scopes);
      const uniqueScopes = [...new Set(allScopes)];
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/google/callback`;
      
      const params = new URLSearchParams({
        clientid: clientId,
        responsetype: 'code',
        redirecturi: redirectUri,
        scope: uniqueScopes.join(' '),
        accesstype: 'offline',
        prompt: 'consent',
        state: btoa(JSON.stringify({ timestamp: Date.now() }))
      });

      const authUrl = `https: //accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open OAuth window
      const authWindow = window.open(
        authUrl,
        'google-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'google-oauth-success') {
          authWindow?.close();
          // Mock user info - in real implementation, this would come from the OAuth callback
          const mockUserInfo = {
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            organization: 'Acme Corporation'
          };
          setConnectionStatus('connected');
          setUserInfo(mockUserInfo);
              setCurrentStep('services');
        } else if (event.data.type === 'google-oauth-error') {
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
      }, 300000);

    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message: 'Failed to connect to Google Workspace');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    setGoogleServices(services =>
      services.map(service =>
        service.id === serviceId ? { ...service, enabled } : service
      )
    );
  };

  const handleSelectAll = (category: string) => {
    setGoogleServices(services =>
      services.map(service =>
        service.category === category ? { ...service, enabled: true } : service
      )
    );
  };

  const handleSelectPopular = () => {
    setGoogleServices(services =>
      services.map(service =>
        service.popular ? { ...service, enabled: true } : service
      )
    );
  };

  const handleCompleteSetup = () => {
    const enabledServices = googleServices.filter(service => service.enabled);
    if (enabledServices.length === 0) {
      setError('Please select at least one service to continue');
      return;
    }
    setCurrentStep('complete');
    onComplete({
      platform: 'google-workspace',
      status: 'connected',
      config: {
        userInfo,
        enabledServices: enabledServices.map(service => ({
          id: service.id,
          name: service.name,
          scopes: service.scopes
        }))
      },
      data: {
        servicesCount: enabledServices.length,
        categories: [...new Set(enabledServices.map(s => s.category))]
      }
    });
  };

  const renderOAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Connect Google Workspace</h3>
        <p className="text-muted-foreground">
            Securely authenticate with your Google account to enable integrations
          </p>
        </div>
      </div>

      {connectionStatus === 'error' && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 p-6 rounded-lg space-y-4">
        <h4 className="font-medium flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          What you'll get access to: </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-red-500" />
              <span>Gmail & Email Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Google Drive</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Google Calendar</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-yellow-600" />
              <span>Analytics & Insights</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll choose exactly which services to enable in the next step
        </p>
      </div>

      <Button 
        onClick={handleOAuthConnect} 
        disabled={isConnecting}
        className="w-full"
        size="lg"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting to Google...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect with Google
          </>
        )}
      </Button>

      <div className="bg-muted/30 p-4 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Security & Privacy</h5>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Industry-standard OAuth 2.0 authentication</li>
          <li>• Encrypted token storage and transmission</li>
          <li>• Granular permission control</li>
          <li>• No passwords stored or transmitted</li>
        </ul>
      </div>
    </div>
  );

  const renderServicesStep = () => {
    const servicesByCategory = googleServices.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, GoogleService[]>);

    const enabledCount = googleServices.filter(s => s.enabled).length;

    return (
    <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Choose Google Services</h3>
            <p className="text-muted-foreground">
              Select which Google Workspace services you'd like to integrate with Nexus
            </p>
        </div>
      </div>

        {userInfo && (
          <div className="bg-success/5 border border-success/20 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
    </div>
              <div>
                <div className="font-medium">{userInfo.name}</div>
                <div className="text-sm text-muted-foreground">{userInfo.email}</div>
                <div className="text-xs text-muted-foreground">{userInfo.organization}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectPopular}>
            Select Popular Services
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSelectAll('productivity')}>
            All Productivity
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSelectAll('communication')}>
            All Communication
          </Button>
        </div>

      {error && (
          <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

        <div className="space-y-6">
          {Object.entries(servicesByCategory).map(([category, services]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{category.replace('-', ' ')}</h4>
      <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSelectAll(category)}
                >
                  Select All
      </Button>
              </div>
              
              <div className="grid gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={service.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        service.enabled 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover: border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={service.enabled}
                          onChange={e => handleServiceToggle(service.id, e.target.checked)}
                          className="mt-1 accent-primary"
                        />
                        <Icon className="w-6 h-6 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{service.name}</span>
                            {service.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {service.scopes.slice(0, 2).map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope.split('.').pop()}
                              </Badge>
                            ))}
                            {service.scopes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{service.scopes.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Services Selected: {enabledCount}</div>
              <div className="text-sm text-muted-foreground">
                You can always change these settings later
              </div>
            </div>
            <Button onClick={handleCompleteSetup} disabled={enabledCount === 0}>
              Continue Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
    </div>
  );
  };

  const renderCompleteStep = () => {
    const enabledServices = googleServices.filter(s => s.enabled);
    
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Google Workspace Connected!</h3>
        <p className="text-muted-foreground">
            Your integration is ready and {enabledServices.length} services are now active
        </p>
      </div>

        <div className="bg-success/5 border border-success/20 p-6 rounded-lg space-y-4">
          <h4 className="font-medium">Connected Services</h4>
          <div className="grid grid-cols-2 gap-3">
            {enabledServices.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="flex items-center space-x-2 text-sm">
                  <Icon className="w-4 h-4 text-success" />
                  <span>{service.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">What's Next?</h4>
          <div className="grid gap-3 text-sm text-left">
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Data Sync Starting</div>
                <div className="text-muted-foreground">
                  Your Google Workspace data will begin syncing in the background
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Building className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Integration Dashboard</div>
                <div className="text-muted-foreground">
                  Access your new integration from the main integrations page
                </div>
              </div>
            </div>
          </div>
      </div>

        <Button onClick={() => onComplete(null)} className="w-full" size="lg">
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Setup
        </Button>
    </div>
  );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'oauth':
        return renderOAuthStep();
      case 'services':
        return renderServicesStep();
      case 'complete':
        return renderCompleteStep();
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Google Workspace Integration</h2>
            <p className="text-muted-foreground">
              Connect and configure your Google Workspace services
            </p>
          </div>
        </div>
        {/* Progress Steps could be added here for parity with Microsoft 365 */}
      </div>
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
      </CardContent>
    </Card>
      {/* Cancel Action */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel Setup
        </Button>
        {currentStep === 'services' && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('oauth')}
          >
            Back to Authentication
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoogleWorkspaceSetup; 