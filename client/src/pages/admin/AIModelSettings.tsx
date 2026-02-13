import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Switch } from '@/shared/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Separator } from '@/shared/components/ui/Separator';
import { Bot, Key, Settings, Zap, Loader2 } from 'lucide-react';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';

interface AIModelSettingsState {
  openaiKey: string;
  openaiModel: string;
  openaiTemperature: number;
  anthropicKey: string;
  anthropicModel: string;
  primaryProvider: string;
  fallbackProvider: string;
  autoFallback: boolean;
  maxTokens: number;
  timeout: number;
  streaming: boolean;
  caching: boolean;
}

const DEFAULT_AI_SETTINGS: AIModelSettingsState = {
  openaiKey: '',
  openaiModel: 'gpt-4',
  openaiTemperature: 0.7,
  anthropicKey: '',
  anthropicModel: 'claude-3-sonnet',
  primaryProvider: 'openai',
  fallbackProvider: 'anthropic',
  autoFallback: true,
  maxTokens: 1000,
  timeout: 60,
  streaming: true,
  caching: true,
};

const AIModelSettings: React.FC = () => {
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AIModelSettingsState>(DEFAULT_AI_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from preferences
  useEffect(() => {
    if (preferences?.preferences?.ai_settings) {
      setSettings({
        ...DEFAULT_AI_SETTINGS,
        ...preferences.preferences.ai_settings,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePreferences({
        preferences: {
          ...(preferences?.preferences || {}),
          ai_settings: settings,
        },
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'AI model settings saved successfully.',
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      logger.error('Failed to save AI model settings', { error });
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
    setSettings(DEFAULT_AI_SETTINGS);
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
        <h3 className="text-lg font-medium">AI Model Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI models, API keys, and model preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* OpenAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              OpenAI Configuration
            </CardTitle>
            <CardDescription>
              Configure your OpenAI API settings and model preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={settings.openaiKey}
                onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-model">Default Model</Label>
              <Select
                value={settings.openaiModel}
                onValueChange={(val) => setSettings({ ...settings, openaiModel: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-temperature">Temperature</Label>
              <Input
                id="openai-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.openaiTemperature}
                onChange={(e) => setSettings({ ...settings, openaiTemperature: parseFloat(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Anthropic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Anthropic Configuration
            </CardTitle>
            <CardDescription>
              Configure your Anthropic Claude API settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                value={settings.anthropicKey}
                onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anthropic-model">Default Model</Label>
              <Select
                value={settings.anthropicModel}
                onValueChange={(val) => setSettings({ ...settings, anthropicModel: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Model Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Model Preferences
            </CardTitle>
            <CardDescription>
              Configure default model settings and fallbacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-provider">Primary AI Provider</Label>
              <Select
                value={settings.primaryProvider}
                onValueChange={(val) => setSettings({ ...settings, primaryProvider: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-provider">Fallback Provider</Label>
              <Select
                value={settings.fallbackProvider}
                onValueChange={(val) => setSettings({ ...settings, fallbackProvider: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-fallback">Auto Fallback</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically switch to fallback provider on errors
                </p>
              </div>
              <Switch
                id="auto-fallback"
                checked={settings.autoFallback}
                onCheckedChange={(val) => setSettings({ ...settings, autoFallback: val })}
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
              Configure AI performance and optimization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min="1"
                max="16384"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="10"
                max="300"
                value={settings.timeout}
                onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streaming">Enable Streaming</Label>
                <p className="text-sm text-muted-foreground">
                  Stream AI responses for better user experience
                </p>
              </div>
              <Switch
                id="streaming"
                checked={settings.streaming}
                onCheckedChange={(val) => setSettings({ ...settings, streaming: val })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="caching">Enable Response Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Cache AI responses to improve performance
                </p>
              </div>
              <Switch
                id="caching"
                checked={settings.caching}
                onCheckedChange={(val) => setSettings({ ...settings, caching: val })}
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

export default AIModelSettings;

