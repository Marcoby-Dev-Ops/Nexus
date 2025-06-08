/**
 * N8nConnectionSetup.tsx
 * Onboarding component for connecting user's n8n instance to Nexus
 * Handles connection testing, validation, and configuration storage
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Info, Eye, EyeOff } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { supabase } from '../../lib/supabase';

interface N8nConnectionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName?: string;
  isActive: boolean;
}

interface N8nConnectionSetupProps {
  onComplete: (config: N8nConnectionConfig) => void;
  onSkip?: () => void;
  className?: string;
}

export const N8nConnectionSetup: React.FC<N8nConnectionSetupProps> = ({
  onComplete,
  onSkip,
  className = ''
}) => {
  const [config, setConfig] = useState<N8nConnectionConfig>({
    baseUrl: '',
    apiKey: '',
    instanceName: '',
    isActive: false
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Load existing configuration if any
  useEffect(() => {
    const loadExistingConfig = async () => {
      if (!currentUser?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('n8n_configurations')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .single();
          
        if (data && !error) {
          setConfig({
            baseUrl: data.base_url,
            apiKey: data.api_key,
            instanceName: data.instance_name || '',
            isActive: data.is_active
          });
          setConnectionStatus('success');
        }
      } catch (err) {
        console.log('No existing configuration found');
      }
    };
    
    loadExistingConfig();
  }, [currentUser]);

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config.baseUrl || !config.apiKey) {
      setErrorMessage('Please provide both URL and API key');
      return false;
    }

    if (!validateUrl(config.baseUrl)) {
      setErrorMessage('Please provide a valid URL (including http:// or https://)');
      return false;
    }

    setIsTestingConnection(true);
    setErrorMessage('');

    try {
      // Clean up URL (remove trailing slash)
      const cleanUrl = config.baseUrl.replace(/\/$/, '');
      
      // Test connection with health check
      const healthResponse = await fetch(`${cleanUrl}/healthz`, {
        method: 'GET',
      });

      if (!healthResponse.ok) {
        throw new Error('Health check failed');
      }

      // Test API key with workflows endpoint
      const apiResponse = await fetch(`${cleanUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!apiResponse.ok) {
        if (apiResponse.status === 401) {
          throw new Error('Invalid API key');
        } else if (apiResponse.status === 403) {
          throw new Error('API key does not have sufficient permissions');
        } else {
          throw new Error(`API request failed with status ${apiResponse.status}`);
        }
      }

      setConnectionStatus('success');
      return true;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Failed to connect to n8n instance');
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async (): Promise<boolean> => {
    if (!currentUser?.id) {
      setErrorMessage('User not authenticated');
      return false;
    }

    setIsSaving(true);
    
    try {
      // Deactivate any existing configurations
      await supabase
        .from('n8n_configurations')
        .update({ is_active: false })
        .eq('user_id', currentUser.id);

      // Insert new configuration
      const { error } = await supabase
        .from('n8n_configurations')
        .insert([
          {
            user_id: currentUser.id,
            base_url: config.baseUrl.replace(/\/$/, ''),
            api_key: config.apiKey,
            instance_name: config.instanceName || 'My n8n Instance',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      setErrorMessage('Failed to save configuration: ' + error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    // Test connection first
    const connectionSuccessful = await testConnection();
    if (!connectionSuccessful) return;

    // Save configuration
    const saveSuccessful = await saveConfiguration();
    if (!saveSuccessful) return;

    // Call completion callback
    onComplete({
      ...config,
      isActive: true
    });
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  return (
    <div className={`max-w-2xl mx-auto bg-card dark:bg-background rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
          Connect Your n8n Instance
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Connect your n8n automation platform to unlock powerful AI-driven workflows in Nexus
        </p>
      </div>

      <div className="space-y-6">
        {/* Instance Name */}
        <div>
          <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
            Instance Name (Optional)
          </label>
          <input
            type="text"
            value={config.instanceName}
            onChange={(e) => setConfig(prev => ({ ...prev, instanceName: e.target.value }))}
            placeholder="My n8n Instance"
            className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
            n8n Instance URL *
          </label>
          <input
            type="url"
            value={config.baseUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            placeholder="https://your-n8n-instance.com"
            className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
            The full URL to your n8n instance (e.g., https://n8n.yourcompany.com)
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-foreground/90 dark:text-muted-foreground/60 mb-2">
            API Key *
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="n8n_api_xxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 pr-10 border border-border dark:border-gray-600 rounded-lg bg-card dark:bg-background text-foreground dark:text-primary-foreground placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-start space-x-2 mt-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              <p>You can generate an API key in your n8n instance:</p>
              <p>Settings → Users & Settings → API Keys → Create New Key</p>
            </div>
          </div>
        </div>

        {/* Test Connection Button */}
        <div>
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !config.baseUrl || !config.apiKey}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
          >
            {isTestingConnection ? (
              <>
                <Spinner size={16} className="mr-2" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                <span>Test Connection</span>
              </>
            )}
          </button>
        </div>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <div className={`flex items-center space-x-2 p-4 rounded-lg ${
            connectionStatus === 'success' 
              ? 'bg-success/5 dark:bg-success/20 text-success dark:text-success'
              : 'bg-destructive/5 dark:bg-destructive/20 text-destructive dark:text-destructive'
          }`}>
            {connectionStatus === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Connection successful! Your n8n instance is ready to use.</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          {onSkip && (
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-200 transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={connectionStatus !== 'success' || isSaving}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
          >
            {isSaving ? (
              <>
                <Spinner size={16} className="mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Complete Setup</span>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center pt-4 border-t border-border dark:border-border">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Don't have n8n yet?{' '}
            <a 
              href="https://n8n.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              Get started with n8n
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default N8nConnectionSetup; 