/**
 * Unified Callback Page
 * Handles all integration callbacks using the centralized configuration system
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { callbackRegistry } from '@/shared/callbacks/CallbackRegistry';
import { CallbackProcessor } from '@/shared/callbacks/CallbackHandler';
import { useAuth } from '@/hooks/index';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import type { CallbackConfig, CallbackResponse } from '@/core/types/callbacks';
import { getEnvVar } from '@/lib/env-utils';

type CallbackStatus = 'processing' | 'success' | 'error' | 'timeout';

interface CallbackPageProps {
  /** Integration slug from URL params */
  integrationSlug?: string;
  /** Callback type from URL params */
  callbackType?: string;
}

export const UnifiedCallbackPage: React.FC<CallbackPageProps> = ({
  integrationSlug,
  callbackType = 'oauth'
}) => {
  const { integration: paramIntegration } = useParams<{ integration: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState<string>('Processing callback...');
  const [config, setConfig] = useState<CallbackConfig | null>(null);
  const [response, setResponse] = useState<CallbackResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use integration slug from props or URL params
  const finalIntegrationSlug = integrationSlug || paramIntegration;

  useEffect(() => {
    if (!finalIntegrationSlug) {
      setStatus('error');
      setMessage('Integration not specified');
      return;
    }

    handleCallback();
  }, [finalIntegrationSlug, searchParams]);

  const handleCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Processing callback...');

      // Find callback configuration
      const callbacks = callbackRegistry.getByIntegration(finalIntegrationSlug!);
      const callbackConfig = callbacks.find(c => c.type === callbackType);

      if (!callbackConfig) {
        throw new Error(`No ${callbackType} callback configuration found for ${finalIntegrationSlug}`);
      }

      setConfig(callbackConfig);

      // Extract callback data from URL
      const query: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        query[key] = value;
      });

      // Process the callback
      const callbackResponse = await CallbackProcessor.processCallback(
        window.location.pathname,
        'GET',
        query,
        null,
        {
          'user-agent': navigator.userAgent,
          'referer': document.referrer
        },
        user
      );

      setResponse(callbackResponse);

      // Handle response
      if (callbackResponse.status >= 200 && callbackResponse.status < 300) {
        setStatus('success');
        setMessage(getSuccessMessage(callbackConfig));
        
        // Show success notification
        addNotification({
          type: 'success',
          message: `${finalIntegrationSlug} connected successfully!`
        });

        // Handle automatic actions
        if (callbackResponse.closePopup && window.opener) {
          // Signal parent window
          window.opener.postMessage({
            type: 'CALLBACK_SUCCESS',
            integration: finalIntegrationSlug,
            data: callbackResponse.body
          }, window.location.origin);
          
          // Close popup after delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else if (callbackResponse.redirectUrl) {
          // Redirect after delay
          setTimeout(() => {
            navigate(callbackResponse.redirectUrl!);
          }, 2000);
        } else {
          // Default redirect to integrations page
          setTimeout(() => {
            navigate(`/integrations?connected=${finalIntegrationSlug}`);
          }, 2000);
        }

      } else {
        throw new Error(getErrorMessage(callbackResponse));
      }

    } catch (error: any) {
       
     
    // eslint-disable-next-line no-console
    console.error('Callback processing error: ', error);
      
      setStatus('error');
      setMessage(error.message || 'Failed to process callback');
      
      // Show error notification
      addNotification({
        type: 'error',
        message: `Failed to connect ${finalIntegrationSlug}: ${error.message}`
      });

      // Handle popup error
      if (window.opener) {
        window.opener.postMessage({
          type: 'CALLBACK_ERROR',
          integration: finalIntegrationSlug,
          error: error.message
        }, window.location.origin);
      }
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      handleCallback();
    }
  };

  const handleContinue = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/integrations');
    }
  };

  const getSuccessMessage = (config: CallbackConfig): string => {
    switch (config.type) {
      case 'oauth':
        return `Successfully connected to ${finalIntegrationSlug}! You can now access your data.`;
      case 'webhook':
        return `Webhook configured successfully for ${finalIntegrationSlug}!`;
      case 'api_key':
        return `API key validated successfully for ${finalIntegrationSlug}!`;
      default: return `${finalIntegrationSlug} integration completed successfully!`;
    }
  };

  const getErrorMessage = (response: CallbackResponse): string => {
    if (response.errors && response.errors.length > 0) {
      return response.errors[0].message;
    }
    
    if (typeof response.body === 'object' && response.body && 'error' in response.body) {
      return (response.body as any).error;
    }

    switch (response.status) {
      case 400: return 'Invalid callback request';
      case 401:
        return 'Authentication failed';
      case 403:
        return 'Access denied';
      case 404:
        return 'Callback configuration not found';
      case 429:
        return 'Too many requests, please try again later';
      case 500: return 'Server error occurred';
      default:
        return `Callback failed with status ${response.status}`;
    }
  };

  const getIntegrationIcon = (integrationSlug: string) => {
    // Return appropriate icon based on integration
    switch (integrationSlug?.toLowerCase()) {
      case 'google-analytics':
      case 'google-workspace':
        return '📊';
      case 'hubspot':
        return '🧡';
      case 'paypal':
        return '💰';
      case 'ninjarmm':
        return '🥷';
      case 'linkedin':
        return '💼';
      default: return '🔗';
    }
  };

  const getIntegrationDisplayName = (integrationSlug: string) => {
    return integrationSlug
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Integration';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-success" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-12 h-12 text-destructive" />
            )}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <span className="text-2xl">{getIntegrationIcon(finalIntegrationSlug!)}</span>
            {getIntegrationDisplayName(finalIntegrationSlug!)}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {message}
            </p>
            
            {status === 'processing' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Please wait...</span>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-success font-medium">
                  ✅ Connection successful!
                </div>
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-destructive font-medium">
                  ❌ Connection failed
                </div>
                <div className="flex gap-2">
                  {retryCount < 3 && (
                    <Button 
                      onClick={handleRetry}
                      variant="outline"
                      className="flex-1"
                    >
                      Retry ({3 - retryCount} left)
                    </Button>
                  )}
                  <Button 
                    onClick={handleContinue}
                    variant={retryCount >= 3 ? "default" : "outline"}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Integrations
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Debug information in development */}
          {getEnvVar('NODE_ENV') === 'development' && config && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Debug Information</h4>
              <div className="text-xs space-y-1">
                <div>Integration: {config.integrationSlug}</div>
                <div>Type: {config.type}</div>
                <div>Path: {config.path}</div>
                <div>Status: {status}</div>
                {response && <div>Response Status: {response.status}</div>}
                <div>Retry Count: {retryCount}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedCallbackPage; 
