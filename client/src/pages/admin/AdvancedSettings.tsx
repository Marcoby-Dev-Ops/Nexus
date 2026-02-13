import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Separator } from '@/shared/components/ui/Separator';
import { Settings, Database, Code, Zap, Loader2 } from 'lucide-react';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';

interface AdvancedSettingsState {
  apiUrl: string;
  apiKey: string;
  cacheTtl: number;
  maxConnections: number;
  batchSize: number;
  timeout: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  debugInfo: string;
}

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettingsState = {
  apiUrl: 'https://api.nexus.com',
  apiKey: '',
  cacheTtl: 3600,
  maxConnections: 10,
  batchSize: 100,
  timeout: 30000,
  logLevel: 'info',
  debugInfo: '',
};

const AdvancedSettings: React.FC = () => {
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdvancedSettingsState>(DEFAULT_ADVANCED_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from preferences
  useEffect(() => {
    if (preferences?.preferences?.advanced_settings) {
      setSettings({
        ...DEFAULT_ADVANCED_SETTINGS,
        ...preferences.preferences.advanced_settings,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePreferences({
        preferences: {
          ...(preferences?.preferences || {}),
          advanced_settings: settings,
        },
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Advanced settings saved successfully.',
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      logger.error('Failed to save advanced settings', { error });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_ADVANCED_SETTINGS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Advanced Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure advanced options for power users and developers.
        </p>
      </div>

      <div className="space-y-4">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure API endpoints and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">API Base URL</Label>
              <Input
                id="api-url"
                placeholder="https://api.nexus.com"
                value={settings.apiUrl}
                onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Configuration
            </CardTitle>
            <CardDescription>
              Advanced database and caching settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
              <Input
                id="cache-ttl"
                type="number"
                value={settings.cacheTtl}
                onChange={(e) => setSettings({ ...settings, cacheTtl: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-connections">Max Database Connections</Label>
              <Input
                id="max-connections"
                type="number"
                value={settings.maxConnections}
                onChange={(e) => setSettings({ ...settings, maxConnections: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Settings
            </CardTitle>
            <CardDescription>
              Optimize application performance and resource usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Processing Size</Label>
              <Input
                id="batch-size"
                type="number"
                value={settings.batchSize}
                onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) })}
                min="10"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={settings.timeout}
                onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                min="1000"
                max="300000"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Debug Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Debug & Logging
            </CardTitle>
            <CardDescription>
              Configure debug logging and error reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="log-level">Log Level</Label>
              <select
                id="log-level"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={settings.logLevel}
                onChange={(e) => setSettings({ ...settings, logLevel: e.target.value as any })}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debug-info">Debug Information</Label>
              <Textarea
                id="debug-info"
                placeholder="Additional debug information..."
                rows={3}
                value={settings.debugInfo}
                onChange={(e) => setSettings({ ...settings, debugInfo: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>Reset to Defaults</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;

