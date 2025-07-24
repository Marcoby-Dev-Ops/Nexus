import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Building2, 
  Linkedin,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  SkipForward,
  Zap,
  Shield
} from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { OAuthTokenService } from '@/domains/integrations/lib';
// TODO: These services need to be implemented
// import { linkedinService } from '@/domains/services/linkedinService';

interface IntegrationStatus {
  microsoft: 'not_connected' | 'connecting' | 'connected' | 'error';
  linkedin: 'not_connected' | 'connecting' | 'connected' | 'error';
  google: 'not_connected' | 'connecting' | 'connected' | 'error';
}

interface IntegrationsSetupStepProps {
  onNext: (data: { connectedIntegrations: string[] }) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const IntegrationsSetupStep: React.FC<IntegrationsSetupStepProps> = ({ 
  onNext, 
  onBack, 
  onSkip 
}) => {
  const { toast } = useToast();
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    microsoft: 'not_connected',
    linkedin: 'not_connected',
    google: 'not_connected'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check existing connections on mount
  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      // Check existing OAuth connections
      const hasMicrosoft = await OAuthTokenService.hasValidTokens('microsoft');
      const hasLinkedIn = await OAuthTokenService.hasValidTokens('linkedin');
      const hasGoogle = await OAuthTokenService.hasValidTokens('google-workspace');
      
      setIntegrationStatus({
        microsoft: hasMicrosoft ? 'connected' : 'not_connected',
        linkedin: hasLinkedIn ? 'connected' : 'not_connected',
        google: hasGoogle ? 'connected' : 'not_connected'
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking existing connections: ', error);
      // Set all to not connected on error
      setIntegrationStatus({
        microsoft: 'not_connected',
        linkedin: 'not_connected',
        google: 'not_connected'
      });
    }
  };

  const handleMicrosoftConnect = async () => {
    try {
      setIntegrationStatus(prev => ({ ...prev, microsoft: 'connecting' }));

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier in session storage
      sessionStorage.setItem('microsoft_code_verifier', codeVerifier);
      
      // Build Microsoft OAuth URL
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/microsoft/callback`;
      const state = crypto.randomUUID();
      
      const authUrl = new URL('https: //login.microsoftonline.com/common/oauth2/v2.0/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'User.Read Mail.Read Mail.ReadWrite Calendars.Read Files.Read.All Contacts.Read offline_access');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('response_mode', 'query');
      
      // Redirect to Microsoft OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error connecting Microsoft: ', error);
      setIntegrationStatus(prev => ({ ...prev, microsoft: 'error' }));
      toast({
        title: 'Error',
        description: 'Failed to connect Microsoft account',
        variant: 'destructive',
      });
    }
  };

  const handleLinkedInConnect = async () => {
    try {
      setIntegrationStatus(prev => ({ ...prev, linkedin: 'connecting' }));

      // Generate state parameter
      const state = crypto.randomUUID();
      
      // Build LinkedIn OAuth URL
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/linkedin/callback`;
      
      const authUrl = new URL('https: //www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'r_liteprofile r_emailaddress w_member_social');
      authUrl.searchParams.set('state', state);
      
      // Redirect to LinkedIn OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error connecting LinkedIn: ', error);
      setIntegrationStatus(prev => ({ ...prev, linkedin: 'error' }));
      toast({
        title: 'Error',
        description: 'Failed to connect LinkedIn account',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setIntegrationStatus(prev => ({ ...prev, google: 'connecting' }));

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier in session storage
      sessionStorage.setItem('google_code_verifier', codeVerifier);
      
      // Build Google OAuth URL
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/integrations/google/callback`;
      const state = crypto.randomUUID();
      
      const authUrl = new URL('https: //accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'https: //www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error connecting Google: ', error);
      setIntegrationStatus(prev => ({ ...prev, google: 'error' }));
      toast({
        title: 'Error',
        description: 'Failed to connect Google Workspace',
        variant: 'destructive',
      });
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // Get list of connected integrations
      const connectedIntegrations: string[] = [];
      if (integrationStatus.microsoft === 'connected') connectedIntegrations.push('microsoft');
      if (integrationStatus.linkedin === 'connected') connectedIntegrations.push('linkedin');
      if (integrationStatus.google === 'connected') connectedIntegrations.push('google');

      onNext({ connectedIntegrations });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error continuing to next step: ', error);
      toast({
        title: 'Error',
        description: 'Failed to proceed to next step',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionButton = (integration: keyof IntegrationStatus) => {
    const status = integrationStatus[integration];
    const isConnecting = status === 'connecting';
    const isConnected = status === 'connected';
    const hasError = status === 'error';

    const config = {
      microsoft: {
        name: 'Microsoft',
        icon: Building2,
        description: 'Connect your Microsoft 365 account for Teams, Outlook, OneDrive, and SharePoint integration',
        benefits: ['Email synchronization', 'Teams analytics', 'OneDrive & SharePoint file access', 'Calendar integration']
      },
      linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        description: 'Connect your LinkedIn account for professional networking insights',
        benefits: ['Contact synchronization', 'Network analytics', 'Professional insights', 'Lead generation']
      },
      google: {
        name: 'Google Workspace',
        icon: Mail,
        description: 'Connect your Google Workspace for Gmail, Drive, and Calendar integration',
        benefits: ['Gmail synchronization', 'Drive file access', 'Calendar integration', 'Docs collaboration']
      }
    };

    const { name, icon: Icon, description, benefits } = config[integration];

    return (
      <Card key={integration} className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Connected</span>
                </Badge>
              )}
              {hasError && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Error</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Zap className="h-3 w-3 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <Button
              onClick={
                integration === 'microsoft' ? handleMicrosoftConnect: integration === 'linkedin' ? handleLinkedInConnect :
                handleGoogleConnect
              }
              disabled={isConnecting || isConnected}
              className="w-full"
              variant={isConnected ? "outline" : "default"}
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConnected ? 'Connected' : `Connect ${name}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const connectedCount = Object.values(integrationStatus).filter(status => status === 'connected').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Connect Your Integrations</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect your business accounts to unlock powerful features and automate your workflow. 
          These integrations are optional but highly recommended for the best experience.
        </p>
        
        {connectedCount > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>{connectedCount} integration{connectedCount !== 1 ? 's' : ''} connected</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg: grid-cols-3 gap-6">
        {getConnectionButton('microsoft')}
        {getConnectionButton('linkedin')}
        {getConnectionButton('google')}
      </div>

      <div className="flex items-center justify-between pt-6">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button onClick={onSkip} variant="ghost">
            <SkipForward className="mr-2 h-4 w-4" />
            Skip for now
          </Button>
          
          <Button 
            onClick={handleContinue} 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Continue
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>You can always connect these integrations later from your dashboard settings.</p>
      </div>
    </div>
  );
}; 

// Helper functions for PKCE
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
};

const base64URLEncode = (buffer: Uint8Array): string => {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}; 