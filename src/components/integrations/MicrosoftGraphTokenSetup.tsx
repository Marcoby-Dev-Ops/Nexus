/**
 * Microsoft Graph Token Setup Component
 * Handles manual OAuth flow to get Microsoft Graph access tokens
 * when Supabase provider tokens aren't available
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';

interface MicrosoftGraphTokenSetupProps {
  onTokenObtained?: (accessToken: string) => void;
}

interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

const MicrosoftGraphTokenSetup: React.FC<MicrosoftGraphTokenSetupProps> = ({ 
  onTokenObtained 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'connecting' | 'complete'>('setup');
  
  const { addNotification } = useNotifications();

  // Check if we already have a token stored
  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      // Call our edge function to check token status
      const { data, error } = await supabase.functions.invoke('microsoft_graph_token_manager', {
        method: 'GET'
      });

      if (!error && data.has_token && data.is_valid) {
        setStep('complete');
        setTokenInfo({
          access_token: 'stored_securely',
          expires_in: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000),
          scope: 'Mail.Read Mail.ReadWrite'
        });
        
        addNotification({
          type: 'success',
          message: 'Microsoft Graph token found and is valid!'
        });
      }
    } catch (error) {
      // No existing token, that's fine
      console.log('No existing token found:', error);
    }
  };

  const initiateOAuthFlow = async () => {
    setIsConnecting(true);
    setError(null);
    setStep('connecting');

    try {
      // Get current user for company context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store callback info for after OAuth
      localStorage.setItem('nexus_oauth_callback', JSON.stringify({
        type: 'microsoft_graph_setup',
        timestamp: Date.now()
      }));

      addNotification({
        type: 'info',
        message: 'Redirecting to Microsoft for email permissions...'
      });

      // Redirect to Microsoft OAuth with Graph API scopes
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access',
          redirectTo: `${window.location.origin}/auth/callback?setup=microsoft_graph`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate OAuth');
      }

    } catch (error) {
      console.error('OAuth initiation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to start OAuth flow');
      setIsConnecting(false);
      setStep('setup');
    }
  };

  const testConnection = async () => {
    addNotification({
      type: 'info',
      message: 'Connection test will be available once tokens are properly configured.'
    });
  };

  if (step === 'complete') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span>Microsoft Graph Connected</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Access Token</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
          
          {tokenInfo && (
            <div className="text-xs text-green-600">
              Expires in: {Math.floor(tokenInfo.expires_in / 3600)} hours
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <Shield className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('setup')}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Token
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <Key className="w-5 h-5" />
          <span>Microsoft Graph Access Required</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-orange-700">
          To sync your emails, we need access to your Microsoft Graph API. This requires 
          re-authorization with the correct permissions for email access.
        </div>

        <div className="bg-orange-100 p-3 rounded-lg text-xs text-orange-600">
          <strong>Required Permissions:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Mail.Read - Read your email messages</li>
            <li>Mail.ReadWrite - Manage email status</li>
            <li>User.Read - Basic profile information</li>
          </ul>
        </div>

        <Button
          onClick={initiateOAuthFlow}
          disabled={isConnecting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isConnecting ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Re-authorize with Email Permissions</span>
            </div>
          )}
        </Button>

        <div className="text-xs text-orange-600 text-center">
          This will redirect to Microsoft for re-authentication
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrosoftGraphTokenSetup; 