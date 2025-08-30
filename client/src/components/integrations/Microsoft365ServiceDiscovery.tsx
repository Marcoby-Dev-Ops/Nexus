import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Users, 
  Calendar, 
  MessageSquare, 
  Folder, 
  FolderOpen,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useToast } from '@/shared/components/ui/use-toast';
import { microsoft365DiscoveryService } from '@/services/integrations/microsoft365DiscoveryService';
import type { DiscoveredService } from '@/services/integrations/microsoft365DiscoveryService';
import { logger } from '@/shared/utils/logger';

interface Microsoft365ServiceDiscoveryProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const serviceIcons: Record<string, React.ComponentType<any>> = {
  mail: Mail,
  users: Users,
  calendar: Calendar,
  'message-square': MessageSquare,
  folder: Folder,
  'folder-open': FolderOpen,
};

const Microsoft365ServiceDiscovery: React.FC<Microsoft365ServiceDiscoveryProps> = ({
  onComplete,
  onSkip
}) => {
  const { toast } = useToast();
  const [services, setServices] = useState<DiscoveredService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    discoverServices();
  }, []);

  const discoverServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await microsoft365DiscoveryService.discoverServices();
      
      if (result.success && result.data) {
        setServices(result.data);
        // Pre-select available services
        const availableServices = result.data
          .filter(service => service.available)
          .map(service => service.id);
        setSelectedServices(availableServices);
      } else {
        setError(result.error || 'Failed to discover services');
      }
    } catch (err) {
      logger.error('Service discovery failed', { error: err });
      setError('Failed to discover Microsoft 365 services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSetupServices = async () => {
    if (selectedServices.length === 0) {
      toast({
        title: 'No Services Selected',
        description: 'Please select at least one service to continue.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSettingUp(true);
      
      const result = await microsoft365DiscoveryService.setupServices(selectedServices);
      
      if (result.success) {
        toast({
          title: 'Services Setup Complete',
          description: `Successfully configured ${selectedServices.length} Microsoft 365 service${selectedServices.length > 1 ? 's' : ''}.`,
        });
        
        logger.info('Microsoft 365 services setup completed', {
          selectedServices,
          count: selectedServices.length
        });
        
        onComplete?.();
      } else {
        toast({
          title: 'Setup Failed',
          description: result.error || 'Failed to set up selected services.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      logger.error('Service setup failed', { error: err });
      toast({
        title: 'Setup Failed',
        description: 'An error occurred while setting up services.',
        variant: 'destructive'
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const availableServices = services.filter(service => service.available);
  const unavailableServices = services.filter(service => !service.available);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              Discovering Microsoft 365 Services
            </CardTitle>
            <CardDescription>
              Scanning your Microsoft 365 account for available services...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we discover the services available in your Microsoft 365 account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Discovery Failed
            </CardTitle>
            <CardDescription>
              Failed to discover Microsoft 365 services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={discoverServices} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleSkip} className="flex-1">
                Skip Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-6 w-6 text-green-600" />
            Microsoft 365 Connected Successfully!
          </CardTitle>
          <CardDescription>
            We've discovered the following services in your Microsoft 365 account. 
            Select the ones you'd like to integrate with Nexus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Available Services */}
          {availableServices.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Available Services ({availableServices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServices.map((service) => {
                  const IconComponent = serviceIcons[service.icon] || Folder;
                  return (
                    <Card key={service.id} className="border-2 border-green-200 hover:border-green-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <IconComponent className="h-5 w-5 text-green-600" />
                              <h4 className="font-medium">{service.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {service.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {service.description}
                            </p>
                            {service.data && (
                              <div className="text-xs text-muted-foreground">
                                {service.id === 'mailbox' && `${service.data.mailFolders} folders`}
                                {service.id === 'shared_mailboxes' && `${service.data.sharedFolders} shared folders`}
                                {service.id === 'teams' && `${service.data.teams} teams`}
                                {service.id === 'onedrive' && `${service.data.driveType} drive`}
                                {service.id === 'sharepoint' && `${service.data.sites} sites`}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unavailable Services */}
          {unavailableServices.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unavailable Services ({unavailableServices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unavailableServices.map((service) => {
                  const IconComponent = serviceIcons[service.icon] || Folder;
                  return (
                    <Card key={service.id} className="border-2 border-gray-200 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-muted-foreground">{service.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {service.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Not available in your account
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleSkip} 
              variant="outline" 
              className="flex-1"
              disabled={isSettingUp}
            >
              Skip Setup
            </Button>
            <Button 
              onClick={handleSetupServices} 
              className="flex-1"
              disabled={selectedServices.length === 0 || isSettingUp}
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Set Up {selectedServices.length} Service{selectedServices.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>

          {/* Summary */}
          {selectedServices.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              You've selected {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} to integrate.
              You can always change these settings later in your integration preferences.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Microsoft365ServiceDiscovery;
