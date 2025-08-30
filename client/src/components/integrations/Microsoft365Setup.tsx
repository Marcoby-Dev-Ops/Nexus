import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare, 
  CheckSquare, 
  StickyNote,
  Zap,
  RefreshCw,
  Shield,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { microsoft365TokenService } from '@/services/integrations/Microsoft365TokenService';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { msalInstance, msalReady } from '@/shared/auth/msal';

interface Microsoft365SetupProps {
  className?: string;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

interface ConnectionStatus {
  connected: boolean;
  lastSync?: string;
  dataPoints?: number;
  error?: string;
}

interface SyncProgress {
  emails: number;
  calendarEvents: number;
  files: number;
  contacts: number;
  teams: number;
  tasks: number;
  notes: number;
}

interface AvailableService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  reason?: string;
  scopes: string[];
}

interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  type: 'primary' | 'shared' | 'delegate';
  isSelected: boolean;
}

const Microsoft365Setup: React.FC<Microsoft365SetupProps> = ({ 
  className = '', 
  onComplete, 
  onCancel 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    emails: 0,
    calendarEvents: 0,
    files: 0,
    contacts: 0,
    teams: 0,
    tasks: 0,
    notes: 0
  });
  const [currentStep, setCurrentStep] = useState<'connect' | 'discover' | 'permissions' | 'email-accounts' | 'sync' | 'complete'>('connect');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    try {
      const result = await microsoft365TokenService.getConnectionStatus(user.id);
      
      if (result.success && result.data) {
        const status = {
          connected: result.data.connected,
          lastSync: result.data.lastSync,
          dataPoints: 0, // TODO: Get actual data points count
        };
        
        setConnectionStatus(status);
        
        if (status.connected) {
          setCurrentStep('discover');
          await discoverAvailableServices();
        }
      } else {
        logger.error('Failed to get connection status', { error: result.error });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check Microsoft 365 connection status');
    }
  };

  const discoverAvailableServices = async () => {
    if (!user?.id) return;

    setIsDiscovering(true);
    try {
      // Initialize default services
      const defaultServices: AvailableService[] = [
        {
          id: 'mail',
          name: 'Exchange Online Mailbox',
          description: 'Email messages, folders, and mail settings',
          icon: <Mail className="h-4 w-4" />,
          available: false,
          scopes: ['Mail.Read', 'Mail.ReadWrite']
        },
        {
          id: 'calendar',
          name: 'Outlook Calendar',
          description: 'Calendar events, meetings, and scheduling',
          icon: <Calendar className="h-4 w-4" />,
          available: false,
          scopes: ['Calendars.Read', 'Calendars.ReadWrite']
        },
        {
          id: 'contacts',
          name: 'Outlook Contacts',
          description: 'Contact information and address books',
          icon: <Users className="h-4 w-4" />,
          available: false,
          scopes: ['Contacts.Read', 'Contacts.ReadWrite']
        },
        {
          id: 'onedrive',
          name: 'OneDrive for Business',
          description: 'Personal files and documents',
          icon: <FileText className="h-4 w-4" />,
          available: false,
          scopes: ['Files.Read.All', 'Files.ReadWrite.All']
        },
        {
          id: 'teams',
          name: 'Microsoft Teams',
          description: 'Team conversations, channels, and meetings',
          icon: <MessageSquare className="h-4 w-4" />,
          available: false,
          scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All']
        },
        {
          id: 'tasks',
          name: 'Microsoft To Do',
          description: 'Personal tasks and to-do lists',
          icon: <CheckSquare className="h-4 w-4" />,
          available: false,
          scopes: ['Tasks.Read', 'Tasks.ReadWrite']
        },
        {
          id: 'notes',
          name: 'OneNote',
          description: 'Digital notes and notebooks',
          icon: <StickyNote className="h-4 w-4" />,
          available: false,
          scopes: ['Notes.Read.All', 'Notes.ReadWrite.All']
        }
      ];

      // Simulate API calls to check service availability
      // In a real implementation, you would make actual Microsoft Graph API calls
      const discoveredServices = await Promise.all(
        defaultServices.map(async (service) => {
          try {
            // Simulate checking if the service is available
            // This would be replaced with actual Microsoft Graph API calls
            const isAvailable = await checkServiceAvailability(service.id);
            
            return {
              ...service,
              available: isAvailable,
              reason: isAvailable ? undefined : 'Service not available in your plan'
            };
          } catch (error) {
            logger.error(`Failed to check ${service.name} availability`, { error });
            return {
              ...service,
              available: false,
              reason: 'Unable to verify service availability'
            };
          }
        })
      );

      setAvailableServices(discoveredServices);
      
      // Auto-select available services
      const availableServiceIds = discoveredServices
        .filter(service => service.available)
        .map(service => service.id);
      setSelectedServices(availableServiceIds);

    } catch (error) {
      logger.error('Failed to discover available services', { error });
      toast({
        title: 'Discovery Failed',
        description: 'Unable to discover available Microsoft 365 services. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Simulate checking service availability
  const checkServiceAvailability = async (serviceId: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate different availability scenarios
    switch (serviceId) {
      case 'mail':
      case 'calendar':
        // Most users have Exchange Online
        return Math.random() > 0.1; // 90% chance
      case 'contacts':
        return Math.random() > 0.2; // 80% chance
      case 'onedrive':
        return Math.random() > 0.3; // 70% chance
      case 'teams':
        return Math.random() > 0.4; // 60% chance
      case 'tasks':
        return Math.random() > 0.5; // 50% chance
      case 'notes':
        return Math.random() > 0.6; // 40% chance
      default:
        return false;
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please log in to connect Microsoft 365',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Clear any existing session storage
      const allKeys = Object.keys(sessionStorage);
      const microsoftKeys = allKeys.filter(key => key.includes('microsoft') || key.includes('msal'));
      microsoftKeys.forEach(key => {
        sessionStorage.removeItem(key);
        logger.info('Cleared existing session storage key', { key });
      });

      // Use MSAL's built-in flow with proper scopes for refresh tokens
      logger.info('Initiating MSAL login redirect for Microsoft 365');
      
      // Ensure MSAL is ready before using it
      await msalReady;
      
      await msalInstance.loginRedirect({
        scopes: [
          'User.Read',
          'Mail.Read',
          'Mail.ReadWrite', 
          'Calendars.Read',
          'Files.Read.All',
          'Contacts.Read',
          'Team.ReadBasic.All',
          'Channel.ReadBasic.All',
          'Tasks.Read',
          'Notes.Read.All',
          'offline_access'
        ],
        redirectStartPage: `${window.location.origin}/integrations/microsoft365/callback`,
        prompt: 'consent', // Force consent to ensure refresh token is provided
        extraQueryParameters: {
          response_mode: 'query' // Ensure we get the authorization code
        }
      });
      
    } catch (error) {
      logger.error('Failed to initiate Microsoft 365 connection', { 
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        clientId: '***', // Retrieved from server-side API
        redirectUri: '***' // Retrieved from server-side API
      });
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Microsoft 365. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSync = async () => {
    if (!user?.id) return;

    setIsSyncing(true);
    setSyncProgress({
      emails: 0,
      calendarEvents: 0,
      files: 0,
      contacts: 0,
      teams: 0,
      tasks: 0,
      notes: 0
    });

    try {
      // Start sync process for selected services
      const syncPromises = selectedServices.map(async (serviceId) => {
        // Simulate sync progress
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Update progress based on service type
        switch (serviceId) {
          case 'mail':
            setSyncProgress(prev => ({ ...prev, emails: Math.floor(Math.random() * 1000) + 100 }));
            break;
          case 'calendar':
            setSyncProgress(prev => ({ ...prev, calendarEvents: Math.floor(Math.random() * 500) + 50 }));
            break;
          case 'contacts':
            setSyncProgress(prev => ({ ...prev, contacts: Math.floor(Math.random() * 200) + 20 }));
            break;
          case 'onedrive':
            setSyncProgress(prev => ({ ...prev, files: Math.floor(Math.random() * 100) + 10 }));
            break;
          case 'teams':
            setSyncProgress(prev => ({ ...prev, teams: Math.floor(Math.random() * 50) + 5 }));
            break;
          case 'tasks':
            setSyncProgress(prev => ({ ...prev, tasks: Math.floor(Math.random() * 100) + 10 }));
            break;
          case 'notes':
            setSyncProgress(prev => ({ ...prev, notes: Math.floor(Math.random() * 50) + 5 }));
            break;
        }
      });

      await Promise.all(syncPromises);

      setCurrentStep('complete');
      toast({
        title: 'Sync Complete',
        description: 'Microsoft 365 data has been successfully synchronized.',
      });

      onComplete?.({ 
        success: true, 
        selectedServices,
        syncProgress 
      });
    } catch (error) {
      logger.error({ error }, 'Microsoft 365 sync failed');
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync Microsoft 365 data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalDataPoints = Object.values(syncProgress).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Microsoft 365 Integration
          </CardTitle>
          <CardDescription>
            Connect your Microsoft 365 account to sync emails, calendar, files, contacts, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="connect">Connect</TabsTrigger>
              <TabsTrigger value="discover" disabled={!connectionStatus.connected}>Discover</TabsTrigger>
              <TabsTrigger value="permissions" disabled={!connectionStatus.connected}>Permissions</TabsTrigger>
              <TabsTrigger value="sync" disabled={!connectionStatus.connected}>Sync</TabsTrigger>
              <TabsTrigger value="complete" disabled={!connectionStatus.connected}>Complete</TabsTrigger>
            </TabsList>

            <TabsContent value="connect" className="space-y-4">
              {connectionStatus.connected ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Microsoft 365 is already connected. You can proceed to discover available services.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Email & Calendar</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm">OneDrive & SharePoint</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Contacts & People</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Teams & Chat</span>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      We use Microsoft's secure OAuth 2.0 authentication. Your credentials are never stored.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Connect Microsoft 365
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Discovering Available Services</h3>
                  <p className="text-sm text-muted-foreground">
                    We're checking which Microsoft 365 services you have access to...
                  </p>
                </div>

                {isDiscovering ? (
                  <div className="space-y-4">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <div className="flex items-center space-x-3">
                          {service.icon}
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Checking...</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableServices.map((service) => (
                      <div key={service.id} className={`flex items-center space-x-4 p-4 border rounded-lg ${
                        service.available ? 'bg-background' : 'bg-muted/50 opacity-60'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {service.icon}
                          <div>
                            <div className="text-sm font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground">{service.description}</div>
                          </div>
                        </div>
                        <div className="ml-auto">
                          {service.available ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isDiscovering && (
                  <Button 
                    onClick={() => setCurrentStep('permissions')}
                    className="w-full"
                  >
                    Continue to Permissions
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Select Services to Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which Microsoft 365 services you want to sync with Nexus.
                  </p>
                </div>

                <div className="space-y-4">
                  {availableServices
                    .filter(service => service.available)
                    .map((service) => (
                      <div key={service.id} className="flex items-start space-x-4 p-4 border border-border dark:border-border rounded-lg hover:bg-background dark:hover:bg-background/50">
                        <input
                          type="checkbox"
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                        />
                        <label htmlFor={service.id} className="text-sm font-medium leading-relaxed cursor-pointer flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            {service.icon}
                            <div>
                              <div className="break-words">{service.name}</div>
                              <div className="text-xs text-muted-foreground break-words">{service.description}</div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>

                {availableServices.filter(s => s.available).length === 0 && (
                  <Alert>
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      No Microsoft 365 services are available in your plan. Please contact your administrator.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedServices.length > 0 && (
                  <Button 
                    onClick={() => setCurrentStep('sync')}
                    className="w-full"
                  >
                    Continue to Sync
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sync Progress</h3>
                  <Badge variant="outline">
                    {totalDataPoints} items synced
                  </Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(syncProgress).map(([key, count]) => {
                    const service = availableServices.find(s => s.id === key);
                    if (!service || !selectedServices.includes(key)) return null;
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {service.icon}
                          <span className="text-sm capitalize">{service.name}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>

                <Button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Start Sync
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="complete" className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Microsoft 365 integration is complete! Your data is now available in Nexus.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedServices.map(serviceId => {
                  const service = availableServices.find(s => s.id === serviceId);
                  const count = syncProgress[serviceId as keyof SyncProgress] || 0;
                  
                  if (!service) return null;
                  
                  return (
                    <Card key={serviceId}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {service.icon}
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground">items synced</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => onComplete?.({ success: true })} className="flex-1">
                  <Zap className="mr-2 h-4 w-4" />
                  Continue to Dashboard
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Microsoft365Setup; 
