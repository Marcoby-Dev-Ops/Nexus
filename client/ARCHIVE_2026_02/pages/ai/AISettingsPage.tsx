import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Switch } from '@/shared/components/ui/Switch';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { 
  Settings, 
  Brain, 
  MessageSquare, 
  Zap, 
  Shield, 
  Eye,
  Clock,
  Target,
  Activity,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AISettings {
  // General Settings
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  enableStreaming: boolean;
  
  // Privacy & Security
  dataRetentionDays: number;
  enableAnalytics: boolean;
  allowDataSharing: boolean;
  encryptionLevel: 'standard' | 'enhanced' | 'enterprise';
  
  // Performance
  responseTimeout: number;
  maxConcurrentRequests: number;
  enableCaching: boolean;
  cacheExpiration: number;
  
  // Personalization
  enableContextMemory: boolean;
  memoryRetentionDays: number;
  enablePersonalization: boolean;
  learningRate: number;
  
  // Notifications
  enableNotifications: boolean;
  notificationTypes: string[];
  quietHours: { start: string; end: string };
}

export default function AISettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings>({
    defaultModel: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.7,
    enableStreaming: true,
    dataRetentionDays: 30,
    enableAnalytics: true,
    allowDataSharing: false,
    encryptionLevel: 'enhanced',
    responseTimeout: 30,
    maxConcurrentRequests: 5,
    enableCaching: true,
    cacheExpiration: 3600,
    enableContextMemory: true,
    memoryRetentionDays: 7,
    enablePersonalization: true,
    learningRate: 0.1,
    enableNotifications: true,
    notificationTypes: ['responses', 'errors', 'updates'],
    quietHours: { start: '22:00', end: '08:00' }
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // TODO: Load settings from API
      // const userSettings = await aiService.getUserSettings();
      // setSettings(userSettings);
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save settings to API
      // await aiService.updateUserSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    loadSettings();
  };

  const updateSetting = <K extends keyof AISettings>(
    key: K, 
    value: AISettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Authentication Required</h2>
          </div>
          <p className="text-yellow-700">
            Please log in to access AI settings and configuration options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your AI assistant preferences and behavior
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Settings saved successfully!</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Configure your default AI model and response parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default Model</Label>
                  <Select
                    value={settings.defaultModel}
                    onValueChange={(value) => updateSetting('defaultModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Most Capable)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</SelectItem>
                      <SelectItem value="claude-3">Claude-3 (Balanced)</SelectItem>
                      <SelectItem value="custom">Custom Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                    min="100"
                    max="8000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (Creativity)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                    min="0"
                    max="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseTimeout">Response Timeout (seconds)</Label>
                  <Input
                    id="responseTimeout"
                    type="number"
                    value={settings.responseTimeout}
                    onChange={(e) => updateSetting('responseTimeout', parseInt(e.target.value))}
                    min="10"
                    max="120"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="streaming">Enable Streaming Responses</Label>
                  <p className="text-sm text-gray-500">
                    Get real-time responses as they're generated
                  </p>
                </div>
                <Switch
                  id="streaming"
                  checked={settings.enableStreaming}
                  onCheckedChange={(checked) => updateSetting('enableStreaming', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control how your data is handled and protected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encryption">Encryption Level</Label>
                  <Select
                    value={settings.encryptionLevel}
                    onValueChange={(value: 'standard' | 'enhanced' | 'enterprise') => 
                      updateSetting('encryptionLevel', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (AES-256)</SelectItem>
                      <SelectItem value="enhanced">Enhanced (AES-256 + TLS 1.3)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (FIPS 140-2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="analytics">Enable Analytics</Label>
                    <p className="text-sm text-gray-500">
                      Help improve AI performance with usage analytics
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.enableAnalytics}
                    onCheckedChange={(checked) => updateSetting('enableAnalytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="dataSharing">Allow Data Sharing</Label>
                    <p className="text-sm text-gray-500">
                      Share anonymized data for research and improvements
                    </p>
                  </div>
                  <Switch
                    id="dataSharing"
                    checked={settings.allowDataSharing}
                    onCheckedChange={(checked) => updateSetting('allowDataSharing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Optimize AI response speed and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Requests</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    value={settings.maxConcurrentRequests}
                    onChange={(e) => updateSetting('maxConcurrentRequests', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cacheExpiration">Cache Expiration (seconds)</Label>
                  <Input
                    id="cacheExpiration"
                    type="number"
                    value={settings.cacheExpiration}
                    onChange={(e) => updateSetting('cacheExpiration', parseInt(e.target.value))}
                    min="60"
                    max="86400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="caching">Enable Response Caching</Label>
                  <p className="text-sm text-gray-500">
                    Cache responses to improve speed for similar queries
                  </p>
                </div>
                <Switch
                  id="caching"
                  checked={settings.enableCaching}
                  onCheckedChange={(checked) => updateSetting('enableCaching', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalization
              </CardTitle>
              <CardDescription>
                Customize how the AI learns and adapts to your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memoryRetention">Memory Retention (days)</Label>
                  <Input
                    id="memoryRetention"
                    type="number"
                    value={settings.memoryRetentionDays}
                    onChange={(e) => updateSetting('memoryRetentionDays', parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learningRate">Learning Rate</Label>
                  <Input
                    id="learningRate"
                    type="number"
                    step="0.01"
                    value={settings.learningRate}
                    onChange={(e) => updateSetting('learningRate', parseFloat(e.target.value))}
                    min="0"
                    max="1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="contextMemory">Enable Context Memory</Label>
                    <p className="text-sm text-gray-500">
                      Remember conversation context for better responses
                    </p>
                  </div>
                  <Switch
                    id="contextMemory"
                    checked={settings.enableContextMemory}
                    onCheckedChange={(checked) => updateSetting('enableContextMemory', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="personalization">Enable Personalization</Label>
                    <p className="text-sm text-gray-500">
                      Adapt responses based on your usage patterns
                    </p>
                  </div>
                  <Switch
                    id="personalization"
                    checked={settings.enablePersonalization}
                    onCheckedChange={(checked) => updateSetting('enablePersonalization', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure when and how you receive AI-related notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about AI activities
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quietStart">Quiet Hours Start</Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => updateSetting('quietHours', {
                      ...settings.quietHours,
                      start: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quietEnd">Quiet Hours End</Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => updateSetting('quietHours', {
                      ...settings.quietHours,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
